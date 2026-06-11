-- Audits professionnels : modèles structurés, réponses typées et modèles
-- par défaut copiés automatiquement dans chaque nouvelle organisation.
-- Cette migration est volontairement idempotente : migrate.yml rejoue tous
-- les fichiers 2026 à chaque changement du dossier.

ALTER TABLE public.audit_templates
  ADD COLUMN IF NOT EXISTS icon text,
  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS audit_templates_organization_name_key
  ON public.audit_templates (organization_id, name);

CREATE TABLE IF NOT EXISTS public.audit_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.audit_templates(id) ON DELETE CASCADE,
  section text NOT NULL DEFAULT 'General',
  question text NOT NULL,
  item_type text NOT NULL DEFAULT 'yes_no'
    CHECK (item_type IN ('yes_no', 'score_1_5', 'text', 'photo')),
  is_required boolean NOT NULL DEFAULT false,
  points integer NOT NULL DEFAULT 10 CHECK (points >= 0),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS audit_template_items_template_order_key
  ON public.audit_template_items (template_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_audit_template_items_template
  ON public.audit_template_items (template_id);

-- Conserver les anciens critères créés dans audit_items. Leurs UUID restent
-- identiques afin que d'éventuelles réponses historiques restent valides.
INSERT INTO public.audit_template_items (
  id,
  template_id,
  section,
  question,
  item_type,
  is_required,
  points,
  sort_order,
  created_at
)
SELECT
  item.id,
  item.template_id,
  'General',
  item.question,
  CASE item.item_type
    WHEN 'checkbox' THEN 'yes_no'
    WHEN 'rating' THEN 'score_1_5'
    WHEN 'numeric' THEN 'score_1_5'
    WHEN 'photo' THEN 'photo'
    ELSE 'text'
  END,
  COALESCE(item.is_required, false),
  COALESCE(item.points, 10),
  COALESCE(item.sort_order, 0),
  COALESCE(item.created_at, now())
FROM public.audit_items item
ON CONFLICT (id) DO UPDATE SET
  template_id = EXCLUDED.template_id,
  question = EXCLUDED.question,
  item_type = EXCLUDED.item_type,
  is_required = EXCLUDED.is_required,
  points = EXCLUDED.points,
  sort_order = EXCLUDED.sort_order;

ALTER TABLE public.audit_responses
  ADD COLUMN IF NOT EXISTS value jsonb,
  ADD COLUMN IF NOT EXISTS is_compliant boolean,
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS comment text;

UPDATE public.audit_responses
SET
  value = COALESCE(value, to_jsonb(response_value)),
  photo_url = COALESCE(photo_url, photos[1]),
  comment = COALESCE(comment, notes)
WHERE value IS NULL OR photo_url IS NULL OR comment IS NULL;

ALTER TABLE public.audit_responses
  DROP CONSTRAINT IF EXISTS audit_responses_item_id_fkey;
ALTER TABLE public.audit_responses
  ADD CONSTRAINT audit_responses_item_id_fkey
  FOREIGN KEY (item_id)
  REFERENCES public.audit_template_items(id)
  ON DELETE CASCADE;

ALTER TABLE public.audit_template_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS org_all_audit_template_items
  ON public.audit_template_items;
CREATE POLICY org_all_audit_template_items
  ON public.audit_template_items
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM public.audit_templates template
      JOIN public.v_current_profile profile
        ON profile.organization_id = template.organization_id
      WHERE template.id = audit_template_items.template_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.audit_templates template
      JOIN public.v_current_profile profile
        ON profile.organization_id = template.organization_id
      WHERE template.id = audit_template_items.template_id
    )
  );

-- Quatre modèles métier complets pour l'organisation de démonstration.
INSERT INTO public.audit_templates (
  organization_id,
  name,
  description,
  category,
  icon,
  estimated_duration,
  max_score,
  is_active,
  is_default
)
SELECT
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  seed.name,
  seed.description,
  seed.category,
  seed.icon,
  seed.estimated_duration,
  100,
  true,
  true
FROM (
  VALUES
    (
      'HACCP alimentaire',
      'Controle complet des points critiques de securite alimentaire.',
      'HACCP',
      'shield-check',
      45
    ),
    (
      'Hygiene generale',
      'Controle des pratiques du personnel, des locaux et du nettoyage.',
      'Hygiene',
      'sparkles',
      35
    ),
    (
      'Securite incendie',
      'Verification des moyens de secours et des consignes incendie.',
      'Securite',
      'flame',
      30
    ),
    (
      'DLC & qualite',
      'Controle des dates, de la rotation des stocks et de la qualite.',
      'Qualite',
      'package-check',
      30
    )
) AS seed(name, description, category, icon, estimated_duration)
WHERE EXISTS (
  SELECT 1
  FROM public.organizations
  WHERE id = '550e8400-e29b-41d4-a716-446655440000'::uuid
)
ON CONFLICT (organization_id, name) DO UPDATE SET
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  estimated_duration = EXCLUDED.estimated_duration,
  max_score = EXCLUDED.max_score,
  is_active = true,
  is_default = true,
  updated_at = now();

WITH item_seed(template_name, section, question, item_type, is_required, points, sort_order) AS (
  VALUES
    ('HACCP alimentaire', 'Reception', 'La temperature des produits frais est-elle conforme a la reception ?', 'yes_no', true, 10, 1),
    ('HACCP alimentaire', 'Reception', 'Les emballages recus sont-ils intacts et propres ?', 'yes_no', true, 6, 2),
    ('HACCP alimentaire', 'Reception', 'La tracabilite fournisseur et les numeros de lot sont-ils disponibles ?', 'yes_no', true, 8, 3),
    ('HACCP alimentaire', 'Reception', 'Evaluer la proprete de la zone de reception.', 'score_1_5', true, 5, 4),
    ('HACCP alimentaire', 'Reception', 'Photographier le relevé de temperature de reception.', 'photo', true, 4, 5),
    ('HACCP alimentaire', 'Stockage', 'Les produits sont-ils stockes aux temperatures requises ?', 'yes_no', true, 10, 6),
    ('HACCP alimentaire', 'Stockage', 'La separation cru, cuit et allergenes est-elle respectee ?', 'yes_no', true, 8, 7),
    ('HACCP alimentaire', 'Stockage', 'La rotation FEFO est-elle appliquee ?', 'yes_no', true, 7, 8),
    ('HACCP alimentaire', 'Stockage', 'Evaluer la proprete des chambres froides.', 'score_1_5', true, 5, 9),
    ('HACCP alimentaire', 'Stockage', 'Noter toute anomalie de stockage observee.', 'text', false, 3, 10),
    ('HACCP alimentaire', 'Preparation', 'Le lavage des mains est-il respecte avant manipulation ?', 'yes_no', true, 8, 11),
    ('HACCP alimentaire', 'Preparation', 'Les plans de travail sont-ils nettoyes et desinfectes ?', 'yes_no', true, 8, 12),
    ('HACCP alimentaire', 'Preparation', 'Les temperatures de cuisson ou remise en temperature sont-elles tracees ?', 'yes_no', true, 10, 13),
    ('HACCP alimentaire', 'Preparation', 'Evaluer la maitrise des contaminations croisees.', 'score_1_5', true, 5, 14),
    ('HACCP alimentaire', 'Preparation', 'Commentaire final HACCP.', 'text', false, 3, 15),

    ('Hygiene generale', 'Personnel', 'Les tenues de travail sont-elles propres et adaptees ?', 'yes_no', true, 10, 1),
    ('Hygiene generale', 'Personnel', 'Le protocole de lavage des mains est-il affiche et respecte ?', 'yes_no', true, 10, 2),
    ('Hygiene generale', 'Personnel', 'Les equipements de protection requis sont-ils portes ?', 'yes_no', true, 8, 3),
    ('Hygiene generale', 'Personnel', 'Evaluer les pratiques hygieniques du personnel.', 'score_1_5', true, 8, 4),
    ('Hygiene generale', 'Locaux', 'Les sols, murs et plafonds sont-ils propres et en bon etat ?', 'yes_no', true, 10, 5),
    ('Hygiene generale', 'Locaux', 'Les sanitaires sont-ils propres et approvisionnes ?', 'yes_no', true, 8, 6),
    ('Hygiene generale', 'Locaux', 'Les poubelles sont-elles fermees, propres et evacuees ?', 'yes_no', true, 8, 7),
    ('Hygiene generale', 'Locaux', 'Aucun indice de nuisible n est-il visible ?', 'yes_no', true, 10, 8),
    ('Hygiene generale', 'Locaux', 'Photographier la zone controlee.', 'photo', true, 6, 9),
    ('Hygiene generale', 'Nettoyage', 'Le plan de nettoyage est-il a jour et signe ?', 'yes_no', true, 8, 10),
    ('Hygiene generale', 'Nettoyage', 'Les produits de nettoyage sont-ils identifies et stockes a part ?', 'yes_no', true, 8, 11),
    ('Hygiene generale', 'Nettoyage', 'Observations sur le nettoyage.', 'text', false, 6, 12),

    ('Securite incendie', 'Evacuation', 'Les issues de secours sont-elles degagees ?', 'yes_no', true, 14, 1),
    ('Securite incendie', 'Evacuation', 'La signaletique d evacuation est-elle visible ?', 'yes_no', true, 10, 2),
    ('Securite incendie', 'Evacuation', 'Les plans d evacuation sont-ils affiches et a jour ?', 'yes_no', true, 10, 3),
    ('Securite incendie', 'Evacuation', 'Evaluer l accessibilite des cheminements.', 'score_1_5', true, 8, 4),
    ('Securite incendie', 'Moyens de secours', 'Les extincteurs sont-ils accessibles et controles ?', 'yes_no', true, 14, 5),
    ('Securite incendie', 'Moyens de secours', 'Les alarmes et declencheurs manuels sont-ils accessibles ?', 'yes_no', true, 12, 6),
    ('Securite incendie', 'Moyens de secours', 'L eclairage de securite semble-t-il operationnel ?', 'yes_no', true, 10, 7),
    ('Securite incendie', 'Moyens de secours', 'Photographier un equipement de secours controle.', 'photo', true, 6, 8),
    ('Securite incendie', 'Organisation', 'Le registre de securite est-il a jour ?', 'yes_no', true, 10, 9),
    ('Securite incendie', 'Organisation', 'Observations de securite.', 'text', false, 6, 10),

    ('DLC & qualite', 'Dates', 'Aucun produit a DLC depassee n est-il present ?', 'yes_no', true, 16, 1),
    ('DLC & qualite', 'Dates', 'Les produits a DLC courte sont-ils identifies ?', 'yes_no', true, 12, 2),
    ('DLC & qualite', 'Dates', 'La rotation FEFO est-elle respectee en rayon ?', 'yes_no', true, 12, 3),
    ('DLC & qualite', 'Dates', 'Evaluer la fiabilite du balisage des dates.', 'score_1_5', true, 8, 4),
    ('DLC & qualite', 'Qualite', 'Les emballages et opercules sont-ils intacts ?', 'yes_no', true, 10, 5),
    ('DLC & qualite', 'Qualite', 'L aspect, l odeur et la texture des produits sont-ils conformes ?', 'yes_no', true, 12, 6),
    ('DLC & qualite', 'Qualite', 'Les temperatures d exposition sont-elles conformes ?', 'yes_no', true, 12, 7),
    ('DLC & qualite', 'Qualite', 'Photographier la zone DLC controlee.', 'photo', true, 6, 8),
    ('DLC & qualite', 'Traçabilite', 'Les retraits et destructions sont-ils traces ?', 'yes_no', true, 8, 9),
    ('DLC & qualite', 'Traçabilite', 'Produits ou lots a surveiller.', 'text', false, 4, 10)
)
INSERT INTO public.audit_template_items (
  template_id,
  section,
  question,
  item_type,
  is_required,
  points,
  sort_order
)
SELECT
  template.id,
  item.section,
  item.question,
  item.item_type,
  item.is_required,
  item.points,
  item.sort_order
FROM item_seed item
JOIN public.audit_templates template
  ON template.organization_id = '550e8400-e29b-41d4-a716-446655440000'::uuid
  AND template.name = item.template_name
ON CONFLICT (template_id, sort_order) DO UPDATE SET
  section = EXCLUDED.section,
  question = EXCLUDED.question,
  item_type = EXCLUDED.item_type,
  is_required = EXCLUDED.is_required,
  points = EXCLUDED.points;

CREATE OR REPLACE FUNCTION public.copy_default_audit_templates(
  target_organization_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  source_template public.audit_templates%ROWTYPE;
  target_template_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.organizations WHERE id = target_organization_id
  ) THEN
    RAISE EXCEPTION 'Organisation introuvable';
  END IF;

  FOR source_template IN
    SELECT *
    FROM public.audit_templates
    WHERE is_default = true
      AND organization_id <> target_organization_id
    ORDER BY name
  LOOP
    SELECT id
    INTO target_template_id
    FROM public.audit_templates
    WHERE organization_id = target_organization_id
      AND name = source_template.name;

    IF target_template_id IS NULL THEN
      INSERT INTO public.audit_templates (
        organization_id,
        name,
        description,
        category,
        icon,
        estimated_duration,
        max_score,
        is_active,
        is_default
      )
      VALUES (
        target_organization_id,
        source_template.name,
        source_template.description,
        source_template.category,
        source_template.icon,
        source_template.estimated_duration,
        source_template.max_score,
        true,
        false
      )
      RETURNING id INTO target_template_id;
    END IF;

    INSERT INTO public.audit_template_items (
      template_id,
      section,
      question,
      item_type,
      is_required,
      points,
      sort_order
    )
    SELECT
      target_template_id,
      item.section,
      item.question,
      item.item_type,
      item.is_required,
      item.points,
      item.sort_order
    FROM public.audit_template_items item
    WHERE item.template_id = source_template.id
    ON CONFLICT (template_id, sort_order) DO UPDATE SET
      section = EXCLUDED.section,
      question = EXCLUDED.question,
      item_type = EXCLUDED.item_type,
      is_required = EXCLUDED.is_required,
      points = EXCLUDED.points;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.copy_default_audit_templates_on_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.copy_default_audit_templates(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS copy_default_audit_templates_after_organization_insert
  ON public.organizations;
CREATE TRIGGER copy_default_audit_templates_after_organization_insert
AFTER INSERT ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.copy_default_audit_templates_on_organization();

REVOKE ALL ON FUNCTION public.copy_default_audit_templates(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.copy_default_audit_templates_on_organization()
  FROM PUBLIC;
