import { NextRequest, NextResponse } from 'next/server'
import { fetchProceduresCollectives } from '@/lib/procedures/procedures-service'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const departement = searchParams.get('departement') || undefined
  const nature = (searchParams.get('nature') as any) || 'all'
  const limit = Math.min(parseInt(searchParams.get('limit') || '25', 10), 100)
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)

  try {
    const data = await fetchProceduresCollectives({
      departement,
      nature,
      limit,
      page,
    })

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('[API /procedures-collectives] Erreur :', error)
    return NextResponse.json(
      { error: 'Impossible de récupérer les procédures collectives' },
      { status: 500 }
    )
  }
}
