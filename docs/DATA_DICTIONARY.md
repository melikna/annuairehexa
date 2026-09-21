# Dictionnaire de données — Répertoire Sirene & Base Locale

> Référence des variables officielles Sirene (INSEE) et de leur représentation dans notre schéma PostgreSQL.

---

## 1. Unité Légale (`legal_units`)

| Variable Sirene | Colonne PostgreSQL | Type | Description / Règle métier |
|-----------------|--------------------|------|----------------------------|
| `siren` | `siren` | `VARCHAR(9)` | Clé primaire. Identifiant unique de l'entreprise (9 chiffres). |
| `statutDiffusionUniteLegale` | `statut_diffusion` | `VARCHAR(1)` | `O` (diffusible), `P` (diffusion partielle - opposition). |
| `etatAdministratifUniteLegale` | `etat_administratif` | `VARCHAR(1)` | `A` (active), `C` (cessée). |
| `denominationUniteLegale` | `denomination` | `TEXT` | Nom de la personne morale. `NULL` pour les entrepreneurs individuels. |
| `nomUniteLegale` / `prenom1UniteLegale` | `nom_naissance` / `prenom_1` | `TEXT` | Identité des personnes physiques. **Masqué si statut_diffusion = 'P'**. |
| `categorieJuridiqueUniteLegale` | `categorie_juridique` | `VARCHAR(4)` | Code à 4 chiffres (ex: 5499 = SARL, 1000 = Entrepreneur individuel). |
| `activitePrincipaleUniteLegale` | `activite_principale_naf_rev2` | `VARCHAR(10)` | Code APE selon la NAF Rév. 2 (ex: 62.01Z). |
| `activitePrincipaleNAF25UniteLegale` | `activite_principale_naf_2025`| `VARCHAR(10)` | Code d'activité selon la future NAF 2025. |
| `trancheEffectifsUniteLegale` | `tranche_effectifs` | `VARCHAR(2)` | Tranche codifiée INSEE (ex: '01' = 1 ou 2 salariés, 'NN' = non employeur). |
| `categorieEntreprise` | `categorie_entreprise` | `VARCHAR(3)` | 'PME', 'ETI', 'GE' au sens statistique. |
| `dateCreationUniteLegale` | `date_creation` | `DATE` | Date officielle de création. |
| `dateDebut` (fermeture) | `date_fermeture` | `DATE` | Date de cessation d'activité le cas échéant. |

---

## 2. Établissement (`establishments`)

| Variable Sirene | Colonne PostgreSQL | Type | Description / Règle métier |
|-----------------|--------------------|------|----------------------------|
| `siret` | `siret` | `VARCHAR(14)` | Clé primaire. SIREN (9) + NIC (5). |
| `siren` | `siren` | `VARCHAR(9)` | Clé étrangère vers `legal_units`. |
| `nic` | `nic` | `VARCHAR(5)` | Numéro Interne de Classement. |
| `statutDiffusionEtablissement` | `statut_diffusion` | `VARCHAR(1)` | `O` ou `P`. |
| `etatAdministratifEtablissement`| `etat_administratif` | `VARCHAR(1)` | `A` (ouvert / actif), `F` (fermé). |
| `etablissementSiege` | `etablissement_siege` | `BOOLEAN` | `true` si siège social de l'entreprise. |
| `codePostalEtablissement` | `code_postal` | `VARCHAR(5)` | Code postal de distribution. |
| `codeCommuneEtablissement` | `code_commune` | `VARCHAR(5)` | Code officiel géographique (COG) INSEE. |
| `numeroVoieEtablissement` + `typeVoie` + `libelleVoie` | `numero_voie`, `type_voie`, `libelle_voie` | `TEXT` | Composantes d'adresse. **Masquées si statut_diffusion = 'P'**. |
| `latitude` / `longitude` | `latitude` / `longitude` | `NUMERIC` | Coordonnées géographiques. **Masquées si statut_diffusion = 'P'**. |
| `enseigne1Etablissement` | `enseigne_1` | `TEXT` | Enseigne commerciale affichable. |
| `activitePrincipaleEtablissement` | `activite_principale_naf_rev2` | `VARCHAR(10)` | APE de l'établissement. |

---

## 3. Données dérivées et contrôle d'accès

- **`legal_units_publishable` & `establishments_publishable`** : Vues SQL excluant les statuts non diffusibles et filtrant les demandes de suppression permanente validées (`suppression_requests`).
- **`PublicationService.buildUniteLegalePubliable()`** : Couche d'application garantissant que même dans les entités publiables avec statut 'P', aucun nom, prénom ou adresse personnelle ne soit diffusé.
