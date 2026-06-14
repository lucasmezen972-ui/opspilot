/**
 * Base de connaissances métier cadrée pour l'assistant IA OpsPilot.
 * L'assistant répond UNIQUEMENT aux sujets listés ici.
 * Toute demande hors périmètre reçoit OUT_OF_SCOPE_RESPONSE.
 */

export const OUT_OF_SCOPE_RESPONSE =
  'Je suis spécialisé dans les opérations terrain de votre magasin : hygiène, audits, DLC, actions correctives, formations et tâches. Pour cette demande, veuillez consulter les services compétents de votre organisation.';

export type OperationalDomain =
  | 'audit'
  | 'action'
  | 'dlc'
  | 'haccp'
  | 'formation'
  | 'tache'
  | 'messagerie'
  | 'greeting';

type DomainKeywords = {
  domain: OperationalDomain;
  keywords: string[];
};

const DOMAIN_KEYWORDS: DomainKeywords[] = [
  {
    domain: 'greeting',
    keywords: [
      'bonjour',
      'bonsoir',
      'salut',
      'hello',
      'aide',
      'aider',
      'aide-moi',
      'priorite',
      'priorités',
      'situation',
      'tableau',
    ],
  },
  {
    domain: 'audit',
    keywords: [
      'audit',
      'inspection',
      'verification',
      'controle',
      'contrôle',
      'verifier',
      'vérifier',
      'retard',
      'echeance',
      'échéance',
    ],
  },
  {
    domain: 'haccp',
    keywords: [
      'haccp',
      'hygiene',
      'hygiène',
      'bacterie',
      'bactérie',
      'contamination',
      'temperature',
      'température',
      'alimentaire',
      'securite alimentaire',
      'sécurité alimentaire',
      'ccp',
      'danger',
    ],
  },
  {
    domain: 'action',
    keywords: [
      'action',
      'corrective',
      'non-conform',
      'nonconform',
      'incident',
      'anomalie',
      'probleme',
      'problème',
      'critique',
    ],
  },
  {
    domain: 'dlc',
    keywords: [
      'dlc',
      'date',
      'péremption',
      'peremption',
      'stock',
      'produit',
      'rotation',
      'fefo',
      'fifo',
      'expir',
    ],
  },
  {
    domain: 'formation',
    keywords: [
      'formation',
      'quiz',
      'cours',
      'certification',
      'certificat',
      'apprendre',
      'apprentissage',
      'module',
      'chapitre',
    ],
  },
  {
    domain: 'tache',
    keywords: [
      'tache',
      'tâche',
      'planifier',
      'planification',
      'schedule',
      'travail',
      'mission',
      'assigner',
      'priorité',
    ],
  },
  {
    domain: 'messagerie',
    keywords: [
      'message',
      'canal',
      'annonce',
      'communiquer',
      'communication',
      'equipe',
      'équipe',
      'collegu',
      'notif',
    ],
  },
];

function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function classifyIntent(userMessage: string): OperationalDomain | null {
  const normalized = normalizeText(userMessage);
  for (const { domain, keywords } of DOMAIN_KEYWORDS) {
    if (keywords.some((kw) => normalized.includes(normalizeText(kw)))) {
      return domain;
    }
  }
  return null;
}

export const SYSTEM_PROMPT_CONSTRAINT = `
PÉRIMÈTRE STRICT : Tu réponds UNIQUEMENT aux questions portant sur :
- Hygiène alimentaire, HACCP et sécurité alimentaire
- DLC, rotation des stocks et gestion des dates de péremption
- Audits opérationnels et non-conformités
- Actions correctives et plans d'action
- Formations internes et procédures terrain
- Tâches opérationnelles et planification
- Communication interne de l'équipe magasin

Si la demande est HORS PÉRIMÈTRE (recettes, sujets personnels, actualité générale, droit, médical, etc.), réponds EXACTEMENT et uniquement avec ce texte :
"Je suis spécialisé dans les opérations terrain de votre magasin : hygiène, audits, DLC, actions correctives, formations et tâches. Pour cette demande, veuillez consulter les services compétents de votre organisation."
`.trim();
