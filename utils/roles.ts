/**
 * Rôles disposant des fonctions d'encadrement (supervision, modération,
 * gestion d'équipe). Source de vérité unique pour les gardes d'UI manager.
 */
export function isManagerRole(role?: string | null): boolean {
  return role === 'manager' || role === 'admin' || role === 'superadmin';
}
