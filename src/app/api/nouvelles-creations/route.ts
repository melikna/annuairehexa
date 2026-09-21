import { NextRequest, NextResponse } from 'next/server'
import { fetchNouvellesCreations } from '@/lib/creations/creations-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const departement = searchParams.get('departement') || undefined
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 5), 100)
    const page = Math.max(Number(searchParams.get('page')) || 1, 1)

    const data = await fetchNouvellesCreations({
      departement,
      limit,
      page,
    })

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('API /api/nouvelles-creations error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des nouvelles créations' },
      { status: 500 }
    )
  }
}
