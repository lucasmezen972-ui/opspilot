-- Index de performance (Lot 3.6 — scalabilité)
-- Cible les colonnes des requêtes chaudes (cockpit manager, rapports,
-- supervision formation). Idempotent (IF NOT EXISTS).

-- Actions correctives : aucun index jusqu'ici, colonnes très filtrées
-- (cockpit « actions critiques », rapports, plans d'action ouverts).
CREATE INDEX IF NOT EXISTS idx_corrective_actions_org
  ON corrective_actions(organization_id);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_status
  ON corrective_actions(status);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_priority
  ON corrective_actions(priority);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_audit
  ON corrective_actions(audit_id);
CREATE INDEX IF NOT EXISTS idx_corrective_actions_due
  ON corrective_actions(due_date);

-- Audits : filtres cockpit (retards) et rapports (évolution, multi-sites).
CREATE INDEX IF NOT EXISTS idx_audits_org_status
  ON audits(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_audits_due ON audits(due_date);
CREATE INDEX IF NOT EXISTS idx_audits_completed ON audits(completed_at);
CREATE INDEX IF NOT EXISTS idx_audits_store ON audits(store_id);
CREATE INDEX IF NOT EXISTS idx_audits_template ON audits(template_id);

-- Tâches : retards (cockpit, supervision).
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);

-- Progression formation : supervision et recherche du couple (user, training).
CREATE INDEX IF NOT EXISTS idx_utp_user_training
  ON user_training_progress(user_id, training_id);
CREATE INDEX IF NOT EXISTS idx_utp_status
  ON user_training_progress(status);

-- Certificats : récupération par utilisateur (écran formation).
CREATE INDEX IF NOT EXISTS idx_training_certificates_user
  ON training_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_training_certificates_training
  ON training_certificates(training_id);
