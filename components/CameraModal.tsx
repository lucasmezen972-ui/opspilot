import React, { useState, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert, Image } from 'react-native'
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera'
import { X, Camera, RotateCcw, Sparkles, CheckCircle } from 'lucide-react-native'
import { analyzeAuditImage } from '../lib/openai'

interface CameraModalProps {
  visible: boolean
  onClose: () => void
  onPhotoTaken: (uri: string, analysis?: any) => void
  auditType?: string
}

export default function CameraModal({ visible, onClose, onPhotoTaken, auditType = 'general' }: CameraModalProps) {
  const [facing, setFacing] = useState<CameraType>('back')
  const [permission, requestPermission] = useCameraPermissions()
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<any>(null)
  const cameraRef = useRef<CameraView>(null)

  if (!permission) {
    return <View />
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} animationType="slide">
        <View style={styles.permissionContainer}>
          <Camera size={64} color="#6B7280" />
          <Text style={styles.permissionTitle}>Autorisation caméra requise</Text>
          <Text style={styles.permissionText}>
            OpsPilot a besoin d'accéder à votre caméra pour prendre des photos d'audit.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Autoriser l'accès</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    )
  }

  const takePicture = async () => {
    if (!cameraRef.current) return

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      })

      if (photo?.uri) {
        setPhotoUri(photo.uri)
        
        // Analyser l'image avec OpenAI si disponible
        if (process.env.EXPO_PUBLIC_OPENAI_API_KEY) {
          setAnalyzing(true)
          try {
            const aiAnalysis = await analyzeAuditImage(photo.uri, auditType)
            setAnalysis(aiAnalysis)
          } catch (error) {
            console.warn('Analyse IA indisponible:', error)
          } finally {
            setAnalyzing(false)
          }
        }
      }
    } catch (error) {
      console.error('Erreur prise de photo:', error)
      Alert.alert('Erreur', 'Impossible de prendre la photo')
    }
  }

  const confirmPhoto = () => {
    if (photoUri) {
      onPhotoTaken(photoUri, analysis)
      resetState()
      onClose()
    }
  }

  const retakePhoto = () => {
    setPhotoUri(null)
    setAnalysis(null)
  }

  const resetState = () => {
    setPhotoUri(null)
    setAnalysis(null)
    setAnalyzing(false)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'))
  }

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
              <Text style={styles.analysisScore}>Score: {analysis.overall_score}/100</Text>
              <Text style={styles.analysisSummary}>{analysis.summary}</Text>
              {analysis.issues.length > 0 && (
                <View style={styles.issuesList}>
                  <Text style={styles.issuesTitle}>Problèmes détectés:</Text>
                  {analysis.issues.slice(0, 2).map((issue: any, index: number) => (
                    <Text key={index} style={styles.issueItem}>
                      • {issue.description}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          )}

          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
              <Text style={styles.retakeButtonText}>Reprendre</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={confirmPhoto}>
              <CheckCircle size={20} color="#FFFFFF" />
              <Text style={styles.confirmButtonText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    )
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
            <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
              <RotateCcw size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            
            <View style={styles.placeholder} />
          </View>
          
          <Text style={styles.cameraHint}>
            Centrez l'élément à auditer dans le cadre
          </Text>
          
          {process.env.EXPO_PUBLIC_OPENAI_API_KEY && (
            <View style={styles.aiHint}>
              <Sparkles size={16} color="#F59E0B" />
              <Text style={styles.aiHintText}>Analyse IA automatique activée</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    gap: 16,
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
})