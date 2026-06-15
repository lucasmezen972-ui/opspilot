import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { colors, spacing } from '../styles/tokens';

export interface TableCell {
  content: ReactNode;
  /** Poids de la colonne (flex). Défaut 1. */
  flex?: number;
  align?: 'left' | 'right' | 'center';
  color?: string;
}

interface AppTableRowProps {
  cells: TableCell[];
  /** Ligne d'en-tête (style atténué, fond léger). */
  header?: boolean;
  /** Dernière ligne : pas de séparateur bas. */
  last?: boolean;
  testID?: string;
}

/** Ligne de tableau tokenisée : cellules pondérées, en-tête, séparateurs. */
export function AppTableRow({
  cells,
  header = false,
  last = false,
  testID,
}: AppTableRowProps) {
  return (
    <View
      testID={testID}
      style={[styles.row, header && styles.headerRow, last && styles.lastRow]}
    >
      {cells.map((cell, index) => {
        const align = cell.align ?? (index === 0 ? 'left' : 'right');
        return (
          <View key={index} style={{ flex: cell.flex ?? 1 }}>
            {typeof cell.content === 'string' ||
            typeof cell.content === 'number' ? (
              <Text
                numberOfLines={1}
                style={[
                  styles.cellText,
                  header && styles.headerText,
                  { textAlign: align },
                  cell.color ? { color: cell.color } : null,
                ]}
              >
                {cell.content}
              </Text>
            ) : (
              cell.content
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  headerRow: {
    backgroundColor: colors.backgroundAlt,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  cellText: {
    fontSize: 13,
    color: colors.text,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
  },
});
