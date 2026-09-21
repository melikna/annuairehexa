/**
 * Types du domaine métier — Annuairehexa
 * Base Sirene Insee, RNE (INPI), BODACC
 *
 * Ces types reflètent le modèle Sirene tel que documenté par l'INSEE.
 * Les commentaires indiquent le nom de variable officiel Sirene et sa signification.
 * 
 * Principes :
 * - SIREN, SIRET, codes INSEE, codes postaux, codes APE : toujours string
 * - Distinguer absent (null/undefined), inconnu ('?'), non diffusé ('ND'), confidentiel ('C')
 * - Effectif : toujours une tranche, jamais un chiffre exact
 * - Catégorie d'entreprise : conserver le millésime
 */

// =============================================================================
// Statuts et énumérations
// =============================================================================

/** Statut administratif d'une unité légale ou d'un établissement */
export type EtatAdministratif = 'A' | 'C' | 'F'
// A = Active/Actif  C = Cessée (unité légale)  F = Fermé (établissement)

/** Statut de diffusion Sirene */
export type StatutDiffusion = 'O' | 'P'
// O = diffusé intégralement  P = diffusion Partielle (opposition)

/** Version de la nomenclature d'activité */
export type NomenclatureActivite = 'NAFRev2' | 'NAF2025'

/** Catégorie d'entreprise (au sens statistique) */
export type CategorieEntreprise = 'PME' | 'ETI' | 'GE' | null

/** Type de personne pour les représentants */
export type TypePersonne = 'physique' | 'morale'

/** Type d'établissement */
export type TypeEtablissement = 'siège' | 'secondaire'

// =============================================================================
// Tranches d'effectif salarié (codification INSEE)
// =============================================================================

/** 
 * Tranche d'effectif salarié selon la codification INSEE.
 * Ces tranches sont les seules valeurs diffusées — jamais un effectif exact.
 */
export type TrancheEffectif =
  | 'NN'   // Non employeur (0 salarié)
  | '00'   // 0 salarié
  | '01'   // 1 ou 2 salariés
  | '02'   // 3 à 5 salariés
  | '03'   // 6 à 9 salariés
  | '11'   // 10 à 19 salariés
  | '12'   // 20 à 49 salariés
  | '21'   // 50 à 99 salariés
  | '22'   // 100 à 199 salariés
  | '31'   // 200 à 249 salariés
  | '32'   // 250 à 499 salariés
  | '41'   // 500 à 999 salariés
  | '42'   // 1 000 à 1 999 salariés
  | '51'   // 2 000 à 4 999 salariés
  | '52'   // 5 000 à 9 999 salariés
  | '53'   // 10 000 salariés et plus
  | null   // Non renseigné

/** Libellé lisible d'une tranche d'effectif */
export const TRANCHE_EFFECTIF_LABELS: Record<Exclude<TrancheEffectif, null>, string> = {
  'NN': 'Non employeur',
  '00': '0 salarié',
  '01': '1 ou 2 salariés',
  '02': '3 à 5 salariés',
  '03': '6 à 9 salariés',
  '11': '10 à 19 salariés',
  '12': '20 à 49 salariés',
  '21': '50 à 99 salariés',
  '22': '100 à 199 salariés',
  '31': '200 à 249 salariés',
  '32': '250 à 499 salariés',
  '41': '500 à 999 salariés',
  '42': '1 000 à 1 999 salariés',
  '51': '2 000 à 4 999 salariés',
  '52': '5 000 à 9 999 salariés',
  '53': '10 000 salariés et plus',
}

// =============================================================================
// Géographie
// =============================================================================

export interface Region {
  /** Code INSEE de la région (2 chiffres, ex: "11", "76") */
  code: string
  nom: string
  slug: string
}

export interface Departement {
  /** Code INSEE du département (2-3 caractères, ex: "75", "2A", "971") */
  code: string
  nom: string
  slug: string
  /** Code INSEE de la région parente */
  codeRegion: string
}

export interface Commune {
  /** Code INSEE de la commune (5 caractères, ex: "75056", "2A004") */
  code: string
  nom: string
  slug: string
  /** Code INSEE du département (déduit du code commune, sauf cas particuliers) */
  codeDepartement: string
  /** Code INSEE de la région */
  codeRegion: string
  /**
   * Codes postaux associés à cette commune.
   * Relation plusieurs-à-plusieurs : une commune peut avoir plusieurs codes postaux
   * et un code postal peut couvrir plusieurs communes.
   */
  codesPostaux: string[]
  /** Population (optionnel, source COG) */
  population?: number
  /** Coordonnées GPS du centre de la commune */
  coordonnees?: { latitude: number; longitude: number }
}

// =============================================================================
// Codes d'activité
// =============================================================================

export interface CodeActivite {
  /** Code APE (ex: "01.12Z" pour NAF Rév.2 ; format différent pour NAF 2025) */
  code: string
  /** Libellé officiel du code */
  libelle: string
  /** Version de la nomenclature */
  version: NomenclatureActivite
  /** Section (lettre, ex: "A", "C") */
  section: string
  /** Division (2 chiffres) */
  division: string
  /** Groupe (3 chiffres) */
  groupe: string
  /** Classe (4 chiffres) */
  classe: string
  /** Sous-classe (5 caractères avec lettre) */
  sousClasse: string
}

/** Libellé de section pour la nomenclature NAF Rév.2 */
export const NAF_SECTIONS: Record<string, string> = {
  'A': 'Agriculture, sylviculture et pêche',
  'B': 'Industries extractives',
  'C': 'Industrie manufacturière',
  'D': "Production et distribution d'électricité, de gaz, de vapeur et d'air conditionné",
  'E': "Production et distribution d'eau ; assainissement, gestion des déchets et dépollution",
  'F': 'Construction',
  'G': 'Commerce ; réparation d\'automobiles et de motocycles',
  'H': 'Transports et entreposage',
  'I': 'Hébergement et restauration',
  'J': 'Information et communication',
  'K': "Activités financières et d'assurance",
  'L': 'Activités immobilières',
  'M': 'Activités spécialisées, scientifiques et techniques',
  'N': 'Activités de services administratifs et de soutien',
  'O': 'Administration publique',
  'P': 'Enseignement',
  'Q': 'Santé humaine et action sociale',
  'R': 'Arts, spectacles et activités récréatives',
  'S': 'Autres activités de services',
  'T': "Activités des ménages en tant qu'employeurs",
  'U': 'Activités extra-territoriales',
}

// =============================================================================
// Catégories juridiques
// =============================================================================

export interface CategorieJuridique {
  /** Code de catégorie juridique sur 4 chiffres (ex: "5710" = SA) */
  code: string
  libelle: string
  /** Niveau : 1 = grande catégorie, 2 = catégorie, 3 = forme juridique */
  niveau: 1 | 2 | 3
}

// =============================================================================
// Unité légale
// =============================================================================

/** 
 * Représentation d'une unité légale Sirene.
 * Une unité légale peut être une entreprise, une association, un organisme public, etc.
 * Elle est identifiée par son SIREN (9 chiffres, toujours string).
 */
export interface UniteLegale {
  // --- Identifiant ---
  /** Numéro SIREN — 9 chiffres, stocké comme string (préserve les zéros initiaux) */
  siren: string

  // --- Statut de diffusion ---
  /** Statut de diffusion. "P" = diffusion partielle (opposition) */
  statutDiffusion: StatutDiffusion

  // --- État administratif ---
  /** "A" = active, "C" = cessée */
  etatAdministratif: EtatAdministratif
  /** Date de création de l'unité légale */
  dateCreation: string | null
  /** Date de fermeture (pour les unités légales cessées) */
  dateFermeture: string | null

  // --- Dénomination ---
  /**
   * Raison sociale pour les personnes morales.
   * Pour les personnes physiques : peut être null si statutDiffusion = "P".
   */
  denominationUniteLegale: string | null
  denominationUsuelle1: string | null
  denominationUsuelle2: string | null
  denominationUsuelle3: string | null
  /** Sigle */
  sigleUniteLegale: string | null
  /**
   * Nom de naissance pour les personnes physiques.
   * Masqué si statutDiffusion = "P".
   */
  nomUniteLegale: string | null
  /** Nom d'usage */
  nomUsageUniteLegale: string | null
  /** Prénom(s) pour les personnes physiques */
  prenom1UniteLegale: string | null
  prenom2UniteLegale: string | null
  prenom3UniteLegale: string | null
  prenom4UniteLegale: string | null

  // --- Classification ---
  /** Code de catégorie juridique (4 chiffres, ex: "5710") */
  categorieJuridiqueUniteLegale: string | null
  /** Code APE selon NAF Rév.2 */
  activitePrincipaleUniteLegale: string | null
  /** Nomenclature de l'APE (ex: "NAFRev2", "NAF2025") */
  nomenclatureActivitePrincipaleUniteLegale: NomenclatureActivite | null
  /** Code APE selon NAF 2025 (présent depuis le 16/12/2025, temporaire jusqu'au 6/01/2027) */
  activitePrincipaleNAF25UniteLegale: string | null

  // --- Effectif ---
  /** Tranche d'effectif salarié — jamais un nombre exact */
  trancheEffectifsUniteLegale: TrancheEffectif
  /** Année de validité de la tranche d'effectif */
  anneeEffectifsUniteLegale: string | null
  /** Catégorie d'entreprise (PME, ETI, GE) — au sens statistique INSEE */
  categorieEntreprise: CategorieEntreprise
  /** Année de la catégorie d'entreprise */
  anneeCategorieEntreprise: string | null

  // --- Caractéristiques ---
  /** "O" = employeur, "N" = non-employeur */
  caractereEmployeurUniteLegale: 'O' | 'N' | null
  /** Économie sociale et solidaire */
  economieSocialeSolidaireUniteLegale: 'O' | 'N' | null
  /** Société à mission */
  societeMissionUniteLegale: 'O' | 'N' | null

  // --- Établissement siège ---
  /** SIRET du siège (14 chiffres, toujours string) */
  siretSiege: string | null

  // --- Données techniques ---
  /** Date du dernier traitement dans Sirene — utilisé pour la synchronisation */
  dateDernierTraitementUniteLegale: string | null
  /** Date de collecte par notre système */
  dateCollecte: string
  /** Source de la donnée */
  sourceImport: string
  /** Identifiant de l'import */
  importId: string | null
  /** Procédure collective en cours */
  estEnProcedureCollective?: boolean
  /** Nature de la procédure collective */
  natureProcedureCollective?: string | null
  /** Date du jugement */
  dateProcedureCollective?: string | null
  /** Tribunal ayant statué */
  tribunalProcedureCollective?: string | null
  /** Détails du jugement */
  detailsProcedureCollective?: string | null
  /** Horodatage du dernier contrôle temps réel */
  derniereVerificationTempsReel?: string | null
}

// =============================================================================
// Établissement
// =============================================================================

/**
 * Représentation d'un établissement Sirene.
 * Un établissement est une unité géographique d'une unité légale.
 * Identifié par son SIRET (14 chiffres = SIREN 9 + NIC 5), toujours string.
 */
export interface Etablissement {
  // --- Identifiant ---
  /** SIRET — 14 chiffres, stocké comme string */
  siret: string
  /** SIREN de l'unité légale parente — 9 chiffres, stocké comme string */
  siren: string
  /** NIC (Numéro Interne de Classement) — 5 chiffres */
  nic: string

  // --- Statut de diffusion ---
  statutDiffusionEtablissement: StatutDiffusion

  // --- État administratif ---
  /** "A" = actif, "F" = fermé */
  etatAdministratifEtablissement: 'A' | 'F'
  dateCreationEtablissement: string | null
  dateFermetureEtablissement: string | null

  // --- Type ---
  /** Si cet établissement est le siège de l'unité légale */
  etablissementSiege: boolean

  // --- Dénomination ---
  /** Enseigne 1 (parmi les 3 possibles) */
  enseigne1Etablissement: string | null
  enseigne2Etablissement: string | null
  enseigne3Etablissement: string | null
  /** Dénomination usuelle de l'établissement */
  denominationUsuelleEtablissement: string | null

  // --- Adresse (brute) ---
  /**
   * Ces champs peuvent être masqués pour les établissements avec statutDiffusion = "P"
   * (opposition d'une personne physique ou de représentants légaux d'une personne morale)
   */
  complementAdresseEtablissement: string | null
  numeroVoieEtablissement: string | null
  indiceRepetitionEtablissement: string | null
  typeVoieEtablissement: string | null
  libelleVoieEtablissement: string | null
  codePostalEtablissement: string | null
  libelleCommuneEtablissement: string | null
  /** Code INSEE de la commune (5 caractères, alphanumérique possible) */
  codeCommuneEtablissement: string | null
  /** Code département (2-3 caractères) */
  codeDepartementEtablissement: string | null
  /** Code région (2 chiffres) */
  codeRegionEtablissement: string | null
  /** Distribution spéciale (BP, CEDEX...) */
  distributionSpecialeEtablissement: string | null
  /** Code CEDEX */
  codeCedexEtablissement: string | null
  libelleCedexEtablissement: string | null
  /** Pour les établissements à l'étranger */
  codePaysEtrangerEtablissement: string | null
  libellePaysEtrangerEtablissement: string | null
  libelleCommuneEtrangerEtablissement: string | null

  // --- Géolocalisation ---
  /**
   * Coordonnées GPS (masquées si statutDiffusion = "P")
   * Source : géocodage INSEE pour les études statistiques
   */
  latitude: string | null
  longitude: string | null

  // --- Activité ---
  /** Code APE selon NAF Rév.2 */
  activitePrincipaleEtablissement: string | null
  /** Nomenclature APE */
  nomenclatureActivitePrincipaleEtablissement: NomenclatureActivite | null
  /** Code APE selon NAF 2025 (temporaire jusqu'au 6/01/2027) */
  activitePrincipaleNAF25Etablissement: string | null
  /** Activité principale au registre des métiers */
  activitePrincipaleRegistreMetiersEtablissement: string | null

  // --- Effectif ---
  trancheEffectifsEtablissement: TrancheEffectif
  anneeEffectifsEtablissement: string | null
  caractereEmployeurEtablissement: 'O' | 'N' | null

  // --- Données techniques ---
  dateDernierTraitementEtablissement: string | null
  dateCollecte: string
  sourceImport: string
  importId: string | null
}

// =============================================================================
// Vues publiables (après application des règles de diffusion)
// =============================================================================

/**
 * Vue d'une unité légale après application des règles de publication.
 * Seuls les champs autorisés à la diffusion sont présents.
 * Utilisée pour le rendu HTML, les API publiques, les métadonnées, les données structurées.
 */
export interface UniteLegalePubliable {
  siren: string
  /** Dénomination affichable (peut être masquée pour les personnes physiques) */
  denominationAffichable: string | null
  etatAdministratif: EtatAdministratif
  dateCreation: string | null
  dateFermeture: string | null
  /** Code APE en vigueur (selon la version active de la nomenclature) */
  activitePrincipale: string | null
  /** Libellé de l'APE */
  libelleActivite: string | null
  /** Version de la nomenclature active */
  nomenclatureActive: NomenclatureActivite | null
  categorieJuridique: string | null
  libelleFormeJuridique: string | null
  trancheEffectifs: TrancheEffectif
  anneeEffectifs: string | null
  categorieEntreprise: CategorieEntreprise
  anneeCategorieEntreprise: string | null
  siretSiege: string | null
  /** Indique si des informations ont été masquées (diffusion partielle) */
  diffusionPartielle: boolean
  /** Date de fraîcheur de la donnée */
  dateMiseAJour: string | null
  /** Nombre total d'établissements (connu dans notre base) */
  nombreEtablissements?: number
  /** Nombre d'établissements actifs (connu dans notre base) */
  nombreEtablissementsActifs?: number
  /** Procédure collective en cours (redressement, liquidation, sauvegarde...) */
  estEnProcedureCollective?: boolean
  /** Nature de la procédure ('liquidation', 'redressement', 'sauvegarde', etc.) */
  natureProcedureCollective?: string | null
  /** Date du jugement de procédure collective */
  dateProcedureCollective?: string | null
  /** Tribunal compétent ayant rendu le jugement */
  tribunalProcedureCollective?: string | null
  /** Détails ou extrait du jugement BODACC */
  detailsProcedureCollective?: string | null
  /** Date et heure de la dernière synchronisation temps réel */
  derniereVerificationTempsReel?: string | null
  /** Historique des annonces de procédures collectives (BODACC) */
  proceduresCollectivesHistorique?: ProcedureCollective[]

  // --- Enrichissements complets API (Dirigeants, Finances, Compléments, NAF25) ---
  activitePrincipaleNAF25?: string | null
  nomCommercial?: string | null
  dateDebutActivite?: string | null
  dirigeants?: Array<{
    nom: string
    prenoms?: string | null
    qualite: string
    anneeNaissance?: string | null
    dateNaissance?: string | null
    typeDirigeant?: string | null
    nationalite?: string | null
  }>
  finances?: Record<string, { ca?: number; resultatNet?: number }>
  complements?: {
    conventionCollectiveRenseignee?: boolean
    listeIdcc?: string[]
    estOrganismeFormation?: boolean
    estQualiopi?: boolean
    listeIdOrganismeFormation?: string[]
    estRge?: boolean
    estEss?: boolean
    estSocieteMission?: boolean
    estBio?: boolean
    estEntrepreneurIndividuel?: boolean
    egaproRenseignee?: boolean
  }
}

export interface ProcedureCollective {
  id: string
  siren: string
  typeJugement: string
  natureDecision: string
  dateJugement: string | null
  datePublication: string | null
  tribunal: string | null
  numeroAnnonce: string | null
  parutionBodacc: string | null
  description: string | null
}

/**
 * Vue d'un établissement après application des règles de publication.
 */
export interface EtablissementPubliable {
  siret: string
  siren: string
  nic: string
  etablissementSiege: boolean
  etatAdministratif: 'A' | 'F'
  dateCreation: string | null
  dateFermeture: string | null
  enseigneAffichable: string | null
  /** Adresse complète formatée (null si masquée) */
  adresseComplete: string | null
  adresseLigne1: string | null
  adresseLigne2: string | null
  codePostal: string | null
  libelleCommune: string | null
  codeCommune: string | null
  codeDepartement: string | null
  codeRegion: string | null
  /** Coordonnées GPS (null si masquées ou non disponibles) */
  coordonnees: { latitude: number; longitude: number } | null
  activitePrincipale: string | null
  libelleActivite: string | null
  nomenclatureActive: NomenclatureActivite | null
  trancheEffectifs: TrancheEffectif
  anneeEffectifs: string | null
  /** Indique si des informations ont été masquées */
  diffusionPartielle: boolean
  dateMiseAJour: string | null
}

// =============================================================================
// Pagination et recherche
// =============================================================================

export interface PaginationMeta {
  page: number
  perPage: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface SearchResult<T> {
  results: T[]
  pagination: PaginationMeta
  /** Indique si le total est exact ou approximatif */
  totalIsExact: boolean
  /** Paramètres de recherche appliqués */
  params: SearchParams
}

export interface SearchParams {
  q?: string
  region?: string
  departement?: string
  codeCommune?: string
  codePostal?: string
  activitePrincipale?: string
  section?: string
  natureJuridique?: string
  etatAdministratif?: EtatAdministratif
  trancheEffectifs?: string
  anneeCreationMin?: string
  anneeCreationMax?: string
  categorieEntreprise?: CategorieEntreprise
  estEss?: boolean
  estRge?: boolean
  estOrganismeFormation?: boolean
  estSocieteMission?: boolean
  estBio?: boolean
  page: number
  perPage: number
  sort?: 'pertinence' | 'nom' | 'dateCreation' | 'dateCreationDesc'
}

// =============================================================================
// Import et synchronisation
// =============================================================================

export interface ImportRecord {
  id: string
  type: 'stock_unites_legales' | 'stock_etablissements' | 'referentiels_geo' | 'sync_incremental'
  status: 'pending' | 'running' | 'completed' | 'failed' | 'partial'
  startedAt: string
  completedAt: string | null
  source: string
  sourceVersion: string | null
  /** Nombre de lignes dans le fichier source */
  sourceRowCount: number | null
  /** Nombre de lignes traitées */
  processedCount: number
  /** Nombre de lignes créées */
  createdCount: number
  /** Nombre de lignes mises à jour */
  updatedCount: number
  /** Nombre de lignes rejetées */
  rejectedCount: number
  /** Message d'erreur si status = 'failed' */
  errorMessage: string | null
  /** Watermark de fin utilisé pour la prochaine synchronisation */
  watermarkEnd: string | null
}

export interface SyncCheckpoint {
  flux: 'unites_legales' | 'etablissements'
  /** Date-heure du dernier traitement intégré avec succès */
  lastProcessedAt: string
  /** Identifiant de l'import correspondant */
  importId: string
  updatedAt: string
}

// =============================================================================
// Suppressions et droits
// =============================================================================

export interface DemandeCorrection {
  id: string
  type: 'correction' | 'opposition' | 'suppression' | 'acces'
  /** SIREN ou SIRET concerné */
  entityId: string
  entityType: 'unite_legale' | 'etablissement'
  status: 'pending' | 'validated' | 'rejected' | 'applied'
  /** Description de la demande (fournie par le demandeur) */
  description: string
  /** Champs concernés */
  fieldsAffected: string[]
  createdAt: string
  updatedAt: string
  /** Date d'application de la suppression (si applicable) */
  appliedAt: string | null
}

// =============================================================================
// Économie et mesure
// =============================================================================

export interface CoverageReport {
  /** Date de génération du rapport */
  generatedAt: string
  /** Date de l'import le plus récent pris en compte */
  importDate: string
  /** Nombre d'unités légales dans notre base */
  totalUnitesLegales: number
  /** Dont actives */
  unitesLegalesActives: number
  /** Nombre d'établissements dans notre base */
  totalEtablissements: number
  /** Dont actifs */
  etablissementsActifs: number
  /** Nombre de fiches publiables (statut de diffusion O) */
  fichesPubables: number
  /** Nombre de fiches avec diffusion partielle */
  fichesDiffusionPartielle: number
  /** Couverture géographique : départements importés */
  departementsCoverts: string[]
  /** Limites et exclusions documentées */
  limitesDocumentees: string[]
}
