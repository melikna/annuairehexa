/**
 * Service de publication — Point central de décision de diffusion
 * 
 * TOUTES les décisions de publication passent par ce service.
 * Il s'applique au HTML, aux API, aux métadonnées, aux données structurées,
 * aux résultats de recherche et aux exports.
 * 
 * Ce service ne gère PAS uniquement du CSS : il décide quelles données
 * sont transmises, pas seulement affichées.
 * 
 * Règles de diffusion (Sirene, art. R 123-232 Code de commerce, CNIL) :
 * - statut_diffusion = "O" : diffusion intégrale
 * - statut_diffusion = "P" : diffusion partielle (opposition)
 *   - Personne physique : identité (nom, prénom), adresse dans la commune, géolocalisation masquées
 *   - Représentants légaux de personne morale : adresse et géolocalisation masquées
 * - Entité bloquée par demande validée : retirée des résultats
 */

import type { 
  UniteLegale, 
  Etablissement, 
  UniteLegalePubliable, 
  EtablissementPubliable,
  TrancheEffectif,
  NomenclatureActivite,
  CategorieEntreprise,
} from '@/types/domain'
import { TRANCHE_EFFECTIF_LABELS } from '@/types/domain'

// =============================================================================
// Détermination du statut de publication
// =============================================================================

export type PublicationStatus = 
  | 'publishable'     // Diffusé intégralement
  | 'partial'         // Diffusion partielle (champs masqués)
  | 'suppressed'      // Retiré sur demande validée
  | 'non_diffusible'  // Non diffusé par Sirene

/**
 * Détermine le statut de publication d'une entité.
 * Approche conservatrice : en cas de doute, ne pas publier.
 */
export function getPublicationStatus(
  statutDiffusion: string | null | undefined,
  isSuppressed: boolean = false,
): PublicationStatus {
  if (isSuppressed) return 'suppressed'
  if (!statutDiffusion) return 'non_diffusible'  // Valeur inconnue → conservateur
  if (statutDiffusion === 'O') return 'publishable'
  if (statutDiffusion === 'P') return 'partial'
  return 'non_diffusible'  // Toute autre valeur → conservateur
}

/**
 * Indique si une entité doit apparaître dans les résultats publics.
 */
export function isPublishable(
  statutDiffusion: string | null | undefined,
  isSuppressed: boolean = false,
): boolean {
  const status = getPublicationStatus(statutDiffusion, isSuppressed)
  return status === 'publishable' || status === 'partial'
}

// =============================================================================
// Application des règles aux unités légales
// =============================================================================

/**
 * Détermine si une unité légale est une personne physique.
 * Les personnes physiques sont identifiées par leur catégorie juridique (1xxx).
 */
function isPersonnePhysique(categorieJuridique: string | null | undefined): boolean {
  if (!categorieJuridique) return false
  // Les catégories 1000-1999 correspondent aux entrepreneurs individuels et assimilés
  return categorieJuridique.startsWith('1')
}

/**
 * Construit la dénomination affichable d'une unité légale,
 * en respectant les règles de diffusion.
 */
export function buildDenominationAffichable(ul: UniteLegale): string | null {
  // Pour les personnes morales : raison sociale
  if (!isPersonnePhysique(ul.categorieJuridiqueUniteLegale)) {
    return ul.denominationUniteLegale ??
      ul.denominationUsuelle1 ??
      ul.denominationUsuelle2 ??
      ul.denominationUsuelle3 ??
      ul.sigleUniteLegale ??
      null
  }

  // Pour les personnes physiques avec statut_diffusion = "P" : identité masquée
  if (ul.statutDiffusion === 'P') {
    return null  // Ne pas afficher l'identité
  }

  // Pour les personnes physiques sans opposition : nom + prénom
  const parts: string[] = []
  if (ul.prenom1UniteLegale) parts.push(ul.prenom1UniteLegale)
  if (ul.nomUsageUniteLegale) parts.push(ul.nomUsageUniteLegale)
  else if (ul.nomUniteLegale) parts.push(ul.nomUniteLegale)
  
  if (parts.length > 0) return parts.join(' ')
  return ul.denominationUniteLegale ?? null
}

/**
 * Construit la vue publiable d'une unité légale.
 * Toutes les informations masquées sont remplacées par null.
 * 
 * @param ul - Unité légale brute (de la base de données)
 * @param isSuppressed - Si true, l'entité a été retirée sur demande validée
 * @param nombreEtablissements - Nombre total d'établissements connus
 * @param nombreEtablissementsActifs - Nombre d'établissements actifs
 */
export function buildUniteLegalePubliable(
  ul: UniteLegale,
  isSuppressed: boolean = false,
  nombreEtablissements?: number,
  nombreEtablissementsActifs?: number,
): UniteLegalePubliable | null {
  const status = getPublicationStatus(ul.statutDiffusion, isSuppressed)
  if (status === 'suppressed' || status === 'non_diffusible') {
    return null
  }

  const diffusionPartielle = status === 'partial'

  // Déterminer la nomenclature active et le code APE correspondant
  const { activitePrincipale, nomenclatureActive } = resolveActiveNomenclature(
    ul.activitePrincipaleUniteLegale,
    ul.activitePrincipaleNAF25UniteLegale,
    ul.nomenclatureActivitePrincipaleUniteLegale,
  )

  return {
    siren: ul.siren,
    denominationAffichable: buildDenominationAffichable(ul),
    etatAdministratif: ul.etatAdministratif,
    dateCreation: ul.dateCreation,
    dateFermeture: ul.dateFermeture,
    activitePrincipale,
    libelleActivite: null,  // Résolu par le caller via la table activity_codes
    nomenclatureActive,
    categorieJuridique: ul.categorieJuridiqueUniteLegale,
    libelleFormeJuridique: null,  // Résolu par le caller via la table legal_categories
    trancheEffectifs: ul.trancheEffectifsUniteLegale,
    anneeEffectifs: ul.anneeEffectifsUniteLegale,
    categorieEntreprise: ul.categorieEntreprise,
    anneeCategorieEntreprise: ul.anneeCategorieEntreprise,
    siretSiege: ul.siretSiege,
    diffusionPartielle,
    statutDiffusion: ul.statutDiffusion,
    dateMiseAJour: ul.dateDernierTraitementUniteLegale,
    nombreEtablissements,
    nombreEtablissementsActifs,
    estEnProcedureCollective: ul.estEnProcedureCollective ?? false,
    natureProcedureCollective: ul.natureProcedureCollective ?? null,
    dateProcedureCollective: ul.dateProcedureCollective ?? null,
    tribunalProcedureCollective: ul.tribunalProcedureCollective ?? null,
    detailsProcedureCollective: ul.detailsProcedureCollective ?? null,
    derniereVerificationTempsReel: ul.derniereVerificationTempsReel ?? null,
  }
}

// =============================================================================
// Application des règles aux établissements
// =============================================================================

/**
 * Construit l'enseigne affichable d'un établissement.
 */
export function buildEnseigneAffichable(etab: Etablissement): string | null {
  return etab.enseigne1Etablissement ??
    etab.enseigne2Etablissement ??
    etab.enseigne3Etablissement ??
    etab.denominationUsuelleEtablissement ??
    null
}

/**
 * Construit l'adresse formatée d'un établissement.
 * Retourne null si l'adresse doit être masquée (statut_diffusion = "P").
 */
export function buildAdresseFormatee(etab: Etablissement): {
  adresseComplete: string | null
  adresseLigne1: string | null
  adresseLigne2: string | null
  codePostal: string | null
  libelleCommune: string | null
} {
  // Si diffusion partielle : masquer l'adresse dans la commune
  if (etab.statutDiffusionEtablissement === 'P') {
    return {
      adresseComplete: null,
      adresseLigne1: null,
      adresseLigne2: null,
      codePostal: null,
      libelleCommune: null,
    }
  }

  // Adresse étrangère
  if (etab.codePaysEtrangerEtablissement && etab.libellePaysEtrangerEtablissement) {
    const parties = [
      etab.libelleCommuneEtrangerEtablissement,
      etab.libellePaysEtrangerEtablissement,
    ].filter(Boolean)
    return {
      adresseComplete: parties.join(', '),
      adresseLigne1: etab.libelleCommuneEtrangerEtablissement,
      adresseLigne2: etab.libellePaysEtrangerEtablissement,
      codePostal: null,
      libelleCommune: etab.libelleCommuneEtrangerEtablissement,
    }
  }

  // Adresse française
  const ligne1Parts = [
    etab.complementAdresseEtablissement,
    [
      etab.numeroVoieEtablissement,
      etab.indiceRepetitionEtablissement,
      etab.typeVoieEtablissement,
      etab.libelleVoieEtablissement,
    ].filter(Boolean).join(' '),
    etab.distributionSpecialeEtablissement,
  ].filter(Boolean)

  const ligne1 = ligne1Parts.join(', ').trim() || null

  const codePostal = etab.codeCedexEtablissement ?? etab.codePostalEtablissement
  const libelleCommune = etab.libelleCedexEtablissement ?? etab.libelleCommuneEtablissement

  const ligne2Parts = [codePostal, libelleCommune].filter(Boolean)
  const ligne2 = ligne2Parts.join(' ').trim() || null

  const adresseComplete = [ligne1, ligne2].filter(Boolean).join(', ')

  return {
    adresseComplete: adresseComplete || null,
    adresseLigne1: ligne1,
    adresseLigne2: ligne2,
    codePostal,
    libelleCommune,
  }
}

/**
 * Construit la vue publiable d'un établissement.
 */
export function buildEtablissementPubliable(
  etab: Etablissement,
  isSuppressed: boolean = false,
): EtablissementPubliable | null {
  const status = getPublicationStatus(etab.statutDiffusionEtablissement, isSuppressed)
  if (status === 'suppressed' || status === 'non_diffusible') {
    return null
  }

  const diffusionPartielle = status === 'partial'
  const adresse = buildAdresseFormatee(etab)

  // Coordonnées GPS : masquées si diffusion partielle
  const coordonnees = (!diffusionPartielle && etab.latitude && etab.longitude)
    ? { latitude: parseFloat(etab.latitude), longitude: parseFloat(etab.longitude) }
    : null

  const { activitePrincipale, nomenclatureActive } = resolveActiveNomenclature(
    etab.activitePrincipaleEtablissement,
    etab.activitePrincipaleNAF25Etablissement,
    etab.nomenclatureActivitePrincipaleEtablissement,
  )

  return {
    siret: etab.siret,
    siren: etab.siren,
    nic: etab.nic,
    etablissementSiege: etab.etablissementSiege,
    etatAdministratif: etab.etatAdministratifEtablissement,
    dateCreation: etab.dateCreationEtablissement,
    dateFermeture: etab.dateFermetureEtablissement,
    enseigneAffichable: buildEnseigneAffichable(etab),
    ...adresse,
    codeCommune: diffusionPartielle ? null : etab.codeCommuneEtablissement,
    codeDepartement: etab.codeDepartementEtablissement,  // Le département reste visible
    codeRegion: etab.codeRegionEtablissement,
    coordonnees,
    activitePrincipale,
    libelleActivite: null,  // Résolu par le caller
    nomenclatureActive,
    trancheEffectifs: etab.trancheEffectifsEtablissement,
    anneeEffectifs: etab.anneeEffectifsEtablissement,
    diffusionPartielle,
    dateMiseAJour: etab.dateDernierTraitementEtablissement,
  }
}

// =============================================================================
// Résolution de la nomenclature active
// =============================================================================

/**
 * Détermine le code APE et la nomenclature en vigueur.
 * 
 * Règle de transition NAF 2025 :
 * - Avant le 6 janvier 2027 : NAF Rév.2 en vigueur
 * - Dès le 6 janvier 2027 : NAF 2025 en vigueur
 * - Entre le 16/12/2025 et le 5/01/2027 : les deux codes sont disponibles
 */
export function resolveActiveNomenclature(
  codeNafRev2: string | null | undefined,
  codeNaf2025: string | null | undefined,
  nomenclatureDeclaree: NomenclatureActivite | null | undefined,
): {
  activitePrincipale: string | null
  nomenclatureActive: NomenclatureActivite | null
} {
  const now = new Date()
  const switchDate = new Date('2027-01-06T00:00:00Z')

  if (now >= switchDate) {
    // Après la bascule : NAF 2025 en vigueur
    const code = codeNaf2025 ?? codeNafRev2 ?? null
    return {
      activitePrincipale: code,
      nomenclatureActive: code ? 'NAF2025' : null,
    }
  }

  // Avant la bascule : NAF Rév.2 en vigueur
  const code = codeNafRev2 ?? null
  return {
    activitePrincipale: code,
    nomenclatureActive: code ? (nomenclatureDeclaree ?? 'NAFRev2') : null,
  }
}

// =============================================================================
// Formatters
// =============================================================================

/**
 * Retourne le libellé lisible d'une tranche d'effectif.
 */
export function formatTrancheEffectif(tranche: TrancheEffectif, annee?: string | null): string {
  if (!tranche) return 'Non renseigné'
  const label = TRANCHE_EFFECTIF_LABELS[tranche] ?? 'Inconnu'
  if (annee) return `${label} (données ${annee})`
  return label
}

/**
 * Retourne le libellé lisible d'une catégorie d'entreprise.
 */
export function formatCategorieEntreprise(cat: CategorieEntreprise, annee?: string | null): string {
  if (!cat) return 'Non classifiée'
  const labels: Record<Exclude<CategorieEntreprise, null>, string> = {
    'PME': 'PME (Petite et Moyenne Entreprise)',
    'ETI': 'ETI (Entreprise de Taille Intermédiaire)',
    'GE': 'Grande Entreprise',
  }
  const label = labels[cat] ?? cat
  if (annee) return `${label} (millésime ${annee})`
  return label
}

/**
 * Formatte un SIREN pour l'affichage (xxx xxx xxx).
 */
export function formatSiren(siren: string): string {
  if (siren.length !== 9) return siren
  return `${siren.slice(0, 3)} ${siren.slice(3, 6)} ${siren.slice(6, 9)}`
}

/**
 * Formatte un SIRET pour l'affichage (xxx xxx xxx xxxxx).
 */
export function formatSiret(siret: string): string {
  if (siret.length !== 14) return siret
  return `${siret.slice(0, 3)} ${siret.slice(3, 6)} ${siret.slice(6, 9)} ${siret.slice(9, 14)}`
}

/**
 * Valide le format d'un SIREN (9 chiffres).
 * Ne valide pas la clé de Luhn (un SIREN valide dans Sirene ne passe pas forcément Luhn).
 */
export function isValidSirenFormat(siren: string): boolean {
  return /^\d{9}$/.test(siren)
}

/**
 * Valide le format d'un SIRET (14 chiffres).
 */
export function isValidSiretFormat(siret: string): boolean {
  return /^\d{14}$/.test(siret)
}

/**
 * Extrait le SIREN d'un SIRET.
 */
export function siretToSiren(siret: string): string {
  return siret.slice(0, 9)
}

/**
 * Extrait le NIC d'un SIRET.
 */
export function siretToNic(siret: string): string {
  return siret.slice(9, 14)
}
