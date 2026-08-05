import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import {
  X,
  Camera,
  RotateCcw,
  Sparkles,
  CircleCheck as CheckCircle,
} from 'lucide-react-native';
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Image,
  PanResponder,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { analyzeAuditImage, type AuditAnalysis } from '../lib/openai';
import { colors, shadow } from '../shared/styles/tokens';
import { logger } from '../utils/logger';

interface CameraModalProps {
  visible: boolean;
  onClose: () => void;
  onPhotoTaken: (
    uri: string,
    analysis?: AuditAnalysis,
    annotations?: string[],
  ) => void;
  auditType?: string;
}

export default function CameraModal({
  visible,
  onClose,
  onPhotoTaken,
  auditType = 'general',
}: CameraModalProps) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AuditAnalysis | null>(null);
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const pathRef = useRef('');
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        pathRef.current = `M ${locationX} ${locationY}`;
        setCurrentPath(pathRef.current);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        pathRef.current += ` L ${locationX} ${locationY}`;
        setCurrentPath(pathRef.current);
      },
      onPanResponderRelease: () => {
        if (pathRef.current) {
          setPaths((prev) => [...prev, pathRef.current]);
          pathRef.current = '';
          setCurrentPath('');
        }
      },
    }),
  ).current;
  const cameraRef = useRef<CameraView>(null);
  const isE2ECameraMode =
    Platform.OS === 'web' &&
    typeof localStorage !== 'undefined' &&
    localStorage.getItem('opspilot_e2e_camera') === '1';

  // Fallback web : import d'un fichier image si la caméra est indisponible /
  // refusée. Garantit qu'un utilisateur terrain n'est jamais bloqué. Défini
  // avant les retours anticipés (écran permission) pour rester accessible.
  const canImport = Platform.OS === 'web';
  const importFromFile = () => {
    if (typeof document === 'undefined') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      onPhotoTaken(url);
      onClose();
    };
    input.click();
  };

  if (visible && isE2ECameraMode) {
    return (
      <Modal visible animationType="none">
        <View style={styles.permissionContainer}>
          <Camera size={64} color="#2563EB" />
          <Text style={styles.permissionTitle}>Photo de contrôle E2E</Text>
          <TouchableOpacity
            testID="camera-e2e-photo-button"
            style={styles.permissionButton}
            onPress={() => {
              onPhotoTaken('data:image/png;base64,b3BzcGlsb3QtZTJl');
              onClose();
            }}
          >
            <Text style={styles.permissionButtonText}>Joindre la photo</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.permissionContainer}>
          <Camera size={64} color="#6B7280" />
          <Text style={styles.permissionTitle}>
            Autorisation caméra requise
          </Text>
          <Text style={styles.permissionText}>
            La caméra n'est pas disponible ou son accès a été refusé.
            {canImport
              ? ' Vous pouvez réessayer ou importer une photo existante.'
              : ' Autorisez l’accès dans les réglages de votre appareil, puis réessayez.'}
          </Text>
          <TouchableOpacity
            testID="camera-permission-button"
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Réessayer</Text>
          </TouchableOpacity>
          {canImport && (
            <TouchableOpacity
              testID="camera-import-button"
              style={styles.importButton}
              onPress={importFromFile}
            >
              <Text style={styles.importButtonText}>Importer une photo</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo?.uri) {
        setPhotoUri(photo.uri);

        setAnalyzing(true);
        try {
          const aiAnalysis = await analyzeAuditImage(photo.uri, auditType);
          setAnalysis(aiAnalysis);
        } catch (error) {
          logger.warn('Analyse IA indisponible:', error);
        } finally {
          setAnalyzing(false);
        }
      }
    } catch (error) {
      logger.error('Erreur prise de photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  const confirmPhoto = () => {
    if (photoUri) {
      onPhotoTaken(photoUri, analysis ?? undefined, paths);
      resetState();
      onClose();
    }
  };

  const retakePhoto = () => {
    setPhotoUri(null);
    setAnalysis(null);
    setPaths([]);
    setCurrentPath('');
  };

  const resetState = () => {
    setPhotoUri(null);
    setAnalysis(null);
    setAnalyzing(false);
    setPaths([]);
    setCurrentPath('');
    pathRef.current = '';
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const toggleCameraFacing = () => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const clearAnnotations = () => {
    setPaths([]);
    setCurrentPath('');
    pathRef.current = '';
  };

  if (photoUri) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Photo d'audit</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.previewContainer}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
            <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
              {paths.map((p, index) => (
                <Path
                  key={index}
                  d={p}
                  stroke="#F59E0B"
                  strokeWidth={3}
                  fill="none"
                />
              ))}
              {currentPath !== '' && (
                <Path
                  d={currentPath}
                  stroke="#F59E0B"
                  strokeWidth={3}
                  fill="none"
                />
              )}
            </Svg>
            <View
              style={StyleSheet.absoluteFill}
              {...panResponder.panHandlers}
            />

            {analyzing && (
              <View style={styles.analysisOverlay}>
                <Sparkles size={32} color="#FFFFFF" />
                <Text style={styles.analysisText}>Analyse IA en cours...</Text>
              </View>
            )}
          </View>

          {analysis && !analyzing && (
            <View style={styles.analysisResults}>
              <Text style={styles.analysisTitle}>🤖 Analyse IA</Text>
              <Text style={styles.analysisScore}>
                Score: {analysis.overall_score}/100
              </Text>
              <Text style={styles.analysisSummary}>{analysis.summary}</Text>
              {analysis.issues.length > 0 && (
                <View style={styles.issuesList}>
                  <Text style={styles.issuesTitle}>Problèmes détectés:</Text>
                  {analysis.issues.slice(0, 2).map((issue, index) => (
                    <Text key={index} style={styles.issueItem}>
                      • {issue.description}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearAnnotations}
            >
              <Text style={styles.clearButtonText}>Effacer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
              <Text style={styles.retakeButtonText}>Reprendre</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="camera-confirm-button"
              style={styles.confirmButton}
              onPress={confirmPhoto}
            >
              <CheckCircle size={20} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Prendre une photo</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <CameraView style={styles.camera} facing={facing} ref={cameraRef}>
          <View style={styles.cameraOverlay}>
            <View style={styles.cameraGrid}>
              <View style={styles.gridLine} />
              <View style={[styles.gridLine, styles.gridLineVertical]} />
            </View>
          </View>
        </CameraView>

        <View style={styles.cameraControls}>
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={styles.flipButton}
              onPress={toggleCameraFacing}
            >
              <RotateCcw size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              testID="camera-capture-button"
              style={styles.captureButton}
              onPress={takePicture}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            <View style={styles.placeholder} />
          </View>

          <Text style={styles.cameraHint}>
            Centrez l'élément à auditer dans le cadre
          </Text>

          {canImport && (
            <TouchableOpacity
              testID="camera-import-button"
              style={styles.importInline}
              onPress={importFromFile}
            >
              <Text style={styles.importInlineText}>
                Ou importer une photo existante
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.aiHint}>
            <Sparkles size={16} color="#F59E0B" />
            <Text style={styles.aiHintText}>
              Analyse IA automatique activée
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#000000',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraGrid: {
    width: '80%',
    height: '60%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
  },
  gridLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    top: '33%',
  },
  gridLineVertical: {
    width: 1,
    height: '100%',
    left: '33%',
    top: 0,
  },
  cameraControls: {
    padding: 30,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  placeholder: {
    width: 50,
    height: 50,
  },
  cameraHint: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  aiHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  aiHintText: {
    color: '#F59E0B',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  previewContainer: {
    flex: 1,
    position: 'relative',
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  analysisOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analysisText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  analysisResults: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow.card,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  analysisScore: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
    marginBottom: 8,
  },
  analysisSummary: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  issuesList: {
    marginTop: 8,
  },
  issuesTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#DC2626',
    marginBottom: 4,
  },
  issueItem: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  previewActions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#000000',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  retakeButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  retakeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
  },
  importButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2563EB',
    marginBottom: 12,
  },
  importButtonText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
  importInline: {
    marginTop: 4,
    paddingVertical: 6,
  },
  importInlineText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
