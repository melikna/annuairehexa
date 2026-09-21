/**
 * Migrations PostgreSQL — Annuaire Entreprises France
 * 
 * Migration 001 : Schéma initial
 * 
 * Conventions :
 * - SIREN, SIRET, codes INSEE, codes postaux, codes APE : VARCHAR (jamais NUMERIC)
 * - Toutes les tables ont created_at et updated_at
 * - Séparation source_value / normalized_value / publishable_value pour les champs sensibles
 * - index sur les champs de recherche et de jointure
 */

-- Migration: 001_initial_schema
-- Date: 2026-09-19

-- Extensions PostgreSQL nécessaires
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Fonction de mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================================================
-- Table : registre des sources
-- =============================================================================
CREATE TABLE source_registry (
  id            VARCHAR(100) PRIMARY KEY,
  name          TEXT NOT NULL,
  producer      TEXT NOT NULL,
  license       TEXT NOT NULL,
  base_url      TEXT,
  documentation_url TEXT,
  last_verified_at  TIMESTAMPTZ NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_source_registry_updated_at
  BEFORE UPDATE ON source_registry
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Table : imports
-- =============================================================================
CREATE TABLE imports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type            VARCHAR(50) NOT NULL,
  -- stock_unites_legales, stock_etablissements, referentiels_geo, sync_incremental
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- pending, running, completed, failed, partial
  source_id       VARCHAR(100) REFERENCES source_registry(id),
  source_url      TEXT,
  source_version  VARCHAR(100),
  source_row_count BIGINT,
  processed_count BIGINT NOT NULL DEFAULT 0,
  created_count   BIGINT NOT NULL DEFAULT 0,
  updated_count   BIGINT NOT NULL DEFAULT 0,
  rejected_count  BIGINT NOT NULL DEFAULT 0,
  error_message   TEXT,
  watermark_end   TIMESTAMPTZ,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_imports_type_status ON imports(type, status);
CREATE INDEX idx_imports_started_at ON imports(started_at DESC);

CREATE TRIGGER update_imports_updated_at
  BEFORE UPDATE ON imports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Table : checkpoints de synchronisation
-- =============================================================================
CREATE TABLE sync_checkpoints (
  flux              VARCHAR(50) PRIMARY KEY,
  -- unites_legales, etablissements
  last_processed_at TIMESTAMPTZ NOT NULL,
  import_id         UUID REFERENCES imports(id),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Table : géographie — régions
-- =============================================================================
CREATE TABLE regions (
  code        VARCHAR(3) PRIMARY KEY,   -- Ex: "11", "76", "01" (Guadeloupe)
  nom         TEXT NOT NULL,
  slug        VARCHAR(200) NOT NULL UNIQUE,
  millesime   VARCHAR(4) NOT NULL,      -- Année du COG utilisé
  source      VARCHAR(100),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_regions_updated_at
  BEFORE UPDATE ON regions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Table : géographie — départements
-- =============================================================================
CREATE TABLE departements (
  code         VARCHAR(3) PRIMARY KEY,  -- Ex: "75", "2A", "971"
  nom          TEXT NOT NULL,
  slug         VARCHAR(200) NOT NULL UNIQUE,
  code_region  VARCHAR(3) NOT NULL REFERENCES regions(code),
  millesime    VARCHAR(4) NOT NULL,
  source       VARCHAR(100),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_departements_region ON departements(code_region);

CREATE TRIGGER update_departements_updated_at
  BEFORE UPDATE ON departements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Table : géographie — communes
-- =============================================================================
CREATE TABLE communes (
  code              VARCHAR(5) PRIMARY KEY,  -- Ex: "75056", "2A004", "97100"
  nom               TEXT NOT NULL,
  slug              VARCHAR(200) NOT NULL,
  code_departement  VARCHAR(3) NOT NULL,
  code_region       VARCHAR(3) NOT NULL,
  population        INTEGER,
  latitude          NUMERIC(10, 7),
  longitude         NUMERIC(10, 7),
  millesime         VARCHAR(4) NOT NULL,
  source            VARCHAR(100),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_communes_departement ON communes(code_departement);
CREATE INDEX idx_communes_region ON communes(code_region);
CREATE INDEX idx_communes_slug ON communes(slug);
-- Index de recherche textuelle sur le nom
CREATE INDEX idx_communes_nom_trgm ON communes USING gin(unaccent(nom) gin_trgm_ops);

CREATE TRIGGER update_communes_updated_at
  BEFORE UPDATE ON communes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Table : relation commune <-> codes postaux (plusieurs-à-plusieurs)
-- =============================================================================
CREATE TABLE commune_codes_postaux (
  code_commune  VARCHAR(5) NOT NULL REFERENCES communes(code),
  code_postal   VARCHAR(5) NOT NULL,
  PRIMARY KEY (code_commune, code_postal)
);

CREATE INDEX idx_ccp_code_postal ON commune_codes_postaux(code_postal);

-- =============================================================================
-- Table : codes d'activité (NAF Rév.2 et NAF 2025)
-- =============================================================================
CREATE TABLE activity_codes (
  id              SERIAL PRIMARY KEY,
  code            VARCHAR(20) NOT NULL,   -- Ex: "01.12Z", "53.10A"
  version         VARCHAR(10) NOT NULL,   -- "NAFRev2", "NAF2025"
  libelle         TEXT NOT NULL,
  section         VARCHAR(1) NOT NULL,
  division        VARCHAR(2) NOT NULL,
  groupe          VARCHAR(3),
  classe          VARCHAR(4),
  sous_classe     VARCHAR(10),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(code, version)
);

CREATE INDEX idx_activity_codes_section ON activity_codes(section, version);
CREATE INDEX idx_activity_codes_version ON activity_codes(version);
-- Recherche textuelle sur le libellé
CREATE INDEX idx_activity_codes_libelle_trgm ON activity_codes USING gin(unaccent(libelle) gin_trgm_ops);

-- =============================================================================
-- Table : catégories juridiques
-- =============================================================================
CREATE TABLE legal_categories (
  code      VARCHAR(4) PRIMARY KEY,    -- Ex: "5710"
  libelle   TEXT NOT NULL,
  niveau    SMALLINT NOT NULL,         -- 1, 2 ou 3
  parent    VARCHAR(4),               -- Code parent pour les niveaux 2 et 3
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Table : unités légales
-- =============================================================================
CREATE TABLE legal_units (
  -- Identifiant
  siren                                     VARCHAR(9) PRIMARY KEY,

  -- Statut de diffusion (jamais NULL après import)
  statut_diffusion                          VARCHAR(1) NOT NULL DEFAULT 'O',
  -- O = diffusé, P = partiel (opposition)

  -- État administratif
  etat_administratif                        VARCHAR(1) NOT NULL,  -- A, C
  date_creation                             DATE,
  date_fermeture                            DATE,

  -- Dénomination (peut être NULL pour les personnes physiques avec opposition)
  denomination                              TEXT,
  denomination_usuelle_1                    TEXT,
  denomination_usuelle_2                    TEXT,
  denomination_usuelle_3                    TEXT,
  sigle                                     TEXT,
  -- Personnes physiques (masquées si statut_diffusion = 'P')
  nom_naissance                             TEXT,
  nom_usage                                 TEXT,
  prenom_1                                  TEXT,
  prenom_2                                  TEXT,
  prenom_3                                  TEXT,
  prenom_4                                  TEXT,

  -- Classification
  categorie_juridique                       VARCHAR(4),
  activite_principale_naf_rev2              VARCHAR(10),
  activite_principale_naf_2025              VARCHAR(10),
  -- Nomenclature active au moment de l'import
  nomenclature_activite_active              VARCHAR(10),

  -- Effectif
  tranche_effectifs                         VARCHAR(2),
  annee_effectifs                           VARCHAR(4),
  categorie_entreprise                      VARCHAR(3),  -- PME, ETI, GE
  annee_categorie_entreprise                VARCHAR(4),

  -- Caractéristiques
  caractere_employeur                       VARCHAR(1),
  economie_sociale_solidaire               VARCHAR(1),
  societe_mission                          VARCHAR(1),

  -- Siège
  siret_siege                              VARCHAR(14),

  -- Traçabilité
  date_dernier_traitement                   TIMESTAMPTZ,
  date_collecte                             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_import                             VARCHAR(100),
  import_id                                UUID REFERENCES imports(id),

  -- Timestamps internes
  created_at                                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index principaux
CREATE INDEX idx_legal_units_etat ON legal_units(etat_administratif);
CREATE INDEX idx_legal_units_statut_diffusion ON legal_units(statut_diffusion);
CREATE INDEX idx_legal_units_activite ON legal_units(activite_principale_naf_rev2);
CREATE INDEX idx_legal_units_categorie_juridique ON legal_units(categorie_juridique);
CREATE INDEX idx_legal_units_dernier_traitement ON legal_units(date_dernier_traitement);
CREATE INDEX idx_legal_units_date_creation ON legal_units(date_creation);
CREATE INDEX idx_legal_units_categorie_entreprise ON legal_units(categorie_entreprise);
-- Recherche textuelle sur la dénomination
CREATE INDEX idx_legal_units_denomination_trgm ON legal_units 
  USING gin(unaccent(lower(COALESCE(denomination, nom_naissance || ' ' || COALESCE(prenom_1, ''), ''))) gin_trgm_ops);

CREATE TRIGGER update_legal_units_updated_at
  BEFORE UPDATE ON legal_units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Table : établissements
-- =============================================================================
CREATE TABLE establishments (
  -- Identifiant
  siret                                     VARCHAR(14) PRIMARY KEY,
  siren                                     VARCHAR(9) NOT NULL,
  nic                                       VARCHAR(5) NOT NULL,

  -- Statut de diffusion
  statut_diffusion                          VARCHAR(1) NOT NULL DEFAULT 'O',

  -- État administratif
  etat_administratif                        VARCHAR(1) NOT NULL,  -- A, F
  date_creation                             DATE,
  date_fermeture                            DATE,

  -- Type
  etablissement_siege                       BOOLEAN NOT NULL DEFAULT FALSE,

  -- Dénomination
  enseigne_1                                TEXT,
  enseigne_2                                TEXT,
  enseigne_3                                TEXT,
  denomination_usuelle                      TEXT,

  -- Adresse (peut être masquée si statut_diffusion = 'P')
  complement_adresse                        TEXT,
  numero_voie                               VARCHAR(10),
  indice_repetition                         VARCHAR(10),
  type_voie                                 VARCHAR(10),
  libelle_voie                              TEXT,
  code_postal                               VARCHAR(5),
  libelle_commune                           TEXT,
  code_commune                              VARCHAR(5),
  code_departement                          VARCHAR(3),
  code_region                               VARCHAR(3),
  distribution_speciale                     TEXT,
  code_cedex                                VARCHAR(10),
  libelle_cedex                             TEXT,
  -- Adresse étrangère
  code_pays_etranger                        VARCHAR(10),
  libelle_pays_etranger                     TEXT,
  libelle_commune_etranger                  TEXT,

  -- Géolocalisation (masquée si statut_diffusion = 'P')
  latitude                                  NUMERIC(10, 7),
  longitude                                 NUMERIC(10, 7),

  -- Activité
  activite_principale_naf_rev2              VARCHAR(10),
  activite_principale_naf_2025              VARCHAR(10),
  nomenclature_activite_active              VARCHAR(10),
  activite_principale_registre_metiers      TEXT,

  -- Effectif
  tranche_effectifs                         VARCHAR(2),
  annee_effectifs                           VARCHAR(4),
  caractere_employeur                       VARCHAR(1),

  -- Traçabilité
  date_dernier_traitement                   TIMESTAMPTZ,
  date_collecte                             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_import                             VARCHAR(100),
  import_id                                UUID REFERENCES imports(id),

  -- Timestamps internes
  created_at                                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                                TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contrainte d'intégrité : SIRET = SIREN + NIC
  CONSTRAINT chk_siret_composition CHECK (siret = siren || nic)
);

-- Index principaux
CREATE INDEX idx_establishments_siren ON establishments(siren);
CREATE INDEX idx_establishments_etat ON establishments(etat_administratif);
CREATE INDEX idx_establishments_statut_diffusion ON establishments(statut_diffusion);
CREATE INDEX idx_establishments_siege ON establishments(etablissement_siege);
CREATE INDEX idx_establishments_code_commune ON establishments(code_commune);
CREATE INDEX idx_establishments_code_departement ON establishments(code_departement);
CREATE INDEX idx_establishments_code_region ON establishments(code_region);
CREATE INDEX idx_establishments_code_postal ON establishments(code_postal);
CREATE INDEX idx_establishments_activite ON establishments(activite_principale_naf_rev2);
CREATE INDEX idx_establishments_dernier_traitement ON establishments(date_dernier_traitement);
CREATE INDEX idx_establishments_date_creation ON establishments(date_creation);
-- Index géospatial simple (pas PostGIS pour le pilote)
CREATE INDEX idx_establishments_geo ON establishments(latitude, longitude) WHERE latitude IS NOT NULL;
-- Recherche textuelle sur les enseignes
CREATE INDEX idx_establishments_enseigne_trgm ON establishments 
  USING gin(unaccent(lower(COALESCE(enseigne_1, denomination_usuelle, ''))) gin_trgm_ops);

CREATE TRIGGER update_establishments_updated_at
  BEFORE UPDATE ON establishments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Table : historique des établissements (liens de succession)
-- =============================================================================
CREATE TABLE establishment_successions (
  id                          SERIAL PRIMARY KEY,
  siret_precedent             VARCHAR(14) NOT NULL,
  siret_successeur            VARCHAR(14) NOT NULL,
  date_lien                   DATE,
  type_lien                   VARCHAR(50),
  continuoite_economique      BOOLEAN,
  source_import               VARCHAR(100),
  import_id                   UUID REFERENCES imports(id),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(siret_precedent, siret_successeur)
);

CREATE INDEX idx_successions_precedent ON establishment_successions(siret_precedent);
CREATE INDEX idx_successions_successeur ON establishment_successions(siret_successeur);

-- =============================================================================
-- Table : doublons SIREN
-- =============================================================================
CREATE TABLE official_duplicates (
  siren_doublon    VARCHAR(9) NOT NULL,
  siren_conserve   VARCHAR(9) NOT NULL,
  date_traitement  DATE,
  source_import    VARCHAR(100),
  import_id        UUID REFERENCES imports(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (siren_doublon, siren_conserve)
);

CREATE INDEX idx_duplicates_conserve ON official_duplicates(siren_conserve);

-- =============================================================================
-- Table : règles de publication
-- =============================================================================
CREATE TABLE publication_rules (
  id          SERIAL PRIMARY KEY,
  rule_name   VARCHAR(100) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  condition   TEXT NOT NULL,  -- Expression en pseudo-SQL pour documentation
  action      VARCHAR(50) NOT NULL,  -- hide, show, partial
  priority    INTEGER NOT NULL DEFAULT 100,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_publication_rules_updated_at
  BEFORE UPDATE ON publication_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Règles de base (documentées, appliquées par code)
INSERT INTO publication_rules (rule_name, description, condition, action, priority) VALUES
('hide_statut_P_identity', 
 'Masquer identité des personnes physiques avec opposition',
 'statut_diffusion = P AND categorie_juridique IN (1xxx)',
 'partial', 10),
('hide_statut_P_address', 
 'Masquer adresse des entités avec opposition',
 'statut_diffusion = P',
 'partial', 20),
('hide_non_diffusible',
 'Exclure les entités non diffusibles',
 'statut_diffusion NOT IN (O, P)',
 'hide', 5);

-- =============================================================================
-- Table : liste de suppression (entités retirées sur demande)
-- =============================================================================
CREATE TABLE suppression_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type     VARCHAR(20) NOT NULL,  -- unite_legale, etablissement
  entity_id       VARCHAR(14) NOT NULL,  -- SIREN ou SIRET
  request_type    VARCHAR(30) NOT NULL,  -- opposition, correction, suppression, acces
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',
  description     TEXT,
  fields_affected TEXT[],
  -- Pas de données personnelles du demandeur ici — dans une table séparée sécurisée
  applied_at      TIMESTAMPTZ,
  -- Empêche la réintroduction lors d'un réimport
  permanent_block BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suppression_entity ON suppression_requests(entity_type, entity_id);
CREATE INDEX idx_suppression_status ON suppression_requests(status);

CREATE TRIGGER update_suppression_requests_updated_at
  BEFORE UPDATE ON suppression_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Table : routes SEO (registre central des slugs)
-- =============================================================================
CREATE TABLE seo_routes (
  id            SERIAL PRIMARY KEY,
  route_pattern VARCHAR(200) NOT NULL,
  entity_type   VARCHAR(50) NOT NULL,
  entity_id     VARCHAR(14),
  slug          VARCHAR(500) NOT NULL,
  canonical_url TEXT,
  is_indexable  BOOLEAN NOT NULL DEFAULT TRUE,
  noindex_reason VARCHAR(200),
  -- Suivi des changements de slug (pour les redirections)
  previous_slugs TEXT[],
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_seo_routes_slug ON seo_routes(entity_type, entity_id);
CREATE INDEX idx_seo_routes_canonical ON seo_routes(canonical_url);

CREATE TRIGGER update_seo_routes_updated_at
  BEFORE UPDATE ON seo_routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Table : paramètres AdSense
-- =============================================================================
CREATE TABLE ad_settings (
  id                SERIAL PRIMARY KEY,
  page_family       VARCHAR(100) NOT NULL UNIQUE,
  -- unite_legale, etablissement, commune, departement, region, secteur, activite
  enabled           BOOLEAN NOT NULL DEFAULT FALSE,
  slot_ids          JSONB,
  -- Exclusions (secteurs, types d'entités)
  excluded_sectors  TEXT[],
  excluded_types    TEXT[],
  requires_editorial_validation BOOLEAN NOT NULL DEFAULT TRUE,
  editorial_validated_at        TIMESTAMPTZ,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_ad_settings_updated_at
  BEFORE UPDATE ON ad_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Paramètres par défaut (publicité désactivée partout)
INSERT INTO ad_settings (page_family, enabled, notes) VALUES
('unite_legale', FALSE, 'Désactivé par défaut — valider avant activation'),
('etablissement', FALSE, 'Désactivé par défaut'),
('commune', FALSE, 'Désactivé par défaut'),
('departement', FALSE, 'Désactivé par défaut'),
('region', FALSE, 'Désactivé par défaut'),
('secteur', FALSE, 'Désactivé par défaut'),
('activite', FALSE, 'Désactivé par défaut'),
('recherche', FALSE, 'Jamais de publicité sur la page de recherche'),
('correction', FALSE, 'Jamais de publicité sur les formulaires de droits'),
('legal', FALSE, 'Jamais de publicité sur les pages légales');

-- =============================================================================
-- Table : journal d'audit
-- =============================================================================
CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action        VARCHAR(100) NOT NULL,
  entity_type   VARCHAR(50),
  entity_id     VARCHAR(14),
  actor         VARCHAR(200),
  -- Données du changement (sans données personnelles)
  details       JSONB,
  ip_hash       VARCHAR(64),  -- Hash de l'IP, pas l'IP brute
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =============================================================================
-- Table : agrégats géographiques (calculés périodiquement)
-- =============================================================================
CREATE TABLE geo_aggregates (
  id                      SERIAL PRIMARY KEY,
  geo_type                VARCHAR(20) NOT NULL,  -- region, departement, commune
  geo_code                VARCHAR(5) NOT NULL,
  calculated_at           TIMESTAMPTZ NOT NULL,
  -- Établissements
  total_etablissements    INTEGER NOT NULL DEFAULT 0,
  etablissements_actifs   INTEGER NOT NULL DEFAULT 0,
  etablissements_fermes   INTEGER NOT NULL DEFAULT 0,
  -- Unités légales (sièges implantés sur ce territoire)
  total_unites_legales    INTEGER NOT NULL DEFAULT 0,
  unites_legales_actives  INTEGER NOT NULL DEFAULT 0,
  -- Répartition par section d'activité (JSONB : {"A": 123, "B": 45, ...})
  repartition_activite    JSONB,
  -- Créations observées (établissements créés dans les 12 derniers mois)
  -- Note: ce chiffre est notre mesure, pas une statistique officielle INSEE
  nouvelles_creations_12m INTEGER,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(geo_type, geo_code)
);

CREATE INDEX idx_geo_aggregates_type_code ON geo_aggregates(geo_type, geo_code);

CREATE TRIGGER update_geo_aggregates_updated_at
  BEFORE UPDATE ON geo_aggregates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Vue : établissements publiables
-- =============================================================================
-- Cette vue applique les règles de diffusion de base pour les requêtes publiques.
-- Elle ne remplace pas le PublicationService (qui gère la suppression et les cas complexes),
-- mais permet d'optimiser les requêtes courantes.
CREATE VIEW establishments_publishable AS
SELECT
  e.*,
  -- Champs masqués si diffusion partielle
  CASE WHEN e.statut_diffusion = 'P' THEN NULL ELSE e.code_postal END as code_postal_pub,
  CASE WHEN e.statut_diffusion = 'P' THEN NULL ELSE e.libelle_commune END as libelle_commune_pub,
  CASE WHEN e.statut_diffusion = 'P' THEN NULL ELSE e.complement_adresse END as complement_adresse_pub,
  CASE WHEN e.statut_diffusion = 'P' THEN NULL ELSE e.numero_voie END as numero_voie_pub,
  CASE WHEN e.statut_diffusion = 'P' THEN NULL ELSE e.libelle_voie END as libelle_voie_pub,
  CASE WHEN e.statut_diffusion = 'P' THEN NULL ELSE e.latitude END as latitude_pub,
  CASE WHEN e.statut_diffusion = 'P' THEN NULL ELSE e.longitude END as longitude_pub
FROM establishments e
WHERE e.statut_diffusion IN ('O', 'P')
  AND NOT EXISTS (
    SELECT 1 FROM suppression_requests sr
    WHERE sr.entity_type = 'etablissement'
      AND sr.entity_id = e.siret
      AND sr.permanent_block = TRUE
      AND sr.status = 'applied'
  );

-- =============================================================================
-- Vue : unités légales publiables
-- =============================================================================
CREATE VIEW legal_units_publishable AS
SELECT
  lu.*,
  -- Champs masqués pour les personnes physiques avec opposition
  CASE WHEN lu.statut_diffusion = 'P' 
    THEN NULL 
    ELSE lu.nom_naissance 
  END as nom_naissance_pub,
  CASE WHEN lu.statut_diffusion = 'P' 
    THEN NULL 
    ELSE lu.prenom_1 
  END as prenom_1_pub,
  CASE WHEN lu.statut_diffusion = 'P' 
    THEN NULL 
    ELSE lu.prenom_2 
  END as prenom_2_pub
FROM legal_units lu
WHERE lu.statut_diffusion IN ('O', 'P')
  AND NOT EXISTS (
    SELECT 1 FROM suppression_requests sr
    WHERE sr.entity_type = 'unite_legale'
      AND sr.entity_id = lu.siren
      AND sr.permanent_block = TRUE
      AND sr.status = 'applied'
  );

-- =============================================================================
-- Données initiales : registre des sources
-- =============================================================================
INSERT INTO source_registry (id, name, producer, license, base_url, documentation_url, last_verified_at, notes) VALUES
('sirene_stock', 'Base Sirene — Fichiers stock', 'INSEE', 'Licence Ouverte 2.0 (Etalab)',
 'https://www.data.gouv.fr', 
 'https://portail-api.insee.fr/catalog/api/2ba0e549-5587-3ef1-9082-99cd865de66f/doc',
 '2026-09-19T00:00:00Z',
 'Fichiers mensuels : stockUniteLegale, stockEtablissement, stockDoublons, stockLienSuccession. Format CSV (arrêt prévu S2 2027) et Parquet (prioritaire). URL stables via data.gouv.fr.'),
('sirene_api', 'API Sirene — INSEE', 'INSEE', 'Licence Ouverte 2.0 (Etalab)',
 'https://portail-api.insee.fr',
 'https://portail-api.insee.fr/catalog/api/2ba0e549-5587-3ef1-9082-99cd865de66f/doc',
 '2026-09-19T00:00:00Z',
 'Accès après inscription et souscription. Quotas à vérifier dans le portail. Utilisation : synchronisation incrémentale uniquement.'),
('recherche_entreprises', 'API Recherche d''entreprises', 'DINUM / Annuaire des Entreprises', 'À vérifier',
 'https://recherche-entreprises.api.gouv.fr',
 'https://recherche-entreprises.api.gouv.fr/docs/',
 '2026-09-19T00:00:00Z',
 'Accès public, 7 req/s par IP. Recherche uniquement, pas d''aspiration exhaustive. Entités non-diffusibles exclues.'),
('geo_api', 'API Découpage Administratif', 'Etalab / DINUM', 'Licence Ouverte 2.0 (Etalab)',
 'https://geo.api.gouv.fr',
 'https://geo.api.gouv.fr/decoupage-administratif',
 '2026-09-19T00:00:00Z',
 'Communes, EPCI, départements, régions. Accès public sans authentification.'),
('inpi_rne', 'INPI — Registre National des Entreprises', 'INPI', 'À vérifier',
 'https://data.inpi.fr',
 'https://data.inpi.fr/content/editorial/Acces_API_Entreprises',
 '2026-09-19T00:00:00Z',
 'NON CONNECTÉ — compte INPI requis. Enrichissement optionnel (dirigeants, comptes annuels, actes).');
