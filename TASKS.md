# Suivi des tâches — Annuaire Entreprises France

> Maintenu entre sessions. Dernière mise à jour : 2026-09-19.

---

## Jalon A — Architecture et preuve de données

### Documentation
- [x] Inspection du projet existant
- [x] Vérification des sources officielles (Sirene, API Recherche Entreprises, Geo API)
- [x] DECISIONS.md
- [x] docs/SOURCES.md
- [x] .env.example
- [x] docs/ARCHITECTURE.md
- [x] docs/DATA_DICTIONARY.md
- [x] docs/IMPORTS.md
- [x] docs/PRIVACY.md
- [x] docs/SEO.md
- [ ] docs/ADSENSE.md
- [ ] docs/COUTS.md
- [x] docs/DEPLOYMENT.md
- [x] docs/RUNBOOK.md
- [ ] docs/TEST_REPORT.md
- [ ] PROJECT_BRIEF.md
- [x] README.md

### Infrastructure et schéma
- [x] Structure du projet Next.js
- [x] package.json + installation des dépendances
- [x] Configuration TypeScript
- [x] Configuration Tailwind CSS
- [x] Migrations PostgreSQL (schéma complet)
- [x] Docker Compose (production)
- [x] next.config.ts

### Code — Couche données
- [x] Types TypeScript (domaine)
- [x] Client PostgreSQL (src/lib/db/)
- [x] Service de publication (PublicationService)
- [x] Service de recherche (SearchService — interface)
- [x] Service géographie (GeoService)
- [x] Formatters et utilitaires

### Code — Import pilote
- [x] Worker d'import référentiels géographiques (geo.api.gouv.fr)
- [x] Worker d'import pilote départemental (API Recherche Entreprises)
- [x] Validation et contrôles qualité
- [x] Commandes CLI (scripts/)

### Code — Application web
- [x] Layout principal
- [x] Page d'accueil
- [x] Page de recherche
- [x] Fiche entreprise
- [x] Fiche établissement
- [x] Pages géographiques (région, département, ville)
- [x] Pages secteurs/activité
- [x] Pages légales et méthodologie
- [ ] Administration minimale

### Tests
- [x] Tests unitaires (formatters, validators, publication rules)
- [ ] Tests d'intégration (import pipeline)
- [ ] Tests e2e (parcours utilisateur)

---

## Jalon B — Version utilisable

- [x] Recherche opérationnelle sur le pilote
- [x] Fiches entreprise et établissement complètes
- [x] Navigation géographique et sectorielle
- [x] Administration minimale
- [x] Formulaires correction et opposition
- [x] Pages sources et méthodologie

---

## Jalon C — Passage à l'échelle

- [x] Import streaming national (workers/import/stock.js)
- [x] Synchronisation incrémentale via API Sirene (workers/sync/incremental.js)
- [x] Surveillance temps réel des Procédures Collectives BODACC (workers/sync/bodacc.js)
- [x] Ordonnanceur automatisé en continu (workers/cron/scheduler.js)
- [x] Actualisation à la volée / Read-through cache (/api/entreprise/[siren]/refresh)
- [x] Agrégats et statistiques (geo_aggregates)
- [x] Index PostgreSQL optimisés (trgm, btree, vues filtrées)
- [x] Cache et revalidation (ISR différencié par type de route)
- [x] Rapport de couverture (/couverture)
- [ ] Tests de charge sur volume représentatif

---

## Jalon D — Publication et monétisation

- [x] Politique d'indexation SEO complète (robots.ts, canonical, meta)
- [x] Sitemaps générés (sitemap.ts avec hubs régionaux/départementaux)
- [x] AdSense configuré et validé (AdSlot.tsx avec réservation d'espace anti-CLS)
- [x] Règles d'exclusion publicitaire (pages formulaires, légales et recherche exclues)
- [ ] CMP intégrée (IAB TCF v2.2)
- [ ] Tableau de bord économique

---

## Jalon E — Enrichissements et durcissement

- [x] Connecteur INPI/RNE (workers/enrichment/inpi.js avec SSO & JWT)
- [x] Documentation d'exploitation finale (docs/RUNBOOK.md, DEPLOYMENT.md, IMPORTS.md, PRIVACY.md, SEO.md)
- [ ] Revendication de fiche
- [ ] Audit de sécurité
- [ ] Sauvegardes et restauration testées
