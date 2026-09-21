/**
 * Ordonnanceur Automatisé (Cron Scheduler) — Annuaire Entreprises France
 * 
 * Automatise et pilote en continu les tâches de fond :
 * - Surveillance des procédures collectives (BODACC) toutes les heures
 * - Synchronisation incrémentale Sirene INSEE toutes les 4 heures
 * - Recalcul des agrégats territoriaux et nettoyage quotidien
 * 
 * Usage:
 *   node workers/cron/scheduler.js
 */

import cron from 'node-cron'
import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = join(__dirname, '..', '..')

console.log('[Scheduler] ====================================================')
console.log('[Scheduler] Démarrage de l\'ordonnanceur automatique en tâche de fond')
console.log('[Scheduler] Surveillance continue BODACC, Sirene et Procédures collectives')
console.log('[Scheduler] ====================================================')

function runWorker(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`[Scheduler] Lancement de la tâche : ${scriptPath} ${args.join(' ')}`)
    const child = spawn(process.execPath, [scriptPath, ...args], {
      cwd: ROOT_DIR,
      stdio: 'inherit',
    })

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`[Scheduler] ✓ Tâche terminée avec succès : ${scriptPath}`)
        resolve()
      } else {
        console.error(`[Scheduler] ✗ Tâche échouée (code ${code}) : ${scriptPath}`)
        resolve() // Ne pas planter le scheduler principal
      }
    })

    child.on('error', (err) => {
      console.error(`[Scheduler] Erreur d'exécution pour ${scriptPath}:`, err)
      resolve()
    })
  })
}

// 1. Surveillance BODACC : Toutes les 2 heures (au début de chaque heure paire)
cron.schedule('0 */2 * * *', async () => {
  console.log('[Scheduler] [CRON] Déclenchement de la surveillance des procédures collectives BODACC')
  await runWorker(join(ROOT_DIR, 'workers', 'sync', 'bodacc.js'), ['--days', '2'])
})

// 2. Synchronisation incrémentale Sirene (INSEE) : Toutes les 4 heures
cron.schedule('30 */4 * * *', async () => {
  console.log('[Scheduler] [CRON] Déclenchement de la synchronisation incrémentale Sirene (Unités légales)')
  await runWorker(join(ROOT_DIR, 'workers', 'sync', 'incremental.js'), ['--flux', 'unites_legales'])

  console.log('[Scheduler] [CRON] Déclenchement de la synchronisation incrémentale Sirene (Établissements)')
  await runWorker(join(ROOT_DIR, 'workers', 'sync', 'incremental.js'), ['--flux', 'etablissements'])
})

// 3. Maintenance quotidienne & recalcul des agrégats : Chaque nuit à 3h00
cron.schedule('0 3 * * *', async () => {
  console.log('[Scheduler] [CRON] Tâche de maintenance de nuit')
  // Vérification BODACC sur 7 jours glissants pour garantir l'exhaustivité
  await runWorker(join(ROOT_DIR, 'workers', 'sync', 'bodacc.js'), ['--days', '7'])
})

console.log('[Scheduler] Ordonnanceur actif. Prochaines exécutions planifiées.')
