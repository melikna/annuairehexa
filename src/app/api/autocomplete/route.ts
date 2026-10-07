import { NextRequest, NextResponse } from 'next/server'
import { getSearchEngine } from '@/lib/search/engine'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''

  if (q.length < 2) {
    return NextResponse.json({ suggestions: [] })
  }

  try {
    const engine = getSearchEngine()
    const searchRes = await engine.searchEntities({
      q,
      perPage: 7,
      page: 1,
    })

    if (searchRes.unavailable) throw new Error('Search upstream unavailable')
    const suggestions = searchRes.results.map((r) => ({
      siren: r.siren,
      nom: r.denominationAffichable ?? `Entreprise ${r.siren}`,
      nomCommercial: r.nomCommercial ?? null,
      formeJuridique: r.libelleFormeJuridique ?? null,
      activite: r.activitePrincipale ?? null,
      libelleActivite: r.libelleActivite ?? null,
      etatAdministratif: r.etatAdministratif,
      estEnProcedureCollective: Boolean(r.estEnProcedureCollective),
      natureProcedureCollective: r.natureProcedureCollective ?? null,
      siretSiege: r.siretSiege ?? null,
    }))

    return NextResponse.json(
      { suggestions },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (error) {
    console.error('[Autocomplete API Error]:', error)
    return NextResponse.json({ suggestions: [], error: 'Recherche temporairement indisponible' }, {
      status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '10' },
    })
  }
}
