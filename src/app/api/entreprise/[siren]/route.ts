import { NextRequest, NextResponse } from 'next/server'
import { getSearchEngine } from '@/lib/search/engine'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ siren: string }> }
) {
  const { siren } = await params

  if (!/^\d{9}$/.test(siren)) {
    return NextResponse.json(
      { error: 'Format SIREN invalide. Le SIREN doit comporter exactement 9 chiffres.' },
      { status: 400 }
    )
  }

  try {
    const engine = getSearchEngine()
    const ul = await engine.getUniteLegale(siren)

    if (!ul) {
      return NextResponse.json(
        { error: 'Unité légale introuvable ou non diffusible.' },
        { status: 404 }
      )
    }

    // Récupérer les établissements
    const etablissements = await engine.getEtablissementsBySiren(siren, { perPage: 25 })

    return NextResponse.json(
      { unite_legale: ul, etablissements: etablissements.results, pagination: etablissements.pagination },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          'X-Data-Source': 'Sirene-INSEE-LO2',
        },
      }
    )
  } catch (error) {
    console.error('[API /entreprise]', error)
    return NextResponse.json(
      { error: 'Erreur interne.' },
      { status: 503 }
    )
  }
}
