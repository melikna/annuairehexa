import type { UniteLegalePubliable, EtablissementPubliable } from '@/types/domain'
import { formatSiren, formatSiret } from '@/lib/publication/service'

export interface EnterpriseTaxInfo {
  siren: string
  tvaIntracommunautaire: string
  cleLuhnValide: boolean
}

/**
 * Calcule le numéro de TVA intracommunautaire français
 * Formule : Clé = [12 + 3 * (SIREN modulo 97)] modulo 97
 * Résultat : "FR" + Clé (sur 2 chiffres) + SIREN (9 chiffres)
 */
export function calculateFrenchVAT(siren: string): string {
  if (!/^\d{9}$/.test(siren)) return ''
  const sirenNum = parseInt(siren, 10)
  const key = (12 + 3 * (sirenNum % 97)) % 97
  const keyStr = key < 10 ? `0${key}` : `${key}`
  return `FR${keyStr}${siren}`
}

/**
 * Formate le numéro de TVA intracommunautaire pour une lisibilité maximale
 * Ex: FR 12 345 678 901
 */
export function formatFrenchVAT(vat: string): string {
  if (!vat || vat.length !== 13) return vat
  return `${vat.slice(0, 2)} ${vat.slice(2, 4)} ${vat.slice(4, 7)} ${vat.slice(7, 10)} ${vat.slice(10, 13)}`
}

/**
 * Vérifie la clé de Luhn pour un numéro SIREN (9 chiffres)
 */
export function verifyLuhn(siren: string): boolean {
  if (!/^\d{9}$/.test(siren)) return false
  let sum = 0
  for (let i = 0; i < siren.length; i++) {
    let digit = parseInt(siren[i]!, 10)
    // Multiplier par 2 les positions impaires (en partant de la fin, ou index 1, 3, 5, 7)
    if (i % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}

export interface SeniorityResult {
  annees: number
  mois: number
  isFuture: boolean
  dateFormatted?: string
  texte: string
}

/**
 * Calcule l'ancienneté d'une entreprise en années et mois, en gérant rigoureusement les dates futures
 */
export function calculateSeniority(dateCreation: string | null): SeniorityResult | null {
  if (!dateCreation) return null
  const creation = new Date(dateCreation)
  if (isNaN(creation.getTime())) return null

  const now = new Date()

  // Si la date est dans le futur (création anticipée)
  if (creation.getTime() > now.getTime()) {
    const dateFr = creation.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    return {
      annees: 0,
      mois: 0,
      isFuture: true,
      dateFormatted: dateFr,
      texte: `prévue le ${dateFr}`,
    }
  }

  let years = now.getFullYear() - creation.getFullYear()
  let months = now.getMonth() - creation.getMonth()

  if (months < 0) {
    years--
    months += 12
  }

  if (years < 0) {
    return {
      annees: 0,
      mois: 0,
      isFuture: true,
      texte: 'à venir',
    }
  }

  let texte = ''
  if (years > 0) {
    texte = `${years} an${years > 1 ? 's' : ''}`
    if (months > 0) {
      texte += ` et ${months} mois`
    }
  } else if (months > 0) {
    texte = `${months} mois`
  } else {
    texte = 'moins d\'un mois'
  }

  return { annees: years, mois: months, isFuture: false, texte }
}

export interface EnterpriseEditorialContent {
  introText: string
  activityText: string
  legalText: string
  faq: Array<{ question: string; answer: string }>
}

/**
 * Générateur de contenu textuel unique et personnalisé (anti-duplicate content)
 * Ce moteur génère un texte naturel, riche et varié en fonction des attributs spécifiques de l'entreprise.
 */
function cleanDenomination(rawName: string | null | undefined): string | null {
  if (!rawName) return null
  const trimmed = rawName.trim()
  const match = trimmed.match(/^(.*?)\s*\(\s*\1\s*\)$/i)
  if (match && match[1]) {
    return match[1].trim()
  }
  return trimmed
}

export function generateEnterpriseEditorial(
  ul: UniteLegalePubliable,
  siege: EtablissementPubliable | null,
  nombreEtablissements: number
): EnterpriseEditorialContent {
  const isProtected = ul.diffusionPartielle
  const rawNom = ul.denominationAffichable ?? `L'entreprise individuelle (SIREN ${formatSiren(ul.siren)})`
  const nom = cleanDenomination(rawNom) ?? rawNom
  const isActive = ul.etatAdministratif === 'A'
  const seniority = calculateSeniority(ul.dateCreation)
  const tva = calculateFrenchVAT(ul.siren)
  const formattedTva = formatFrenchVAT(tva)

  // 1. Paragraphe d'introduction dynamique
  let intro = isProtected
    ? `L'entreprise individuelle identifiée sous le numéro d'immatriculation SIREN ${formatSiren(ul.siren)} fait l'objet d'une protection légale de la vie privée (statut de non-diffusion ou diffusion partielle Insee Sirene, art. A123-96 du Code de commerce). Elle est `
    : `L'entreprise ${nom}, immatriculée sous le code d'identification unique SIREN ${formatSiren(ul.siren)}, est `

  if (isActive) {
    if (seniority?.isFuture) {
      intro += `enregistrée auprès des registres officiels avec une date de création anticipée (${seniority.texte}). `
    } else if (seniority) {
      intro += `actuellement en activité depuis ${seniority.texte}. `
    } else {
      intro += `enregistrée comme active au sein du répertoire public national Sirene tenu par l'INSEE. `
    }
    if (ul.dateCreation && !seniority?.isFuture) {
      const dateFr = new Date(ul.dateCreation).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
      intro += `Sa date de création déclarée remonte au ${dateFr}. `
    }
  } else {
    intro += `une entité aujourd'hui répertoriée comme cessée dans le registre national Sirene. `
    if (ul.dateFermeture) {
      const dateFerm = new Date(ul.dateFermeture).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
      intro += `Sa cessation d'activité a été enregistrée le ${dateFerm}. `
    }
  }

  // 2. Paragraphe sur l'activité et le secteur
  let activity = ''
  if (ul.activitePrincipale) {
    activity = `Sur le plan économique, ${nom} exerce à titre principal l'activité déclarée sous l'intitulé ${ul.libelleActivite || 'non spécifié'}, codifiée sous la référence APE/NAF ${ul.activitePrincipale}. `
    activity += `Cette nomenclature statistique permet de classifier l'entreprise dans sa branche professionnelle de référence. `
  } else {
    activity = `Aucun code d'activité principale (APE) spécifique n'a été renseigné pour cette unité légale. `
  }

  // Si diffusion partielle, ne jamais divulguer la commune ni l'adresse
  if (!isProtected && siege?.libelleCommune) {
    activity += `Le siège social opérationnel de l'entité est localisé sur le territoire de la commune de ${siege.libelleCommune} (${siege.codePostal || ''}). `
  }

  // 3. Paragraphe juridique et organisationnel
  let legal = `Sur le plan de son organisation juridique, l'entité relève de la catégorie légale ${ul.libelleFormeJuridique || 'Forme juridique déclarée'}`
  if (ul.categorieJuridique) {
    legal += ` (identifiant juridique INSEE ${ul.categorieJuridique})`
  }
  legal += `. `

  if (ul.categorieEntreprise) {
    legal += `Elle est répertoriée au sens statistique comme ${ul.categorieEntreprise}. `
  }

  if (nombreEtablissements > 1) {
    legal += `L'entreprise dispose d'un réseau composé de ${nombreEtablissements} établissements (siège social et structures secondaires comprises). `
  } else {
    legal += `Le réseau de l'entreprise s'organise autour d'un établissement unique faisant office de siège social. `
  }

  if (tva) {
    legal += `Son identifiant fiscal européen de TVA intracommunautaire est ${formattedTva}.`
  }

  // 4. Foire Aux Questions (FAQ) sur-mesure pour Google Rich Snippets
  const faq = [
    {
      question: `Quel est le numéro SIREN et SIRET de ${nom} ?`,
      answer: `Le numéro SIREN de ${nom} est le ${ul.siren} (${formatSiren(ul.siren)}). ${
        siege ? `Le SIRET de son siège social est le ${siege.siret} (${formatSiret(siege.siret)}).` : ''
      }`,
    },
    {
      question: `Quel est le numéro de TVA intracommunautaire de ${nom} ?`,
      answer: tva
        ? `Le numéro de TVA intracommunautaire calculé et assigné à ${nom} est ${formattedTva} (${tva}).`
        : `Le numéro de TVA intracommunautaire est établi à partir du numéro SIREN pour toutes les entreprises françaises assujetties.`,
    },
    {
      question: `Quelle est l'adresse du siège social de ${nom} ?`,
      answer: isProtected
        ? `L'adresse précise de cette entreprise individuelle fait l'objet d'une restriction de diffusion au répertoire officiel Insee Sirene suite à l'exercice légal du droit d'opposition (Code de commerce et RGPD).`
        : siege?.adresseComplete
        ? `Le siège social de l'entreprise ${nom} est situé à l'adresse déclarée suivante : ${siege.adresseComplete}.`
        : `L'adresse déclarée du siège social est consultable sur la fiche d'établissement rattachée.`,
    },
    {
      question: `Quel est le code APE / NAF et l'activité de ${nom} ?`,
      answer: ul.activitePrincipale
        ? `Le code APE (Activité Principale Exercée) de ${nom} est ${ul.activitePrincipale}, ce qui correspond à l'activité : "${ul.libelleActivite || 'Activité déclarée'}".`
        : `Aucun code APE principal n'est renseigné pour cette entreprise.`,
    },
    {
      question: `L'entreprise ${nom} est-elle toujours en activité ?`,
      answer: isActive
        ? `Oui, l'entreprise ${nom} est actuellement enregistrée comme active dans le répertoire public Sirene.`
        : `Non, l'entreprise ${nom} est enregistrée comme ayant cessé son activité au répertoire Sirene.`,
    },
  ]

  return {
    introText: intro,
    activityText: activity,
    legalText: legal,
    faq,
  }
}
