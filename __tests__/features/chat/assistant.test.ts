import { describe, expect, it } from 'vitest';

import {
  getLocalAssistantResponse,
  type OperationalContext,
} from '../../../features/chat/assistant';
import {
  classifyIntent,
  OUT_OF_SCOPE_RESPONSE,
} from '../../../features/chat/knowledgeBase';

const context: OperationalContext = {
  overdueAudits: 2,
  criticalActions: 1,
  criticalDlc: 4,
};

describe('assistant IA local', () => {
  it("répond avec le compteur d'audits en retard", () => {
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

  it('retourne OUT_OF_SCOPE_RESPONSE pour les sujets hors périmètre', () => {
    const response = getLocalAssistantResponse(
      'Donne-moi une recette de poulet rôti',
      context,
    );
    expect(response).toBe(OUT_OF_SCOPE_RESPONSE);
  });

  it('retourne OUT_OF_SCOPE_RESPONSE pour les questions personnelles', () => {
    expect(
      getLocalAssistantResponse('Quel temps fait-il demain ?', context),
    ).toBe(OUT_OF_SCOPE_RESPONSE);
  });

  it('répond aux questions HACCP', () => {
    expect(
      getLocalAssistantResponse('Comment gérer un problème HACCP ?', context),
    ).toContain('CCP');
  });

  it('répond aux questions de formation', () => {
    expect(
      getLocalAssistantResponse(
        'Où voir mes formations disponibles ?',
        context,
      ),
    ).toContain('Formation');
  });
});

describe('classifyIntent', () => {
  it('identifie le domaine audit', () => {
    expect(classifyIntent('audit en retard')).toBe('audit');
    expect(classifyIntent('Contrôle qualité')).toBe('audit');
  });

  it('identifie le domaine DLC', () => {
    expect(classifyIntent('Quels produits ont une DLC dépassée ?')).toBe('dlc');
    expect(classifyIntent('rotation des stocks')).toBe('dlc');
  });

  it('identifie le domaine HACCP', () => {
    expect(classifyIntent('température de la chambre froide')).toBe('haccp');
    expect(classifyIntent("règles d'hygiène")).toBe('haccp');
  });

  it('retourne null pour les sujets hors périmètre', () => {
    expect(classifyIntent('recette de cuisine')).toBeNull();
    expect(classifyIntent('météo demain')).toBeNull();
    expect(classifyIntent('mon horoscope')).toBeNull();
  });
});
