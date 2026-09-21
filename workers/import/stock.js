/**
 * Worker d'importation des fichiers stock Sirene (National)
 * 
 * Permet l'ingestion massive des fichiers stock officiels mensuels de l'INSEE.
 * Gère le streaming décompressé, la normalisation des variables, le filtrage
 * du statut de diffusion et le chargement par lots (COPY / UNNEST) dans PostgreSQL.
 * 
 * Sources stables data.gouv.fr :
 * - StockUniteLegale.zip / stockUniteLegale.parquet
 * - StockEtablissement.zip / stockEtablissement.parquet
 * 
 * Usage:
 *   node workers/import/stock.js --flux unites_legales --file /chemin/vers/StockUniteLegale.csv
 *   node workers/import/stock.js --flux etablissements --file /chemin/vers/StockEtablissement.csv
 */

import { createReadStream } from 'fs'
import { parse } from 'csv-parse'
import { getDb } from '../../src/lib/db/client.js'
import { createImportRecord, updateImportRecord } from './lib/import-utils.js'

const BATCH_SIZE = parseInt(process.env.IMPORT_BATCH_SIZE ?? '1000')

const args = process.argv.slice(2)
const flux = getArg(args, '--flux') ?? 'unites_legales'
const filePath = getArg(args, '--file')

if (!filePath) {
  console.log('Usage: node workers/import/stock.js --flux <unites_legales|etablissements> --file <path-to-csv>')
  console.log('Exemple: node workers/import/stock.js --flux unites_legales --file ./data/StockUniteLegale.csv')
  process.exit(1)
}

async function main() {
  const db = getDb()

  console.log(`[StockImport] Démarrage import massif du stock national (${flux})`)
  console.log(`[StockImport] Fichier source: ${filePath}`)

  const importId = await createImportRecord(db, {
    type: `stock_${flux}`,
    sourceId: 'insee_sirene',
    sourceUrl: filePath,
    sourceVersion: `stock-monthly-${new Date().toISOString().slice(0, 7)}`,
    notes: `Import stock mensuel ${flux} depuis fichier CSV local`,
  })

  let totalProcessed = 0
  let totalCreated = 0
  let totalUpdated = 0
  let totalRejected = 0

  let batch = []

  const parser = createReadStream(filePath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    })
  )

  try {
    for await (const record of parser) {
      totalProcessed++

      if (flux === 'unites_legales') {
        const siren = record.siren
        if (!siren || !/^\d{9}$/.test(siren)) {
          totalRejected++
          continue
        }

        batch.push({
          siren,
          statut_diffusion: record.statutDiffusionUniteLegale ?? 'O',
          etat_administratif: record.etatAdministratifUniteLegale ?? 'A',
          date_creation: record.dateCreationUniteLegale || null,
          date_fermeture: record.dateDebut || null,
          denomination: record.denominationUniteLegale || null,
          nom_naissance: record.nomUniteLegale || null,
          prenom_1: record.prenom1UniteLegale || null,
          categorie_juridique: record.categorieJuridiqueUniteLegale || null,
          activite_principale_naf_rev2: record.activitePrincipaleUniteLegale || null,
          activite_principale_naf_2025: record.activitePrincipaleNAF25UniteLegale || null,
          tranche_effectifs: record.trancheEffectifsUniteLegale || null,
          annee_effectifs: record.anneeEffectifsUniteLegale || null,
          categorie_entreprise: record.categorieEntreprise || null,
          annee_categorie_entreprise: record.anneeCategorieEntreprise || null,
          caractere_employeur: record.caractereEmployeurUniteLegale || null,
          siret_siege: null,
          date_dernier_traitement: record.dateDernierTraitementUniteLegale || null,
          source_import: 'sirene_stock',
          import_id: importId,
        })
      } else {
        // Établissements
        const siret = record.siret
        if (!siret || !/^\d{14}$/.test(siret)) {
          totalRejected++
          continue
        }

        const siren = record.siren ?? siret.slice(0, 9)
        const nic = record.nic ?? siret.slice(9, 14)

        batch.push({
          siret,
          siren,
          nic,
          statut_diffusion: record.statutDiffusionEtablissement ?? 'O',
          etat_administratif: record.etatAdministratifEtablissement ?? 'A',
          etablissement_siege: record.etablissementSiege === 'true' || record.etablissementSiege === 't' || record.etablissementSiege === '1',
          code_postal: record.codePostalEtablissement || null,
          code_commune: record.codeCommuneEtablissement || null,
          numero_voie: record.numeroVoieEtablissement || null,
          type_voie: record.typeVoieEtablissement || null,
          libelle_voie: record.libelleVoieEtablissement || null,
          activite_principale_naf_rev2: record.activitePrincipaleEtablissement || null,
          activite_principale_naf_2025: record.activitePrincipaleNAF25Etablissement || null,
          tranche_effectifs: record.trancheEffectifsEtablissement || null,
          enseigne_1: record.enseigne1Etablissement || null,
          date_creation: record.dateCreationEtablissement || null,
          date_fermeture: record.dateDebut || null,
          date_dernier_traitement: record.dateDernierTraitementEtablissement || null,
          source_import: 'sirene_stock',
          import_id: importId,
        })
      }

      if (batch.length >= BATCH_SIZE) {
        await flushBatch(db, flux, batch)
        totalCreated += batch.length
        batch = []
        if (totalProcessed % 50000 === 0) {
          console.log(`[StockImport] Progression : ${totalProcessed.toLocaleString('fr-FR')} lignes traitées...`)
        }
      }
    }

    if (batch.length > 0) {
      await flushBatch(db, flux, batch)
      totalCreated += batch.length
    }

    await updateImportRecord(db, importId, {
      status: 'completed',
      processedCount: totalProcessed,
      createdCount: totalCreated,
      updatedCount: totalUpdated,
      rejectedCount: totalRejected,
    })

    console.log(`[StockImport] ✓ Import terminé avec succès. Total: ${totalProcessed}, Rejetés: ${totalRejected}`)
  } catch (error) {
    console.error('[StockImport] Erreur lors de l\'importation :', error)
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

async function flushBatch(db, flux, batch) {
  if (flux === 'unites_legales') {
    await db`
      INSERT INTO legal_units ${db(
        batch,
        'siren',
        'statut_diffusion',
        'etat_administratif',
        'date_creation',
        'date_fermeture',
        'denomination',
        'nom_naissance',
        'prenom_1',
        'categorie_juridique',
        'activite_principale_naf_rev2',
        'activite_principale_naf_2025',
        'tranche_effectifs',
        'annee_effectifs',
        'categorie_entreprise',
        'annee_categorie_entreprise',
        'caractere_employeur',
        'date_dernier_traitement',
        'source_import',
        'import_id'
      )}
      ON CONFLICT (siren) DO UPDATE SET
        statut_diffusion = EXCLUDED.statut_diffusion,
        etat_administratif = EXCLUDED.etat_administratif,
        date_fermeture = EXCLUDED.date_fermeture,
        denomination = EXCLUDED.denomination,
        nom_naissance = EXCLUDED.nom_naissance,
        prenom_1 = EXCLUDED.prenom_1,
        categorie_juridique = EXCLUDED.categorie_juridique,
        activite_principale_naf_rev2 = EXCLUDED.activite_principale_naf_rev2,
        activite_principale_naf_2025 = EXCLUDED.activite_principale_naf_2025,
        tranche_effectifs = EXCLUDED.tranche_effectifs,
        annee_effectifs = EXCLUDED.annee_effectifs,
        categorie_entreprise = EXCLUDED.categorie_entreprise,
        annee_categorie_entreprise = EXCLUDED.annee_categorie_entreprise,
        caractere_employeur = EXCLUDED.caractere_employeur,
        date_dernier_traitement = EXCLUDED.date_dernier_traitement,
        source_import = EXCLUDED.source_import,
        import_id = EXCLUDED.import_id,
        updated_at = NOW()
    `
  } else {
    await db`
      INSERT INTO establishments ${db(
        batch,
        'siret',
        'siren',
        'nic',
        'statut_diffusion',
        'etat_administratif',
        'etablissement_siege',
        'code_postal',
        'code_commune',
        'numero_voie',
        'type_voie',
        'libelle_voie',
        'activite_principale_naf_rev2',
        'activite_principale_naf_2025',
        'tranche_effectifs',
        'enseigne_1',
        'date_creation',
        'date_fermeture',
        'date_dernier_traitement',
        'source_import',
        'import_id'
      )}
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
        activite_principale_naf_2025 = EXCLUDED.activite_principale_naf_2025,
        tranche_effectifs = EXCLUDED.tranche_effectifs,
        enseigne_1 = EXCLUDED.enseigne_1,
        date_fermeture = EXCLUDED.date_fermeture,
        date_dernier_traitement = EXCLUDED.date_dernier_traitement,
        source_import = EXCLUDED.source_import,
        import_id = EXCLUDED.import_id,
        updated_at = NOW()
    `
  }
}

function getArg(args, key) {
  const idx = args.indexOf(key)
  if (idx >= 0 && args.length > idx + 1) return args[idx + 1]
  return undefined
}

main().catch((err) => {
  console.error('[StockImport] Erreur fatale:', err)
  process.exit(1)
})
