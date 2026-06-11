import { getDemoState } from '../../lib/demoStore';

export type AssistantHistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type OperationalContext = {
  overdueAudits: number;
  criticalActions: number;
  criticalDlc: number;
};

export function getLocalOperationalContext(
  now = Date.now(),
): OperationalContext {
  const state = getDemoState();
  const dlcLimit = now + 7 * 86_400_000;

  return {
    overdueAudits: state.audits.filter((audit) => {
      if (!audit.due_date || audit.status === 'completed') return false;
      return new Date(audit.due_date).getTime() < now;
    }).length,
    criticalActions: state.actions.filter(
      (action) =>
        action.priority === 'critical' &&
        (action.status === 'open' || action.status === 'in_progress'),
    ).length,
    criticalDlc: state.products.filter((product) => {
      if (!product.dlc) return false;
      return new Date(product.dlc).getTime() <= dlcLimit;
    }).length,
  };
}

function normalized(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function getLocalAssistantResponse(
  userMessage: string,
  context: OperationalContext,
): string {
  const message = normalized(userMessage);

  if (message.includes('audit') || message.includes('retard')) {
    return `${countLabel(context.overdueAudits, 'audit est en retard', 'audits sont en retard')}. Commencez par le plus ancien, vérifiez son échéance et assignez immédiatement les éventuelles non-conformités.`;
  }

  if (
    message.includes('action') ||
    message.includes('critique') ||
    message.includes('non-conform')
  ) {
    return `${countLabel(context.criticalActions, 'action corrective critique reste ouverte', 'actions correctives critiques restent ouvertes')}. Priorisez la sécurisation immédiate, nommez un responsable et confirmez une échéance aujourd’hui.`;
  }

  if (
    message.includes('dlc') ||
    message.includes('stock') ||
    message.includes('produit')
  ) {
    return `${countLabel(context.criticalDlc, 'produit a une DLC critique', 'produits ont une DLC critique')} dans les 7 prochains jours. Contrôlez d’abord les produits déjà dépassés, puis appliquez la rotation FEFO.`;
  }

  if (
    message.includes('bonjour') ||
    message.includes('aide') ||
    message.includes('priorite')
  ) {
    return `Bonjour. Votre situation actuelle : ${context.overdueAudits} audit(s) en retard, ${context.criticalActions} action(s) critique(s) ouverte(s) et ${context.criticalDlc} produit(s) à DLC critique. Dites-moi quel sujet vous voulez traiter en premier.`;
  }

  return `Je peux vous aider sur les audits, les actions correctives et les DLC. Aujourd’hui, je surveille surtout ${context.overdueAudits} audit(s) en retard, ${context.criticalActions} action(s) critique(s) et ${context.criticalDlc} DLC critique(s).`;
}
