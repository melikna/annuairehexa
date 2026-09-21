/**
 * Script de migration PostgreSQL
 * 
 * Usage:
 *   node scripts/migrate.js            — Exécute toutes les migrations non appliquées
 *   node scripts/migrate.js --status   — Affiche l'état des migrations
 *   node scripts/migrate.js --dry-run  — Simule sans exécuter
 * 
 * Les migrations sont des fichiers SQL dans le répertoire migrations/
 * numérotés par ordre alphabétique (001_xxx.sql, 002_xxx.sql, etc.)
 */

import { readdir, readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import postgres from 'postgres'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = join(__dirname, '..', 'migrations')

async function getDb() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('ERREUR: DATABASE_URL non définie.')
    console.error('Copiez .env.example en .env.local et configurez DATABASE_URL.')
    process.exit(1)
  }
  return postgres(url, { max: 1 })
}

async function ensureMigrationsTable(db) {
  await db`
    CREATE TABLE IF NOT EXISTS _migrations (
      id          SERIAL PRIMARY KEY,
      filename    VARCHAR(500) NOT NULL UNIQUE,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      checksum    VARCHAR(64)
    )
  `
}

async function getAppliedMigrations(db) {
  const rows = await db`SELECT filename FROM _migrations ORDER BY filename`
  return new Set(rows.map((r) => r.filename))
}

async function getMigrationFiles() {
  const files = await readdir(MIGRATIONS_DIR)
  return files
    .filter((f) => f.endsWith('.sql'))
    .sort()  // Ordre alphabétique = ordre chronologique grâce à la numérotation
}

async function applyMigration(db, filename, dryRun = false) {
  const content = await readFile(join(MIGRATIONS_DIR, filename), 'utf-8')
  
  if (dryRun) {
    console.log(`[DRY RUN] Appliquerait: ${filename}`)
    return
  }
  
  console.log(`[Migration] Application de ${filename}...`)
  
  try {
    await db.begin(async (tx) => {
      await tx.unsafe(content)
      await tx`
        INSERT INTO _migrations (filename)
        VALUES (${filename})
      `
    })
    console.log(`[Migration] ✓ ${filename} appliquée`)
  } catch (error) {
    console.error(`[Migration] ✗ Erreur sur ${filename}:`, error.message)
    throw error
  }
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const statusOnly = args.includes('--status')
  
  const db = await getDb()
  
  try {
    await ensureMigrationsTable(db)
    
    const applied = await getAppliedMigrations(db)
    const files = await getMigrationFiles()
    
    if (statusOnly) {
      console.log('\nStatut des migrations:\n')
      for (const file of files) {
        const status = applied.has(file) ? '✓ Appliquée' : '○ En attente'
        console.log(`  ${status}  ${file}`)
      }
      console.log()
      return
    }
    
    const pending = files.filter((f) => !applied.has(f))
    
    if (pending.length === 0) {
      console.log('[Migration] Toutes les migrations sont à jour.')
      return
    }
    
    console.log(`[Migration] ${pending.length} migration(s) en attente:`)
    pending.forEach((f) => console.log(`  - ${f}`))
    console.log()
    
    for (const filename of pending) {
      await applyMigration(db, filename, dryRun)
    }
    
    if (!dryRun) {
      console.log(`\n[Migration] ✓ ${pending.length} migration(s) appliquée(s) avec succès.`)
    }
  } finally {
    await db.end()
  }
}

main().catch((err) => {
  console.error('[Migration] Erreur fatale:', err)
  process.exit(1)
})
