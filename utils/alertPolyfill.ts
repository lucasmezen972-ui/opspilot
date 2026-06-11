import { Alert, Platform } from 'react-native';

type AlertButton = {
  text?: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

/**
 * react-native-web n'implémente pas Alert.alert (no-op silencieux) : sur le
 * web, les confirmations et retours utilisateur disparaissaient (boutons
 * morts en démo). Shim minimal : window.alert pour 0-1 bouton,
 * window.confirm pour 2+ boutons (OK = dernier bouton non-cancel).
 */
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  (Alert as any).alert = (
    title?: string,
    message?: string,
    buttons?: AlertButton[],
  ) => {
    const text = [title, message].filter(Boolean).join('\n\n');
    if (!buttons || buttons.length <= 1) {
      window.alert(text);
      buttons?.[0]?.onPress?.();
      return;
    }
    const confirmed = window.confirm(text);
    if (confirmed) {
      // Convention RN : l'action principale est le DERNIER bouton non-cancel
      // (ex : [OK, Modifier stock] → confirmer doit déclencher « Modifier »).
      const action =
        [...buttons].reverse().find((b) => b.style !== 'cancel') ??
        buttons[buttons.length - 1];
      action?.onPress?.();
    } else {
      buttons.find((b) => b.style === 'cancel')?.onPress?.();
    }
  };
}

export {};
