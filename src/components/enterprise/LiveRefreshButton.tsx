'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react'

interface LiveRefreshButtonProps {
  siren: string
  lastVerifiedAt?: string | null
  className?: string
}

export function LiveRefreshButton({
  siren,
  lastVerifiedAt,
  className = '',
}: LiveRefreshButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [justUpdated, setJustUpdated] = useState(false)

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/entreprise/${siren}/refresh`, {
        method: 'POST',
      })
      if (response.ok) {
        setJustUpdated(true)
        router.refresh()
        setTimeout(() => setJustUpdated(false), 3000)
      }
    } catch (err) {
      console.warn('Erreur lors du rafraîchissement temps réel:', err)
    } finally {
      setLoading(false)
    }
  }

  const formattedDate = lastVerifiedAt
    ? new Date(lastVerifiedAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleRefresh}
        disabled={loading}
        title="Interroger les bases publiques (BODACC / Sirene) en temps réel"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 hover:border-blue-300 transition-colors shadow-2xs disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
        <span>{loading ? 'Interrogation en direct...' : justUpdated ? 'À jour !' : 'Vérifier en direct'}</span>
      </button>

      {formattedDate && !loading && !justUpdated && (
        <span className="text-[11px] text-gray-400">
          Dernier contrôle : {formattedDate}
        </span>
      )}
    </div>
  )
}
