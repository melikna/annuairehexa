# Annuaire Entreprises France

> **Application web d'annuaire des entreprises et établissements en France**  
> Données issues du répertoire Sirene de l'INSEE — Licence Ouverte 2.0 (Etalab)

---

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Démarrage rapide](#démarrage-rapide)
3. [Structure du projet](#structure-du-projet)
4. [Configuration](#configuration)
5. [Base de données](#base-de-données)
6. [Import des données](#import-des-données)
7. [Développement](#développement)
8. [Tests](#tests)
9. [Déploiement](#déploiement)
10. [Documentation complémentaire](#documentation-complémentaire)

---

## Vue d'ensemble

**Annuaire Entreprises France** est une application web recensant les entreprises et leurs établissements en France, classés par commune, département, région, secteur et activité.

### Principes fondamentaux

- **Fiabilité avant exhaustivité** : les données affichées proviennent directement de Sirene, sans déduction ni invention
- **Transparence** : sources, dates de mise à jour, limites et lacunes sont documentées et affichées
- **Respect de la vie privée** : le statut de diffusion Sirene est honoré ; les oppositions et les entités non-diffusibles ne sont jamais exposées
- **Honnêteté editoriale** : un code APE ne prouve pas une qualification, une certification ou un agrément

### Technologies

| Composant | Technologie |
|-----------|-------------|
| Frontend + SSR | Next.js 15 + TypeScript strict |
| Base de données | PostgreSQL 16+ (pg_trgm, unaccent) |
| Recherche (pilote) | PostgreSQL full-text + trigrammes |
| Workers d'import | Node.js ESM |
| Style | Tailwind CSS |
| Licence données | Licence Ouverte 2.0 (Etalab) |

---

## Démarrage rapide

### Prérequis

- Node.js ≥ 20
- PostgreSQL 16+ (avec extensions pg_trgm et unaccent)
- npm 9+

### Installation

```bash
# 1. Cloner le projet et installer les dépendances
cd annuaire-entreprises-france
npm install

# 2. Configurer l'environnement
cp .env.example .env.local
# Éditer .env.local et renseigner DATABASE_URL

# 3. Créer la base de données et appliquer les migrations
createdb annuaire_dev   # ou via psql
node scripts/migrate.js

# 4. Importer les référentiels géographiques
node workers/import/referentiels.js

# 5. Importer les données pilote (département 75 — Paris)
node workers/import/pilot.js --departement 75 --max-pages 100

# 6. Lancer le serveur de développement
npm run dev
```

L'application est accessible sur http://localhost:3000

---

## Structure du projet

```
annuaire-entreprises-france/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (public)/           # Pages publiques
│   │   │   ├── page.tsx        # Accueil
│   │   │   ├── recherche/      # Recherche
│   │   │   ├── entreprise/     # Fiches entreprise [siren]
│   │   │   ├── etablissement/  # Fiches établissement [siret]
│   │   │   ├── region/         # Pages région [slug]
│   │   │   ├── departement/    # Pages département [slug]
│   │   │   ├── ville/          # Pages ville [slug]
│   │   │   ├── secteur/        # Pages secteur [slug]
│   │   │   ├── activite/       # Pages activité [version]/[slug]
│   │   │   ├── methodologie/   # Méthodologie
│   │   │   ├── sources/        # Sources des données
│   │   │   ├── couverture/     # Rapport de couverture
│   │   │   ├── correction/     # Formulaire RGPD
│   │   │   ├── confidentialite/# Politique de confidentialité
│   │   │   └── mentions-legales/
│   │   ├── api/                # Route Handlers API
│   │   │   ├── search/         # GET /api/search
│   │   │   ├── entreprise/     # GET /api/entreprise/[siren]
│   │   │   ├── etablissement/  # GET /api/etablissement/[siret]
│   │   │   ├── sitemaps/       # GET /api/sitemaps
│   │   │   └── coverage/       # GET /api/coverage
│   │   ├── (admin)/            # Administration
│   │   ├── layout.tsx          # Layout racine
│   │   └── globals.css         # Styles globaux
│   ├── components/
│   │   ├── layout/             # Header, Footer, PublicLayout
│   │   ├── ui/                 # StatusBadge, Breadcrumb, Pagination
│   │   ├── entity/             # Cartes d'entités
│   │   ├── search/             # Composants de recherche
│   │   └── ads/                # Emplacements publicitaires
│   ├── lib/
│   │   ├── db/                 # Client PostgreSQL
│   │   ├── search/             # Moteur de recherche (interface + impl. PostgreSQL)
│   │   ├── publication/        # Service de publication (règles de diffusion)
│   │   ├── geo/                # Utilitaires géographiques
│   │   ├── seo/                # Génération de métadonnées SEO
│   │   └── formatting/         # Formatters (SIREN, dates, adresses...)
│   └── types/
│       └── domain.ts           # Types TypeScript du domaine métier
├── migrations/
│   └── 001_initial_schema.sql  # Schéma complet PostgreSQL
├── workers/
│   ├── import/
│   │   ├── pilot.js            # Import pilote (API Recherche Entreprises)
│   │   ├── referentiels.js     # Import référentiels géographiques
│   │   ├── stock.js            # Import fichiers stock Sirene (Jalon C)
│   │   └── lib/
│   │       └── import-utils.js
│   ├── sync/
│   │   └── incremental.js      # Synchronisation incrémentale (Jalon C)
│   └── sitemap/
│       └── generate.js         # Génération de sitemaps
├── scripts/
│   └── migrate.js              # Outil de migration SQL
├── docs/
│   ├── SOURCES.md              # Sources et licences
│   ├── ARCHITECTURE.md         # Architecture technique
│   └── DATA_DICTIONARY.md      # Dictionnaire de données
├── tests/
│   ├── unit/                   # Tests unitaires
│   ├── integration/            # Tests d'intégration
│   └── e2e/                    # Tests end-to-end
├── DECISIONS.md                # Journal des décisions architecturales
├── TASKS.md                    # Suivi des tâches (jalons A-E)
├── .env.example                # Variables d'environnement (template)
└── package.json
```

---

## Configuration

Copiez `.env.example` en `.env.local` et configurez les variables :

```bash
cp .env.example .env.local
```

Variables **obligatoires** pour démarrer :

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL de connexion PostgreSQL |
| `NEXT_PUBLIC_SITE_NAME` | Nom du site (configurable) |
| `NEXT_PUBLIC_SITE_URL` | URL canonique |

Variables optionnelles documentées dans `.env.example`.

---

## Base de données

### Migrations

```bash
# Appliquer toutes les migrations en attente
node scripts/migrate.js

# Vérifier l'état des migrations
node scripts/migrate.js --status

# Simuler sans exécuter
node scripts/migrate.js --dry-run
```

### Schéma principal

Les tables principales (voir `migrations/001_initial_schema.sql`) :

- `legal_units` — Unités légales (SIREN)
- `establishments` — Établissements (SIRET)
- `regions`, `departements`, `communes` — Référentiels géographiques
- `activity_codes` — Nomenclatures NAF Rév.2 et NAF 2025
- `legal_categories` — Catégories juridiques
- `publication_rules` — Règles de diffusion
- `suppression_requests` — Demandes de suppression RGPD
- `imports`, `sync_checkpoints` — Traçabilité des imports
- `geo_aggregates` — Agrégats calculés
- `audit_logs` — Journal d'audit

---

## Import des données

### Étape 1 : Référentiels géographiques (obligatoire en premier)

```bash
node workers/import/referentiels.js
```

Importe les communes, départements et régions depuis `geo.api.gouv.fr`.
Durée estimée : 10-30 minutes selon la connexion.

### Étape 2 : Données pilote (un département)

```bash
# Département 75 (Paris) — ~100 pages × 25 résultats = ~2 500 entreprises
node workers/import/pilot.js --departement 75 --max-pages 100

# Département 69 (Rhône) — toutes les pages
node workers/import/pilot.js --departement 69

# Par secteur (pour contourner la limite de 10 000 résultats par requête)
node workers/import/pilot.js --departement 75 --secteur G --max-pages 400
node workers/import/pilot.js --departement 75 --secteur F --max-pages 400
```

> ⚠ **Limites du worker pilote** : utilise l'API Recherche d'Entreprises qui
> exclut les entités non-diffusibles et est limitée à ~10 000 résultats
> par requête paginée. Pour la couverture nationale, utiliser les fichiers
> stock Sirene (Jalon C).

### Étape 3 : Vérifier la couverture

Accédez à `/couverture` après import pour vérifier les statistiques.

---

## Développement

```bash
# Démarrer en mode développement
npm run dev

# Vérification TypeScript
npm run typecheck

# Linting
npm run lint

# Build de production
npm run build

# Serveur de production
npm start
```

---

## Tests

```bash
# Tests unitaires (formatters, règles de publication)
npm test

# Tests e2e (Playwright)
npm run test:e2e
```

Les tests unitaires sont dans `tests/unit/`. Voir `docs/TEST_REPORT.md` pour les résultats.

---

## Déploiement

Voir `docs/DEPLOYMENT.md` pour les instructions détaillées.

Le projet inclut un `docker-compose.yml` pour la production (non disponible en développement local sans Docker).

---

## Documentation complémentaire

| Document | Contenu |
|----------|---------|
| [docs/SOURCES.md](docs/SOURCES.md) | Sources de données, licences, restrictions |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architecture technique détaillée |
| [DECISIONS.md](DECISIONS.md) | Journal des décisions architecturales |
| [TASKS.md](TASKS.md) | Suivi des jalons A–E |
| [.env.example](.env.example) | Documentation des variables d'environnement |

---

## Licence du code

Le code source de cette application est propriétaire (à définir par l'éditeur).

Les **données** affichées sont issues du répertoire Sirene de l'INSEE, diffusées sous [Licence Ouverte 2.0 (Etalab)](https://www.etalab.gouv.fr/licence-ouverte-open-licence).

---

## Avertissement

Ce projet est indépendant et n'est pas affilié à l'INSEE, au gouvernement français, ni à aucune administration publique. Les informations affichées sont fournies à titre indicatif et peuvent comporter des inexactitudes ou des décalages de mise à jour.
