-- Migration: 002_procedures_collectives_and_realtime
-- Date: 2026-09-19
-- Objet: Support des procédures collectives (BODACC / RNE / Redressement / Liquidation) et horodatage temps réel

-- 1. Ajout des colonnes de procédure collective sur legal_units
ALTER TABLE legal_units
  ADD COLUMN IF NOT EXISTS est_en_procedure_collective BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS nature_procedure_collective VARCHAR(100),
  ADD COLUMN IF NOT EXISTS date_procedure_collective DATE,
  ADD COLUMN IF NOT EXISTS tribunal_procedure_collective TEXT,
  ADD COLUMN IF NOT EXISTS details_procedure_collective TEXT,
  ADD COLUMN IF NOT EXISTS derniere_verification_temps_reel TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_lu_procedure_collective 
  ON legal_units(est_en_procedure_collective) 
  WHERE est_en_procedure_collective = TRUE;

-- 2. Table dédiée aux annonces et jugements de procédures collectives (BODACC)
CREATE TABLE IF NOT EXISTS collective_procedures (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siren           VARCHAR(9) NOT NULL,
  type_jugement   VARCHAR(100) NOT NULL,
  -- ex: Ouverture de redressement judiciaire, Liquidation judiciaire, Clôture pour insuffisance d'actif, etc.
  nature_decision VARCHAR(50) NOT NULL,
  -- redressement, liquidation, sauvegarde, cloture
  date_jugement   DATE,
  date_publication DATE,
  tribunal        TEXT,
  numero_annonce  VARCHAR(100),
  parution_bodacc VARCHAR(100),
  description     TEXT,
  source          VARCHAR(100) NOT NULL DEFAULT 'bodacc',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cp_siren ON collective_procedures(siren);
CREATE INDEX IF NOT EXISTS idx_cp_nature ON collective_procedures(nature_decision);
CREATE INDEX IF NOT EXISTS idx_cp_date_jugement ON collective_procedures(date_jugement DESC);

-- 3. Table de journalisation des tâches d'automatisation (Cron / Sync continue)
CREATE TABLE IF NOT EXISTS cron_job_logs (
  id              SERIAL PRIMARY KEY,
  job_name        VARCHAR(100) NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'running',
  -- running, success, failed
  records_processed INTEGER NOT NULL DEFAULT 0,
  records_updated   INTEGER NOT NULL DEFAULT 0,
  details         JSONB,
  error_message   TEXT,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cron_logs_job_status ON cron_job_logs(job_name, started_at DESC);

-- 4. Rafraîchissement de la vue legal_units_publishable pour inclure les nouvelles colonnes
CREATE OR REPLACE VIEW legal_units_publishable AS
SELECT
  lu.*,
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
