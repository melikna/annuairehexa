/**
 * Service de Synchronisation Temps Réel & Procédures Collectives (BODACC / RNE / Sirene)
 * 
 * Ce service garantit que les informations d'une entreprise (en particulier
 * les procédures collectives : redressement, liquidation judiciaire, sauvegarde)
 * sont interrogées et actualisées à la volée.
 */

import { getDb } from '@/lib/db/client'
import { safeFetch } from '@/lib/api/fetch-client'
import type { UniteLegalePubliable, ProcedureCollective } from '@/types/domain'

const BODACC_API_BASE = 'https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records'
const RECHERCHE_ENTREPRISES_BASE = process.env.RECHERCHE_ENTREPRISES_BASE_URL ?? 'https://recherche-entreprises.api.gouv.fr'

export interface RealtimeSyncResult {
  siren: string
  estEnProcedureCollective: boolean
  natureProcedure: string | null
  dateJugement: string | null
  tribunal: string | null
  details: string | null
  procedures: ProcedureCollective[]
}

/**
 * Interroge l'API publique BODACC pour un numéro SIREN
 * Détecte les jugements de redressement, liquidation judiciaire, sauvegarde, etc.
 */
export async function fetchBodaccProcedures(siren: string): Promise<ProcedureCollective[]> {
  try {
    const url = new URL(BODACC_API_BASE)
    // Recherche par SIREN dans le champ 'registre' (supporte les formats avec et sans espaces)
    const spaced = `${siren.slice(0, 3)} ${siren.slice(3, 6)} ${siren.slice(6, 9)}`
    url.searchParams.set('where', `registre like "*${siren}*" or registre like "*${spaced}*"`)
    url.searchParams.set('order_by', 'dateparution desc')
    url.searchParams.set('limit', '10')

    const response = await safeFetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AnnuaireEntreprisesFrance/0.1',
      },
      signal: AbortSignal.timeout(6000), // Timeout court 6s pour ne pas bloquer le SSR
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    const records = data.results ?? []

    const procedures: ProcedureCollective[] = []

    for (const rec of records) {
      let jugementData: Record<string, any> = {}
      if (typeof rec.jugement === 'string') {
        try {
          jugementData = JSON.parse(rec.jugement)
        } catch {
          jugementData = { nature: rec.jugement }
        }
      } else if (typeof rec.jugement === 'object' && rec.jugement !== null) {
        jugementData = rec.jugement
      }

      const typeAvis = (rec.typeavis_lib ?? rec.typeavis ?? '').toLowerCase()
      const familleAvis = (rec.familleavis_lib ?? rec.familleavis ?? '').toLowerCase()
      const jugementText = (jugementData.nature || jugementData.famille || rec.texte || '').toLowerCase()
      const complement = (jugementData.complementJugement || rec.texte || '').toLowerCase()

      let nature: string = 'autre'
      if (jugementText.includes('liquidation') || complement.includes('liquidation judiciaire')) {
        nature = 'liquidation'
      } else if (jugementText.includes('redressement') || complement.includes('redressement judiciaire')) {
        nature = 'redressement'
      } else if (jugementText.includes('sauvegarde') || complement.includes('sauvegarde')) {
        nature = 'sauvegarde'
      } else if (jugementText.includes('clôture') || jugementText.includes('cloture') || complement.includes('insuffisance d\'actif')) {
        nature = 'cloture'
      }

      // Si l'annonce concerne une procédure collective
      if (nature !== 'autre' || familleAvis.includes('collective')) {
        procedures.push({
          id: rec.id ?? String(Math.random()),
          siren,
          typeJugement: jugementData.nature || jugementData.famille || rec.typeavis_lib || 'Procédure collective',
          natureDecision: nature,
          dateJugement: jugementData.date || rec.dateparution || null,
          datePublication: rec.dateparution || null,
          tribunal: rec.tribunal ?? rec.tribunal_lib ?? null,
          numeroAnnonce: rec.numeroannonce ?? null,
          parutionBodacc: rec.parution ?? null,
          description: jugementData.complementJugement || rec.texte || jugementData.nature || null,
        })
      }
    }

    return procedures
  } catch (error) {
    console.warn(`[RealtimeSync] Erreur requête BODACC pour SIREN ${siren}:`, error)
    return []
  }
}

/**
 * Interroge en direct l'API Recherche Entreprises pour vérifier l'état administratif et les compléments
 */
export async function fetchLiveRechercheEntreprise(siren: string) {
  try {
    const url = new URL(`${RECHERCHE_ENTREPRISES_BASE}/search`)
    url.searchParams.set('q', siren)
    url.searchParams.set('limite_matching_etablissements', '10')

    const response = await safeFetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AnnuaireEntreprisesFrance/0.1',
      },
      signal: AbortSignal.timeout(6000),
    })

    if (!response.ok) return null

    const data = await response.json()
    const match = data.results?.find((r: any) => r.siren === siren)
    return match ?? null
  } catch (error) {
    console.warn(`[RealtimeSync] Erreur API Recherche Entreprises pour SIREN ${siren}:`, error)
    return null
  }
}

/**
 * Exécute une actualisation temps réel complète pour une unité légale :
 * 1. BODACC pour les procédures collectives
 * 2. API Entreprises pour l'état actif/fermé et les établissements
 * 3. Enregistrement en base de données PostgreSQL
 */
export async function syncEnterpriseLive(siren: string): Promise<RealtimeSyncResult> {
  // 1. Requêtes parallèles pour minimiser la latence
  const [procedures, liveSirene] = await Promise.all([
    fetchBodaccProcedures(siren),
    fetchLiveRechercheEntreprise(siren),
  ])

  // Détection si en procédure collective
  const mostRecentProcedure = procedures[0] ?? null
  const isEnProcedure = !!mostRecentProcedure && mostRecentProcedure.natureDecision !== 'cloture'

  const nature = mostRecentProcedure ? mostRecentProcedure.natureDecision : null
  const dateJugement = mostRecentProcedure ? mostRecentProcedure.dateJugement : null
  const tribunal = mostRecentProcedure ? mostRecentProcedure.tribunal : null
  const details = mostRecentProcedure ? mostRecentProcedure.description : null

  // 2. Mise à jour persistante dans PostgreSQL
  try {
    const db = getDb()

    // Mise à jour de legal_units
    await db`
      UPDATE legal_units SET
        est_en_procedure_collective = ${isEnProcedure},
        nature_procedure_collective = ${nature},
        date_procedure_collective = ${dateJugement ? new Date(dateJugement) : null},
        tribunal_procedure_collective = ${tribunal},
        details_procedure_collective = ${details},
        derniere_verification_temps_reel = NOW(),
        updated_at = NOW()
      WHERE siren = ${siren}
    `

    // Enregistrement de l'historique dans collective_procedures
    for (const proc of procedures) {
      await db`
        INSERT INTO collective_procedures (
          siren, type_jugement, nature_decision, date_jugement,
          date_publication, tribunal, numero_annonce, parution_bodacc,
          description
        ) VALUES (
          ${proc.siren}, ${proc.typeJugement}, ${proc.natureDecision},
          ${proc.dateJugement ? new Date(proc.dateJugement) : null},
          ${proc.datePublication ? new Date(proc.datePublication) : null},
          ${proc.tribunal}, ${proc.numeroAnnonce}, ${proc.parutionBodacc},
          ${proc.description}
        )
        ON CONFLICT DO NOTHING
      `
    }
  } catch (dbError) {
    console.warn(`[RealtimeSync] Avertissement écriture DB pour SIREN ${siren}:`, dbError)
  }

  return {
    siren,
    estEnProcedureCollective: isEnProcedure,
    natureProcedure: nature,
    dateJugement,
    tribunal,
    details,
    procedures,
  }
}

/**
 * Récupère les procédures collectives depuis la base locale
 */
export async function getLocalCollectiveProcedures(siren: string): Promise<ProcedureCollective[]> {
  try {
    const db = getDb()
    const rows = await db`
      SELECT id, siren, type_jugement, nature_decision, date_jugement,
             date_publication, tribunal, numero_annonce, parution_bodacc, description
      FROM collective_procedures
      WHERE siren = ${siren}
      ORDER BY date_jugement DESC NULLS LAST, created_at DESC
    `

    return rows.map((r) => ({
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
  } catch (error) {
    return []
  }
}
