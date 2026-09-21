/**
 * Worker d'import pilote — Annuaire Entreprises France
 * 
 * Ce worker importe les établissements d'un département via l'API Recherche d'Entreprises.
 * Il est conçu pour le pilote (Jalon A/B) et sera remplacé par l'import des fichiers
 * stocks Sirene pour la couverture nationale (Jalon C).
 * 
 * LIMITES DE CE WORKER :
 * - L'API Recherche d'Entreprises exclut les entités non-diffusibles
 * - Elle ne permet pas d'aspirer exhaustivement toutes les entités d'un département
 * - Elle est limitée à 7 req/s et 25 résultats par page, soit ~10 000 entités max par requête paginée
 * - Pour la couverture nationale, utiliser les fichiers stock Sirene (Parquet ou CSV)
 * 
 * Usage :
 *   node workers/import/pilot.js --departement 75 --max-pages 400
 *   node workers/import/pilot.js --departement 75 --secteur F --max-pages 100
 */

import { getDb } from '../../src/lib/db/client.js'
import { createImportRecord, updateImportRecord } from './lib/import-utils.js'

// Configuration
const BASE_URL = process.env.RECHERCHE_ENTREPRISES_BASE_URL ?? 'https://recherche-entreprises.api.gouv.fr'
const USER_AGENT = process.env.RECHERCHE_ENTREPRISES_USER_AGENT ?? 'AnnuaireEntreprisesFrance/0.1'
const RATE_LIMIT_MS = 200  // ~5 req/s pour rester bien en dessous de la limite de 7/s
const MAX_RETRIES = 3
const PER_PAGE = 25  // Maximum autorisé par l'API
const BATCH_SIZE = parseInt(process.env.IMPORT_BATCH_SIZE ?? '500')

// Paramètres CLI
const args = process.argv.slice(2)
const departement = getArg(args, '--departement') ?? process.env.PILOT_DEPARTMENT ?? '75'
const secteur = getArg(args, '--secteur')  // Section NAF (A-U), optionnel
const maxPages = parseInt(getArg(args, '--max-pages') ?? '400')
const activeOnly = args.includes('--active-only')  // Si true, uniquement les unités légales actives

console.log(`[PilotImport] Démarrage pour le département ${departement}`)
console.log(`[PilotImport] Secteur: ${secteur ?? 'tous'}, Max pages: ${maxPages}, Active only: ${activeOnly}`)
console.log(`[PilotImport] ATTENTION: Import partiel via API Recherche Entreprises (entités diffusibles uniquement)`)
console.log(`[PilotImport] Pour la couverture nationale, utiliser l'import des fichiers stock Sirene`)

// =============================================================================
// Point d'entrée principal
// =============================================================================

async function main() {
  const db = getDb()
  
  // Créer l'enregistrement d'import
  const importId = await createImportRecord(db, {
    type: 'stock_etablissements',
    sourceId: 'recherche_entreprises',
    sourceUrl: `${BASE_URL}/search`,
    sourceVersion: `pilot-dept-${departement}-${new Date().toISOString().slice(0, 10)}`,
    notes: `Import pilote département ${departement}${secteur ? ` secteur ${secteur}` : ''} — API Recherche Entreprises (diffusibles uniquement)`,
  })
  
  console.log(`[PilotImport] Import ID: ${importId}`)
  
  let totalProcessed = 0
  let totalCreated = 0
  let totalUpdated = 0
  let totalRejected = 0
  let currentPage = 1
  let hasMore = true
  let consecutiveErrors = 0
  
  const stagingBatch: EntityData[] = []
  
  try {
    while (hasMore && currentPage <= maxPages) {
      console.log(`[PilotImport] Page ${currentPage}/${maxPages}...`)
      
      const result = await fetchWithRetry(currentPage, departement, secteur, activeOnly)
      
      if (!result) {
        consecutiveErrors++
        if (consecutiveErrors >= 3) {
          console.error('[PilotImport] Trop d\'erreurs consécutives. Arrêt.')
          break
        }
        currentPage++
        continue
      }
      
      consecutiveErrors = 0
      
      const { results, total_results } = result
      
      if (results.length === 0) {
        hasMore = false
        break
      }
      
      // Vérification : si l'API retourne plus de résultats que le max paginable
      if (currentPage === 1) {
        console.log(`[PilotImport] Total estimé par l'API: ${total_results}`)
        if (total_results > maxPages * PER_PAGE) {
          console.warn(
            `[PilotImport] ATTENTION: Le total (${total_results}) dépasse la limite de pagination (${maxPages * PER_PAGE}).`,
            'Affiner avec --secteur pour couvrir plus exhaustivement.'
          )
        }
      }
      
      // Transformer et valider les résultats
      for (const entity of results) {
        try {
          const validated = validateAndTransform(entity, importId)
          if (validated) {
            stagingBatch.push(validated)
          }
        } catch (err) {
          totalRejected++
          console.warn(`[PilotImport] Rejet entité ${entity.siren}:`, err)
        }
      }
      
      totalProcessed += results.length
      
      // Flush du batch si atteint la taille configurée
      if (stagingBatch.length >= BATCH_SIZE) {
        const { created, updated } = await upsertBatch(db, stagingBatch, importId)
        totalCreated += created
        totalUpdated += updated
        stagingBatch.length = 0
        console.log(`[PilotImport] Batch upserted: ${created} créés, ${updated} mis à jour. Total: ${totalProcessed}`)
      }
      
      hasMore = (currentPage * PER_PAGE) < Math.min(total_results, maxPages * PER_PAGE)
      currentPage++
      
      // Respect du rate limit
      await sleep(RATE_LIMIT_MS)
    }
    
    // Flush du dernier batch
    if (stagingBatch.length > 0) {
      const { created, updated } = await upsertBatch(db, stagingBatch, importId)
      totalCreated += created
      totalUpdated += updated
      console.log(`[PilotImport] Batch final upserted: ${created} créés, ${updated} mis à jour`)
    }
    
    // Calcul des agrégats pour le département
    await updateGeoAggregates(db, departement)
    
    // Finaliser l'import
    await updateImportRecord(db, importId, {
      status: 'completed',
      processedCount: totalProcessed,
      createdCount: totalCreated,
      updatedCount: totalUpdated,
      rejectedCount: totalRejected,
    })
    
    console.log(`[PilotImport] ✓ Terminé.`)
    console.log(`[PilotImport] Traités: ${totalProcessed}, Créés: ${totalCreated}, Mis à jour: ${totalUpdated}, Rejetés: ${totalRejected}`)
    console.log(`[PilotImport] ⚠ Couverture: entités diffusibles uniquement. Les non-diffusibles ne sont pas inclus.`)
    
  } catch (error) {
    console.error('[PilotImport] Erreur fatale:', error)
    
    await updateImportRecord(db, importId, {
      status: 'failed',
      processedCount: totalProcessed,
      createdCount: totalCreated,
      updatedCount: totalUpdated,
      rejectedCount: totalRejected,
      errorMessage: error instanceof Error ? error.message : String(error),
    })
    
    process.exit(1)
  } finally {
    await db.end()
  }
}

// =============================================================================
// Appel API avec retry et respect du rate limit
// =============================================================================

interface ApiResult {
  results: RawEntity[]
  total_results: number
  page: number
  per_page: number
  total_pages: number
}

interface RawEntity {
  siren: string
  nom_complet: string
  nom_raison_sociale?: string
  sigle?: string
  activite_principale?: string
  activite_principale_naf25?: string
  categorie_entreprise?: string
  annee_categorie_entreprise?: string
  caractere_employeur?: string
  date_creation?: string
  date_mise_a_jour?: string
  date_mise_a_jour_insee?: string
  etat_administratif?: string
  nature_juridique?: string
  statut_diffusion?: string
  tranche_effectif_salarie?: string
  annee_tranche_effectif_salarie?: string
  nombre_etablissements?: number
  nombre_etablissements_ouverts?: number
  siege?: RawSiege
  matching_etablissements?: RawEtablissement[]
}

interface RawSiege {
  siret: string
  activite_principale?: string
  activite_principale_naf25?: string
  adresse?: string
  code_postal?: string
  commune?: string
  departement?: string
  region?: string
  etat_administratif?: string
  est_siege: boolean
  latitude?: string
  longitude?: string
  liste_enseignes?: string[]
  nom_commercial?: string
  statut_diffusion_etablissement?: string
  tranche_effectif_salarie?: string
  annee_tranche_effectif_salarie?: string
  date_creation?: string
  date_fermeture?: string
}

interface RawEtablissement extends RawSiege {
  est_siege: boolean
}

async function fetchWithRetry(
  page: number,
  departement: string,
  secteur?: string,
  activeOnly: boolean = false,
): Promise<ApiResult | null> {
  const url = new URL(`${BASE_URL}/search`)
  url.searchParams.set('departement', departement)
  url.searchParams.set('page', String(page))
  url.searchParams.set('per_page', String(PER_PAGE))
  url.searchParams.set('minimal', 'true')
  url.searchParams.set('include', 'siege,matching_etablissements')
  url.searchParams.set('limite_matching_etablissements', '5')
  
  if (secteur) {
    url.searchParams.set('section_activite_principale', secteur)
  }
  
  if (activeOnly) {
    url.searchParams.set('etat_administratif', 'A')
  }
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url.toString(), {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(30000),
      })
      
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') ?? '5')
        console.log(`[PilotImport] Rate limit 429. Attente ${retryAfter}s...`)
        await sleep(retryAfter * 1000)
        continue
      }
      
      if (response.status === 400) {
        const body = await response.json()
        console.error('[PilotImport] Requête invalide:', body)
        return null
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`)
      }
      
      return await response.json() as ApiResult
      
    } catch (error) {
      const isLast = attempt === MAX_RETRIES
      const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 30000)
      
      if (isLast) {
        console.error(`[PilotImport] Échec après ${MAX_RETRIES} tentatives:`, error)
        return null
      }
      
      console.warn(`[PilotImport] Tentative ${attempt} échouée. Retry dans ${Math.round(delay)}ms...`)
      await sleep(delay)
    }
  }
  
  return null
}

// =============================================================================
// Validation et transformation
// =============================================================================

interface EntityData {
  siren: string
  denomination: string | null
  etat_administratif: string
  statut_diffusion: string
  date_creation: string | null
  date_fermeture: string | null
  categorie_juridique: string | null
  activite_principale_naf_rev2: string | null
  activite_principale_naf_2025: string | null
  tranche_effectifs: string | null
  annee_effectifs: string | null
  categorie_entreprise: string | null
  annee_categorie_entreprise: string | null
  caractere_employeur: string | null
  siret_siege: string | null
  date_dernier_traitement: string | null
  import_id: string
  // Établissement siège (pour upsert simultané)
  siege?: {
    siret: string
    adresse: string | null
    code_postal: string | null
    code_commune: string | null
    code_departement: string | null
    code_region: string | null
    latitude: string | null
    longitude: string | null
    etat_administratif: string
    statut_diffusion: string
    activite_principale_naf_rev2: string | null
    tranche_effectifs: string | null
    enseigne: string | null
    date_creation: string | null
    date_fermeture: string | null
  }
}

function validateAndTransform(entity: RawEntity, importId: string): EntityData | null {
  // Validation format SIREN
  if (!entity.siren || !/^\d{9}$/.test(entity.siren)) {
    throw new Error(`SIREN invalide: ${entity.siren}`)
  }
  
  // L'API Recherche Entreprises ne retourne que les entités diffusibles (statut O)
  // mais nous conservons la valeur reçue pour être précis
  const statutDiffusion = entity.statut_diffusion ?? 'O'
  if (!['O', 'P'].includes(statutDiffusion)) {
    throw new Error(`Statut de diffusion inconnu: ${statutDiffusion}`)
  }
  
  let siegeData: EntityData['siege'] | undefined = undefined
  
  if (entity.siege && /^\d{14}$/.test(entity.siege.siret)) {
    const s = entity.siege
    const sStatut = s.statut_diffusion_etablissement ?? 'O'
    
    siegeData = {
      siret: s.siret,
      adresse: null,  // Construit à partir des champs individuels dans l'import stock
      code_postal: s.code_postal ?? null,
      code_commune: s.commune ?? null,
      code_departement: s.departement ?? null,
      code_region: s.region ?? null,
      latitude: s.latitude ?? null,
      longitude: s.longitude ?? null,
      etat_administratif: s.etat_administratif ?? 'A',
      statut_diffusion: sStatut,
      activite_principale_naf_rev2: s.activite_principale ?? null,
      tranche_effectifs: s.tranche_effectif_salarie ?? null,
      enseigne: s.liste_enseignes?.[0] ?? s.nom_commercial ?? null,
      date_creation: s.date_creation ?? null,
      date_fermeture: s.date_fermeture ?? null,
    }
  }
  
  return {
    siren: entity.siren,
    denomination: entity.nom_raison_sociale ?? entity.nom_complet ?? null,
    etat_administratif: entity.etat_administratif ?? 'A',
    statut_diffusion: statutDiffusion,
    date_creation: entity.date_creation ?? null,
    date_fermeture: null,  // Non disponible dans cette API
    categorie_juridique: entity.nature_juridique ?? null,
    activite_principale_naf_rev2: entity.activite_principale ?? null,
    activite_principale_naf_2025: entity.activite_principale_naf25 ?? null,
    tranche_effectifs: entity.tranche_effectif_salarie ?? null,
    annee_effectifs: entity.annee_tranche_effectif_salarie ?? null,
    categorie_entreprise: entity.categorie_entreprise ?? null,
    annee_categorie_entreprise: entity.annee_categorie_entreprise ?? null,
    caractere_employeur: entity.caractere_employeur ?? null,
    siret_siege: entity.siege?.siret ?? null,
    date_dernier_traitement: entity.date_mise_a_jour_insee ?? entity.date_mise_a_jour ?? null,
    import_id: importId,
    siege: siegeData,
  }
}

// =============================================================================
// Upsert PostgreSQL
// =============================================================================

async function upsertBatch(
  db: ReturnType<typeof getDb>,
  batch: EntityData[],
  importId: string,
): Promise<{ created: number; updated: number }> {
  let created = 0
  let updated = 0
  
  // Upsert dans une transaction
  await db.begin(async (tx) => {
    // Upsert des unités légales
    const ulValues = batch.map((e) => [
      e.siren,
      e.statut_diffusion,
      e.etat_administratif,
      e.date_creation,
      e.date_fermeture,
      e.denomination,
      e.categorie_juridique,
      e.activite_principale_naf_rev2,
      e.activite_principale_naf_2025,
      e.tranche_effectifs,
      e.annee_effectifs,
      e.categorie_entreprise,
      e.annee_categorie_entreprise,
      e.caractere_employeur,
      e.siret_siege,
      e.date_dernier_traitement,
      'recherche_entreprises',
      importId,
    ])
    
    // Utilisation de postgres.js pour un upsert bulk sécurisé
    for (const values of ulValues) {
      const [siren, statut_diffusion, etat_administratif, date_creation, date_fermeture,
             denomination, categorie_juridique, activite_principale_naf_rev2,
             activite_principale_naf_2025, tranche_effectifs, annee_effectifs,
             categorie_entreprise, annee_categorie_entreprise, caractere_employeur,
             siret_siege, date_dernier_traitement, source_import, import_id] = values
      
      const result = await tx`
        INSERT INTO legal_units (
          siren, statut_diffusion, etat_administratif, date_creation, date_fermeture,
          denomination, categorie_juridique, activite_principale_naf_rev2,
          activite_principale_naf_2025, tranche_effectifs, annee_effectifs,
          categorie_entreprise, annee_categorie_entreprise, caractere_employeur,
          siret_siege, date_dernier_traitement, source_import, import_id
        ) VALUES (
          ${siren as string}, ${statut_diffusion as string}, ${etat_administratif as string},
          ${date_creation as string | null}, ${date_fermeture as string | null},
          ${denomination as string | null}, ${categorie_juridique as string | null},
          ${activite_principale_naf_rev2 as string | null}, ${activite_principale_naf_2025 as string | null},
          ${tranche_effectifs as string | null}, ${annee_effectifs as string | null},
          ${categorie_entreprise as string | null}, ${annee_categorie_entreprise as string | null},
          ${caractere_employeur as string | null}, ${siret_siege as string | null},
          ${date_dernier_traitement as string | null}, ${source_import as string}, ${import_id as string}
        )
        ON CONFLICT (siren) DO UPDATE SET
          statut_diffusion = EXCLUDED.statut_diffusion,
          etat_administratif = EXCLUDED.etat_administratif,
          date_fermeture = EXCLUDED.date_fermeture,
          denomination = EXCLUDED.denomination,
          categorie_juridique = EXCLUDED.categorie_juridique,
          activite_principale_naf_rev2 = EXCLUDED.activite_principale_naf_rev2,
          activite_principale_naf_2025 = EXCLUDED.activite_principale_naf_2025,
          tranche_effectifs = EXCLUDED.tranche_effectifs,
          annee_effectifs = EXCLUDED.annee_effectifs,
          categorie_entreprise = EXCLUDED.categorie_entreprise,
          annee_categorie_entreprise = EXCLUDED.annee_categorie_entreprise,
          caractere_employeur = EXCLUDED.caractere_employeur,
          siret_siege = EXCLUDED.siret_siege,
          date_dernier_traitement = EXCLUDED.date_dernier_traitement,
          source_import = EXCLUDED.source_import,
          import_id = EXCLUDED.import_id,
          updated_at = NOW()
        RETURNING xmax
      `
      
      // xmax = 0 → INSERT (créé), xmax > 0 → UPDATE (mis à jour)
      if (result[0]?.xmax === '0' || result[0]?.xmax === 0) {
        created++
      } else {
        updated++
      }
    }
    
    // Upsert des sièges sociaux
    const sieges = batch.filter((e) => e.siege !== undefined).map((e) => e.siege!)
    
    for (const siege of sieges) {
      const nic = siege.siret.slice(9, 14)
      const siren = siege.siret.slice(0, 9)
      
      await tx`
        INSERT INTO establishments (
          siret, siren, nic, statut_diffusion, etat_administratif, etablissement_siege,
          code_postal, code_commune, code_departement, code_region,
          latitude, longitude, activite_principale_naf_rev2,
          tranche_effectifs, enseigne_1, date_creation, date_fermeture,
          source_import, import_id
        ) VALUES (
          ${siege.siret}, ${siren}, ${nic},
          ${siege.statut_diffusion}, ${siege.etat_administratif}, true,
          ${siege.code_postal}, ${siege.code_commune}, ${siege.code_departement}, ${siege.code_region},
          ${siege.latitude}, ${siege.longitude}, ${siege.activite_principale_naf_rev2},
          ${siege.tranche_effectifs}, ${siege.enseigne}, ${siege.date_creation}, ${siege.date_fermeture},
          'recherche_entreprises', ${importId}
        )
        ON CONFLICT (siret) DO UPDATE SET
          statut_diffusion = EXCLUDED.statut_diffusion,
          etat_administratif = EXCLUDED.etat_administratif,
          code_postal = EXCLUDED.code_postal,
          code_commune = EXCLUDED.code_commune,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          activite_principale_naf_rev2 = EXCLUDED.activite_principale_naf_rev2,
          tranche_effectifs = EXCLUDED.tranche_effectifs,
          enseigne_1 = EXCLUDED.enseigne_1,
          date_fermeture = EXCLUDED.date_fermeture,
          updated_at = NOW()
      `
    }
  })
  
  return { created, updated }
}

// =============================================================================
// Agrégats géographiques
// =============================================================================

async function updateGeoAggregates(db: ReturnType<typeof getDb>, departement: string): Promise<void> {
  console.log(`[PilotImport] Calcul des agrégats pour le département ${departement}...`)
  
  try {
    await db`
      INSERT INTO geo_aggregates (geo_type, geo_code, calculated_at, 
        total_etablissements, etablissements_actifs, etablissements_fermes,
        total_unites_legales, unites_legales_actives)
      SELECT 
        'departement', ${departement}, NOW(),
        COUNT(*) as total_etablissements,
        COUNT(*) FILTER (WHERE etat_administratif = 'A') as etablissements_actifs,
        COUNT(*) FILTER (WHERE etat_administratif = 'F') as etablissements_fermes,
        COUNT(DISTINCT siren) as total_unites_legales,
        COUNT(DISTINCT siren) FILTER (WHERE etat_administratif = 'A') as unites_legales_actives
      FROM establishments
      WHERE code_departement = ${departement}
        AND statut_diffusion IN ('O', 'P')
      ON CONFLICT (geo_type, geo_code) DO UPDATE SET
        calculated_at = EXCLUDED.calculated_at,
        total_etablissements = EXCLUDED.total_etablissements,
        etablissements_actifs = EXCLUDED.etablissements_actifs,
        etablissements_fermes = EXCLUDED.etablissements_fermes,
        total_unites_legales = EXCLUDED.total_unites_legales,
        unites_legales_actives = EXCLUDED.unites_legales_actives,
        updated_at = NOW()
    `
    console.log(`[PilotImport] ✓ Agrégats calculés pour le département ${departement}`)
  } catch (err) {
    console.warn('[PilotImport] Erreur calcul agrégats (non bloquant):', err)
  }
}

// =============================================================================
// Utilitaires
// =============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getArg(args: string[], key: string): string | undefined {
  const idx = args.indexOf(key)
  if (idx >= 0 && args.length > idx + 1) {
    return args[idx + 1]
  }
  return undefined
}

// Lancement
main().catch((err) => {
  console.error('[PilotImport] Erreur non gérée:', err)
  process.exit(1)
})
