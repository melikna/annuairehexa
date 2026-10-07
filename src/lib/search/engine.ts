/**
 * Interface de recherche — Abstraction isolant le moteur de recherche
 * 
 * Le moteur hybride priorise PostgreSQL s'il est configuré et disponible,
 * et bascule de manière transparente et sans interruption vers l'API publique
 * Recherche d'Entreprises (api.gouv.fr) et BODACC lorsque
 * la base locale n'a pas encore été importée ou est inaccessible.
 */

import type { SearchParams, SearchResult, UniteLegalePubliable, EtablissementPubliable, UniteLegale, Etablissement, ProcedureCollective } from '@/types/domain'
import { getDbReadonly } from '@/lib/db/client'
import { buildUniteLegalePubliable, buildEtablissementPubliable, isPublishable } from '@/lib/publication/service'
import { safeFetch } from '@/lib/api/fetch-client'
import { fetchBodaccProcedures } from '@/lib/sync/realtime-service'
import { isEntitySuppressed } from './suppression-registry'
import { getNafLabel } from '@/lib/naf/naf-table'

export interface SearchEngine {
  searchUnitesLegales(params: SearchParams): Promise<SearchResult<UniteLegalePubliable>>
  searchEtablissements(params: SearchParams): Promise<SearchResult<EtablissementPubliable>>
  searchEntities(params: SearchParams): Promise<SearchResult<UniteLegalePubliable>>
  getUniteLegale(siren: string): Promise<UniteLegalePubliable | null>
  getEtablissement(siret: string): Promise<EtablissementPubliable | null>
  getEtablissementsBySiren(
    siren: string,
    options?: { page?: number; perPage?: number; activeOnly?: boolean }
  ): Promise<SearchResult<EtablissementPubliable>>
  healthCheck(): Promise<{ ok: boolean; error?: string }>
}

const DEFAULT_PER_PAGE = 20
const MAX_PER_PAGE = 100
const RECHERCHE_ENTREPRISES_BASE = process.env.RECHERCHE_ENTREPRISES_BASE_URL ?? 'https://recherche-entreprises.api.gouv.fr'

// Dictionnaires de libellés courants pour enrichir les fiches en fallback
const LEGAL_CATEGORIES: Record<string, string> = {
  '1000': 'Entrepreneur individuel',
  '5498': 'SARL unipersonnelle (EURL)',
  '5499': 'Société à responsabilité limitée (SARL)',
  '5710': 'SAS, société par actions simplifiée',
  '5720': 'SASU, société par actions simplifiée à associé unique',
  '5599': 'SA à conseil d\'administration',
  '5699': 'SA à directoire',
  '6599': 'Société civile',
  '6540': 'Société civile immobilière (SCI)',
  '9220': 'Association déclarée',
}

const NAF_SECTIONS: Record<string, string> = {
  'A': 'Agriculture, sylviculture et pêche',
  'B': 'Industries extractives',
  'C': 'Industrie manufacturière',
  'D': 'Production et distribution d\'électricité, de gaz, de vapeur et d\'air conditionné',
  'E': 'Production et distribution d\'eau ; assainissement, gestion des déchets et dépollution',
  'F': 'Construction',
  'G': 'Commerce ; réparation d\'automobiles et de motocycles',
  'H': 'Transports et entreposage',
  'I': 'Hébergement et restauration',
  'J': 'Information et communication',
  'K': 'Activités financières et d\'assurance',
  'L': 'Activités immobilières',
  'M': 'Activités spécialisées, scientifiques et techniques',
  'N': 'Activités de services administratifs et de soutien',
  'O': 'Administration publique',
  'P': 'Enseignement',
  'Q': 'Santé humaine et action sociale',
  'R': 'Arts, spectacles et activités récréatives',
  'S': 'Autres activités de services',
}

function resolveLegalFormLabel(cat?: string | null): string | null {
  if (!cat) return null
  return LEGAL_CATEGORIES[cat] ?? null
}

function resolveNafLabel(naf?: string | null): string | null {
  if (!naf) return null
  const official = getNafLabel(naf)
  if (official) return official

  // Fallback indicatif basé sur la division (2 chiffres)
  const prefix = naf.slice(0, 2)
  if (prefix === '85') return 'Enseignement et formation'
  if (prefix === '62') return 'Programmation, conseil et autres activités informatiques'
  if (prefix === '70') return 'Activités des sièges sociaux ; conseil de gestion'
  if (prefix === '68') return 'Activités immobilières'
  if (prefix === '47') return 'Commerce de détail'
  if (prefix === '56') return 'Restauration'
  if (prefix === '41' || prefix === '43') return 'Travaux de construction spécialisés'
  if (prefix === '81') return 'Services relatifs aux bâtiments et aménagement paysager'
  return null
}

// =============================================================================
// Implémentation PostgreSQL (pg_trgm + unaccent)
// =============================================================================

export class SearchEnginePostgres implements SearchEngine {
  private get db() {
    return getDbReadonly()
  }

  async searchUnitesLegales(params: SearchParams): Promise<SearchResult<UniteLegalePubliable>> {
    const page = Math.max(1, params.page ?? 1)
    const perPage = Math.min(MAX_PER_PAGE, Math.max(1, params.perPage ?? DEFAULT_PER_PAGE))
    const offset = (page - 1) * perPage
    const db = this.db

    const query = `
      WITH filtered AS (
        SELECT lu.*
        FROM legal_units_publishable lu
        WHERE 1=1
          ${params.q ? `AND (
            similarity(unaccent(lower(COALESCE(lu.denomination, lu.nom_naissance || ' ' || COALESCE(lu.prenom_1, ''), ''))), unaccent(lower($1))) > 0.1
            OR lu.siren = $1
          )` : ''}
          ${params.etatAdministratif ? `AND lu.etat_administratif = '${params.etatAdministratif}'` : ''}
          ${params.natureJuridique ? `AND lu.categorie_juridique = '${params.natureJuridique}'` : ''}
          ${params.activitePrincipale ? `AND lu.activite_principale_naf_rev2 = '${params.activitePrincipale}'` : ''}
          ${params.categorieEntreprise ? `AND lu.categorie_entreprise = '${params.categorieEntreprise}'` : ''}
          ${params.trancheEffectifs ? `AND lu.tranche_effectifs = '${params.trancheEffectifs}'` : ''}
      )
      SELECT 
        COUNT(*) OVER() AS total_count,
        f.*
      FROM filtered f
      ORDER BY 
        ${params.q ? `similarity(unaccent(lower(COALESCE(f.denomination, ''))), unaccent(lower($1))) DESC,` : ''}
        f.date_creation DESC NULLS LAST
      LIMIT ${perPage} OFFSET ${offset}
    `

    const rawResults = params.q
      ? await db.unsafe(query, [params.q])
      : await db.unsafe(query.replace(/\$1/g, "''"), [])

    const total = rawResults.length > 0 ? parseInt(rawResults[0]?.total_count as string ?? '0') : 0
    const totalPages = Math.ceil(total / perPage)

    const results: UniteLegalePubliable[] = rawResults
      .map((row) => buildUniteLegalePubliable(rowToUniteLegale(row)))
      .filter((r): r is UniteLegalePubliable => r !== null)

    return {
      results,
      pagination: {
        page,
        perPage,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      totalIsExact: total <= 10000,
      params,
    }
  }

  async searchEtablissements(params: SearchParams): Promise<SearchResult<EtablissementPubliable>> {
    const page = Math.max(1, params.page ?? 1)
    const perPage = Math.min(MAX_PER_PAGE, Math.max(1, params.perPage ?? DEFAULT_PER_PAGE))
    const offset = (page - 1) * perPage
    const db = this.db

    const conditions: string[] = ['1=1']
    const queryParams: (string | number)[] = []
    let paramIdx = 1

    if (params.q) {
      if (/^\d{9}$/.test(params.q)) {
        conditions.push(`e.siren = $${paramIdx}`)
        queryParams.push(params.q)
        paramIdx++
      } else if (/^\d{14}$/.test(params.q)) {
        conditions.push(`e.siret = $${paramIdx}`)
        queryParams.push(params.q)
        paramIdx++
      } else {
        conditions.push(`similarity(unaccent(lower(COALESCE(e.enseigne_1, e.denomination_usuelle, ''))), unaccent(lower($${paramIdx}))) > 0.1`)
        queryParams.push(params.q)
        paramIdx++
      }
    }

    if (params.departement) {
      conditions.push(`e.code_departement = $${paramIdx}`)
      queryParams.push(params.departement)
      paramIdx++
    }

    if (params.codeCommune) {
      conditions.push(`e.code_commune = $${paramIdx}`)
      queryParams.push(params.codeCommune)
      paramIdx++
    }

    if (params.activitePrincipale) {
      conditions.push(`e.activite_principale_naf_rev2 = $${paramIdx}`)
      queryParams.push(params.activitePrincipale)
      paramIdx++
    }

    if (params.etatAdministratif) {
      conditions.push(`e.etat_administratif = $${paramIdx}`)
      queryParams.push(params.etatAdministratif)
      paramIdx++
    }

    const whereClause = conditions.join(' AND ')

    const rawResults = await db.unsafe(`
      SELECT 
        COUNT(*) OVER() AS total_count,
        e.*
      FROM establishments_publishable e
      WHERE ${whereClause}
      ORDER BY e.etablissement_siege DESC, e.date_creation DESC NULLS LAST
      LIMIT ${perPage} OFFSET ${offset}
    `, queryParams)

    const total = rawResults.length > 0 ? parseInt(rawResults[0]?.total_count as string ?? '0') : 0
    const totalPages = Math.ceil(total / perPage)

    const results: EtablissementPubliable[] = rawResults
      .map((row) => buildEtablissementPubliable(rowToEtablissement(row)))
      .filter((r): r is EtablissementPubliable => r !== null)

    return {
      results,
      pagination: {
        page,
        perPage,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      totalIsExact: total <= 10000,
      params,
    }
  }

  async searchEntities(params: SearchParams): Promise<SearchResult<UniteLegalePubliable>> {
    return this.searchUnitesLegales(params)
  }

  async getUniteLegale(siren: string): Promise<UniteLegalePubliable | null> {
    const db = this.db
    const rows = await db`
      SELECT lu.*
      FROM legal_units_publishable lu
      WHERE lu.siren = ${siren}
      LIMIT 1
    `
    if (rows.length === 0) return null
    const ul = rowToUniteLegale(rows[0]!)
    if (!isPublishable(ul.statutDiffusion)) return null

    const countRows = await db`
      SELECT 
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE etat_administratif = 'A') AS actifs
      FROM establishments_publishable
      WHERE siren = ${siren}
    `
    const total = parseInt(countRows[0]?.total as string ?? '0')
    const actifs = parseInt(countRows[0]?.actifs as string ?? '0')

    const publiable = buildUniteLegalePubliable(ul, false, total, actifs)
    if (publiable) {
      try {
        const historyRows = await db`
          SELECT id, siren, type_jugement, nature_decision, date_jugement,
                 date_publication, tribunal, numero_annonce, parution_bodacc, description
          FROM collective_procedures
          WHERE siren = ${siren}
          ORDER BY date_jugement DESC NULLS LAST, created_at DESC
        `
        publiable.proceduresCollectivesHistorique = historyRows.map((r) => ({
          id: r.id,
          siren: r.siren,
          typeJugement: r.type_jugement,
          natureDecision: r.nature_decision,
          dateJugement: r.date_jugement ? new Date(r.date_jugement).toISOString().slice(0, 10) : null,
          datePublication: r.date_publication ? new Date(r.date_publication).toISOString().slice(0, 10) : null,
          tribunal: r.tribunal,
          numeroAnnonce: r.numero_annonce,
          parutionBodacc: r.parution_bodacc,
          description: r.description,
        }))
      } catch {
        publiable.proceduresCollectivesHistorique = []
      }
    }

    return publiable
  }

  async getEtablissement(siret: string): Promise<EtablissementPubliable | null> {
    const db = this.db
    const rows = await db`
      SELECT e.*
      FROM establishments_publishable e
      WHERE e.siret = ${siret}
      LIMIT 1
    `
    if (rows.length === 0) return null
    const etab = rowToEtablissement(rows[0]!)
    return buildEtablissementPubliable(etab)
  }

  async getEtablissementsBySiren(
    siren: string,
    options: { page?: number; perPage?: number; activeOnly?: boolean } = {}
  ): Promise<SearchResult<EtablissementPubliable>> {
    const page = Math.max(1, options.page ?? 1)
    const perPage = Math.min(50, Math.max(1, options.perPage ?? 20))
    const offset = (page - 1) * perPage
    const db = this.db

    const rows = await db.unsafe(`
      SELECT 
        COUNT(*) OVER() AS total_count,
        e.*
      FROM establishments_publishable e
      WHERE e.siren = $1
        ${options.activeOnly ? "AND e.etat_administratif = 'A'" : ''}
      ORDER BY e.etablissement_siege DESC, e.date_creation DESC NULLS LAST
      LIMIT ${perPage} OFFSET ${offset}
    `, [siren])

    const total = rows.length > 0 ? parseInt(rows[0]?.total_count as string ?? '0') : 0
    const totalPages = Math.ceil(total / perPage)

    const params: SearchParams = { page, perPage, sort: 'pertinence' }

    const results = rows
      .map((row) => buildEtablissementPubliable(rowToEtablissement(row)))
      .filter((r): r is EtablissementPubliable => r !== null)

    return {
      results,
      pagination: { page, perPage, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
      totalIsExact: true,
      params,
    }
  }

  async healthCheck(): Promise<{ ok: boolean; error?: string }> {
    try {
      const db = this.db
      await db`SELECT 1`
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Erreur inconnue' }
    }
  }
}

// =============================================================================
// Moteur Hybride : Priorité DB + Fallback Transparent API Publique Sirene
// =============================================================================

export class SearchEngineHybrid implements SearchEngine {
  private pg = new SearchEnginePostgres()

  async searchUnitesLegales(params: SearchParams): Promise<SearchResult<UniteLegalePubliable>> {
    try {
      const dbResult = await this.pg.searchUnitesLegales(params)
      if (dbResult.results.length > 0) {
        return dbResult
      }
    } catch {
      // PostgreSQL indisponible ou non initialisé
    }

    // Bascule automatique vers l'API publique
    return this.fallbackSearchApi(params)
  }

  async searchEtablissements(params: SearchParams): Promise<SearchResult<EtablissementPubliable>> {
    try {
      const dbResult = await this.pg.searchEtablissements(params)
      if (dbResult.results.length > 0) {
        return dbResult
      }
    } catch {
      // DB non accessible
    }

    // Extraction depuis l'API recherche entreprises
    const ulResults = await this.fallbackSearchApi(params)
    const etablissements: EtablissementPubliable[] = []

    for (const ul of ulResults.results) {
      if (ul.siretSiege) {
        const etab = await this.getEtablissement(ul.siretSiege)
        if (etab) etablissements.push(etab)
      }
    }

    return {
      results: etablissements,
      pagination: ulResults.pagination,
      totalIsExact: false,
      params,
    }
  }

  async searchEntities(params: SearchParams): Promise<SearchResult<UniteLegalePubliable>> {
    return this.searchUnitesLegales(params)
  }

  async getUniteLegale(siren: string): Promise<UniteLegalePubliable | null> {
    try {
      const res = await this.pg.getUniteLegale(siren)
      if (res) return res
    } catch {
      // DB non accessible
    }

    return this.fallbackGetUniteLegale(siren)
  }

  async getEtablissement(siret: string): Promise<EtablissementPubliable | null> {
    try {
      const res = await this.pg.getEtablissement(siret)
      if (res) return res
    } catch {
      // DB non accessible
    }

    return this.fallbackGetEtablissement(siret)
  }

  async getEtablissementsBySiren(
    siren: string,
    options: { page?: number; perPage?: number; activeOnly?: boolean } = {}
  ): Promise<SearchResult<EtablissementPubliable>> {
    try {
      const res = await this.pg.getEtablissementsBySiren(siren, options)
      if (res.results.length > 0) return res
    } catch {
      // DB non accessible
    }

    return this.fallbackGetEtablissementsBySiren(siren, options)
  }

  async healthCheck(): Promise<{ ok: boolean; error?: string }> {
    return { ok: true }
  }

  // --- Méthodes privées de repli vers les APIs d'État ---

  private async fallbackSearchApi(params: SearchParams): Promise<SearchResult<UniteLegalePubliable>> {
    const page = Math.max(1, params.page ?? 1)
    const perPage = Math.min(25, Math.max(1, params.perPage ?? DEFAULT_PER_PAGE))

    if (!params.q && !params.departement && !params.region && !params.activitePrincipale && !params.section && !params.codeCommune && !params.codePostal) {
      return {
        results: [],
        pagination: { page: 1, perPage, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        totalIsExact: true,
        params,
      }
    }

    try {
      const url = new URL(`${RECHERCHE_ENTREPRISES_BASE}/search`)
      if (params.q) url.searchParams.set('q', params.q)
      if (params.departement) url.searchParams.set('departement', params.departement)
      if (params.region) url.searchParams.set('region', params.region)
      if (params.codeCommune) {
        // Traitement spécifique des communes à arrondissements (Paris, Lyon, Marseille)
        // car l'INSEE enregistre les établissements sous les codes de leurs arrondissements respectifs
        if (params.codeCommune === '75056') {
          // Paris : le département 75 est strictement coextensif à la commune de Paris et couvre les 20 arrondissements
          url.searchParams.set('departement', '75')
        } else if (params.codeCommune === '69123') {
          // Lyon : inclusion des 9 arrondissements municipaux (69381 à 69389)
          const lyonArr = ['69381', '69382', '69383', '69384', '69385', '69386', '69387', '69388', '69389', '69123'].join(',')
          url.searchParams.set('code_commune', lyonArr)
        } else if (params.codeCommune === '13055') {
          // Marseille : inclusion des 16 arrondissements municipaux (13201 à 13216)
          const marseilleArr = [
            '13201', '13202', '13203', '13204', '13205', '13206', '13207', '13208',
            '13209', '13210', '13211', '13212', '13213', '13214', '13215', '13216', '13055'
          ].join(',')
          url.searchParams.set('code_commune', marseilleArr)
        } else {
          url.searchParams.set('code_commune', params.codeCommune)
        }
      }
      if (params.codePostal) url.searchParams.set('code_postal', params.codePostal)

      // Prise en charge section NAF (1 lettre A-U) vs sous-classe APE (ex: 49.41A)
      if (params.section || (params.activitePrincipale && /^[A-Za-z]$/.test(params.activitePrincipale.trim()))) {
        const sectionCode = (params.section || params.activitePrincipale)!.trim().toUpperCase()
        url.searchParams.set('section_activite_principale', sectionCode)
      } else if (params.activitePrincipale) {
        url.searchParams.set('activite_principale', params.activitePrincipale.trim())
      }

      if (params.etatAdministratif) url.searchParams.set('etat_administratif', params.etatAdministratif)
      if (params.categorieEntreprise) url.searchParams.set('categorie_entreprise', params.categorieEntreprise)
      if (params.trancheEffectifs) url.searchParams.set('tranche_effectif_salarie', params.trancheEffectifs)
      if (params.natureJuridique) url.searchParams.set('nature_juridique', params.natureJuridique)
      if (params.estEss) url.searchParams.set('est_ess', 'true')
      if (params.estRge) url.searchParams.set('est_rge', 'true')
      if (params.estOrganismeFormation) url.searchParams.set('est_organisme_formation', 'true')
      if (params.estSocieteMission) url.searchParams.set('est_societe_mission', 'true')
      if (params.estBio) url.searchParams.set('est_bio', 'true')
      url.searchParams.set('page', String(page))
      url.searchParams.set('per_page', String(perPage))

      const response = await safeFetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AnnuaireEntreprisesFrance/0.1',
        },
        signal: AbortSignal.timeout(6000),
      })

      if (!response.ok) {
        throw new Error(`Recherche Entreprises HTTP ${response.status}`)
      }

      const data = await response.json()
      const rawList: any[] = data.results ?? []

      // Exclusion stricte des entités ayant exercé une demande d'opposition/suppression
      const results: UniteLegalePubliable[] = rawList
        .filter((item) => !isEntitySuppressed(item.siren))
        .map((item) => apiItemToUniteLegalePubliable(item))
      const total = Number(data.total_results || results.length)
      const totalPages = Math.ceil(total / perPage)

      return {
        results,
        pagination: {
          page,
          perPage,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
        totalIsExact: false,
        params,
      }
    } catch (err) {
      console.warn('[SearchEngineHybrid] Erreur API Recherche Entreprises fallback:', err)
      return {
        unavailable: true,
        results: [],
        pagination: { page, perPage, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        totalIsExact: false,
        params,
      }
    }
  }

  private async fallbackGetUniteLegale(siren: string): Promise<UniteLegalePubliable | null> {
    // Vérification préalable du registre d'opposition RGPD
    if (isEntitySuppressed(siren)) {
      return null
    }

    try {
      const [apiRes, procedures] = await Promise.all([
        safeFetch(`${RECHERCHE_ENTREPRISES_BASE}/search?q=${siren}&limite_matching_etablissements=10`, {
          headers: { 'Accept': 'application/json', 'User-Agent': 'AnnuaireEntreprisesFrance/0.1' },
          signal: AbortSignal.timeout(6000),
        }),
        fetchBodaccProcedures(siren).catch(() => [] as ProcedureCollective[]),
      ])

      if (!apiRes.ok) return null

      const data = await apiRes.json()
      const match = (data.results ?? []).find((r: any) => r.siren === siren)
      if (!match) return null

      const publiable = apiItemToUniteLegalePubliable(match)

      // Intégration des procédures collectives (BODACC)
      if (procedures.length > 0) {
        const mostRecent = procedures[0]
        if (mostRecent) {
          publiable.estEnProcedureCollective = mostRecent.natureDecision !== 'cloture'
          publiable.natureProcedureCollective = mostRecent.natureDecision
          publiable.dateProcedureCollective = mostRecent.dateJugement
          publiable.tribunalProcedureCollective = mostRecent.tribunal
          publiable.detailsProcedureCollective = mostRecent.description
          publiable.proceduresCollectivesHistorique = procedures
        }
      }

      return publiable
    } catch (err) {
      console.warn(`[SearchEngineHybrid] Erreur getUniteLegale pour SIREN ${siren}:`, err)
      return null
    }
  }

  private async fallbackGetEtablissement(siret: string): Promise<EtablissementPubliable | null> {
    const siren = siret.slice(0, 9)
    // Vérification préalable du registre d'opposition RGPD
    if (isEntitySuppressed(siret) || isEntitySuppressed(siren)) {
      return null
    }

    try {
      const response = await safeFetch(`${RECHERCHE_ENTREPRISES_BASE}/search?q=${siret}`, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'AnnuaireEntreprisesFrance/0.1' },
        signal: AbortSignal.timeout(6000),
      })

      if (!response.ok) return null

      const data = await response.json()
      const rawList: any[] = data.results ?? []

      for (const item of rawList) {
        if (item.siege && item.siege.siret === siret) {
          return apiEtablissementToPubliable(item.siege, item.siren)
        }
        if (Array.isArray(item.matching_etablissements)) {
          const match = item.matching_etablissements.find((e: any) => e.siret === siret)
          if (match) return apiEtablissementToPubliable(match, item.siren)
        }
      }

      // Si l'entreprise correspondante est trouvée, le siège peut faire office de référence
      if (rawList[0]?.siege) {
        return apiEtablissementToPubliable(rawList[0].siege, rawList[0].siren)
      }

      return null
    } catch {
      return null
    }
  }

  private async fallbackGetEtablissementsBySiren(
    siren: string,
    options: { page?: number; perPage?: number; activeOnly?: boolean } = {}
  ): Promise<SearchResult<EtablissementPubliable>> {
    const page = Math.max(1, options.page ?? 1)
    const perPage = Math.min(50, Math.max(1, options.perPage ?? 20))

    try {
      const response = await safeFetch(`${RECHERCHE_ENTREPRISES_BASE}/search?q=${siren}&limite_matching_etablissements=20`, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'AnnuaireEntreprisesFrance/0.1' },
        signal: AbortSignal.timeout(6000),
      })

      if (!response.ok) {
        return {
          results: [],
          pagination: { page: 1, perPage, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
          totalIsExact: true,
          params: { page, perPage, sort: 'pertinence' },
        }
      }

      const data = await response.json()
      const match = (data.results ?? []).find((r: any) => r.siren === siren)
      if (!match) {
        return {
          results: [],
          pagination: { page: 1, perPage, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
          totalIsExact: true,
          params: { page, perPage, sort: 'pertinence' },
        }
      }

      const etabs: EtablissementPubliable[] = []
      if (match.siege) {
        etabs.push(apiEtablissementToPubliable(match.siege, match.siren))
      }

      if (Array.isArray(match.matching_etablissements)) {
        for (const etab of match.matching_etablissements) {
          if (etab.siret !== match.siege?.siret) {
            etabs.push(apiEtablissementToPubliable(etab, match.siren))
          }
        }
      }

      const filtered = options.activeOnly ? etabs.filter((e) => e.etatAdministratif === 'A') : etabs
      const total = filtered.length

      return {
        results: filtered.slice((page - 1) * perPage, page * perPage),
        pagination: {
          page,
          perPage,
          total,
          totalPages: Math.max(1, Math.ceil(total / perPage)),
          hasNext: page * perPage < total,
          hasPrev: page > 1,
        },
        totalIsExact: true,
        params: { page, perPage, sort: 'pertinence' },
      }
    } catch {
      return {
        results: [],
        pagination: { page: 1, perPage, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
        totalIsExact: true,
        params: { page, perPage, sort: 'pertinence' },
      }
    }
  }
}

// =============================================================================
// Fonctions de transformation API externe → Types Domain
// =============================================================================

function cleanDenomination(rawName: string | null | undefined): string | null {
  if (!rawName) return null
  const trimmed = rawName.trim()
  if (/\[?NON[- ]?DIFFUSIBLE\]?/i.test(trimmed)) {
    return null
  }
  const match = trimmed.match(/^(.*?)\s*\(\s*\1\s*\)$/i)
  if (match && match[1]) {
    return match[1].trim()
  }
  return trimmed
}

function apiItemToUniteLegalePubliable(item: any): UniteLegalePubliable {
  const isDiffusible = item.statut_diffusion !== 'P'
  const isPersonnePhysique =
    (item.nature_juridique && String(item.nature_juridique).startsWith('1')) ||
    item.complements?.est_entrepreneur_individuel === true

  // Dans le format Sirene Insee, date_debut_activite de l'établissement siège
  // est la date du dernier état administratif (qui prend la valeur de date_fermeture lors d'une cessation).
  // Si cette date est >= date_fermeture ou égale à date_creation, on la neutralise pour éviter d'afficher
  // la même date de début et de cessation.
  const rawDebut = item.siege?.date_debut_activite || null
  let dateDebutActivite: string | null = rawDebut
  if (rawDebut && item.date_fermeture && rawDebut >= item.date_fermeture) {
    dateDebutActivite = null
  } else if (rawDebut && item.date_creation && rawDebut === item.date_creation) {
    dateDebutActivite = null
  }

  const cleanNom = cleanDenomination(item.nom_raison_sociale) || cleanDenomination(item.nom_complet)

  // Respect strict de l'opposition RGPD / Insee (Art. A123-96 Code de commerce)
  // Pour une personne physique ayant demandé la non-diffusion (statut P) : identité masquée
  let denominationAffichable: string | null = null
  if (isDiffusible) {
    denominationAffichable = cleanNom || `Entreprise ${item.siren}`
  } else if (!isPersonnePhysique) {
    // Personne morale avec diffusion partielle
    denominationAffichable = cleanNom || null
  } else {
    // Personne physique en opposition : identité strictement masquée
    denominationAffichable = null
  }

  return {
    siren: item.siren,
    denominationAffichable,
    etatAdministratif: item.etat_administratif === 'A' ? 'A' : 'C',
    dateCreation: item.date_creation || null,
    dateFermeture: item.date_fermeture || null,
    activitePrincipale: item.activite_principale || null,
    libelleActivite: resolveNafLabel(item.activite_principale),
    nomenclatureActive: 'NAFRev2',
    activitePrincipaleNAF25: item.activite_principale_naf25 || item.siege?.activite_principale_naf25 || null,
    nomCommercial: isDiffusible ? (item.siege?.nom_commercial || item.nom_raison_sociale || null) : null,
    dateDebutActivite,
    categorieJuridique: item.nature_juridique || null,
    libelleFormeJuridique: resolveLegalFormLabel(item.nature_juridique),
    trancheEffectifs: item.tranche_effectif_salarie || 'NN',
    anneeEffectifs: item.annee_tranche_effectif_salarie || null,
    categorieEntreprise: item.categorie_entreprise || null,
    anneeCategorieEntreprise: item.annee_categorie_entreprise || null,
    siretSiege: item.siege?.siret || null,
    diffusionPartielle: !isDiffusible,
    statutDiffusion: item.statut_diffusion === 'P' ? 'P' : 'O',
    dateMiseAJour: item.date_mise_a_jour || item.date_mise_a_jour_insee || null,
    nombreEtablissements: item.nombre_etablissements ?? 1,
    nombreEtablissementsActifs: item.nombre_etablissements_ouverts ?? (item.etat_administratif === 'A' ? 1 : 0),
    estEnProcedureCollective: false,
    natureProcedureCollective: null,
    dateProcedureCollective: null,
    tribunalProcedureCollective: null,
    detailsProcedureCollective: null,
    derniereVerificationTempsReel: new Date().toISOString(),
    proceduresCollectivesHistorique: [],
    // Pour les personnes physiques en opposition, les mandataires/dirigeants sont masqués
    dirigeants: (!isDiffusible && isPersonnePhysique)
      ? []
      : Array.isArray(item.dirigeants)
      ? item.dirigeants.map((d: any) => ({
          nom: d.nom || '',
          prenoms: d.prenoms || null,
          qualite: d.qualite || 'Dirigeant',
          anneeNaissance: d.annee_de_naissance || null,
          dateNaissance: d.date_de_naissance || null,
          typeDirigeant: d.type_dirigeant || null,
          nationalite: d.nationalite || null,
        }))
      : undefined,
    finances: item.finances && typeof item.finances === 'object'
      ? Object.fromEntries(
          Object.entries(item.finances).map(([year, val]: [string, any]) => [
            year,
            {
              ca: typeof val?.ca === 'number' ? val.ca : undefined,
              resultatNet: typeof val?.resultat_net === 'number' ? val.resultat_net : undefined,
            },
          ])
        )
      : undefined,
    complements: item.complements
      ? {
          conventionCollectiveRenseignee: item.complements.convention_collective_renseignee,
          listeIdcc: item.complements.liste_idcc || [],
          estOrganismeFormation: item.complements.est_organisme_formation,
          estQualiopi: item.complements.est_qualiopi,
          listeIdOrganismeFormation: item.complements.liste_id_organisme_formation || [],
          estRge: item.complements.est_rge,
          estEss: item.complements.est_ess,
          estSocieteMission: item.complements.est_societe_mission,
          estBio: item.complements.est_bio,
          estEntrepreneurIndividuel: item.complements.est_entrepreneur_individuel,
          egaproRenseignee: item.complements.egapro_renseignee,
        }
      : undefined,
  }
}

function apiEtablissementToPubliable(etab: any, sirenFallback?: string): EtablissementPubliable {
  const siren = etab.siren || sirenFallback || (etab.siret ? etab.siret.slice(0, 9) : '')
  const nic = etab.nic || (etab.siret ? etab.siret.slice(9) : '00001')
  const isDiffusible = etab.statut_diffusion_etablissement !== 'P'

  const adresseParts = [
    etab.numero_voie,
    etab.type_voie,
    etab.libelle_voie,
    etab.code_postal,
    etab.libelle_commune,
  ].filter(Boolean)
  const fullAdresse = etab.adresse || (adresseParts.length > 0 ? adresseParts.join(' ') : null)

  return {
    siret: etab.siret,
    siren,
    nic,
    etablissementSiege: Boolean(etab.est_siege),
    etatAdministratif: etab.etat_administratif === 'A' ? 'A' : 'F',
    dateCreation: etab.date_creation || null,
    dateFermeture: etab.date_fermeture || null,
    enseigneAffichable: isDiffusible ? (etab.nom_commercial || (Array.isArray(etab.liste_enseignes) && etab.liste_enseignes[0]) || null) : null,
    adresseComplete: isDiffusible ? fullAdresse : null,
    adresseLigne1: isDiffusible ? ([etab.numero_voie, etab.type_voie, etab.libelle_voie].filter(Boolean).join(' ') || null) : null,
    adresseLigne2: null,
    codePostal: isDiffusible ? (etab.code_postal || null) : null,
    libelleCommune: isDiffusible ? (etab.libelle_commune || null) : null,
    codeCommune: isDiffusible ? (etab.commune || null) : null,
    codeDepartement: etab.departement || null, // Le département reste public pour le rattachement administratif
    codeRegion: etab.region || null,
    coordonnees: (isDiffusible && etab.latitude && etab.longitude)
      ? { latitude: parseFloat(etab.latitude), longitude: parseFloat(etab.longitude) }
      : null,
    activitePrincipale: etab.activite_principale || null,
    libelleActivite: resolveNafLabel(etab.activite_principale),
    nomenclatureActive: 'NAFRev2',
    trancheEffectifs: etab.tranche_effectif_salarie || 'NN',
    anneeEffectifs: etab.annee_tranche_effectif_salarie || null,
    diffusionPartielle: !isDiffusible,
    dateMiseAJour: etab.date_mise_a_jour_insee || null,
  }
}

function rowToUniteLegale(row: Record<string, unknown>): UniteLegale {
  return {
    siren: row.siren as string,
    statutDiffusion: (row.statut_diffusion as string ?? 'O') as 'O' | 'P',
    etatAdministratif: (row.etat_administratif as string) as 'A' | 'C' | 'F',
    dateCreation: row.date_creation as string | null,
    dateFermeture: row.date_fermeture as string | null,
    denominationUniteLegale: row.denomination as string | null,
    denominationUsuelle1: row.denomination_usuelle_1 as string | null,
    denominationUsuelle2: row.denomination_usuelle_2 as string | null,
    denominationUsuelle3: row.denomination_usuelle_3 as string | null,
    sigleUniteLegale: row.sigle as string | null,
    nomUniteLegale: row.nom_naissance as string | null,
    nomUsageUniteLegale: row.nom_usage as string | null,
    prenom1UniteLegale: row.prenom_1 as string | null,
    prenom2UniteLegale: row.prenom_2 as string | null,
    prenom3UniteLegale: row.prenom_3 as string | null,
    prenom4UniteLegale: row.prenom_4 as string | null,
    categorieJuridiqueUniteLegale: row.categorie_juridique as string | null,
    activitePrincipaleUniteLegale: row.activite_principale_naf_rev2 as string | null,
    nomenclatureActivitePrincipaleUniteLegale: row.nomenclature_activite_active as 'NAFRev2' | 'NAF2025' | null,
    activitePrincipaleNAF25UniteLegale: row.activite_principale_naf_2025 as string | null,
    trancheEffectifsUniteLegale: row.tranche_effectifs as any,
    anneeEffectifsUniteLegale: row.annee_effectifs as string | null,
    categorieEntreprise: row.categorie_entreprise as any,
    anneeCategorieEntreprise: row.annee_categorie_entreprise as string | null,
    caractereEmployeurUniteLegale: row.caractere_employeur as 'O' | 'N' | null,
    economieSocialeSolidaireUniteLegale: row.economie_sociale_solidaire as 'O' | 'N' | null,
    societeMissionUniteLegale: row.societe_mission as 'O' | 'N' | null,
    siretSiege: row.siret_siege as string | null,
    dateDernierTraitementUniteLegale: row.date_dernier_traitement as string | null,
    dateCollecte: row.date_collecte as string,
    sourceImport: row.source_import as string,
    importId: row.import_id as string | null,
    estEnProcedureCollective: Boolean(row.est_en_procedure_collective),
    natureProcedureCollective: row.nature_procedure_collective as string | null,
    dateProcedureCollective: row.date_procedure_collective ? new Date(row.date_procedure_collective as string).toISOString().slice(0, 10) : null,
    tribunalProcedureCollective: row.tribunal_procedure_collective as string | null,
    detailsProcedureCollective: row.details_procedure_collective as string | null,
    derniereVerificationTempsReel: row.derniere_verification_temps_reel ? new Date(row.derniere_verification_temps_reel as string).toISOString() : null,
  }
}

function rowToEtablissement(row: Record<string, unknown>): Etablissement {
  return {
    siret: row.siret as string,
    siren: row.siren as string,
    nic: row.nic as string,
    statutDiffusionEtablissement: (row.statut_diffusion as string ?? 'O') as 'O' | 'P',
    etatAdministratifEtablissement: (row.etat_administratif as string) as 'A' | 'F',
    dateCreationEtablissement: row.date_creation as string | null,
    dateFermetureEtablissement: row.date_fermeture as string | null,
    etablissementSiege: row.etablissement_siege as boolean,
    enseigne1Etablissement: row.enseigne_1 as string | null,
    enseigne2Etablissement: row.enseigne_2 as string | null,
    enseigne3Etablissement: row.enseigne_3 as string | null,
    denominationUsuelleEtablissement: row.denomination_usuelle as string | null,
    complementAdresseEtablissement: row.complement_adresse as string | null,
    numeroVoieEtablissement: row.numero_voie as string | null,
    indiceRepetitionEtablissement: row.indice_repetition as string | null,
    typeVoieEtablissement: row.type_voie as string | null,
    libelleVoieEtablissement: row.libelle_voie as string | null,
    codePostalEtablissement: row.code_postal as string | null,
    libelleCommuneEtablissement: row.libelle_commune as string | null,
    codeCommuneEtablissement: row.code_commune as string | null,
    codeDepartementEtablissement: row.code_departement as string | null,
    codeRegionEtablissement: row.code_region as string | null,
    distributionSpecialeEtablissement: row.distribution_speciale as string | null,
    codeCedexEtablissement: row.code_cedex as string | null,
    libelleCedexEtablissement: row.libelle_cedex as string | null,
    codePaysEtrangerEtablissement: row.code_pays_etranger as string | null,
    libellePaysEtrangerEtablissement: row.libelle_pays_etranger as string | null,
    libelleCommuneEtrangerEtablissement: row.libelle_commune_etranger as string | null,
    latitude: row.latitude as string | null,
    longitude: row.longitude as string | null,
    activitePrincipaleEtablissement: row.activite_principale_naf_rev2 as string | null,
    nomenclatureActivitePrincipaleEtablissement: row.nomenclature_activite_active as 'NAFRev2' | 'NAF2025' | null,
    activitePrincipaleNAF25Etablissement: row.activite_principale_naf_2025 as string | null,
    activitePrincipaleRegistreMetiersEtablissement: row.activite_principale_registre_metiers as string | null,
    trancheEffectifsEtablissement: row.tranche_effectifs as any,
    anneeEffectifsEtablissement: row.annee_effectifs as string | null,
    caractereEmployeurEtablissement: row.caractere_employeur as 'O' | 'N' | null,
    dateDernierTraitementEtablissement: row.date_dernier_traitement as string | null,
    dateCollecte: row.date_collecte as string,
    sourceImport: row.source_import as string,
    importId: row.import_id as string | null,
  }
}

// =============================================================================
// Instance singleton
// =============================================================================

let searchEngineInstance: SearchEngine | null = null

export function getSearchEngine(): SearchEngine {
  if (!searchEngineInstance) {
    searchEngineInstance = new SearchEngineHybrid()
  }
  return searchEngineInstance
}
