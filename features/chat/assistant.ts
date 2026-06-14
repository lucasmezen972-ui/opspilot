import { getDemoState } from '../../lib/demoStore';
import { classifyIntent, OUT_OF_SCOPE_RESPONSE } from './knowledgeBase';

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

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function getLocalAssistantResponse(
  userMessage: string,
  context: OperationalContext,
): string {
  const domain = classifyIntent(userMessage);

  switch (domain) {
    case 'greeting':
      return `Bonjour ! Situation actuelle : ${countLabel(context.overdueAudits, 'audit en retard', 'audits en retard')}, ${countLabel(context.criticalActions, 'action corrective critique ouverte', 'actions correctives critiques ouvertes')} et ${countLabel(context.criticalDlc, 'produit à DLC critique', 'produits à DLC critique')}. Quel sujet voulez-vous traiter ?`;

    case 'audit':
      return `${countLabel(context.overdueAudits, 'audit est en retard', 'audits sont en retard')}. Commencez par le plus ancien, vérifiez son échéance et assignez immédiatement les éventuelles non-conformités.`;

    case 'action':
      return `${countLabel(context.criticalActions, 'action corrective critique reste ouverte', 'actions correctives critiques restent ouvertes')}. Priorisez la sécurisation immédiate, nommez un responsable et confirmez une échéance aujourd'hui.`;

    case 'dlc':
      return `${countLabel(context.criticalDlc, 'produit a une DLC critique', 'produits ont une DLC critique')} dans les 7 prochains jours. Contrôlez d'abord les produits déjà dépassés, puis appliquez la rotation FEFO.`;

    case 'haccp':
      return 'Vérifiez les points critiques de contrôle (CCP) : températures de réception (< +4 °C pour les frais), stockage séparé cru/cuit, et traçabilité des lots. Notez toute déviation dans le journal de bord HACCP.';

    case 'formation':
      return "Consultez le catalogue de formations dans l'onglet Formation. Les formations HACCP et Hygiène alimentaire sont prioritaires pour les nouveaux membres. Votre progression et vos certificats sont disponibles directement dans l'application.";

    case 'tache':
      return "Vérifiez l'onglet Tâches pour voir vos missions du jour et celles en retard. Priorisez par criticité et échéance — commencez par les tâches déjà dépassées.";

    case 'messagerie':
      return "Utilisez l'onglet Messages > Canaux pour les communications officielles de votre équipe. Les annonces importantes sont épinglées en haut de chaque canal.";

    default:
      return OUT_OF_SCOPE_RESPONSE;
  }
}
