'use client'

import { useEffect, useState } from 'react'

interface AdSlotProps {
  placementId: string
  slotId: string
  format?: 'auto' | 'rectangle' | 'horizontal'
  className?: string
}

const FORMAT_STYLES: Record<string, { minHeight: string; maxWidth?: string }> = {
  auto: { minHeight: '100px' },
  rectangle: { minHeight: '250px', maxWidth: '300px' },
  horizontal: { minHeight: '90px', maxWidth: '728px' },
}

export function AdSlot({
  placementId,
  slotId,
  format = 'auto',
  className = '',
}: AdSlotProps) {
  const isAdSenseEnabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === 'true'
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID
  const [canDisplay, setCanDisplay] = useState(false)

  useEffect(() => {
    // Vérifier l'activation globale et le consentement CMP le cas échéant
    if (isAdSenseEnabled && clientId) {
      setCanDisplay(true)
      try {
        // @ts-ignore
        if (typeof window !== 'undefined' && window.adsbygoogle) {
          // @ts-ignore
          ;(window.adsbygoogle = window.adsbygoogle || []).push({})
        }
      } catch (err) {
        console.warn('[AdSense] Erreur chargement emplacement:', err)
      }
    }
  }, [isAdSenseEnabled, clientId])

  // Si désactivé (comportement par défaut requis par la spec), ne réserve pas d'espace visible inutilement
  if (!isAdSenseEnabled || !clientId) {
    return null
  }

  const selectedStyle = FORMAT_STYLES[format] || { minHeight: '100px' }
  const minHeight = selectedStyle.minHeight
  const maxWidth = selectedStyle.maxWidth

  return (
    <div
      className={`ad-container my-6 mx-auto flex flex-col items-center justify-center bg-gray-50 border border-gray-100 rounded-lg overflow-hidden ${className}`}
      style={{ minHeight, maxWidth }}
      aria-label="Espace publicitaire"
    >
      <span className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 self-start px-2 pt-1">
        Publicité
      </span>
      {canDisplay && (
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={clientId}
          data-ad-slot={slotId}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      )}
    </div>
  )
}
