import { CameraView, useCameraPermissions } from 'expo-camera';
import { Camera, Keyboard, ScanLine, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { normalizeBarcode } from './barcode';

type BarcodeDetectorResult = { rawValue?: string };
type BarcodeDetectorInstance = {
  detect: (source: HTMLVideoElement) => Promise<BarcodeDetectorResult[]>;
};
type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorInstance;

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onDetected: (barcode: string) => Promise<void> | void;
}

const BARCODE_FORMATS = [
  'ean_13',
  'ean_8',
  'upc_a',
  'upc_e',
  'code_128',
  'code_39',
  'qr_code',
];

export function BarcodeScannerModal({
  visible,
  onClose,
  onDetected,
}: BarcodeScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState('');
  const [detected, setDetected] = useState(false);
  const [webStatus, setWebStatus] = useState<
    'idle' | 'starting' | 'active' | 'unsupported' | 'denied'
  >('idle');
  const webPreviewRef = useRef<View>(null);
  const cleanupWebCameraRef = useRef<(() => void) | null>(null);

  const e2eBarcode =
    Platform.OS === 'web' &&
    typeof localStorage !== 'undefined' &&
    localStorage.getItem('opspilot_e2e_barcode');

  useEffect(() => {
    if (!visible) {
      cleanupWebCameraRef.current?.();
      cleanupWebCameraRef.current = null;
      setManualCode('');
      setDetected(false);
      setWebStatus('idle');
    }
  }, [visible]);

  useEffect(
    () => () => {
      cleanupWebCameraRef.current?.();
    },
    [],
  );

  const submitBarcode = async (value: string) => {
    const barcode = normalizeBarcode(value);
    if (!barcode || detected) return;
    setDetected(true);
    cleanupWebCameraRef.current?.();
    cleanupWebCameraRef.current = null;
    onClose();
    await onDetected(barcode);
  };

  const startWebCamera = async () => {
    if (
      Platform.OS !== 'web' ||
      typeof window === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setWebStatus('unsupported');
      return;
    }

    const Detector = (
      window as typeof window & {
        BarcodeDetector?: BarcodeDetectorConstructor;
      }
    ).BarcodeDetector;
    if (!Detector) {
      setWebStatus('unsupported');
      return;
    }

    setWebStatus('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      const host = webPreviewRef.current as unknown as HTMLElement | null;
      if (!host) {
        stream.getTracks().forEach((track) => track.stop());
        setWebStatus('denied');
        return;
      }

      const video = document.createElement('video');
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.srcObject = stream;
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      host.replaceChildren(video);
      await video.play();

      const detector = new Detector({ formats: BARCODE_FORMATS });
      let stopped = false;
      let timer: ReturnType<typeof setTimeout> | null = null;
      const scanFrame = async () => {
        if (stopped || detected) return;
        try {
          const results = await detector.detect(video);
          const barcode = results.find((result) => result.rawValue)?.rawValue;
          if (barcode) {
            await submitBarcode(barcode);
            return;
          }
        } catch {
          // Une image sans code détectable est normale : poursuivre le scan.
        }
        timer = setTimeout(scanFrame, 250);
      };

      cleanupWebCameraRef.current = () => {
        stopped = true;
        if (timer) clearTimeout(timer);
        stream.getTracks().forEach((track) => track.stop());
        video.remove();
      };
      setWebStatus('active');
      scanFrame().catch(() => setWebStatus('denied'));
    } catch {
      setWebStatus('denied');
    }
  };

  const handleNativeBarcode = async (event: { data: string }) => {
    await submitBarcode(event.data);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay} testID="barcode-scanner-modal">
        <View style={styles.modal}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Scanner un produit</Text>
              <Text style={styles.subtitle}>
                Placez le code-barres dans le cadre.
              </Text>
            </View>
            <TouchableOpacity
              accessibilityLabel="Fermer le scanner"
              style={styles.closeButton}
              onPress={onClose}
            >
              <X size={20} color="#374151" />
            </TouchableOpacity>
          </View>

          {e2eBarcode ? (
            <View style={styles.cameraFallback}>
              <ScanLine size={58} color="#2563EB" />
              <Text style={styles.fallbackTitle}>Scanner de test</Text>
              <TouchableOpacity
                testID="barcode-e2e-scan"
                style={styles.primaryButton}
                onPress={() => submitBarcode(e2eBarcode)}
              >
                <Text style={styles.primaryButtonText}>
                  Simuler le code {e2eBarcode}
                </Text>
              </TouchableOpacity>
            </View>
          ) : Platform.OS === 'web' ? (
            <>
              <View
                ref={webPreviewRef}
                style={[
                  styles.webPreview,
                  webStatus !== 'active' && styles.webPreviewInactive,
                ]}
              >
                {webStatus !== 'active' && (
                  <View style={styles.cameraFallback}>
                    <Camera size={52} color="#2563EB" />
                    <Text style={styles.fallbackTitle}>
                      {webStatus === 'unsupported'
                        ? 'Scan caméra non pris en charge'
                        : webStatus === 'denied'
                          ? 'Accès caméra refusé'
                          : 'Caméra web'}
                    </Text>
                    <Text style={styles.fallbackText}>
                      {webStatus === 'unsupported'
                        ? 'Ce navigateur ne propose pas BarcodeDetector. Utilisez la saisie manuelle.'
                        : webStatus === 'denied'
                          ? 'Autorisez la caméra dans le navigateur ou saisissez le code manuellement.'
                          : 'Activez la caméra pour détecter automatiquement un code-barres.'}
                    </Text>
                    {webStatus !== 'unsupported' && webStatus !== 'denied' && (
                      <TouchableOpacity
                        testID="barcode-web-camera-button"
                        style={styles.primaryButton}
                        onPress={startWebCamera}
                        disabled={webStatus === 'starting'}
                      >
                        <Text style={styles.primaryButtonText}>
                          {webStatus === 'starting'
                            ? 'Activation...'
                            : 'Activer la caméra'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
              <ManualBarcodeForm
                value={manualCode}
                onChange={setManualCode}
                onSubmit={() => submitBarcode(manualCode)}
              />
            </>
          ) : !permission ? (
            <View style={styles.cameraFallback}>
              <Text style={styles.fallbackText}>
                Vérification de l’autorisation caméra…
              </Text>
            </View>
          ) : !permission.granted ? (
            <View style={styles.cameraFallback}>
              <Camera size={52} color="#6B7280" />
              <Text style={styles.fallbackTitle}>
                Autorisation caméra requise
              </Text>
              <Text style={styles.fallbackText}>
                Autorisez OpsPilot à utiliser la caméra pour scanner les
                produits.
              </Text>
              <TouchableOpacity
                testID="barcode-camera-permission"
                style={styles.primaryButton}
                onPress={requestPermission}
              >
                <Text style={styles.primaryButtonText}>
                  Autoriser la caméra
                </Text>
              </TouchableOpacity>
              <ManualBarcodeForm
                value={manualCode}
                onChange={setManualCode}
                onSubmit={() => submitBarcode(manualCode)}
              />
            </View>
          ) : (
            <>
              <View style={styles.nativeCamera}>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  barcodeScannerSettings={{
                    barcodeTypes: [
                      'ean13',
                      'ean8',
                      'upc_a',
                      'upc_e',
                      'code128',
                      'code39',
                      'qr',
                    ],
                  }}
                  onBarcodeScanned={detected ? undefined : handleNativeBarcode}
                />
                <View style={styles.scanFrame} pointerEvents="none" />
              </View>
              <ManualBarcodeForm
                value={manualCode}
                onChange={setManualCode}
                onSubmit={() => submitBarcode(manualCode)}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function ManualBarcodeForm({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <View style={styles.manualSection}>
      <View style={styles.manualTitleRow}>
        <Keyboard size={18} color="#6B7280" />
        <Text style={styles.manualTitle}>Saisie manuelle</Text>
      </View>
      <View style={styles.manualRow}>
        <TextInput
          testID="barcode-manual-input"
          style={styles.manualInput}
          value={value}
          onChangeText={onChange}
          keyboardType="numeric"
          placeholder="Ex : 3000000000001"
          onSubmitEditing={onSubmit}
        />
        <TouchableOpacity
          testID="barcode-manual-submit"
          style={[
            styles.manualSubmit,
            normalizeBarcode(value).length === 0 && styles.buttonDisabled,
          ]}
          onPress={onSubmit}
          disabled={normalizeBarcode(value).length === 0}
        >
          <Text style={styles.manualSubmitText}>Rechercher</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  modal: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: { color: '#111827', fontSize: 20, fontWeight: '700' },
  subtitle: { color: '#6B7280', fontSize: 13, marginTop: 3 },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webPreview: {
    height: 330,
    backgroundColor: '#111827',
    overflow: 'hidden',
  },
  webPreviewInactive: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  nativeCamera: {
    height: 420,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: '78%',
    height: 150,
    borderWidth: 3,
    borderColor: '#22C55E',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  cameraFallback: {
    flex: 1,
    minHeight: 250,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  fallbackTitle: {
    color: '#111827',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  fallbackText: {
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
    maxWidth: 430,
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginTop: 16,
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700' },
  manualSection: {
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  manualTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
  },
  manualTitle: { color: '#374151', fontSize: 14, fontWeight: '700' },
  manualRow: { flexDirection: 'row', gap: 8 },
  manualInput: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    color: '#111827',
    fontSize: 15,
  },
  manualSubmit: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: '#059669',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  manualSubmitText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  buttonDisabled: { opacity: 0.45 },
});
