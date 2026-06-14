/**
 * Matrice de permissions par rôle (source de vérité côté client).
 *
 * Couche d'autorisation de l'interface : masque les actions qu'un rôle n'a pas
 * le droit d'effectuer. L'enforcement réel reste la RLS Supabase côté serveur —
 * cette matrice ne la remplace pas, elle l'accompagne pour l'expérience.
 */

export type AppPermission =
  | 'audit.create'
  | 'audit.export'
  | 'audit.delete'
  | 'action.create'
  | 'action.validate'
  | 'task.assign'
  | 'task.validate'
  | 'training.supervise'
  | 'channel.moderate'
  | 'team.manage'
  | 'reports.view'
  | 'reports.export'
  | 'settings.manage'
  | 'backoffice.access'
  | 'billing.manage';

const FIELD_PERMISSIONS: AppPermission[] = [
  'audit.create',
  'action.create',
  'task.validate',
];

const SUPERVISOR_PERMISSIONS: AppPermission[] = [
  ...FIELD_PERMISSIONS,
  'task.assign',
  'training.supervise',
  'reports.view',
];

const MANAGER_PERMISSIONS: AppPermission[] = [
  ...SUPERVISOR_PERMISSIONS,
  'audit.export',
  'action.validate',
  'channel.moderate',
  'team.manage',
  'reports.export',
];

const ADMIN_PERMISSIONS: AppPermission[] = [
  ...MANAGER_PERMISSIONS,
  'audit.delete',
  'settings.manage',
  'backoffice.access',
  'billing.manage',
];

const ALL_PERMISSIONS: AppPermission[] = [...ADMIN_PERMISSIONS];

/**
 * Permissions par rôle. Les rôles inconnus n'ont aucune permission (défaut sûr).
 * Couvre les rôles applicatifs courants et les rôles enterprise étendus.
 */
export const ROLE_PERMISSIONS: Record<string, AppPermission[]> = {
  superadmin: ALL_PERMISSIONS,
  owner: ADMIN_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
  // Support : lecture du back-office et des rapports, sans action métier.
  support: ['backoffice.access', 'reports.view'],
  manager: MANAGER_PERMISSIONS,
  superviseur: SUPERVISOR_PERMISSIONS,
  employé: FIELD_PERMISSIONS,
  employee: FIELD_PERMISSIONS,
  stagiaire: [],
};

/** Indique si un rôle dispose d'une permission donnée. */
export function can(
  role: string | null | undefined,
  permission: AppPermission,
): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Liste (immuable) des permissions d'un rôle, vide si inconnu. */
export function permissionsForRole(
  role: string | null | undefined,
): AppPermission[] {
  if (!role) return [];
  return [...(ROLE_PERMISSIONS[role] ?? [])];
}
