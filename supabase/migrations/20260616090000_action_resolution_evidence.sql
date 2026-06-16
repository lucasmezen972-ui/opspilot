-- Preuves de clôture contrôlée des actions correctives.
--
-- En complément de `resolved_at` (déjà présent), on persiste désormais QUI a
-- résolu l'action, avec QUELLES preuves et QUELLE validation. Ces données
-- rendent la clôture traçable et exploitable en SaaS (audit, conformité).
--
-- Sécurité : la table corrective_actions est déjà protégée par RLS et les
-- politiques `org_*` filtrent SELECT/INSERT/UPDATE/DELETE par organisation
-- (organization_id = current org). Ces nouvelles colonnes sont donc couvertes
-- sans politique supplémentaire — aucune fuite inter-organisations possible.

ALTER TABLE corrective_actions
  ADD COLUMN IF NOT EXISTS resolution_comment text,
  ADD COLUMN IF NOT EXISTS resolved_by_name text,
  ADD COLUMN IF NOT EXISTS resolved_by_matricule text,
  ADD COLUMN IF NOT EXISTS resolution_photo_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS manager_validated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resolver_role text;

COMMENT ON COLUMN corrective_actions.resolution_comment IS
  'Commentaire de clôture (preuve d''exécution).';
COMMENT ON COLUMN corrective_actions.resolved_by_name IS
  'Nom de l''exécutant ayant résolu l''action.';
COMMENT ON COLUMN corrective_actions.resolved_by_matricule IS
  'Matricule / identifiant interne de l''exécutant.';
COMMENT ON COLUMN corrective_actions.resolution_photo_confirmed IS
  'Preuve photo jointe lors de la clôture.';
COMMENT ON COLUMN corrective_actions.manager_validated IS
  'Validation manager obtenue lors de la clôture contrôlée.';
COMMENT ON COLUMN corrective_actions.resolved_by IS
  'Profil ayant enregistré la clôture (auteur de résolution).';
COMMENT ON COLUMN corrective_actions.resolver_role IS
  'Rôle de l''auteur de résolution au moment de la clôture.';
