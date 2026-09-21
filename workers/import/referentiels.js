/**
 * Worker d'import des référentiels géographiques
 * 
 * Importe les communes, départements et régions depuis l'API Découpage Administratif
 * (geo.api.gouv.fr) — source publique, sans authentification, Licence Ouverte 2.0.
 * 
 * Usage:
 *   node workers/import/referentiels.js
 *   node workers/import/referentiels.js --millesime 2024
 */

import { getDb } from '../../src/lib/db/client.js'
import { createImportRecord, updateImportRecord } from './lib/import-utils.js'

const GEO_API_BASE = process.env.GEO_API_BASE_URL ?? 'https://geo.api.gouv.fr'
const USER_AGENT = process.env.RECHERCHE_ENTREPRISES_USER_AGENT ?? 'AnnuaireEntreprisesFrance/0.1'

const args = process.argv.slice(2)
const millesime = getArg(args, '--millesime') ?? new Date().getFullYear().toString()

console.log(`[Référentiels] Démarrage import géographique — Millésime ${millesime}`)

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
    signal: AbortSignal.timeout(30000),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`)
  return response.json()
}

async function main() {
  const db = getDb()
  
  const importId = await createImportRecord(db, {
    type: 'referentiels_geo',
    sourceId: 'geo_api',
    sourceUrl: GEO_API_BASE,
    sourceVersion: `decoupage-administratif-${millesime}`,
    notes: `Import référentiels géographiques depuis geo.api.gouv.fr — Millésime ${millesime}`,
  })
  
  let stats = { regions: 0, departements: 0, communes: 0 }
  
  try {
    // =========================================================================
    // 1. Régions
    // =========================================================================
    console.log('[Référentiels] Import des régions...')
    const regions = await fetchJson(`${GEO_API_BASE}/regions?fields=code,nom&format=json`)
    
    for (const region of regions) {
      if (!region.code || !region.nom) continue
      const slug = toSlug(region.nom)
      await db`
        INSERT INTO regions (code, nom, slug, millesime, source)
        VALUES (${region.code}, ${region.nom}, ${slug}, ${millesime}, 'geo.api.gouv.fr')
        ON CONFLICT (code) DO UPDATE SET
          nom = EXCLUDED.nom,
          slug = EXCLUDED.slug,
          millesime = EXCLUDED.millesime,
          updated_at = NOW()
      `
      stats.regions++
    }
    console.log(`[Référentiels] ✓ ${stats.regions} régions importées`)
    
    // =========================================================================
    // 2. Départements
    // =========================================================================
    console.log('[Référentiels] Import des départements...')
    const departements = await fetchJson(`${GEO_API_BASE}/departements?fields=code,nom,codeRegion&format=json`)
    
    for (const dept of departements) {
      if (!dept.code || !dept.nom || !dept.codeRegion) continue
      const slug = toSlug(dept.nom) + `-${dept.code}`
      await db`
        INSERT INTO departements (code, nom, slug, code_region, millesime, source)
        VALUES (${dept.code}, ${dept.nom}, ${slug}, ${dept.codeRegion}, ${millesime}, 'geo.api.gouv.fr')
        ON CONFLICT (code) DO UPDATE SET
          nom = EXCLUDED.nom,
          slug = EXCLUDED.slug,
          code_region = EXCLUDED.code_region,
          millesime = EXCLUDED.millesime,
          updated_at = NOW()
      `
      stats.departements++
    }
    console.log(`[Référentiels] ✓ ${stats.departements} départements importés`)
    
    // =========================================================================
    // 3. Communes (par département pour éviter les timeouts)
    // =========================================================================
    console.log('[Référentiels] Import des communes (par département)...')
    
    const deptRows = await db`SELECT code FROM departements ORDER BY code`
    let communeCount = 0
    
    for (const { code: deptCode } of deptRows) {
      try {
        const communes = await fetchJson(
          `${GEO_API_BASE}/communes?codeDepartement=${deptCode}&fields=code,nom,codeDepartement,codeRegion,codesPostaux,population,centre&format=json`
        )
        
        for (const commune of communes) {
          if (!commune.code || !commune.nom) continue
          
          const slug = toSlug(commune.nom) + `-${commune.code}`
          const lat = commune.centre?.coordinates?.[1] ?? null
          const lon = commune.centre?.coordinates?.[0] ?? null
          
          await db`
            INSERT INTO communes (
              code, nom, slug, code_departement, code_region,
              population, latitude, longitude, millesime, source
            )
            VALUES (
              ${commune.code}, ${commune.nom}, ${slug},
              ${commune.codeDepartement ?? deptCode},
              ${commune.codeRegion ?? null},
              ${commune.population ?? null},
              ${lat}, ${lon},
              ${millesime}, 'geo.api.gouv.fr'
            )
            ON CONFLICT (code) DO UPDATE SET
              nom = EXCLUDED.nom,
              slug = EXCLUDED.slug,
              population = EXCLUDED.population,
              latitude = EXCLUDED.latitude,
              longitude = EXCLUDED.longitude,
              millesime = EXCLUDED.millesime,
              updated_at = NOW()
          `
          
          // Codes postaux (relation N:M)
          if (Array.isArray(commune.codesPostaux)) {
            for (const cp of commune.codesPostaux) {
              if (/^\d{5}$/.test(cp)) {
                await db`
                  INSERT INTO commune_codes_postaux (code_commune, code_postal)
                  VALUES (${commune.code}, ${cp})
                  ON CONFLICT DO NOTHING
                `
              }
            }
          }
          
          communeCount++
        }
        
        if (communeCount % 1000 === 0) {
          console.log(`[Référentiels] ${communeCount} communes importées...`)
        }
        
        // Rate limit : 500ms entre les appels par département
        await new Promise((r) => setTimeout(r, 100))
        
      } catch (err) {
        console.warn(`[Référentiels] Erreur département ${deptCode}:`, err.message)
      }
    }
    
    stats.communes = communeCount
    console.log(`[Référentiels] ✓ ${stats.communes} communes importées`)
    
    await updateImportRecord(db, importId, {
      status: 'completed',
      processedCount: stats.regions + stats.departements + stats.communes,
      createdCount: stats.regions + stats.departements + stats.communes,
      updatedCount: 0,
      rejectedCount: 0,
    })
    
    console.log(`[Référentiels] ✓ Import terminé — Régions: ${stats.regions}, Départements: ${stats.departements}, Communes: ${stats.communes}`)
    
  } catch (error) {
    console.error('[Référentiels] Erreur fatale:', error)
    await updateImportRecord(db, importId, {
      status: 'failed',
      processedCount: stats.regions + stats.departements + stats.communes,
      createdCount: stats.regions + stats.departements + stats.communes,
      updatedCount: 0,
      rejectedCount: 0,
      errorMessage: error instanceof Error ? error.message : String(error),
    })
    process.exit(1)
  } finally {
    await db.end()
  }
}

/**
 * Génère un slug à partir d'un texte (ASCII, tirets, pas de majuscules)
 */
function toSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // Supprimer les diacritiques
    .replace(/[^a-z0-9]+/g, '-')        // Remplacer les non-alphanumériques par -
    .replace(/^-|-$/g, '')              // Supprimer les tirets en début/fin
}

function getArg(args, key) {
  const idx = args.indexOf(key)
  if (idx >= 0 && args.length > idx + 1) return args[idx + 1]
  return undefined
}

main().catch((err) => {
  console.error('[Référentiels] Erreur:', err)
  process.exit(1)
})
