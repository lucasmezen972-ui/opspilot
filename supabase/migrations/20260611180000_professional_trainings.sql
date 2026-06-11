-- Formations professionnelles : chapitres, quiz, progression réelle et seeds.
-- Rejouable sur OPS PILOT V2.

ALTER TABLE public.trainings
  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_generated boolean NOT NULL DEFAULT false;

ALTER TABLE public.user_training_progress
  ADD COLUMN IF NOT EXISTS completed_chapter_ids uuid[] NOT NULL DEFAULT '{}';

CREATE UNIQUE INDEX IF NOT EXISTS trainings_organization_title_key
  ON public.trainings (organization_id, title);

CREATE TABLE IF NOT EXISTS public.training_chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid NOT NULL REFERENCES public.trainings(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  sort_order integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (training_id, sort_order)
);

CREATE TABLE IF NOT EXISTS public.training_quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid NOT NULL REFERENCES public.trainings(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_index integer NOT NULL,
  sort_order integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT training_quiz_options_array
    CHECK (jsonb_typeof(options) = 'array' AND jsonb_array_length(options) >= 2),
  CONSTRAINT training_quiz_correct_index
    CHECK (correct_index >= 0 AND correct_index < jsonb_array_length(options)),
  UNIQUE (training_id, sort_order)
);

CREATE INDEX IF NOT EXISTS training_chapters_training_idx
  ON public.training_chapters (training_id, sort_order);
CREATE INDEX IF NOT EXISTS training_quiz_questions_training_idx
  ON public.training_quiz_questions (training_id, sort_order);

ALTER TABLE public.training_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS training_chapters_select_org
  ON public.training_chapters;
CREATE POLICY training_chapters_select_org
ON public.training_chapters
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.trainings training
    JOIN public.profiles profile
      ON profile.organization_id = training.organization_id
    WHERE training.id = training_chapters.training_id
      AND profile.id = auth.uid()
  )
);

DROP POLICY IF EXISTS training_chapters_manage_org
  ON public.training_chapters;
CREATE POLICY training_chapters_manage_org
ON public.training_chapters
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.trainings training
    JOIN public.profiles profile
      ON profile.organization_id = training.organization_id
    WHERE training.id = training_chapters.training_id
      AND profile.id = auth.uid()
      AND profile.role IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.trainings training
    JOIN public.profiles profile
      ON profile.organization_id = training.organization_id
    WHERE training.id = training_chapters.training_id
      AND profile.id = auth.uid()
      AND profile.role IN ('admin', 'manager')
  )
);

DROP POLICY IF EXISTS training_quiz_questions_select_org
  ON public.training_quiz_questions;
CREATE POLICY training_quiz_questions_select_org
ON public.training_quiz_questions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.trainings training
    JOIN public.profiles profile
      ON profile.organization_id = training.organization_id
    WHERE training.id = training_quiz_questions.training_id
      AND profile.id = auth.uid()
  )
);

DROP POLICY IF EXISTS training_quiz_questions_manage_org
  ON public.training_quiz_questions;
CREATE POLICY training_quiz_questions_manage_org
ON public.training_quiz_questions
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.trainings training
    JOIN public.profiles profile
      ON profile.organization_id = training.organization_id
    WHERE training.id = training_quiz_questions.training_id
      AND profile.id = auth.uid()
      AND profile.role IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.trainings training
    JOIN public.profiles profile
      ON profile.organization_id = training.organization_id
    WHERE training.id = training_quiz_questions.training_id
      AND profile.id = auth.uid()
      AND profile.role IN ('admin', 'manager')
  )
);

DROP POLICY IF EXISTS training_progress_self_select
  ON public.user_training_progress;
CREATE POLICY training_progress_self_select
ON public.user_training_progress
FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS training_progress_self_insert
  ON public.user_training_progress;
CREATE POLICY training_progress_self_insert
ON public.user_training_progress
FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS training_progress_self_update
  ON public.user_training_progress;
CREATE POLICY training_progress_self_update
ON public.user_training_progress
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS training_progress_self_delete
  ON public.user_training_progress;
CREATE POLICY training_progress_self_delete
ON public.user_training_progress
FOR DELETE
USING (user_id = auth.uid());

INSERT INTO public.trainings (
  organization_id,
  title,
  content,
  category,
  difficulty,
  duration_minutes,
  xp_reward,
  is_active,
  is_default
)
VALUES
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'HACCP : hygiène et sécurité alimentaire',
    'Maîtriser les dangers alimentaires, les points critiques et les gestes de prévention.',
    'Hygiène',
    'beginner',
    35,
    60,
    true,
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'DLC et rotation des stocks',
    'Contrôler les dates, appliquer la méthode FIFO et traiter les produits à risque.',
    'Qualité',
    'beginner',
    25,
    45,
    true,
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'Chaîne du froid',
    'Préserver les températures réglementaires de la réception jusqu’à la vente.',
    'Qualité',
    'intermediate',
    30,
    55,
    true,
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'Accueil client et réclamations',
    'Créer un accueil professionnel et transformer une réclamation en solution.',
    'Relation client',
    'intermediate',
    30,
    50,
    true,
    true
  )
ON CONFLICT (organization_id, title) DO UPDATE SET
  content = EXCLUDED.content,
  category = EXCLUDED.category,
  difficulty = EXCLUDED.difficulty,
  duration_minutes = EXCLUDED.duration_minutes,
  xp_reward = EXCLUDED.xp_reward,
  is_active = true,
  is_default = true,
  updated_at = now();

WITH chapter_data(training_title, title, body, sort_order) AS (
  VALUES
    (
      'HACCP : hygiène et sécurité alimentaire',
      'Comprendre la méthode HACCP',
      E'# Objectif\n\nLa méthode HACCP identifie, évalue et maîtrise les dangers significatifs pour la sécurité alimentaire.\n\n- Danger biologique : bactéries, virus, moisissures.\n- Danger chimique : allergènes, produits de nettoyage.\n- Danger physique : verre, métal, plastique.\n\nChaque équipe doit connaître les points critiques de son activité.',
      1
    ),
    (
      'HACCP : hygiène et sécurité alimentaire',
      'Hygiène personnelle',
      E'# Les gestes indispensables\n\nLavez-vous les mains à la prise de poste, après chaque interruption et après toute manipulation contaminante.\n\n- Tenue propre et dédiée.\n- Cheveux attachés et protégés.\n- Plaies couvertes avec un pansement détectable.\n- Bijoux et téléphone exclus des zones de préparation.',
      2
    ),
    (
      'HACCP : hygiène et sécurité alimentaire',
      'Prévenir les contaminations croisées',
      E'# Séparer les flux\n\nUtilisez du matériel distinct pour les produits crus et prêts à consommer. Nettoyez puis désinfectez entre deux usages.\n\nLes allergènes doivent être stockés, identifiés et manipulés selon une procédure dédiée.',
      3
    ),
    (
      'HACCP : hygiène et sécurité alimentaire',
      'Tracer et réagir',
      E'# Traçabilité\n\nConservez les étiquettes, numéros de lot et dates d’ouverture. En cas d’écart : isolez le produit, informez le responsable et consignez l’action corrective.',
      4
    ),
    (
      'DLC et rotation des stocks',
      'DLC, DDM et date d’ouverture',
      E'# Distinguer les dates\n\nLa DLC concerne la sécurité sanitaire et ne doit jamais être dépassée. La DDM concerne surtout la qualité. Une date d’ouverture interne peut être plus courte que la date fabricant.',
      1
    ),
    (
      'DLC et rotation des stocks',
      'Appliquer FIFO et FEFO',
      E'# Organiser le rayon\n\nFIFO fait sortir les produits entrés en premier. FEFO donne la priorité à la date la plus proche.\n\nRangez les produits courts devant et contrôlez physiquement chaque référence.',
      2
    ),
    (
      'DLC et rotation des stocks',
      'Réaliser le contrôle quotidien',
      E'# Routine de contrôle\n\nContrôlez les produits expirés, à J0, J+1 et J+3 selon le rayon. Enregistrez les quantités et appliquez la démarque ou le retrait prévu.',
      3
    ),
    (
      'DLC et rotation des stocks',
      'Traiter une anomalie',
      E'# Produit non conforme\n\nRetirez immédiatement le produit de la vente, placez-le dans la zone identifiée et prévenez le responsable. Ne remettez jamais un produit en rayon sans validation.',
      4
    ),
    (
      'Chaîne du froid',
      'Pourquoi le froid est critique',
      E'# Température et croissance microbienne\n\nLe froid ralentit la multiplication des micro-organismes sans les détruire. Une rupture peut rendre un produit dangereux même après retour à la bonne température.',
      1
    ),
    (
      'Chaîne du froid',
      'Contrôler à la réception',
      E'# Réception des marchandises\n\nMesurez un échantillon représentatif, vérifiez le véhicule, l’intégrité des emballages et la durée de déchargement. Refusez ou isolez toute livraison non conforme.',
      2
    ),
    (
      'Chaîne du froid',
      'Stocker et surveiller',
      E'# Stockage\n\nNe surchargez pas les meubles froids. Laissez circuler l’air et surveillez les relevés automatiques. Les portes doivent rester fermées hors manipulation.',
      3
    ),
    (
      'Chaîne du froid',
      'Gérer une rupture',
      E'# Conduite à tenir\n\nNotez la température, la durée estimée et les produits concernés. Isolez le lot puis demandez une décision au responsable selon la procédure interne.',
      4
    ),
    (
      'Accueil client et réclamations',
      'Les premières secondes',
      E'# Donner confiance\n\nRegardez le client, saluez-le et rendez-vous disponible. Une posture ouverte et une phrase claire évitent l’impression d’abandon.',
      1
    ),
    (
      'Accueil client et réclamations',
      'Écouter activement',
      E'# Comprendre avant de répondre\n\nLaissez le client expliquer la situation, reformulez les faits et vérifiez son attente. Ne minimisez pas le problème et évitez de chercher un responsable.',
      2
    ),
    (
      'Accueil client et réclamations',
      'Proposer une solution',
      E'# Réponse opérationnelle\n\nPrésentez ce que vous pouvez faire, le délai et la prochaine étape. Si une validation est nécessaire, donnez un point de contact précis.',
      3
    ),
    (
      'Accueil client et réclamations',
      'Clore et capitaliser',
      E'# Fin de prise en charge\n\nConfirmez que la solution convient, remerciez le client et tracez la réclamation si elle révèle un problème récurrent.',
      4
    )
)
INSERT INTO public.training_chapters (
  training_id,
  title,
  body,
  sort_order
)
SELECT training.id, chapter.title, chapter.body, chapter.sort_order
FROM chapter_data chapter
JOIN public.trainings training
  ON training.organization_id =
    '550e8400-e29b-41d4-a716-446655440000'::uuid
 AND training.title = chapter.training_title
ON CONFLICT (training_id, sort_order) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  updated_at = now();

WITH quiz_data(
  training_title,
  question,
  options,
  correct_index,
  sort_order
) AS (
  VALUES
    (
      'HACCP : hygiène et sécurité alimentaire',
      'Quel est le rôle principal de la méthode HACCP ?',
      '["Décorer les zones de travail","Maîtriser les dangers alimentaires","Calculer le prix de vente","Planifier les congés"]'::jsonb,
      1,
      1
    ),
    (
      'HACCP : hygiène et sécurité alimentaire',
      'Quand faut-il se laver les mains ?',
      '["Uniquement en début de journée","Après une manipulation contaminante","Seulement avant la pause","Quand un client le demande"]'::jsonb,
      1,
      2
    ),
    (
      'HACCP : hygiène et sécurité alimentaire',
      'Comment limiter une contamination croisée ?',
      '["Utiliser le même couteau","Séparer le matériel cru et cuit","Mélanger les allergènes","Laisser sécher sans nettoyage"]'::jsonb,
      1,
      3
    ),
    (
      'HACCP : hygiène et sécurité alimentaire',
      'Que faire d’un produit potentiellement non conforme ?',
      '["Le vendre rapidement","L’isoler et prévenir le responsable","Changer son étiquette","Le mélanger à un autre lot"]'::jsonb,
      1,
      4
    ),
    (
      'HACCP : hygiène et sécurité alimentaire',
      'Quel élément soutient la traçabilité ?',
      '["Le numéro de lot","La couleur du rayon","Le planning des pauses","La météo"]'::jsonb,
      0,
      5
    ),
    (
      'DLC et rotation des stocks',
      'Une DLC dépassée signifie que le produit doit être…',
      '["Mis en promotion","Retiré de la vente","Déplacé en réserve","Réétiqueté"]'::jsonb,
      1,
      1
    ),
    (
      'DLC et rotation des stocks',
      'Que signifie FEFO ?',
      '["Premier expiré, premier sorti","Premier entré, dernier sorti","Stock le plus cher en premier","Contrôle une fois par mois"]'::jsonb,
      0,
      2
    ),
    (
      'DLC et rotation des stocks',
      'Où placer les produits à date courte ?',
      '["Derrière les autres","Devant les dates plus longues","Dans un carton fermé","Sans règle particulière"]'::jsonb,
      1,
      3
    ),
    (
      'DLC et rotation des stocks',
      'Que faut-il enregistrer lors du contrôle ?',
      '["Seulement le nom du salarié","Les quantités et anomalies","La musique du magasin","Le nombre de clients"]'::jsonb,
      1,
      4
    ),
    (
      'DLC et rotation des stocks',
      'Un produit expiré retrouvé en rayon doit être…',
      '["Retiré et isolé immédiatement","Laissé jusqu’à fermeture","Vendu à moitié prix","Donné sans contrôle"]'::jsonb,
      0,
      5
    ),
    (
      'Chaîne du froid',
      'Le froid détruit-il tous les micro-organismes ?',
      '["Oui","Non, il ralentit surtout leur multiplication","Seulement dans les fruits","Uniquement la nuit"]'::jsonb,
      1,
      1
    ),
    (
      'Chaîne du froid',
      'Quel contrôle est prioritaire à la réception ?',
      '["La température des produits","La couleur du camion","Le nombre de palettes seulement","La tenue du chauffeur"]'::jsonb,
      0,
      2
    ),
    (
      'Chaîne du froid',
      'Pourquoi ne faut-il pas surcharger un meuble froid ?',
      '["Pour faciliter l’étiquetage","Pour laisser circuler l’air","Pour réduire le nombre de produits","Pour augmenter l’éclairage"]'::jsonb,
      1,
      3
    ),
    (
      'Chaîne du froid',
      'En cas de rupture, quelle donnée faut-il noter ?',
      '["La température et la durée estimée","Le prix du produit","La couleur de l’emballage","Le nom de tous les clients"]'::jsonb,
      0,
      4
    ),
    (
      'Chaîne du froid',
      'Qui décide du sort d’un lot isolé ?',
      '["N’importe quel client","Le responsable selon la procédure","Le premier salarié disponible","Le fournisseur sans information"]'::jsonb,
      1,
      5
    ),
    (
      'Accueil client et réclamations',
      'Quelle attitude crée un bon premier contact ?',
      '["Éviter le regard","Saluer et se rendre disponible","Continuer une conversation privée","Pointer la file d’attente"]'::jsonb,
      1,
      1
    ),
    (
      'Accueil client et réclamations',
      'À quoi sert la reformulation ?',
      '["À interrompre le client","À vérifier la compréhension","À transférer automatiquement","À contester les faits"]'::jsonb,
      1,
      2
    ),
    (
      'Accueil client et réclamations',
      'Une bonne solution précise…',
      '["L’action, le délai et la prochaine étape","Uniquement les limites du magasin","Le nom d’un collègue absent","Le règlement sans explication"]'::jsonb,
      0,
      3
    ),
    (
      'Accueil client et réclamations',
      'Comment clore une réclamation ?',
      '["Partir sans vérifier","Confirmer que la solution convient","Demander au client d’oublier","Supprimer toute trace"]'::jsonb,
      1,
      4
    ),
    (
      'Accueil client et réclamations',
      'Pourquoi tracer une réclamation récurrente ?',
      '["Pour identifier une amélioration opérationnelle","Pour ralentir le service","Pour éviter toute réponse","Pour remplacer le ticket de caisse"]'::jsonb,
      0,
      5
    )
)
INSERT INTO public.training_quiz_questions (
  training_id,
  question,
  options,
  correct_index,
  sort_order
)
SELECT
  training.id,
  quiz.question,
  quiz.options,
  quiz.correct_index,
  quiz.sort_order
FROM quiz_data quiz
JOIN public.trainings training
  ON training.organization_id =
    '550e8400-e29b-41d4-a716-446655440000'::uuid
 AND training.title = quiz.training_title
ON CONFLICT (training_id, sort_order) DO UPDATE SET
  question = EXCLUDED.question,
  options = EXCLUDED.options,
  correct_index = EXCLUDED.correct_index,
  updated_at = now();

CREATE OR REPLACE FUNCTION public.copy_default_trainings(
  target_organization_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  source_training public.trainings%ROWTYPE;
  target_training_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.organizations WHERE id = target_organization_id
  ) THEN
    RAISE EXCEPTION 'Organisation introuvable';
  END IF;

  FOR source_training IN
    SELECT *
    FROM public.trainings
    WHERE organization_id =
      '550e8400-e29b-41d4-a716-446655440000'::uuid
      AND is_default = true
      AND organization_id <> target_organization_id
    ORDER BY title
  LOOP
    INSERT INTO public.trainings (
      organization_id,
      title,
      content,
      category,
      difficulty,
      duration_minutes,
      xp_reward,
      is_active,
      is_default,
      ai_generated
    )
    VALUES (
      target_organization_id,
      source_training.title,
      source_training.content,
      source_training.category,
      source_training.difficulty,
      source_training.duration_minutes,
      source_training.xp_reward,
      true,
      false,
      false
    )
    ON CONFLICT (organization_id, title) DO UPDATE SET
      content = EXCLUDED.content,
      category = EXCLUDED.category,
      difficulty = EXCLUDED.difficulty,
      duration_minutes = EXCLUDED.duration_minutes,
      xp_reward = EXCLUDED.xp_reward,
      is_active = true,
      updated_at = now()
    RETURNING id INTO target_training_id;

    INSERT INTO public.training_chapters (
      training_id,
      title,
      body,
      sort_order
    )
    SELECT
      target_training_id,
      chapter.title,
      chapter.body,
      chapter.sort_order
    FROM public.training_chapters chapter
    WHERE chapter.training_id = source_training.id
    ON CONFLICT (training_id, sort_order) DO UPDATE SET
      title = EXCLUDED.title,
      body = EXCLUDED.body,
      updated_at = now();

    INSERT INTO public.training_quiz_questions (
      training_id,
      question,
      options,
      correct_index,
      sort_order
    )
    SELECT
      target_training_id,
      quiz.question,
      quiz.options,
      quiz.correct_index,
      quiz.sort_order
    FROM public.training_quiz_questions quiz
    WHERE quiz.training_id = source_training.id
    ON CONFLICT (training_id, sort_order) DO UPDATE SET
      question = EXCLUDED.question,
      options = EXCLUDED.options,
      correct_index = EXCLUDED.correct_index,
      updated_at = now();
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.copy_default_trainings_on_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.copy_default_trainings(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS copy_default_trainings_after_organization_insert
  ON public.organizations;
CREATE TRIGGER copy_default_trainings_after_organization_insert
AFTER INSERT ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.copy_default_trainings_on_organization();

DO $$
DECLARE
  organization_record record;
BEGIN
  FOR organization_record IN
    SELECT id
    FROM public.organizations
    WHERE id <> '550e8400-e29b-41d4-a716-446655440000'::uuid
  LOOP
    PERFORM public.copy_default_trainings(organization_record.id);
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.copy_default_trainings(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.copy_default_trainings_on_organization()
  FROM PUBLIC;
