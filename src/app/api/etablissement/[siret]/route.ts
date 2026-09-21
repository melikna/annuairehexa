import { NextRequest, NextResponse } from 'next/server'
import { getSearchEngine } from '@/lib/search/engine'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ siret: string }> }
) {
  const { siret } = await params

  if (!/^\d{14}$/.test(siret)) {
    return NextResponse.json(
      { error: 'Format SIRET invalide. Le SIRET doit comporter exactement 14 chiffres.' },
      { status: 400 }
    )
  }

  try {
    const engine = getSearchEngine()
    const etab = await engine.getEtablissement(siret)

    if (!etab) {
      return NextResponse.json(
        { error: 'Établissement introuvable ou non diffusible.' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { etablissement: etab },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
          'X-Data-Source': 'Sirene-INSEE-LO2',
        },
      }
    )
  } catch (error) {
    console.error('[API /etablissement]', error)
    return NextResponse.json(
      { error: 'Erreur interne.' },
      { status: 503 }
    )
  }
}
