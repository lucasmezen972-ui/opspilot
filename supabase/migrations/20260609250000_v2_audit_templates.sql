-- V2 Lot 3 : bibliothèque de modèles d'audit + colonne alert_threshold_days sur products
-- Ces modèles sont partagés par toutes les organisations (organization_id IS NULL).

-- ─── audit_templates ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_templates (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,  -- NULL = modèle global
  name            text NOT NULL,
  category        text NOT NULL,  -- 'haccp' | 'hygiene' | 'securite' | 'qualite' | 'custom'
  description     text,
  icon            text,           -- emoji ou nom d'icône
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── audit_template_items ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_template_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES audit_templates(id) ON DELETE CASCADE,
  section     text NOT NULL DEFAULT 'Général',
  question    text NOT NULL,
  item_type   text NOT NULL DEFAULT 'checkbox',  -- 'checkbox' | 'rating' | 'text' | 'photo' | 'numeric'
  is_required boolean NOT NULL DEFAULT true,
  points      int  NOT NULL DEFAULT 1,
  sort_order  int  NOT NULL DEFAULT 0
);

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE audit_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_template_items ENABLE ROW LEVEL SECURITY;

-- Tout utilisateur authentifié peut lire les modèles globaux + ceux de son org
CREATE POLICY "audit_templates_read" ON audit_templates
  FOR SELECT TO authenticated
  USING (
    organization_id IS NULL
    OR organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

-- Seuls admin/manager peuvent créer/modifier des modèles d'organisation
CREATE POLICY "audit_templates_write" ON audit_templates
  FOR ALL TO authenticated
  USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "audit_template_items_read" ON audit_template_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM audit_templates t WHERE t.id = template_id
      AND (
        t.organization_id IS NULL
        OR t.organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
      )
    )
  );

CREATE POLICY "audit_template_items_write" ON audit_template_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM audit_templates t WHERE t.id = template_id
      AND t.organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
      AND (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
    )
  );

-- ─── Données : modèles globaux ────────────────────────────────────────────────
-- HACCP alimentaire
WITH tmpl AS (
  INSERT INTO audit_templates (organization_id, name, category, description, icon)
  VALUES (NULL, 'HACCP alimentaire', 'haccp', 'Contrôle des points critiques de sécurité alimentaire', '🧫')
  RETURNING id
)
INSERT INTO audit_template_items (template_id, section, question, item_type, is_required, points, sort_order)
SELECT tmpl.id, items.section, items.question, items.item_type, true, items.points, items.sort_order
FROM tmpl, (VALUES
  ('Températures', 'Température chambre froide positive (0–4 °C)', 'numeric', 3, 1),
  ('Températures', 'Température chambre froide négative (< −18 °C)', 'numeric', 3, 2),
  ('Températures', 'Température vitrine réfrigérée (≤ 4 °C)', 'numeric', 3, 3),
  ('Réception', 'Bon de livraison présent et conforme', 'checkbox', 2, 4),
  ('Réception', 'Températures des produits réceptionnés conformes', 'checkbox', 3, 5),
  ('Réception', 'Pas de produits endommagés ou périmés réceptionnés', 'checkbox', 2, 6),
  ('Stockage', 'Séparation produits crus / cuits respectée', 'checkbox', 3, 7),
  ('Stockage', 'DLC visibles et lisibles sur tous les produits', 'checkbox', 3, 8),
  ('Stockage', 'Rotation des stocks (FIFO) appliquée', 'checkbox', 2, 9),
  ('Nettoyage', 'Plan de nettoyage à jour et affiché', 'checkbox', 2, 10),
  ('Nettoyage', 'Surfaces alimentaires propres et désinfectées', 'checkbox', 3, 11),
  ('Nettoyage', 'Matériel de nettoyage stocké séparément des aliments', 'checkbox', 2, 12),
  ('Personnel', 'Personnel avec tenue réglementaire (charlotte, tablier)', 'checkbox', 2, 13),
  ('Personnel', 'Lavage des mains respecté aux points clés', 'checkbox', 3, 14),
  ('Personnel', 'Formations HACCP à jour', 'checkbox', 2, 15)
) AS items(section, question, item_type, points, sort_order);

-- Hygiène générale
WITH tmpl AS (
  INSERT INTO audit_templates (organization_id, name, category, description, icon)
  VALUES (NULL, 'Hygiène générale', 'hygiene', 'Vérification de l''hygiène des locaux et du personnel', '🧹')
  RETURNING id
)
INSERT INTO audit_template_items (template_id, section, question, item_type, is_required, points, sort_order)
SELECT tmpl.id, items.section, items.question, items.item_type, true, items.points, items.sort_order
FROM tmpl, (VALUES
  ('Locaux', 'Sol propre, sans déchets visibles', 'checkbox', 2, 1),
  ('Locaux', 'Murs et plafonds sans traces de moisissures', 'checkbox', 2, 2),
  ('Locaux', 'Sanitaires propres et approvisionnés (savon, essuie-mains)', 'checkbox', 2, 3),
  ('Locaux', 'Poubelles couvertes et vidées', 'checkbox', 2, 4),
  ('Matériel', 'Matériel de découpe propre et désinfecté', 'checkbox', 3, 5),
  ('Matériel', 'Planches à découper en bon état (pas de coupures profondes)', 'checkbox', 2, 6),
  ('Matériel', 'Équipements de cuisson propres (four, friteuse…)', 'checkbox', 2, 7),
  ('Personnel', 'Ongles courts et propres', 'checkbox', 1, 8),
  ('Personnel', 'Pas de bijoux aux mains / poignets', 'checkbox', 1, 9),
  ('Personnel', 'Tenue propre et complète', 'checkbox', 2, 10),
  ('Nuisibles', 'Aucune trace de rongeurs ou insectes', 'checkbox', 3, 11),
  ('Nuisibles', 'Pièges ou répulsifs en place et vérifiés', 'checkbox', 2, 12)
) AS items(section, question, item_type, points, sort_order);

-- Sécurité incendie
WITH tmpl AS (
  INSERT INTO audit_templates (organization_id, name, category, description, icon)
  VALUES (NULL, 'Sécurité incendie', 'securite', 'Contrôle des équipements et procédures de sécurité incendie', '🔥')
  RETURNING id
)
INSERT INTO audit_template_items (template_id, section, question, item_type, is_required, points, sort_order)
SELECT tmpl.id, items.section, items.question, items.item_type, true, items.points, items.sort_order
FROM tmpl, (VALUES
  ('Extincteurs', 'Extincteurs présents aux emplacements réglementaires', 'checkbox', 3, 1),
  ('Extincteurs', 'Extincteurs chargés (pastille verte)', 'checkbox', 3, 2),
  ('Extincteurs', 'Date de la dernière vérification < 1 an', 'checkbox', 3, 3),
  ('Évacuation', 'Issues de secours dégagées et signalisées', 'checkbox', 3, 4),
  ('Évacuation', 'Plan d''évacuation affiché et lisible', 'checkbox', 2, 5),
  ('Évacuation', 'Dernier exercice d''évacuation < 12 mois', 'checkbox', 2, 6),
  ('Détection', 'Détecteurs de fumée fonctionnels (test effectué)', 'checkbox', 3, 7),
  ('Détection', 'Alarme incendie testée dans les 6 derniers mois', 'checkbox', 3, 8),
  ('Électrique', 'Tableaux électriques accessibles et non encombrés', 'checkbox', 2, 9),
  ('Électrique', 'Pas de multiprises surchargées visibles', 'checkbox', 2, 10)
) AS items(section, question, item_type, points, sort_order);

-- Contrôle qualité produits / DLC
WITH tmpl AS (
  INSERT INTO audit_templates (organization_id, name, category, description, icon)
  VALUES (NULL, 'Contrôle DLC & qualité', 'qualite', 'Vérification des dates limites et de la qualité des produits en rayon', '📦')
  RETURNING id
)
INSERT INTO audit_template_items (template_id, section, question, item_type, is_required, points, sort_order)
SELECT tmpl.id, items.section, items.question, items.item_type, true, items.points, items.sort_order
FROM tmpl, (VALUES
  ('DLC', 'Aucun produit dont la DLC est dépassée en rayon', 'checkbox', 3, 1),
  ('DLC', 'Produits à DLC < 3 jours regroupés en zone promo', 'checkbox', 2, 2),
  ('DLC', 'Contrôle DLC effectué en rayon frais', 'checkbox', 3, 3),
  ('DLC', 'Contrôle DLC effectué en rayon sec', 'checkbox', 2, 4),
  ('Étiquetage', 'Étiquettes prix présentes et lisibles', 'checkbox', 2, 5),
  ('Étiquetage', 'Étiquettes allergènes affichées (boulangerie/traiteur)', 'checkbox', 3, 6),
  ('Présentation', 'Rayons complets (pas de trous > 2 facing)', 'checkbox', 2, 7),
  ('Présentation', 'Produits propres, sans emballages abîmés', 'checkbox', 2, 8),
  ('Présentation', 'Ordre de rotation FIFO respecté', 'checkbox', 2, 9),
  ('Température', 'Température rayon frais ≤ 4 °C', 'numeric', 3, 10)
) AS items(section, question, item_type, points, sort_order);
