-- Preuve photo durable des clôtures d'actions correctives.
--
-- Jusqu'ici la clôture contrôlée ne stockait qu'un booléen
-- (resolution_photo_confirmed). On persiste désormais la VRAIE preuve : URI
-- locale en démo, ou chemin du bucket privé « evidence » en production.
-- La table est déjà protégée par RLS (politiques org_*), aucune policy à ajouter.

ALTER TABLE corrective_actions
  ADD COLUMN IF NOT EXISTS resolution_photo_url text;

COMMENT ON COLUMN corrective_actions.resolution_photo_url IS
  'Preuve photo de clôture : chemin de stockage « evidence » (prod) ou URI locale (démo).';
