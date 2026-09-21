import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getDb } from '@/lib/db/client'

const correctionSchema = z.object({
  entity_id: z.string().trim().regex(/^(\d{9}|\d{14})$/, 'Doit être un SIREN (9 chiffres) ou un SIRET (14 chiffres)'),
  request_type: z.enum(['correction', 'opposition', 'suppression', 'acces']),
  description: z.string().trim().min(5, 'La description doit comporter au moins 5 caractères').max(2000),
  requester_name: z.string().optional(),
  requester_email: z.string().email().optional(),
  consent_quality: z.any().optional(),
  consent_rgpd: z.any().optional(),
})

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown> = {}

    const contentType = request.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      body = await request.json()
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      body = {
        entity_id: formData.get('entity_id'),
        request_type: formData.get('request_type'),
        description: formData.get('description'),
        requester_name: formData.get('requester_name'),
        requester_email: formData.get('requester_email'),
        consent_quality: formData.get('consent_quality'),
        consent_rgpd: formData.get('consent_rgpd'),
      }
    }

    const parsed = correctionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation échouée',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { entity_id, request_type, description, requester_name, requester_email } = parsed.data
    const entity_type = entity_id.length === 9 ? 'unite_legale' : 'etablissement'

    let recordId = `rgpd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

    try {
      const db = getDb()
      const inserted = await db`
        INSERT INTO suppression_requests (
          entity_type,
          entity_id,
          request_type,
          status,
          description,
          permanent_block
        ) VALUES (
          ${entity_type},
          ${entity_id},
          ${request_type},
          'pending',
          ${description},
          ${request_type === 'opposition' || request_type === 'suppression'}
        )
        RETURNING id, created_at
      `

      if (inserted[0]?.id) {
        recordId = String(inserted[0].id)
      }
    } catch (dbError) {
      console.warn('[API /correction] DB non joignable, enregistrement mémoire/log fallback:', dbError)
      // On consigne la demande pour ne pas bloquer l'exercice des droits RGPD
      console.log(`[RGPD DEMANDE REÇUE] SIREN: ${entity_id}, Type: ${request_type}, Demandeur: ${requester_name} (${requester_email})`)
    }

    // Si soumis par formulaire HTML standard, rediriger vers une page de confirmation
    if (!contentType.includes('application/json')) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: `/correction?success=1&id=${recordId}`,
        },
      })
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Votre demande a été enregistrée et sera traitée sous 48 heures.',
        requestId: recordId,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[API /correction]', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
