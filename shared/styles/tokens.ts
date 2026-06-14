/**
 * Design tokens OpsPilot — source unique de vérité visuelle.
 *
 * Ces valeurs reprennent fidèlement l'identité existante (bleu OpsPilot,
 * verts/oranges/rouges de statut, gris de texte) : le but est d'unifier et
 * de fiabiliser, pas de changer la marque. Tout nouvel écran ou composant
 * doit consommer ces tokens plutôt que des valeurs en dur.
 */

export const colors = {
  // Marque
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primarySoft: '#EEF2FF',

  // Statuts / criticités
  success: '#10B981',
  successText: '#16A34A',
  successSoft: '#DCFCE7',
  warning: '#F59E0B',
  warningText: '#B45309',
  warningSoft: '#FEF3C7',
  danger: '#EF4444',
  dangerStrong: '#DC2626',
  dangerSoft: '#FEE2E2',

  // Surfaces & texte
  surface: '#FFFFFF',
  background: '#F8FAFC',
  backgroundAlt: '#F1F5F9',
  border: '#E5E7EB',
  // Liseré « hairline » très clair des cartes : donne de la définition aux
  // surfaces blanches sur fond clair (rendu premium type dashboard SaaS).
  hairline: '#ECEFF3',
  textStrong: '#111827',
  text: '#374151',
  textMuted: '#6B7280',
  textFaint: '#9CA3AF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  pill: 999,
} as const;

export const typography = {
  kpiValue: { fontSize: 26, fontWeight: '700' as const },
  sectionTitle: { fontSize: 18, fontWeight: '700' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  label: { fontSize: 11, fontWeight: '500' as const },
} as const;

/**
 * Échelle d'élévation premium. Ombres douces, teintées « slate » (et non
 * noir pur) avec un flou large : rendu moderne et discret sur web comme sur
 * mobile, sans changer la mise en page ni les couleurs de marque.
 *
 * - `card` : cartes, panneaux, lignes de liste (élévation au repos).
 * - `floating` : éléments flottants (bouton d'action, modales).
 * - `cardActive` : carte sélectionnée (liseré d'élévation teinté marque).
 */
export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  floating: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
  cardActive: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },
} as const;

/** Couleur de premier plan + fond pour un niveau de statut/criticité. */
export type StatusLevel = 'success' | 'warning' | 'danger' | 'neutral';

export const statusPalette: Record<StatusLevel, { fg: string; bg: string }> = {
  success: { fg: colors.successText, bg: colors.successSoft },
  warning: { fg: colors.warningText, bg: colors.warningSoft },
  danger: { fg: colors.dangerStrong, bg: colors.dangerSoft },
  neutral: { fg: colors.textMuted, bg: colors.backgroundAlt },
};
