import { singleFlight } from '@/lib/api/single-flight'
/**
 * Service Métier : Procédures Collectives en direct du BODACC
 * Récupère, filtre, classe et normalise les annonces de liquidations judiciaires,
 * redressements judiciaires et sauvegardes publiées au BODACC.
 */

import { BoundedCache } from '@/lib/api/bounded-cache'
import { safeFetch } from '@/lib/api/fetch-client'

const BODACC_API_BASE = 'https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records'

export interface ProcedureItem {
  id: string
  siren: string | null
  denomination: string
  formeJuridique: string | null
  activite: string | null
  departementCode: string
  departementNom: string
  ville: string | null
  codePostal: string | null
  nature: 'liquidation' | 'redressement'
  natureLibelle: 'Liquidation Judiciaire' | 'Redressement Judiciaire'
  datePublication: string // YYYY-MM-DD
  dateJugement: string | null // YYYY-MM-DD
  tribunal: string
  complementJugement: string | null
  liquidateurMandataire: string | null
  urlBodacc: string
  parutionNumero: string | null
  numeroAnnonce: string | number | null
}

export interface ProceduresFilterParams {
  departement?: string
  nature?: 'all' | 'liquidation' | 'redressement'
  limit?: number
  page?: number
}

export interface ProceduresResponse {
  totalCount: number
  results: ProcedureItem[]
  departementsDisponibles: { code: string; nom: string; count: number }[]
  updatedAt: string
}

// Cache en mémoire pour garantir un chargement ultra-rapide (< 10ms) et respecter les quotas
interface CacheEntry {
  data: ProceduresResponse
  expiresAt: number
}

const cache = new BoundedCache<CacheEntry>()
const loadOnce = singleFlight<ProceduresResponse>(4)
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

/**
 * Extrait le SIREN propre (9 chiffres sans espaces) d'un enregistrement BODACC
 */
function extractSiren(rec: Record<string, any>): string | null {
  if (rec.siren && /^\d{9}$/.test(rec.siren)) {
    return rec.siren
  }

  if (Array.isArray(rec.registre)) {
    for (const item of rec.registre) {
      const clean = String(item).replace(/\s+/g, '')
      if (/^\d{9}$/.test(clean)) return clean
    }
  }

  if (typeof rec.listepersonnes === 'string') {
    try {
      const parsed = JSON.parse(rec.listepersonnes)
      const id = parsed?.personne?.numeroImmatriculation?.numeroIdentification
      if (id) {
        const clean = String(id).replace(/\s+/g, '')
        if (/^\d{9}$/.test(clean)) return clean
      }
    } catch {
      // Ignorer
    }
  }

  return null
}

/**
 * Normalise un enregistrement BODACC brut en ProcedureItem structuré
 */
function normalizeRecord(rec: Record<string, any>): ProcedureItem | null {
  const siren = extractSiren(rec)

  // Parsing de l'objet jugement
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

  // Parsing de la personne morale / physique
  let personneData: Record<string, any> = {}
  if (typeof rec.listepersonnes === 'string') {
    try {
      const parsed = JSON.parse(rec.listepersonnes)
      personneData = parsed?.personne ?? {}
    } catch {
      // Ignorer
    }
  }

  const rawNature = (
    jugementData.nature ||
    jugementData.famille ||
    rec.typeavis_lib ||
    rec.texte ||
    ''
  ).toLowerCase()

  const rawComplement = jugementData.complementJugement || rec.texte || ''

  let nature: ProcedureItem['nature'] | null = null
  let natureLibelle: ProcedureItem['natureLibelle'] | null = null

  if (rawNature.includes('liquidation') || rawComplement.toLowerCase().includes('liquidation judiciaire')) {
    nature = 'liquidation'
    natureLibelle = 'Liquidation Judiciaire'
  } else if (rawNature.includes('redressement') || rawComplement.toLowerCase().includes('redressement judiciaire')) {
    nature = 'redressement'
    natureLibelle = 'Redressement Judiciaire'
  }

  // L'utilisateur exige UNIQUEMENT les liquidations et redressements
  if (!nature || !natureLibelle) {
    return null
  }

  // Extraction du mandataire ou liquidateur dans le texte du jugement
  let liquidateurMandataire: string | null = null
  const liquidateurMatch = rawComplement.match(/désignant liquidateur\s+([^.]+)/i) ||
    rawComplement.match(/mandataire judiciaire\s+([^.]+)/i) ||
    rawComplement.match(/administrateur\s+([^.]+)/i)
  if (liquidateurMatch) {
    liquidateurMandataire = liquidateurMatch[1].trim()
  }

  // Nom de l'entreprise
  const denomination =
    personneData.denomination ||
    (personneData.nom ? `${personneData.nom} ${personneData.prenom || ''}`.trim() : null) ||
    rec.commercant ||
    'Entreprise'

  // Code et nom du département
  let depCode = String(rec.numerodepartement || '').trim()
  if (depCode.length === 1) depCode = `0${depCode}`
  const depNom = rec.departement_nom_officiel || (depCode ? `Département ${depCode}` : 'France')

  return {
    id: rec.id || `bodacc-${Math.random().toString(36).slice(2)}`,
    siren,
    denomination,
    formeJuridique: personneData.formeJuridique || null,
    activite: personneData.activite || null,
    departementCode: depCode,
    departementNom: depNom,
    ville: rec.ville || personneData.adresseSiegeSocial?.ville || null,
    codePostal: rec.cp || personneData.adresseSiegeSocial?.codePostal || null,
    nature,
    natureLibelle,
    datePublication: rec.dateparution || new Date().toISOString().slice(0, 10),
    dateJugement: jugementData.date || null,
    tribunal: rec.tribunal || 'Tribunal de Commerce',
    complementJugement: rawComplement || null,
    liquidateurMandataire,
    urlBodacc: rec.url_complete || `https://www.bodacc.fr`,
    parutionNumero: rec.parution || null,
    numeroAnnonce: rec.numeroannonce || null,
  }
}

/**
 * Récupère les procédures collectives avec tri par date décroissante et filtrage par département
 */
export async function fetchProceduresCollectives(params: ProceduresFilterParams = {}): Promise<ProceduresResponse> {
  const { departement, nature = 'all', limit = 40, page = 1 } = params
  const cacheKey = `proc_${departement || 'all'}_${nature}_${limit}_${page}`

  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data
  }

  try {
    return await loadOnce(cacheKey, async () => {
    const url = new URL(BODACC_API_BASE)

    // Construction de la clause WHERE OpenDataSoft
    const whereClauses: string[] = ["familleavis='collective'"]

    if (departement && departement !== 'all') {
      const cleanDep = departement.padStart(2, '0')
      if (cleanDep !== departement) {
        whereClauses.push(`(numerodepartement='${cleanDep}' or numerodepartement='${departement}')`)
      } else {
        whereClauses.push(`numerodepartement='${departement}'`)
      }
    }

    url.searchParams.set('where', whereClauses.join(' and '))
    url.searchParams.set('order_by', 'dateparution desc')
    url.searchParams.set('limit', String(Math.min(limit * 2, 100))) // On demande une marge pour filtrer côté serveur si besoin
    const offset = (page - 1) * limit
    url.searchParams.set('offset', String(offset))

    const res = await safeFetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'AnnuaireEntreprisesFrance/0.1',
      },
      signal: AbortSignal.timeout(6000),
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from BODACC API`)
    }

    const json = await res.json()
    const records = json.results ?? []
    const totalCount = json.total_count ?? records.length

    // Ne conserve strictement QUE les liquidations et redressements judiciaires
    let items: ProcedureItem[] = records
      .map((r: any) => normalizeRecord(r))
      .filter((it: ProcedureItem | null): it is ProcedureItem => it !== null)

    // Filtrage par nature spécifique si demandé
    if (nature && nature !== 'all') {
      items = items.filter((it: ProcedureItem) => it.nature === nature)
    }

    // Extraction des départements disponibles pour faciliter le filtrage
    const depMap = new Map<string, { code: string; nom: string; count: number }>()
    for (const item of items) {
      if (item.departementCode) {
        const existing = depMap.get(item.departementCode)
        if (existing) {
          existing.count++
        } else {
          depMap.set(item.departementCode, {
            code: item.departementCode,
            nom: item.departementNom,
            count: 1,
          })
        }
      }
    }

    const response: ProceduresResponse = {
      totalCount,
      results: items.slice(0, limit),
      departementsDisponibles: Array.from(depMap.values()).sort((a, b) => a.code.localeCompare(b.code)),
      updatedAt: new Date().toISOString(),
    }

    cache.set(cacheKey, {
      data: response,
      expiresAt: Date.now() + CACHE_TTL_MS,
    })

    return response
    })
  } catch (error) {
    console.warn('[ProceduresService] Erreur interrogation BODACC :', error)

    // Sécurité juridique absolue : jamais de fausse procédure de faillite en secours
    return {
      totalCount: 0,
      results: [],
      departementsDisponibles: [],
      updatedAt: new Date().toISOString(),
    }
  }
}
