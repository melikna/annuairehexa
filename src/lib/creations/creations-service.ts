import { singleFlight } from '@/lib/api/single-flight'
/**
 * Service Métier : Nouvelles Entreprises Créées (BODACC / RNE en direct)
 * Récupère, filtre et normalise les annonces de créations d'entreprises
 * publiées au BODACC (Bulletin Officiel des Annonces Civiles et Commerciales).
 */

import { BoundedCache } from '@/lib/api/bounded-cache'
import { safeFetch } from '@/lib/api/fetch-client'
import { isEntitySuppressed } from '@/lib/search/suppression-registry'

const BODACC_API_BASE = 'https://bodacc-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/annonces-commerciales/records'

export interface CreationItem {
  id: string
  siren: string | null
  denomination: string
  formeJuridique: string | null
  activite: string | null
  capital?: string | null
  administration?: string | null
  departementCode: string
  departementNom: string
  ville: string | null
  codePostal: string | null
  adresseLigne: string | null
  dateParution: string // YYYY-MM-DD
  dateImmatriculation: string | null
  dateCommencementActivite: string | null
  tribunal: string
  urlBodacc: string
  parutionNumero: string | null
  numeroAnnonce: string | number | null
}

export interface CreationsFilterParams {
  departement?: string
  limit?: number
  page?: number
}

export interface CreationsResponse {
  totalCount: number
  results: CreationItem[]
  departementsDisponibles: { code: string; nom: string; count: number }[]
  dateDerniereParution: string
  updatedAt: string
}

interface CacheEntry {
  data: CreationsResponse
  expiresAt: number
}

const cache = new BoundedCache<CacheEntry>()
const loadOnce = singleFlight<CreationsResponse>(4)
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
 * Normalise un enregistrement BODACC brut de création en CreationItem structuré
 */
function normalizeCreationRecord(rec: Record<string, any>): CreationItem | null {
  const siren = extractSiren(rec)

  // Vérification prioritaire du registre local d'opposition/suppression
  if (siren && isEntitySuppressed(siren)) {
    return null
  }

  // Parsing personne physique ou morale
  let personneData: Record<string, any> = {}
  if (typeof rec.listepersonnes === 'string') {
    try {
      const parsed = JSON.parse(rec.listepersonnes)
      personneData = parsed?.personne ?? {}
    } catch {
      // Ignorer
    }
  } else if (typeof rec.listepersonnes === 'object' && rec.listepersonnes !== null) {
    personneData = rec.listepersonnes.personne ?? {}
  }

  // Parsing etablissement
  let etablissementData: Record<string, any> = {}
  if (typeof rec.listeetablissements === 'string') {
    try {
      const parsed = JSON.parse(rec.listeetablissements)
      etablissementData = parsed?.etablissement ?? {}
    } catch {
      // Ignorer
    }
  } else if (typeof rec.listeetablissements === 'object' && rec.listeetablissements !== null) {
    etablissementData = rec.listeetablissements.etablissement ?? {}
  }

  // Parsing acte
  let acteData: Record<string, any> = {}
  if (typeof rec.acte === 'string') {
    try {
      acteData = JSON.parse(rec.acte)
    } catch {
      // Ignorer
    }
  } else if (typeof rec.acte === 'object' && rec.acte !== null) {
    acteData = rec.acte
  }

  // Dénomination (privilégier l'enseigne commerciale pour les personnes physiques)
  let denomination =
    personneData.denomination ||
    personneData.nomCommercial ||
    (personneData.nom
      ? `${personneData.nom} ${personneData.prenom || ''}`.trim()
      : null) ||
    rec.commercant ||
    'Nouvelle entreprise'

  // Si nom commercial disponible, l'utiliser en priorité pour respecter la vie privée des personnes physiques
  if (personneData.nomCommercial) {
    denomination = personneData.nomCommercial
  }

  // Activité
  let activite =
    etablissementData.activite ||
    personneData.activite ||
    acteData.descriptif ||
    rec.activite ||
    null

  if (activite && activite.includes("n'exerce aucune activité")) {
    activite = "En attente de démarrage d'activité"
  }

  // Forme juridique
  const formeJuridique =
    personneData.formeJuridique ||
    (personneData.typePersonne === 'pp' ? 'Entrepreneur individuel' : null)

  // Capital
  let capital: string | null = null
  if (personneData.capital?.montantCapital) {
    capital = `${Number(personneData.capital.montantCapital).toLocaleString('fr-FR')} ${personneData.capital.devise || '€'}`
  }

  // Adresse
  const adr = personneData.adresseSiegeSocial || etablissementData.adresse || {}
  const adresseParts = [
    adr.numeroVoie,
    adr.typeVoie,
    adr.nomVoie,
  ].filter(Boolean).join(' ')
  const adresseLigne = adresseParts || null

  const ville = rec.ville || adr.ville || null
  const codePostal = rec.cp || adr.codePostal || null

  // Code et nom du département
  let depCode = String(rec.numerodepartement || '').trim()
  if (depCode.length === 1) depCode = `0${depCode}`
  const depNom = rec.departement_nom_officiel || (depCode ? `Département ${depCode}` : 'France')

  return {
    id: rec.id || `crea-${Math.random().toString(36).slice(2)}`,
    siren,
    denomination,
    formeJuridique,
    activite,
    capital,
    administration: personneData.administration || null,
    departementCode: depCode,
    departementNom: depNom,
    ville,
    codePostal,
    adresseLigne,
    dateParution: rec.dateparution || new Date().toISOString().slice(0, 10),
    dateImmatriculation: acteData.dateImmatriculation || null,
    dateCommencementActivite: acteData.dateCommencementActivite || null,
    tribunal: rec.tribunal || 'Greffe du Tribunal de Commerce',
    urlBodacc: rec.url_complete || 'https://www.bodacc.fr',
    parutionNumero: rec.parution || null,
    numeroAnnonce: rec.numeroannonce || null,
  }
}

/**
 * Récupère les nouvelles entreprises créées avec tri par date décroissante
 */
export async function fetchNouvellesCreations(
  params: CreationsFilterParams = {}
): Promise<CreationsResponse> {
  const { departement, limit = 40, page = 1 } = params
  const cacheKey = `crea_${departement || 'all'}_${limit}_${page}`

  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data
  }

  try {
    return await loadOnce(cacheKey, async () => {
    const url = new URL(BODACC_API_BASE)
    const whereClauses: string[] = ["familleavis='creation'"]

    if (departement && departement !== 'all') {
      const cleanDep = departement.padStart(2, '0')
      whereClauses.push(`(numerodepartement='${cleanDep}' or numerodepartement='${departement}')`)
    }

    url.searchParams.set('where', whereClauses.join(' and '))
    url.searchParams.set('order_by', 'dateparution desc')
    url.searchParams.set('limit', String(Math.min(limit, 100)))
    const offset = (page - 1) * limit
    url.searchParams.set('offset', String(offset))

    const res = await safeFetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Annuairehexa/1.0 (contact@annuairehexa.fr)',
      },
      signal: AbortSignal.timeout(6000),
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from BODACC Creations API`)
    }

    const json = await res.json()
    const records = json.results ?? []
    const totalCount = json.total_count ?? records.length

    const items: CreationItem[] = records
      .map((r: any) => normalizeCreationRecord(r))
      .filter((it: CreationItem | null): it is CreationItem => it !== null)

    // Comptage des départements pour faciliter le filtrage
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

    const departementsDisponibles = Array.from(depMap.values()).sort((a, b) =>
      a.code.localeCompare(b.code)
    )

    const dateDerniereParution = items[0]?.dateParution ?? new Date().toISOString().slice(0, 10)

    // Vérification de sécurité RGPD : vérifier le statut de diffusion Sirene des personnes physiques
    // pour éviter qu'une entité non diffusible (statut P Insee ou opposition) n'apparaisse dans le flux public
    const candidateItems = items.filter((it) => !it.siren || !isEntitySuppressed(it.siren))
    const validatedItems: CreationItem[] = []

    for (const item of candidateItems) {
      if (validatedItems.length >= limit) break
      if (!item.siren) {
        validatedItems.push(item)
        continue
      }
      try {
        const chk = await safeFetch(`${process.env.RECHERCHE_ENTREPRISES_BASE_URL ?? 'https://recherche-entreprises.api.gouv.fr'}/search?q=${item.siren}&per_page=1`, {
          signal: AbortSignal.timeout(1500),
        })
        if (chk.ok) {
          const chkJson = await chk.json()
          const match = (chkJson.results ?? []).find((r: any) => r.siren === item.siren)
          if (match && match.statut_diffusion === 'P') {
            // Entité sous statut de protection Insee : exclure du flux public d'accueil
            continue
          }
        }
      } catch {
        // En cas d'indisponibilité momentanée de l'API de contrôle, on conserve l'item
      }
      validatedItems.push(item)
    }

    const result: CreationsResponse = {
      totalCount,
      results: validatedItems,
      departementsDisponibles,
      dateDerniereParution,
      updatedAt: new Date().toISOString(),
    }

    cache.set(cacheKey, {
      data: result,
      expiresAt: Date.now() + CACHE_TTL_MS,
    })

    return result
    })
  } catch (error) {
    console.error('[fetchNouvellesCreations] Erreur BODACC:', error)

    // Zéro risque légal : ne jamais inventer de création d'entreprise ou de données personnelles
    return {
      totalCount: 0,
      results: [],
      departementsDisponibles: [],
      dateDerniereParution: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString(),
    }
  }
}
