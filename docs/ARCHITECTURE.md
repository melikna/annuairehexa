# Architecture technique — Annuaire Entreprises France

## 1. Principes d'architecture

- **Monolithe modulaire en Next.js App Router (TypeScript strict)** : Regroupement de la couche de présentation (Server Components), de l'API publique (`/api/*`) et de la logique de domaine.
- **Workers découplés** : Les processus lourds d'importation et de synchronisation (`workers/import/*`, `workers/sync/*`) s'exécutent en tant que scripts Node.js indépendants en arrière-plan, évitant toute saturation du serveur HTTP.
- **Garantie RGPD au niveau de la couche domaine** : Le composant `PublicationService` est le point d'accès obligatoire à toute donnée avant diffusion publique. Aucune requête brute SQL n'est renvoyée directement au client sans passage par ce filtre.
- **Recherche résiliente** : Abstraction via l'interface `SearchEngine`. En pilote, implémentation `SearchEnginePostgres` avec `pg_trgm` et `unaccent`. Remplacement transparent possible par Typesense ou Elasticsearch si l'échelle l'exige.

---

## 2. Flux de données

```
[Sources Externes]
  - API Recherche Entreprises (Pilote)
  - Fichiers Stock Sirene Parquet (Jalon C)
  - API Découpage Administratif (geo.api.gouv.fr)
         │
         ▼
[Workers d'import (Node.js)]
  - Validation Zod / Types
  - Nettoyage et normalisation
  - Bulk upsert par lots (batch 500)
         │
         ▼
[Base PostgreSQL]
  - legal_units, establishments
  - publication_rules, suppression_requests
  - Vues filtrées : legal_units_publishable, establishments_publishable
         │
         ▼
[PublicationService (TypeScript)]
  - Masquage statut 'P' (personnes physiques, adresses)
  - Exclusion définitive des entités supprimées / non-diffusibles
         │
         ▼
[Next.js App Router (SSR / Cache ISR)]
  - Pages publiques : /entreprise/[siren], /etablissement/[siret], etc.
  - Endpoints REST : /api/search, /api/entreprise/[siren], etc.
```

---

## 3. Stratégie de mise en cache

1. **Pages d'accueil et portails géographiques** : Revalidation ISR (`revalidate = 86400` - 24 heures).
2. **Fiches entreprises et établissements** : Revalidation ISR (`revalidate = 3600` - 1 heure).
3. **Recherche textuelle** : Dynamique (`revalidate = 0`) avec en-têtes HTTP de protection.
4. **Mises à jour incrémentales** : Invalidation ciblée via le tag ou chemin lors des syncs Sirene.

---

## 4. Sécurité & Performance

- **Headers HTTP renforcés** configurés dans `next.config.ts` (CSP, X-Frame-Options, Permissions-Policy, HSTS).
- **Prévention du CLS (Cumulative Layout Shift)** : Emplacements publicitaires réservés avec dimensions CSS fixes conformes aux formats IAB.
- **Monétisation responsable** : Aucun affichage AdSense sur les pages de droits (/correction), légales ou résultats de recherche. Consentement obligatoire via CMP.
