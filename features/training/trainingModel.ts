/** Vue d'un cours prête pour l'affichage (cours + progression résolue). */
export interface TrainingCourseView {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  ai_generated?: boolean;
  duration_minutes: number;
  chapterCount: number;
  difficulty: string;
  progress: number;
  status: string;
}

export function getTrainingStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return '#10B981';
    case 'in_progress':
      return '#F59E0B';
    default:
      return '#6B7280';
  }
}

export function getTrainingStatusText(status: string): string {
  switch (status) {
    case 'completed':
      return 'Terminé';
    case 'in_progress':
      return 'En cours';
    case 'not_started':
      return 'Pas commencé';
    default:
      return 'Inconnu';
  }
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'beginner':
      return '#10B981';
    case 'intermediate':
      return '#F59E0B';
    case 'advanced':
      return '#EF4444';
    default:
      return '#6B7280';
  }
}

export function getDifficultyText(difficulty: string): string {
  switch (difficulty) {
    case 'beginner':
      return 'Débutant';
    case 'intermediate':
      return 'Intermédiaire';
    case 'advanced':
      return 'Avancé';
    default:
      return 'Inconnu';
  }
}

/** Libellé du bouton d'action selon l'avancement du cours. */
export function getCourseActionLabel(status: string): string {
  if (status === 'not_started') return 'Commencer';
  if (status === 'in_progress') return 'Continuer';
  return 'Revoir';
}

/** Temps d'étude cumulé (minutes) des cours terminés. */
export function computeStudyTime(
  courses: { status: string; duration_minutes?: number | null }[],
): number {
  return courses
    .filter((c) => c.status === 'completed')
    .reduce((total, c) => total + (c.duration_minutes ?? 0), 0);
}

/** Score moyen (arrondi) des cours terminés, 0 si aucun. */
export function computeAverageScore(
  completed: { score?: number | null }[],
): number {
  if (completed.length === 0) return 0;
  const sum = completed.reduce((acc, p) => acc + (p.score ?? 0), 0);
  return Math.round(sum / completed.length);
}
