import { describe, it, expect } from 'vitest';

import {
  getDashboardFieldBrief,
  getDashboardKpis,
  getDlcAlerts,
  getDlcUrgency,
} from '../../features/dashboard/dashboardModel';
import type { Audit, CorrectiveAction, Product } from '../../lib/supabase';

const NOW = new Date('2026-06-13T12:00:00Z');

function audit(partial: Partial<Audit>): Audit {
  return {
    id: 'a',
    organization_id: 'org',
    auditor_id: 'u',
    title: 'Audit',
    status: 'pending',
    max_score: 100,
    issues_count: 0,
    photos: [],
    created_at: NOW.toISOString(),
    updated_at: NOW.toISOString(),
    ...partial,
  };
}

function action(partial: Partial<CorrectiveAction>): CorrectiveAction {
  return {
    id: 'c',
    organization_id: 'org',
    title: 'Action',
    priority: 'medium',
    status: 'open',
    ...partial,
  };
}

function product(partial: Partial<Product>): Product {
  return {
    id: 'p',
    organization_id: 'org',
    name: 'Produit',
    stock_quantity: 1,
    created_at: NOW.toISOString(),
    updated_at: NOW.toISOString(),
    ...partial,
  };
}

const days = (n: number) =>
  new Date(NOW.getTime() + n * 86_400_000).toISOString();

describe('getDashboardKpis', () => {
  it('compte audits réalisés, en retard, actions et DLC critiques', () => {
    const kpis = getDashboardKpis(
      [
        audit({ id: 'a1', status: 'completed' }),
        audit({ id: 'a2', status: 'pending', due_date: days(-1) }),
        audit({ id: 'a3', status: 'in_progress', due_date: days(5) }),
      ],
      [
        action({ id: 'c1', status: 'open', priority: 'critical' }),
        action({ id: 'c2', status: 'done', priority: 'critical' }),
        action({ id: 'c3', status: 'in_progress', priority: 'low' }),
      ],
      [
        product({ id: 'p1', dlc: days(1) }),
        product({ id: 'p2', dlc: days(10) }),
      ],
      NOW,
    );
    const byId = Object.fromEntries(kpis.map((k) => [k.id, k.value]));
    expect(byId['audits-done']).toBe(1);
    expect(byId['audits-overdue']).toBe(1);
    expect(byId['actions-open']).toBe(2);
    expect(byId['actions-critical']).toBe(1);
    expect(byId['dlc-critical']).toBe(1);
  });

  it('passe au vert quand un compteur de risque tombe à zéro', () => {
    const kpis = getDashboardKpis([], [], [], NOW);
    const overdue = kpis.find((k) => k.id === 'audits-overdue');
    expect(overdue?.accent).toBe('#10B981');
  });
});

describe('getDashboardFieldBrief', () => {
  it('priorise une action critique avec preuve attendue', () => {
    const brief = getDashboardFieldBrief(
      [audit({ id: 'a1', status: 'completed' })],
      [
        action({
          id: 'c1',
          title: 'Température chambre froide hors seuil',
          description: 'Relever la température et isoler les produits.',
          priority: 'critical',
          status: 'open',
        }),
      ],
      [],
      NOW,
    );

    expect(brief.tone).toBe('danger');
    expect(brief.route).toBe('/actions');
    expect(brief.title).toBe('Température chambre froide hors seuil');
    expect(brief.proof).toContain('Preuve attendue');
  });

  it('fait remonter un audit en retard avant les alertes DLC', () => {
    const brief = getDashboardFieldBrief(
      [
        audit({
          id: 'a1',
          title: 'Tournée parking',
          status: 'pending',
          location: 'Extérieur magasin',
          due_date: days(-1),
        }),
      ],
      [],
      [product({ id: 'p1', name: 'Yaourt nature', dlc: days(0) })],
      NOW,
    );

    expect(brief.tone).toBe('warning');
    expect(brief.route).toBe('/audits');
    expect(brief.message).toContain('Extérieur magasin');
  });

  it('rassure lorsque le terrain ne signale pas de blocage immédiat', () => {
    const brief = getDashboardFieldBrief(
      [audit({ id: 'a1', status: 'completed' })],
      [],
      [],
      NOW,
    );

    expect(brief.tone).toBe('success');
    expect(brief.title).toBe('Les priorités sensibles sont sous contrôle');
  });
});

describe('getDlcAlerts', () => {
  it('garde les 5 DLC les plus proches dans les 7 jours, triées', () => {
    const products = [
      product({ id: 'far', dlc: days(20) }),
      product({ id: 'd3', dlc: days(3) }),
      product({ id: 'd1', dlc: days(1) }),
      product({ id: 'd5', dlc: days(5) }),
      product({ id: 'd2', dlc: days(2) }),
      product({ id: 'd6', dlc: days(6) }),
      product({ id: 'd0', dlc: days(0) }),
      product({ id: 'noDlc' }),
    ];
    const alerts = getDlcAlerts(products, NOW);
    expect(alerts.map((p) => p.id)).toEqual(['d0', 'd1', 'd2', 'd3', 'd5']);
  });
});

describe('getDlcUrgency', () => {
  it('marque un produit expiré', () => {
    const u = getDlcUrgency(days(-2), NOW);
    expect(u.isExpired).toBe(true);
    expect(u.label).toBe('Expiré');
    expect(u.color).toBe('#EF4444');
  });

  it('marque une DLC du jour', () => {
    const u = getDlcUrgency(days(0), NOW);
    expect(u.isToday).toBe(true);
    expect(u.label).toBe("Aujourd'hui");
  });

  it('affiche un compte à rebours pour les jours suivants', () => {
    const u = getDlcUrgency(days(4), NOW);
    expect(u.label).toBe('J−4');
  });
});
