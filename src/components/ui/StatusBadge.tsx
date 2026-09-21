import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'

type EtatAdministratif = 'A' | 'C' | 'F'
type EntityType = 'unite_legale' | 'etablissement'

interface StatusBadgeProps {
  etat: EtatAdministratif
  entityType?: EntityType
  diffusionPartielle?: boolean
  className?: string
  size?: 'sm' | 'md'
}

const LABELS: Record<string, Record<EtatAdministratif, string>> = {
  unite_legale: {
    A: 'Active',
    C: 'Cessée',
    F: 'Fermée',
  },
  etablissement: {
    A: 'Ouvert',
    C: 'Fermé',
    F: 'Fermé',
  },
}

export function StatusBadge({
  etat,
  entityType = 'unite_legale',
  diffusionPartielle = false,
  className,
  size = 'sm',
}: StatusBadgeProps) {
  const label = LABELS[entityType]?.[etat] ?? etat
  const isActive = etat === 'A'

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 font-medium rounded-full',
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1',
        isActive
          ? 'bg-green-100 text-green-800'
          : 'bg-gray-100 text-gray-700',
        className,
      )}
      aria-label={`Statut : ${label}${diffusionPartielle ? ' (informations partiellement disponibles)' : ''}`}
    >
      {isActive
        ? <CheckCircle2 className={clsx('shrink-0', size === 'sm' ? 'w-3 h-3' : 'w-4 h-4')} aria-hidden="true" />
        : <XCircle className={clsx('shrink-0', size === 'sm' ? 'w-3 h-3' : 'w-4 h-4')} aria-hidden="true" />}
      {label}
      {diffusionPartielle && (
        <span title="Informations partiellement disponibles (diffusion restreinte)">
          <AlertTriangle
            className={clsx('shrink-0 text-amber-600', size === 'sm' ? 'w-3 h-3' : 'w-4 h-4')}
            aria-hidden="true"
          />
        </span>
      )}
    </span>
  )
}
