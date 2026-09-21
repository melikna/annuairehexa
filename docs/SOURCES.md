# Sources de données — Annuaire Entreprises France

> Date de vérification : 2026-09-19  
> Responsable : Équipe technique AEF

---

## 1. Base Sirene — INSEE

| Champ | Valeur |
|-------|--------|
| Producteur | Institut national de la statistique et des études économiques (INSEE) |
| Licence | Licence Ouverte 2.0 (Etalab) |
| URL stable données | https://www.data.gouv.fr/datasets/base-sirene-des-entreprises-et-de-leurs-etablissements-siren-siret |
| Identifiant jeu | 5b7ffc618b4c4169d30727e0 |
| Fréquence mise à jour | Mensuelle (stocks), infra-mensuelle via API |
| Périmètre | Ensemble du répertoire Sirene : unités légales et établissements depuis 1973 (actifs et cessés/fermés) |
| Formats disponibles | ZIP+CSV, Parquet (depuis juin 2025) |
| Documentation officielle | https://portail-api.insee.fr/catalog/api/2ba0e549-5587-3ef1-9082-99cd865de66f/doc |
| Dernière mise à jour observée | 1er septembre 2026 |

### Fichiers stock disponibles (6 fichiers mensuels)

1. **stockUniteLegale** — Unités légales actives et cessées (état courant)
2. **stockUniteLegaleHist** — Valeurs historisées des unités légales
3. **stockEtablissement** — Établissements actifs et fermés (état courant)
4. **stockEtablissementHist** — Valeurs historisées des établissements
5. **stockLienSuccessionEtablissement** — Liens de succession entre établissements
6. **stockDoublons** — Doublons SIREN (depuis mai 2024)

### Évolutions annoncées et vérifiées

- **NAF 2025** : depuis le 16 décembre 2025, les champs `activitePrincipaleNAF25Etablissement` et `activitePrincipaleNAF25UniteLegale` sont ajoutés en anticipation.
- **Basculement NAF 2025** : prévu entre le 1er et le 6 janvier 2027. À cette date, les variables NAF25 disparaîtront et les variables principales contiendront les codes NAF 2025.
- **Arrêt CSV** : arrêt des fichiers CSV prévu dans le courant du second semestre 2027 ; seul le format Parquet sera maintenu. Le pipeline privilégie Parquet.
- **URL stables** : utiliser les URL stables de data.gouv.fr, pas les URL directes vers les fichiers datés.

### Restrictions de diffusion

- Les unités légales et établissements avec `statutDiffusion = "P"` font l'objet d'une diffusion partielle (opposition d'une personne physique ou de représentants légaux d'une personne morale).
- Pour les personnes physiques : identité (nom, prénoms), adresse dans la commune et géolocalisation masquées.
- Pour les personnes morales avec opposition : adresse de l'établissement dans la commune et géolocalisation masquées.
- Les données relatives aux représentants légaux ne sont pas diffusées en open data par l'INSEE (article R 123-232 du Code de commerce).
- Les unités non diffusibles ne doivent pas apparaître dans les résultats publics.

### Obligations légales

- Traitement soumis au RGPD et à la Loi CNIL du 6 janvier 1978 modifiée.
- Obligation de tenir compte du statut de diffusion le plus récent.
- Une opposition ne doit pas être contournée par croisement avec d'autres sources.

---

## 2. API Sirene — INSEE

| Champ | Valeur |
|-------|--------|
| Producteur | INSEE |
| Licence données | Licence Ouverte 2.0 (Etalab) — distincte de la licence MIT du code de l'API |
| Accès | Inscription obligatoire sur portail-api.insee.fr, souscription à l'API |
| URL portail | https://portail-api.insee.fr |
| Utilisation | Synchronisation incrémentale post-import initial (pas d'aspiration exhaustive) |
| Variables clés de suivi | `dateDernierTraitementUniteLegale`, `dateDernierTraitementEtablissement` |
| Quotas | À vérifier dans le portail après souscription (non figés ici) |

### Usage prévu

- **Synchronisation quotidienne** : interroger les enregistrements modifiés depuis le dernier watermark.
- **Ne pas** interroger chaque SIREN individuellement chaque nuit.
- Respecter les codes 429 et l'en-tête `Retry-After`.
- Maintenir des watermarks séparés pour les unités légales et les établissements.

---

## 3. API Recherche d'entreprises — api.gouv.fr

| Champ | Valeur |
|-------|--------|
| Producteur | Annuaire des Entreprises / DINUM |
| Licence code | MIT (ne couvre pas les données exposées) |
| Licence données | À vérifier — données issues de sources multiples |
| URL base | https://recherche-entreprises.api.gouv.fr |
| Documentation | https://recherche-entreprises.api.gouv.fr/docs/ |
| OpenAPI | https://recherche-entreprises.api.gouv.fr/openapi.json |
| Accès | Public, sans authentification |
| Limite | 7 req/s par IP, 30 req/s par ASN |
| Réponse 429 | Renvoie l'en-tête Retry-After |
| Périmètre | Unités légales diffusibles uniquement (non-diffusibles exclues) |

### Usage prévu

- Recherche textuelle et géographique en complément de la base locale.
- Vérification ponctuelle et enrichissement autorisé.
- **Ne pas** utiliser pour aspirer exhaustivement la France entière.
- **Ne pas** considérer les `matching_etablissements` comme liste exhaustive des établissements d'un SIREN.
- Les filtres portent parfois sur l'unité légale, parfois sur les établissements — vérifier la documentation par paramètre.
- Distinguer cette API de « API Entreprise » (habilitation administrative requise pour certains services).

### Endpoints vérifiés (2026-09-19)

- `GET /search` : recherche textuelle ou par SIREN/SIRET. Filtres SIREN/SIRET ignorent les autres filtres.
- `GET /near_point` : recherche géographique par lat/long + radius (max 50 km).
- Pagination : `page` (défaut 1), `per_page` (max 25).
- Mode minimal : `minimal=true` + `include` pour réduire la payload.

---

## 4. API Découpage Administratif — geo.api.gouv.fr

| Champ | Valeur |
|-------|--------|
| Producteur | Etalab / DINUM |
| URL | https://geo.api.gouv.fr |
| Accès | Public, sans authentification |
| Périmètre | Communes, communes associées et déléguées, EPCI, départements, régions |
| Usage prévu | Import initial des référentiels géographiques avec millésime |

### Particularités documentées

- Certains codes de commune sont alphanumériques (2A, 2B pour la Corse).
- Les DOM-TOM ont des codes de département spécifiques (971-976).
- Ne pas déduire le département depuis le code postal.
- Prévoir une relation plusieurs-à-plusieurs entre communes et codes postaux.
- Les fusions de communes créent des codes obsolètes ; maintenir un historique.
- Les arrondissements municipaux (Paris, Lyon, Marseille) ont leurs propres codes INSEE.

---

## 5. INPI — Registre National des Entreprises (RNE)

| Champ | Valeur |
|-------|--------|
| Producteur | Institut National de la Propriété Industrielle (INPI) |
| URL | https://data.inpi.fr |
| Accès | Compte INPI requis pour l'API. Les données publiques (comptes annuels non confidentiels, actes) sont accessibles selon les conditions du portail. |
| Utilisation prévue | Enrichissement optionnel : dirigeants publics, comptes annuels, actes |
| Statut connecteur | **Non connecté** — implémenter après obtention d'un accès |

### Note sur la licence

Vérifier séparément la licence des données exposées et la licence du code de l'API. Une licence MIT sur le Swagger ne couvre pas les données.

---

## 6. Licence Ouverte 2.0 (Etalab)

- URL : https://www.data.gouv.fr/pages/legal/licences/etalab-2.0
- Permet la réutilisation libre, y compris commerciale, sous réserve de mentionner la source et la date de collecte.
- S'applique aux données Sirene, API Découpage Administratif et autres jeux de data.gouv.fr concernés.
- Ne couvre pas automatiquement les enrichissements provenant d'autres sources.

---

## 7. Référentiel géographique — Code officiel géographique (COG)

| Champ | Valeur |
|-------|--------|
| Producteur | INSEE |
| URL | https://www.insee.fr/fr/information/2560452 |
| Millésime actuel | À vérifier lors de chaque import |
| Usage | Référentiel des communes, départements, régions, collectivités |
| Licence | Licence Ouverte 2.0 |

---

## 8. Nomenclatures d'activités

### NAF Rév. 2 (en vigueur jusqu'au 5 janvier 2027)
- URL : https://www.insee.fr/fr/information/2406147
- 732 codes à 5 positions (ex : `01.12Z`)

### NAF 2025 (entrée en vigueur le 6 janvier 2027)
- URL : https://www.insee.fr/fr/information/7766026 (à vérifier)
- Transition : depuis le 16/12/2025, les codes NAF 2025 sont diffusés en anticipation.
- Les pipelines doivent gérer la coexistence des deux nomenclatures.
- Ne jamais mélanger les codes, libellés, statistiques ou URL des deux versions.

---

## 9. CNIL — Réutilisation par les annuaires

- URL : https://www.cnil.fr/fr/reutilisation-de-donnees-par-des-annuaires-en-ligne-quels-droits-pour-les-professionnels-concernes
- Les professionnels inscrits en tant que personnes physiques peuvent exercer un droit d'opposition.
- L'annuaire doit proposer une procédure gratuite de correction et d'opposition.
- L'analyse juridique complète doit être validée avant lancement en production.

---

## 10. Google — Règles et API

### AdSense
- Règlement : https://support.google.com/adsense/answer/48182?hl=fr
- Qualité des pages : https://support.google.com/publisherpolicies/answer/11112688?hl=fr
- Consentement : https://support.google.com/adsense/answer/13554116?hl=fr
- Contenu dupliqué : https://support.google.com/publisherpolicies/answer/11190248?hl=fr
- RPM pages : https://support.google.com/adsense/answer/112030?hl=fr

### Search
- Règles antispam : https://developers.google.com/search/docs/essentials/spam-policies
- Sitemaps : https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Navigation à facettes : https://developers.google.com/crawling/docs/faceted-navigation
- Indexing API : https://developers.google.com/search/apis/indexing-api/v3/quickstart
  - **Périmètre limité** : réservé aux offres d'emploi et aux événements en direct. Ne pas l'utiliser pour les fiches d'annuaire ordinaires.

### Web Vitals
- Référence : https://web.dev/articles/vitals
- Objectifs : LCP < 2,5 s (p75), INP < 200 ms (p75), CLS < 0,1 (p75)

---

## Matrice de responsabilité

| Source | Données actuellement importées | Données publiables | Statut |
|--------|-------------------------------|-------------------|--------|
| Sirene stocks (CSV/Parquet) | Non — pilote requis | Non — pilote requis | À implémenter |
| API Sirene (sync) | Non | Non | Requiert clé API |
| API Recherche Entreprises | Oui (ponctuel) | Oui (diffusibles) | Opérationnel |
| API Découpage Administratif | Non — import initial requis | Oui | À implémenter |
| INPI/RNE | Non | Non | Connecteur non connecté |
| BODACC | Non | Non | Connecteur non connecté |

---

*Ce document doit être mis à jour à chaque import initial, chaque mise à jour majeure de source, et au moins trimestriellement.*
