import { isEntitySuppressed } from '@/lib/search/suppression-registry'

/**
 * Service centralisé de gestion de la confidentialité et des diffusions partielles / oppositions
 * Respect strict de l'article A123-96 du Code de commerce et des articles 17 & 21 du RGPD.
 */

export interface DiffusionCheckResult {
  isRestricted: boolean
  reason?: 'suppression_registry' | 'statut_p_insee' | 'personne_physique_protegee'
  publicDenomination: string
  canDisplayNominativeIdentity: boolean
  canDisplayAddress: boolean
}

/**
 * Nettoie une chaîne de caractères en retirant les marqueurs non diffusibles
 */
export function sanitizeText(text?: string | null): string | null {
  if (!text) return null
  const trimmed = text.trim()
  if (/\[?NON[- ]?DIFFUSIBLE\]?/i.test(trimmed)) {
    return null
  }
  return trimmed
}

/**
 * Évalue si une entité est soumise à une restriction de diffusion stricte
 */
export function evaluateEntityDiffusion(params: {
  siren: string
  statutDiffusion?: string | null
  natureJuridique?: string | null
  isEntrepreneurIndividuel?: boolean
  rawDenomination?: string | null
  nomCommercial?: string | null
}): DiffusionCheckResult {
  const { siren, statutDiffusion, natureJuridique, isEntrepreneurIndividuel, rawDenomination, nomCommercial } = params

  // 1. Vérification prioritaire dans le registre local d'opposition/suppression
  if (isEntitySuppressed(siren)) {
    return {
      isRestricted: true,
      reason: 'suppression_registry',
      publicDenomination: `Entreprise ${siren}`,
      canDisplayNominativeIdentity: false,
      canDisplayAddress: false,
    }
  }

  // 2. Vérification du statut Insee (P = Partielle / opposition)
  const isStatutP = statutDiffusion === 'P'
  const isPersonnePhysique =
    (natureJuridique && String(natureJuridique).startsWith('1')) ||
    isEntrepreneurIndividuel === true

  if (isStatutP && isPersonnePhysique) {
    const commercial = sanitizeText(nomCommercial)
    return {
      isRestricted: true,
      reason: 'statut_p_insee',
      publicDenomination: commercial || 'Entrepreneur individuel (diffusion restreinte)',
      canDisplayNominativeIdentity: false,
      canDisplayAddress: false,
    }
  }

  // 3. Personne morale avec statut P : adresse masquée mais raison sociale diffusible
  if (isStatutP && !isPersonnePhysique) {
    const cleanName = sanitizeText(rawDenomination) || `Société ${siren}`
    return {
      isRestricted: true,
      reason: 'personne_physique_protegee',
      publicDenomination: cleanName,
      canDisplayNominativeIdentity: true,
      canDisplayAddress: false,
    }
  }

  // 4. Entité diffusible standard
  const cleanName = sanitizeText(rawDenomination) || sanitizeText(nomCommercial) || `Entreprise ${siren}`
  return {
    isRestricted: false,
    publicDenomination: cleanName,
    canDisplayNominativeIdentity: true,
    canDisplayAddress: true,
  }
}
