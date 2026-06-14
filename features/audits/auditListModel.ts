import {
  CircleCheck as CheckCircle,
  Clock,
  CircleAlert as AlertCircle,
  type LucideIcon,
} from 'lucide-react-native';

import type { Audit } from '../../lib/supabase';

/** Audit projeté pour l'affichage en liste (champs dérivés, dates formatées). */
export interface AuditListItem {
  id: string;
  title: string;
  location: string;
  status: string;
  date: string;
  score: number | null;
  issues: number;
}

/**
 * Construit la liste d'audits affichable : projection des audits bruts puis
 * filtrage par recherche (titre/lieu) et par statut. Logique pure, testée
 * indépendamment de l'UI.
 */
export function toAuditListItems(
  dbAudits: Audit[],
  searchQuery: string,
  statusFilter: string,
): AuditListItem[] {
  const source: AuditListItem[] =
    dbAudits.length > 0
      ? dbAudits.map((a) => ({
          id: a.id,
          title: a.title,
          location: a.location ?? '',
          status: a.status,
          date: a.created_at
            ? new Date(a.created_at).toLocaleDateString('fr-FR')
            : '',
          score: a.score ?? null,
          issues: a.issues_count ?? 0,
        }))
      : [];

  const query = searchQuery.toLowerCase();
  return source.filter((a) => {
    const matchesSearch =
      !searchQuery ||
      a.title.toLowerCase().includes(query) ||
      a.location.toLowerCase().includes(query);
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
}

/** Onglets de filtrage par statut affichés au-dessus de la liste d'audits. */
export const AUDIT_STATUS_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'pending', label: 'À faire' },
  { key: 'in_progress', label: 'En cours' },
  { key: 'completed', label: 'Terminés' },
];

export interface AuditCounts {
  pending: number;
  inProgress: number;
  completed: number;
}

/** Compteurs d'audits par statut, pour le bandeau de statistiques rapides. */
export function getAuditCounts(items: AuditListItem[]): AuditCounts {
  return {
    pending: items.filter((a) => a.status === 'pending').length,
    inProgress: items.filter((a) => a.status === 'in_progress').length,
    completed: items.filter((a) => a.status === 'completed').length,
  };
}

export function getAuditStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return '#10B981';
    case 'in_progress':
      return '#F59E0B';
    case 'pending':
      return '#6B7280';
    default:
      return '#6B7280';
  }
}

export function getAuditStatusIcon(status: string): LucideIcon {
  switch (status) {
    case 'completed':
      return CheckCircle;
    case 'in_progress':
      return Clock;
    case 'pending':
      return AlertCircle;
    default:
      return Clock;
  }
}

export function getAuditStatusText(status: string): string {
  switch (status) {
    case 'completed':
      return 'Terminé';
    case 'in_progress':
      return 'En cours';
    case 'pending':
      return 'À faire';
    default:
      return 'Inconnu';
  }
}
