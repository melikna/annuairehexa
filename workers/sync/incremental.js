/**
 * Worker de synchronisation incrémentale via l'API officielle Sirene INSEE
 * 
 * Ce worker interroge l'API Sirene de l'INSEE pour récupérer les modifications,
 * créations et fermetures intervenues depuis le dernier checkpoint enregistré
 * dans la table `sync_checkpoints`.
 * 
 * Usage:
 *   node workers/sync/incremental.js
 *   node workers/sync/incremental.js --flux unites_legales --since 2026-09-01T00:00:00
 */

import { getDb } from '../../src/lib/db/client.js'
import { createImportRecord, updateImportRecord } from '../import/lib/import-utils.js'

const INSEE_API_BASE = process.env.INSEE_API_BASE_URL ?? 'https://api.insee.fr/entreprises/sirene/V3.11'
const INSEE_API_KEY = process.env.INSEE_API_KEY

if (!INSEE_API_KEY) {
  console.warn('[SyncIncremental] AVERTISSEMENT: INSEE_API_KEY non configurée dans .env.local')
}

const args = process.argv.slice(2)
const targetFlux = getArg(args, '--flux') ?? 'unites_legales' // 'unites_legales' ou 'etablissements'
const forcedSince = getArg(args, '--since')

async function getLastCheckpoint(db, flux) {
  const rows = await db`
    SELECT last_processed_at
    FROM sync_checkpoints
    WHERE flux = ${flux}
    LIMIT 1
  `
  return rows[0]?.last_processed_at ?? null
}

async function setCheckpoint(db, flux, timestamp, importId) {
  await db`
    INSERT INTO sync_checkpoints (flux, last_processed_at, import_id, updated_at)
    VALUES (${flux}, ${timestamp}, ${importId}, NOW())
    ON CONFLICT (flux) DO UPDATE SET
      last_processed_at = EXCLUDED.last_processed_at,
      import_id = EXCLUDED.import_id,
      updated_at = NOW()
  `
}

async function fetchInseeModifications(flux, sinceDate, cursor = '*') {
  const endpoint = flux === 'unites_legales' ? `${INSEE_API_BASE}/siren` : `${INSEE_API_BASE}/siret`
  const fieldDate = flux === 'unites_legales' ? 'dateDernierTraitementUniteLegale' : 'dateDernierTraitementEtablissement'

  // Format ISO pour l'API INSEE : ex "2026-09-01T00:00:00"
  const isoDate = sinceDate.toISOString().slice(0, 19)
  const q = `${fieldDate}:[${isoDate} TO *]`

  const url = new URL(endpoint)
  url.searchParams.set('q', q)
  url.searchParams.set('nombre', '100') // Max autorisé par page
  url.searchParams.set('curseur', cursor)

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${INSEE_API_KEY}`,
      'Accept': 'application/json',
      'User-Agent': 'AnnuaireEntreprisesFrance/0.1',
    },
    signal: AbortSignal.timeout(30000),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText} (${url})`)
  }

  return response.json()
}

async function main() {
  const db = getDb()

  console.log(`[SyncIncremental] Démarrage synchronisation pour le flux : ${targetFlux}`)

  let sinceDate
  if (forcedSince) {
    sinceDate = new Date(forcedSince)
  } else {
    const last = await getLastCheckpoint(db, targetFlux)
    if (last) {
      sinceDate = new Date(last)
    } else {
      // Par défaut : dernières 48 heures si aucun checkpoint
      sinceDate = new Date(Date.now() - 48 * 3600 * 1000)
    }
  }

  console.log(`[SyncIncremental] Recherche des modifications depuis : ${sinceDate.toISOString()}`)

  const importId = await createImportRecord(db, {
    type: 'sync_incremental',
    sourceId: 'insee_sirene',
    sourceUrl: INSEE_API_BASE,
    sourceVersion: `api-${targetFlux}-${sinceDate.toISOString().slice(0, 10)}`,
    notes: `Synchronisation incrémentale ${targetFlux} depuis ${sinceDate.toISOString()}`,
  })

  let totalProcessed = 0
  let totalCreated = 0
  let totalUpdated = 0
  let cursor = '*'
  let hasMore = true
  let maxTimestampSeen = sinceDate

  try {
    if (!INSEE_API_KEY) {
      throw new Error('INSEE_API_KEY absente. Renseignez-la dans votre .env.local.')
    }

    while (hasMore) {
      console.log(`[SyncIncremental] Récupération du lot (curseur ${cursor})...`)
      const data = await fetchInseeModifications(targetFlux, sinceDate, cursor)

      const items = targetFlux === 'unites_legales' ? data.unitesLegales : data.etablissements
      const header = data.header

      if (!items || items.length === 0) {
        hasMore = false
        break
      }

      await db.begin(async (tx) => {
        for (const item of items) {
          if (targetFlux === 'unites_legales') {
            const siren = item.siren
            const dateTraitement = item.dateDernierTraitementUniteLegale
            if (dateTraitement && new Date(dateTraitement) > maxTimestampSeen) {
              maxTimestampSeen = new Date(dateTraitement)
            }

            const res = await tx`
              INSERT INTO legal_units (
                siren, statut_diffusion, etat_administratif, date_creation,
                date_fermeture, denomination, nom_naissance, prenom_1,
                categorie_juridique, activite_principale_naf_rev2,
                tranche_effectifs, siret_siege, date_dernier_traitement,
                source_import, import_id
              ) VALUES (
                ${siren},
                ${item.statutDiffusionUniteLegale ?? 'O'},
                ${item.etatAdministratifUniteLegale ?? 'A'},
                ${item.dateCreationUniteLegale ?? null},
                ${item.dateDebut ?? null},
                ${item.denominationUniteLegale ?? null},
                ${item.nomUniteLegale ?? null},
                ${item.prenom1UniteLegale ?? null},
                ${item.categorieJuridiqueUniteLegale ?? null},
                ${item.activitePrincipaleUniteLegale ?? null},
                ${item.trancheEffectifsUniteLegale ?? null},
                ${item.siretSiege ?? null},
                ${dateTraitement ?? null},
                'insee_api',
                ${importId}
              )
              ON CONFLICT (siren) DO UPDATE SET
                statut_diffusion = EXCLUDED.statut_diffusion,
                etat_administratif = EXCLUDED.etat_administratif,
                date_fermeture = EXCLUDED.date_fermeture,
                denomination = EXCLUDED.denomination,
                nom_naissance = EXCLUDED.nom_naissance,
                prenom_1 = EXCLUDED.prenom_1,
                categorie_juridique = EXCLUDED.categorie_juridique,
                activite_principale_naf_rev2 = EXCLUDED.activite_principale_naf_rev2,
                tranche_effectifs = EXCLUDED.tranche_effectifs,
                siret_siege = EXCLUDED.siret_siege,
                date_dernier_traitement = EXCLUDED.date_dernier_traitement,
                source_import = EXCLUDED.source_import,
                import_id = EXCLUDED.import_id,
                updated_at = NOW()
              RETURNING xmax
            `
            if (res[0]?.xmax === '0' || res[0]?.xmax === 0) totalCreated++
            else totalUpdated++
          } else {
            // Etablissements
            const siret = item.siret
            const siren = item.siren ?? siret.slice(0, 9)
            const nic = item.nic ?? siret.slice(9, 14)
            const dateTraitement = item.dateDernierTraitementEtablissement
            if (dateTraitement && new Date(dateTraitement) > maxTimestampSeen) {
              maxTimestampSeen = new Date(dateTraitement)
            }

            const res = await tx`
              INSERT INTO establishments (
                siret, siren, nic, statut_diffusion, etat_administratif,
                etablissement_siege, code_postal, code_commune,
                numero_voie, type_voie, libelle_voie,
                activite_principale_naf_rev2, tranche_effectifs,
                enseigne_1, date_creation, date_fermeture,
                date_dernier_traitement, source_import, import_id
              ) VALUES (
                ${siret}, ${siren}, ${nic},
                ${item.statutDiffusionEtablissement ?? 'O'},
                ${item.etatAdministratifEtablissement ?? 'A'},
                ${item.etablissementSiege ?? false},
                ${item.adresseEtablissement?.codePostalEtablissement ?? null},
                ${item.adresseEtablissement?.codeCommuneEtablissement ?? null},
                ${item.adresseEtablissement?.numeroVoieEtablissement ?? null},
                ${item.adresseEtablissement?.typeVoieEtablissement ?? null},
                ${item.adresseEtablissement?.libelleVoieEtablissement ?? null},
                ${item.activitePrincipaleEtablissement ?? null},
                ${item.trancheEffectifsEtablissement ?? null},
                ${item.enseigne1Etablissement ?? null},
                ${item.dateCreationEtablissement ?? null},
                ${item.dateDebut ?? null},
                ${dateTraitement ?? null},
                'insee_api',
                ${importId}
              )
              ON CONFLICT (siret) DO UPDATE SET
                statut_diffusion = EXCLUDED.statut_diffusion,
                etat_administratif = EXCLUDED.etat_administratif,
                etablissement_siege = EXCLUDED.etablissement_siege,
                code_postal = EXCLUDED.code_postal,
                code_commune = EXCLUDED.code_commune,
                numero_voie = EXCLUDED.numero_voie,
                type_voie = EXCLUDED.type_voie,
                libelle_voie = EXCLUDED.libelle_voie,
                activite_principale_naf_rev2 = EXCLUDED.activite_principale_naf_rev2,
                tranche_effectifs = EXCLUDED.tranche_effectifs,
                enseigne_1 = EXCLUDED.enseigne_1,
                date_fermeture = EXCLUDED.date_fermeture,
                date_dernier_traitement = EXCLUDED.date_dernier_traitement,
                source_import = EXCLUDED.source_import,
                import_id = EXCLUDED.import_id,
                updated_at = NOW()
              RETURNING xmax
            `
            if (res[0]?.xmax === '0' || res[0]?.xmax === 0) totalCreated++
            else totalUpdated++
          }
        }
      })

      totalProcessed += items.length
      console.log(`[SyncIncremental] Traités : ${totalProcessed} (${totalCreated} créés, ${totalUpdated} mis à jour)`)

      // Gestion du curseur pour la page suivante
      const nextCursor = header?.curseurSuivant
      if (!nextCursor || nextCursor === cursor) {
        hasMore = false
      } else {
        cursor = nextCursor
      }

      // Respect strict des quotas API INSEE
      await new Promise((r) => setTimeout(r, 200))
    }

    // Mise à jour du checkpoint
    await setCheckpoint(db, targetFlux, maxTimestampSeen, importId)

    await updateImportRecord(db, importId, {
      status: 'completed',
      processedCount: totalProcessed,
      createdCount: totalCreated,
      updatedCount: totalUpdated,
      rejectedCount: 0,
      watermarkEnd: maxTimestampSeen.toISOString(),
    })

    console.log(`[SyncIncremental] ✓ Synchronisation terminée avec succès. Nouveau checkpoint : ${maxTimestampSeen.toISOString()}`)
  } catch (error) {
    console.error('[SyncIncremental] Erreur :', error)
    await updateImportRecord(db, importId, {
      status: 'failed',
      processedCount: totalProcessed,
      createdCount: totalCreated,
      updatedCount: totalUpdated,
      rejectedCount: 0,
      errorMessage: error instanceof Error ? error.message : String(error),
    })
  } finally {
    await db.end()
  }
}

function getArg(args, key) {
  const idx = args.indexOf(key)
  if (idx >= 0 && args.length > idx + 1) return args[idx + 1]
  return undefined
}

main().catch((err) => {
  console.error('[SyncIncremental] Erreur non gérée:', err)
  process.exit(1)
})
