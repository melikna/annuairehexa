# Stratégie SEO Technique & Éditoriale — Annuaire Entreprises France

> Objectif : Dominer les requêtes à forte intention de recherche sur les entreprises françaises face aux acteurs historiques (Société.com, Pappers, PagesJaunes, Annuaire des Entreprises).

---

## 1. Moteur anti « Duplicate Content » (Contenu Unique)

Le risque n°1 des annuaires de données publiques est la pénalité pour contenu dupliqué (pages squelettes identiques avec seulement 3 variables qui changent).

Notre moteur éditorial (`src/lib/seo/enterprise-content.ts`) résout ce problème en générant **2 à 4 paragraphes de texte rédigé unique** pour chaque fiche entreprise :
1. **Introduction dynamique** : Synthétise le statut administratif, l'ancienneté calculée (ex: *"en activité depuis 24 ans et 3 mois"*), et la date exacte d'immatriculation officielle.
2. **Contexte sectoriel & économique** : Intègre le libellé complet de l'APE, le numéro de section, la division NAF et la ville d'implantation.
3. **Organisation juridique & réseau** : Précise la forme juridique légale (SARL, SAS, EI...), la catégorie d'entreprise (PME, ETI, GE), la taille du réseau d'établissements (siège unique vs multi-établissements) et le numéro fiscal européen calculé.

---

## 2. Rich Snippets Google (Balisage Schema.org JSON-LD)

Chaque page intègre un graphe Schema.org complet dans `<script type="application/ld+json">` :

1. **`@type: Organization`** :
   - `name`, `legalName`
   - `taxID` (Numéro SIREN officiel)
   - `vatID` (Numéro de TVA intracommunautaire calculé)
   - `foundingDate` & `dissolutionDate` (si cessée)
   - `address` (PostalAddress conforme avec code commune COG et code postal)
2. **`@type: FAQPage`** :
   - Déclenche les accordéons FAQ directement dans les résultats de recherche Google (Rich Snippets).
   - 5 questions/réponses dynamiques et uniques par entreprise (SIREN/SIRET, TVA, adresse du siège, code APE, statut d'activité).
3. **`@type: BreadcrumbList`** :
   - Fil d'Ariane hiérarchique : Accueil > Entreprises > Département > Nom de l'entreprise.

---

## 3. Formules de Titres & Meta Descriptions (CTR Maximum)

Les balises `<title>` et `<meta description>` ciblent les intentions de recherche exactes des professionnels et particuliers :

- **Fiche Entreprise** :
  - Title : `{Nom} (SIREN {SIREN}) : TVA, Chiffres, Adresse, Statut`
  - Meta Description : `Fiche légale complète de {Nom} (SIREN {SIREN}). Entreprise {Statut}, code APE {Code}, TVA {TVA}, siège social, établissements et données officielles Sirene INSEE.`
- **Fiche Établissement** :
  - Title : `{Enseigne / Nom} à {Ville} ({CP}) (SIRET {SIRET}) : Adresse, Activité, Statut`
  - Meta Description : `Fiche légale de l'établissement {Nom} à {Ville}. SIRET {SIRET} ({Statut}). Activité {APE}, adresse, entreprise de rattachement {Entreprise} et données officielles Sirene INSEE.`

---

## 4. Maillage Interne Sémantique (Topic Clusters & Siloing)

Google favorise les sites dont les pages sont interconnectées par affinité thématique et géographique :

- **Siloing Géographique** :
  - Région (`/region/[slug]`) ➔ Départements (`/departement/[slug]`) ➔ Communes (`/ville/[slug]`) ➔ Établissements (`/etablissement/[siret]`).
  - Chaque fiche entreprise renvoie vers les autres entreprises de sa commune et de son département.
- **Siloing Sectoriel** :
  - 21 sections NAF (`/secteurs`) ➔ Codes APE (`/activite/[nomenclature]/[code]`) ➔ Entreprises du secteur.

---

## 5. Optimisation du Budget de Crawl & Indexation

1. **`robots.txt` (`src/app/robots.ts`)** :
   - Bloque strictement `/recherche` : empêche Googlebot de gaspiller son budget de crawl sur des millions de combinaisons de filtres internes.
   - Bloque les routes privées (`/api/`, `/admin/`, `/correction`).
2. **`sitemap.xml` (`src/app/sitemap.ts`)** :
   - Indexe en priorité les hubs territoriaux (régions, départements) et les pages éditoriales avec `changeFrequency` et `priority` ajustés.
3. **Balises canoniques** :
   - Chaque page déclare son URL canonique absolue pour éliminer tout risque de dédoublement.

---

## 6. Performance Web & Core Web Vitals

- **CLS (Cumulative Layout Shift) = 0** :
  - Emplacements publicitaires (`AdSlot.tsx`) réservés avec hauteur minimale CSS fixe.
  - Typographie Marianne importée proprement.
- **Poids ultra-léger** :
  - First Load JS partagé : **101 kB** seulement.
  - Server-Side Rendering (SSR) et Incremental Static Regeneration (ISR) : rendu HTML instantané pour les robots de crawl.
