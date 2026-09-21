/**
 * Connecteur INPI / RNE (Registre National des Entreprises)
 * 
 * Permet l'authentification avec les identifiants INPI (compte utilisateur)
 * et l'enrichissement des fiches entreprises (représentants légaux, bénéficiaires effectifs).
 * 
 * Usage:
 *   node workers/enrichment/inpi.js --siren 123456789
 *   node workers/enrichment/inpi.js --limit 50
 */

import { getDb } from '../../src/lib/db/client.js'

const INPI_API_BASE = process.env.INPI_API_BASE_URL ?? 'https://registre-national-entreprises.inpi.fr/api'
const INPI_USER = process.env.INPI_API_USER
const INPI_PASS = process.env.INPI_API_PASS

const args = process.argv.slice(2)
const targetSiren = getArg(args, '--siren')

let tokenCache = null
let tokenExpiresAt = null

async function getInpiToken() {
  if (tokenCache && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    return tokenCache
  }

  if (!INPI_USER || !INPI_PASS) {
    throw new Error('Identifiants INPI non configurés dans .env.local (INPI_API_USER / INPI_API_PASS).')
  }

  console.log(`[INPI] Authentification avec le compte ${INPI_USER}...`)

  const response = await fetch(`${INPI_API_BASE}/sso/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'AnnuaireEntreprisesFrance/0.1',
    },
    body: JSON.stringify({
      username: INPI_USER,
      password: INPI_PASS,
    }),
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    throw new Error(`Échec authentification INPI HTTP ${response.status} : ${response.statusText}`)
  }

  const data = await response.json()
  tokenCache = data.token
  // Token valide généralement plusieurs heures, on renouvelle après 50 minutes
  tokenExpiresAt = Date.now() + 50 * 60 * 1000
  console.log('[INPI] ✓ Authentification réussie (session active)')
  return tokenCache
}

export async function fetchInpiCompany(siren) {
  const token = await getInpiToken()

  const response = await fetch(`${INPI_API_BASE}/companies/${siren}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'User-Agent': 'AnnuaireEntreprisesFrance/0.1',
    },
    signal: AbortSignal.timeout(15000),
  })

  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`Erreur récupération INPI SIREN ${siren} (HTTP ${response.status})`)
  }

  return response.json()
}

async function main() {
  if (targetSiren) {
    console.log(`[INPI] Recherche des données RNE pour le SIREN : ${targetSiren}`)
    try {
      const company = await fetchInpiCompany(targetSiren)
      if (!company) {
        console.log(`[INPI] Aucune donnée trouvée pour le SIREN ${targetSiren}`)
      } else {
        console.log(`[INPI] ✓ Données récupérées :`, JSON.stringify(company, null, 2).slice(0, 500) + '...')
      }
    } catch (err) {
      console.error('[INPI] Erreur :', err.message)
    }
  } else {
    console.log('[INPI] Mode test de connexion...')
    try {
      await getInpiToken()
      console.log('[INPI] ✓ Vos identifiants INPI sont valides et prêts pour les enrichissements RNE.')
    } catch (err) {
      console.error('[INPI] Erreur de connexion :', err.message)
    }
  }
}

function getArg(args, key) {
  const idx = args.indexOf(key)
  if (idx >= 0 && args.length > idx + 1) return args[idx + 1]
  return undefined
}

if (process.argv[1]?.endsWith('inpi.js')) {
  main().catch(console.error)
}
