/*
  Tâches récurrentes (Lot 1). Ajoute une colonne `recurrence` aux tâches :
  à la clôture d'une tâche récurrente, l'application crée automatiquement la
  prochaine occurrence (échéance décalée selon la fréquence).

  Migration additive et idempotente :
   - ADD COLUMN IF NOT EXISTS → rejouable sans effet de bord ;
   - DEFAULT 'none' + NOT NULL → les tâches existantes deviennent
     non récurrentes, sans rupture de lecture côté application ;
   - CHECK contraint les valeurs autorisées (ajouté seulement s'il manque).
*/

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS recurrence text NOT NULL DEFAULT 'none';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_recurrence_check'
  ) THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT tasks_recurrence_check
      CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly'));
  END IF;
END $$;
