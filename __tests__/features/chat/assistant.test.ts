import { describe, expect, it } from 'vitest';

import {
  getLocalAssistantResponse,
  type OperationalContext,
} from '../../../features/chat/assistant';

const context: OperationalContext = {
  overdueAudits: 2,
  criticalActions: 1,
  criticalDlc: 4,
};

describe('assistant IA local', () => {
  it('répond avec le compteur d’audits en retard', () => {
    expect(
      getLocalAssistantResponse('Quels audits sont en retard ?', context),
    ).toContain('2 audits sont en retard');
  });

  it('priorise les actions critiques', () => {
    expect(
      getLocalAssistantResponse(
        'Que faire pour les actions critiques ?',
        context,
      ),
    ).toContain('1 action corrective critique reste ouverte');
  });

  it('signale les DLC critiques', () => {
    expect(getLocalAssistantResponse('Montre-moi les DLC', context)).toContain(
      '4 produits ont une DLC critique',
    );
  });
});
