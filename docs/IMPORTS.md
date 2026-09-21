# Guide des Procédures d'Importation & Synchronisation

> Documentation opérationnelle des pipelines de données pour l'Annuaire Entreprises France.

---

## 1. Vue d'ensemble des flux

| Script / Worker | Source de données | Fréquence | Objectif |
|-----------------|-------------------|-----------|----------|
| `workers/import/referentiels.js` | API Géo (geo.api.gouv.fr) | Annuelle | Référentiel des 18 régions, 101 départements et ~35 000 communes avec codes postaux. |
| `workers/import/pilot.js` | API Recherche Entreprises | À la demande | Import rapide d'un département complet pour amorcer la base locale en phase pilote. |
| `workers/import/stock.js` | Fichiers Stock Sirene INSEE (data.gouv.fr) | Mensuelle | Ingestion massive du stock national complet (unités légales et établissements). |
| `workers/sync/incremental.js` | API Sirene V3.11 (api.insee.fr) | Quotidienne / Hebdo | Synchronisation incrémentale des créations, modifications et cessations. |
| `workers/enrichment/inpi.js` | API RNE INPI (registre-national-entreprises) | À la demande | Enrichissement en dirigeants et bénéficiaires effectifs. |

---

## 2. Guide d'exécution

### A. Référentiels géographiques
```powershell
node workers/import/referentiels.js
```
- Récupère toutes les régions, départements et communes avec géolocalisation et population.
- Remplit la table de correspondance `commune_codes_postaux`.

### B. Import Pilote (Département 75 - Paris)
```powershell
# 100 pages = ~2 500 entreprises avec sièges
node workers/import/pilot.js --departement 75 --max-pages 100

# Filtrer par secteur d'activité spécifique (ex: Bâtiment / Travaux Publics)
node workers/import/pilot.js --departement 75 --secteur F --max-pages 200
```

### C. Import Stock National Massif
```powershell
# Unités légales
node workers/import/stock.js --flux unites_legales --file ./data/StockUniteLegale.csv

# Établissements
node workers/import/stock.js --flux etablissements --file ./data/StockEtablissement.csv
```

### D. Synchronisation Incrémentale
```powershell
# Utilise le dernier checkpoint enregistré ou les dernières 48h
node workers/sync/incremental.js --flux unites_legales

# Forcer une date de départ
node workers/sync/incremental.js --flux etablissements --since 2026-09-01T00:00:00
```
