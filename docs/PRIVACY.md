# Architecture de Protection des Données & Conformité RGPD

> Politique technique et organisationnelle de traitement des statuts d'opposition Sirene et des droits des personnes.

---

## 1. Principes d'application des statuts Sirene

Le répertoire Sirene distingue deux grands statuts de diffusion pour les entités :

- **Statut `O` (Diffusible)** : L'entreprise ou l'établissement est ouvert à la réutilisation publique sous Licence Ouverte 2.0.
- **Statut `P` (Diffusion partielle / Opposition)** : L'entrepreneur individuel ou le représentant légal a exercé son droit d'opposition auprès de l'INSEE (article A123-96 du Code de commerce).

### Règle technique fondamentale
Le service `PublicationService` applique systématiquement le filtre :
1. Pour une **personne physique avec statut `P`** :
   - Le nom et les prénoms sont **remplacés par `null`** (aucune identité affichée).
   - L'adresse complète et les coordonnées GPS sont **masquées**.
   - Seul le département reste accessible pour les statistiques économiques agrégées.
2. Pour une **personne morale avec établissement en statut `P`** :
   - L'adresse de voie et la géolocalisation de l'établissement sont **masquées**.
3. Pour toute **valeur non reconnue ou non diffusible** :
   - L'entité est **strictement exclue** de tout affichage public.

---

## 2. Droit à l'oubli et procédure de suppression locale

Même si la mise à jour officielle doit être initiée auprès de l'INSEE, notre application propose un guichet direct et gratuit :
- Formulaire dédié : `/correction`
- Endpoint de réception : `/api/correction`
- Table de stockage : `suppression_requests` avec le flag `permanent_block = true`

### Garantie de non-réintroduction
Lorsqu'une demande de suppression ou d'opposition est validée dans `suppression_requests` avec `permanent_block = true`, les vues SQL `legal_units_publishable` et `establishments_publishable` excluent définitivement l'entité, même si un réimport massif ultérieur d'un fichier stock non à jour venait à être exécuté.
