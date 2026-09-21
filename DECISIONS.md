# Journal des décisions techniques — Annuaire Entreprises France

> Ce fichier trace les décisions architecturales et leurs justifications.
> Maintenu entre sessions. Dernière mise à jour : 2026-09-19.

---

## D-001 — Monolithe modulaire Next.js + PostgreSQL

**Date** : 2026-09-19  
**Statut** : Appliqué

**Décision** : Architecture monolithique modulaire avec Next.js 15 (App Router) + TypeScript strict + PostgreSQL 16+.

**Justification** :
- Plus simple à exploiter qu'une constellation de microservices.
- Next.js offre SSR, ISR et API Routes dans un seul déploiement.
- PostgreSQL avec extensions pg_trgm (trigrammes) et unaccent couvre le cas d'usage de recherche pour le pilote.
- Workers d'import séparés du serveur web (processus Node.js distincts, non des routes HTTP).

**Alternatives écartées** :
- Microservices : complexité opérationnelle injustifiée pour la v1.
- MySQL/SQLite : fonctionnalités de recherche textuelle inférieure à PostgreSQL.

---

## D-002 — Parquet prioritaire pour les imports, CSV en fallback

**Date** : 2026-09-19  
**Statut** : Appliqué

**Décision** : Le worker d'import traite Parquet en priorité. Le CSV compressé reste supporté en fallback. L'arrêt du CSV est prévu par l'INSEE dans le second semestre 2027.

**Justification** : L'INSEE a annoncé l'arrêt des livrables CSV au profit du Parquet. Le pipeline ne doit pas dépendre exclusivement du CSV.

**Note** : Pour le pilote initial, le CSV est utilisé (disponibilité immédiate, pas besoin de dépendance Python/DuckDB).

---

## D-003 — Recherche PostgreSQL full-text + trigrammes pour le pilote

**Date** : 2026-09-19  
**Statut** : Appliqué — à réévaluer à l'échelle nationale

**Décision** : Extensions pg_trgm et unaccent pour la recherche. Interface isolée derrière `src/lib/search/` pour permettre une migration future vers Elasticsearch ou Typesense sans réécrire le site.

**Limite documentée** : Les performances sur le volume national (~26 millions d'établissements) doivent être mesurées. Un moteur spécialisé peut s'avérer nécessaire.

---

## D-004 — Statuts de diffusion : approche conservatrice

**Date** : 2026-09-19  
**Statut** : Appliqué

**Décision** : En cas de valeur inconnue ou contradictoire du statut de diffusion, l'entité n'est PAS publiée. Le service central `PublicationService` est le seul point de décision de publication.

**Justification** : La protection des données prime sur l'exhaustivité. Une information absente ne vaut pas une publication conservatrice.

---

## D-005 — SIREN/SIRET stockés comme chaînes

**Date** : 2026-09-19  
**Statut** : Appliqué

**Décision** : SIREN (9 chiffres), SIRET (14 chiffres), codes INSEE, codes postaux, codes APE — tous stockés comme VARCHAR, jamais comme INTEGER/BIGINT.

**Justification** : Préservation des zéros initiaux. Un SIREN commençant par 0 serait tronqué si stocké en numérique.

---

## D-006 — Séparation valeur source / normalisée / publiable

**Date** : 2026-09-19  
**Statut** : Appliqué

**Décision** : Trois couches pour chaque champ important :
1. `source_value` : valeur brute telle que reçue de la source
2. `normalized_value` : valeur nettoyée/normalisée
3. `publishable_value` : valeur publiable après application des règles de confidentialité

---

## D-007 — URL stables Sirene via data.gouv.fr

**Date** : 2026-09-19  
**Statut** : Appliqué

**Décision** : Utiliser les URL stables de data.gouv.fr pour les fichiers Sirene (découverte depuis les métadonnées de l'API), jamais les URL directes vers des fichiers datés.

**Raison** : L'INSEE a notifié que les URL directes changent ; seules les URL stables sont garanties.

---

## D-008 — AdSense désactivé par défaut

**Date** : 2026-09-19  
**Statut** : Appliqué

**Décision** : Le système publicitaire est désactivé jusqu'à ce que `NEXT_PUBLIC_ADSENSE_ENABLED=true` ET que `NEXT_PUBLIC_ADSENSE_CLIENT_ID` soit renseigné.

**Conditions préalables au passage en prod** :
1. Approbation du compte AdSense
2. CMP certifiée IAB TCF intégrée et configurée
3. Validation éditoriale des pages monétisées
4. Test du flux de consentement dans tous les états

---

## D-009 — NAF Rév.2 et NAF 2025 : coexistence jusqu'au 6 janvier 2027

**Date** : 2026-09-19  
**Statut** : Appliqué

**Décision** : Le schéma de données stocke `activite_principale_naf_rev2` et `activite_principale_naf_2025` séparément, avec un champ `naf_version_active` indiquant la version en vigueur. Les URL et pages utilisent la version active.

**Calendrier** :
- Jusqu'au 5 janvier 2027 : NAF Rév.2 en vigueur
- Dès le 6 janvier 2027 : NAF 2025 en vigueur
- Transition dans les fichiers Sirene : 1er-6 janvier 2027

---

## D-010 — Pages locales : établissements implantés, pas uniquement sièges

**Date** : 2026-09-19  
**Statut** : Appliqué

**Décision** : Une page de commune liste les établissements réellement implantés sur ce territoire (via `code_commune` de l'établissement), pas seulement les entreprises dont le siège s'y trouve.

**Conséquence** : Une unité légale avec plusieurs établissements peut apparaître sur plusieurs pages locales, mais ne doit être comptée qu'une fois dans le total national.

---

## D-011 — Pas de Docker en développement local (Windows sans Docker Desktop)

**Date** : 2026-09-19  
**Statut** : Appliqué temporairement

**Décision** : Docker Compose est fourni pour la production mais ne peut pas être exécuté dans l'environnement de développement actuel (Windows, Docker non disponible). Le développement local utilise PostgreSQL installé directement.

**Action requise** : L'opérateur doit installer PostgreSQL 16+ localement ou via WSL2 + Docker.

---

## D-012 — Département pilote : 75 (Paris) par défaut

**Date** : 2026-09-19  
**Statut** : Proposé, configurable

**Décision** : Le pilote importe d'abord les établissements du département 75. Ce choix est configurable via `PILOT_DEPARTMENT` dans `.env.local`.

**Raison** : Volume représentatif (>500 000 établissements), cas d'usage variés (arrondissements municipaux, grandes entreprises, professions libérales).
