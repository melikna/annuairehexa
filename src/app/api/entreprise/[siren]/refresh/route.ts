import { NextRequest, NextResponse } from 'next/server'
import { syncEnterpriseLive } from '@/lib/sync/realtime-service'
import { getSearchEngine } from '@/lib/search/engine'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siren: string }> }
) {
  const { siren } = await params

  if (!/^\d{9}$/.test(siren)) {
    return NextResponse.json(
      { error: 'Format SIREN invalide. Le SIREN doit comporter 9 chiffres.' },
      { status: 400 }
    )
  }

  try {
    // Exécute la synchronisation en direct avec BODACC et les bases publiques
    const realtimeData = await syncEnterpriseLive(siren)

    // Récupère la fiche mise à jour
    const engine = getSearchEngine()
    const updatedUl = await engine.getUniteLegale(siren)

    return NextResponse.json({
      success: true,
      message: 'Données actualisées en direct depuis les bases publiques (Sirene, BODACC).',
      realtime: realtimeData,
      unite_legale: updatedUl,
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[API /refresh] Erreur :', error)
    return NextResponse.json(
      { error: 'Échec de l\'actualisation en temps réel.', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
