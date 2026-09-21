/**
 * Worker automatisé de surveillance des Procédures Collectives (BODACC)
 * 
 * Interroge les annonces officielles du BODACC (Bulletin Officiel des Annonces
 * Civiles et Commerciales) pour détecter en quasi temps réel :
 * - Les jugements d'ouverture de liquidation judiciaire
 * - Les jugements de redressement judiciaire
 * - Les procédures de sauvegarde
 * - Les clôtures de procédures
 * 
 * Met à jour automatiquement les fiches entreprises dans PostgreSQL.
 * 
 * Usage:
 *   node workers/sync/bodacc.js
 *   node workers/sync/bodacc.js --days 7
 */

import { getDb } from '../../src/lib/db/client.js'
import { createImportRecord, updateImportRecord } from '../import/lib/import-utils.js'

const BODACC_API_BASE = 'https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records'

const args = process.argv.slice(2)
const daysBack = parseInt(getArg(args, '--days') ?? '2', 10)

async function main() {
  const db = getDb()

  const sinceDate = new Date(Date.now() - daysBack * 24 * 3600 * 1000)
  const sinceIso = sinceDate.toISOString().slice(0, 10)

  console.log(`[BODACC Sync] Démarrage de la surveillance des procédures collectives depuis le ${sinceIso}`)

  const importId = await createImportRecord(db, {
    type: 'sync_bodacc_procedures',
    sourceId: 'dila_bodacc',
    sourceUrl: BODACC_API_BASE,
    sourceVersion: `bodacc-${sinceIso}`,
    notes: `Surveillance automatique des procédures collectives (redressement/liquidation) depuis ${sinceIso}`,
  })

  let totalProcessed = 0
  let totalUpdated = 0
  let offset = 0
  const limit = 100
  let hasMore = true

  try {
    while (hasMore) {
      const url = new URL(BODACC_API_BASE)
      url.searchParams.set('where', `dateparution >= date'${sinceIso}' and (familleavis_lib like 'Procédure%' or typeavis_lib like 'Procédure%' or jugement like '%judiciaire%')`)
      url.searchParams.set('order_by', 'dateparution desc')
      url.searchParams.set('limit', String(limit))
      url.searchParams.set('offset', String(offset))

      console.log(`[BODACC Sync] Récupération du lot (offset ${offset})...`)

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AnnuaireEntreprisesFrance/0.1',
        },
        signal: AbortSignal.timeout(20000),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const records = data.results ?? []

      if (records.length === 0) {
        hasMore = false
        break
      }

      for (const rec of records) {
        totalProcessed++

        // Extraction du SIREN depuis le registre ou champ siren
        let siren = rec.siren
        if (!siren && rec.registre) {
          const match = rec.registre.match(/(\d{9})/)
          if (match) siren = match[1]
        }

        if (!siren || !/^\d{9}$/.test(siren)) {
          continue
        }

        const jugement = (rec.jugement ?? rec.familleavis_lib ?? '').toLowerCase()
        const content = (rec.texte ?? rec.parution_lib ?? '').toLowerCase()

        let nature = 'autre'
        if (jugement.includes('liquidation') || content.includes('liquidation judiciaire')) {
          nature = 'liquidation'
        } else if (jugement.includes('redressement') || content.includes('redressement judiciaire')) {
          nature = 'redressement'
        } else if (jugement.includes('sauvegarde') || content.includes('sauvegarde')) {
          nature = 'sauvegarde'
        } else if (jugement.includes('clôture') || content.includes('insuffisance d\'actif')) {
          nature = 'cloture'
        }

        const isEnProcedure = nature !== 'cloture'
        const dateJugement = rec.dateparution ?? null
        const tribunal = rec.tribunal ?? rec.tribunal_lib ?? null
        const details = rec.texte ?? rec.jugement ?? null

        // 1. Mise à jour de legal_units si l'entreprise existe dans notre base
        const updated = await db`
          UPDATE legal_units SET
            est_en_procedure_collective = ${isEnProcedure},
            nature_procedure_collective = ${nature},
            date_procedure_collective = ${dateJugement ? new Date(dateJugement) : null},
            tribunal_procedure_collective = ${tribunal},
            details_procedure_collective = ${details},
            derniere_verification_temps_reel = NOW(),
            updated_at = NOW()
          WHERE siren = ${siren}
          RETURNING siren
        `

        // 2. Historique dans collective_procedures
        await db`
          INSERT INTO collective_procedures (
            siren, type_jugement, nature_decision, date_jugement,
            date_publication, tribunal, numero_annonce, parution_bodacc,
            description
          ) VALUES (
            ${siren},
            ${rec.jugement ?? rec.familleavis_lib ?? 'Annonce BODACC'},
            ${nature},
            ${dateJugement ? new Date(dateJugement) : null},
            ${rec.dateparution ? new Date(rec.dateparution) : null},
            ${tribunal},
            ${rec.numeroannonce ?? null},
            ${rec.parution ?? null},
            ${details}
          )
          ON CONFLICT DO NOTHING
        `

        if (updated.length > 0) {
          totalUpdated++
          console.log(`[BODACC Sync] ⚠ Procédure détectée pour SIREN ${siren} : ${nature.toUpperCase()} (${tribunal || 'Tribunal'})`)
        }
      }

      offset += records.length
      if (records.length < limit || offset >= (data.total_count ?? 5000)) {
        hasMore = false
      }

      // Petite pause respectueuse
      await new Promise((r) => setTimeout(r, 200))
    }

    // Journalisation de la réussite
    await updateImportRecord(db, importId, {
      status: 'completed',
      processedCount: totalProcessed,
      createdCount: 0,
      updatedCount: totalUpdated,
      rejectedCount: 0,
    })

    console.log(`[BODACC Sync] ✓ Surveillance terminée avec succès. ${totalProcessed} annonces analysées, ${totalUpdated} entreprises mises à jour.`)
  } catch (error) {
    console.error('[BODACC Sync] Erreur fatale :', error)
    await updateImportRecord(db, importId, {
      status: 'failed',
      processedCount: totalProcessed,
      createdCount: 0,
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
  console.error('[BODACC Sync] Erreur :', err)
  process.exit(1)
})
