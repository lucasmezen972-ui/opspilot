import { Children, type ReactNode, useState } from 'react';
import { View, StyleSheet } from 'react-native';

import { spacing } from '../../shared/styles/tokens';

type Props = {
  children: ReactNode;
  /** Largeur utile d'une carte avant de passer à la grille suivante. */
  minItemWidth?: number;
  columnOptions?: readonly number[];
};

/** La grille suit l'espace disponible, y compris à côté de la navigation. */
export function DashboardGrid({
  children,
  minItemWidth = 190,
  columnOptions = [2, 3, 4],
}: Props) {
  const [width, setWidth] = useState(0);
  const columns = columnOptions.reduce(
    (current, count) =>
      width >= count * minItemWidth + (count - 1) * spacing.md
        ? count
        : current,
    columnOptions[0] ?? 1,
  );
  const itemWidth =
    width > 0
      ? Math.max(0, (width - (columns - 1) * spacing.md) / columns)
      : undefined;

  return (
    <View
      style={styles.grid}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {Children.map(children, (child) => (
        <View
          style={[
            styles.item,
            itemWidth === undefined
              ? { width: `${100 / columns - 2}%` }
              : { width: itemWidth },
          ]}
        >
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  item: {
    minWidth: 0,
  },
});
