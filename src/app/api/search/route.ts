import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSearchEngine } from '@/lib/search/engine'
import type { SearchParams } from '@/types/domain'

// Schema de validation des paramètres de l'API de recherche
const searchSchema = z.object({
  q: z.string().max(200).optional(),
  departement: z.string().regex(/^\d{2,3}[A-Z]?$/).optional(),
  region: z.string().regex(/^\d{2}$/).optional(),
  code_commune: z.string().regex(/^[0-9A-Z]{5}$/).optional(),
  code_postal: z.string().regex(/^\d{5}$/).optional(),
  activite_principale: z.string().max(10).optional(),
  section: z.string().regex(/^[A-U]$/).optional(),
  nature_juridique: z.string().regex(/^\d{4}$/).optional(),
  etat_administratif: z.enum(['A', 'C', 'F']).optional(),
  categorie_entreprise: z.enum(['PME', 'ETI', 'GE']).optional(),
  tranche_effectifs: z.string().max(10).optional(),
  est_ess: z.preprocess((v) => v === 'true' || v === '1' || v === true, z.boolean()).optional(),
  est_rge: z.preprocess((v) => v === 'true' || v === '1' || v === true, z.boolean()).optional(),
  est_organisme_formation: z.preprocess((v) => v === 'true' || v === '1' || v === true, z.boolean()).optional(),
  est_societe_mission: z.preprocess((v) => v === 'true' || v === '1' || v === true, z.boolean()).optional(),
  est_bio: z.preprocess((v) => v === 'true' || v === '1' || v === true, z.boolean()).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  per_page: z.coerce.number().int().min(1).max(25).default(20),
  sort: z.enum(['pertinence', 'nom', 'dateCreation', 'dateCreationDesc']).default('pertinence'),
})

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const raw = Object.fromEntries(searchParams.entries())

  const parsed = searchSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Paramètres invalides', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const {
    q, departement, region, code_commune, code_postal, activite_principale,
    section, nature_juridique, etat_administratif, categorie_entreprise,
    tranche_effectifs, est_ess, est_rge, est_organisme_formation, est_societe_mission, est_bio,
    page, per_page, sort,
  } = parsed.data

  const params: SearchParams = {
    q,
    departement,
    region,
    codeCommune: code_commune,
    codePostal: code_postal,
    activitePrincipale: activite_principale,
    section,
    natureJuridique: nature_juridique,
    etatAdministratif: etat_administratif,
    categorieEntreprise: categorie_entreprise ?? null,
    trancheEffectifs: tranche_effectifs,
    estEss: est_ess,
    estRge: est_rge,
    estOrganismeFormation: est_organisme_formation,
    estSocieteMission: est_societe_mission,
    estBio: est_bio,
    page,
    perPage: per_page,
    sort,
  }

  try {
    const engine = getSearchEngine()
    const result = await engine.searchEntities(params)
    if (result.unavailable) {
      return NextResponse.json({ error: 'Recherche temporairement indisponible' }, {
        status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '10' },
      })
    }

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store',
        'X-Data-Source': 'Sirene-INSEE-LO2',
        'X-Coverage-Note': 'Entités diffusibles uniquement. Voir /couverture.',
      },
    })
  } catch (error) {
    console.error('[API /search]', error)
    return NextResponse.json(
      { error: 'Erreur interne', message: 'La base de données est peut-être non configurée.' },
      { status: 503 }
    )
  }
}
