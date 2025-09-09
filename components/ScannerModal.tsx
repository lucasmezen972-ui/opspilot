import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from 'react-native'
import { X, Scan, Package, Plus, CircleCheck as CheckCircle } from 'lucide-react-native'
import { useProducts } from '../hooks/useProducts'

interface ScannerModalProps {
  visible: boolean
  onClose: () => void
}

export default function ScannerModal({ visible, onClose }: ScannerModalProps) {
  const [barcode, setBarcode] = useState('')
  const [scanning, setScanning] = useState(false)
  const [scannedProduct, setScannedProduct] = useState<any>(null)
  const { scanProduct, createProduct } = useProducts()

  // Codes-barres de démonstration
  const demoBarcodes = [
    '3045320073034',
    '3564700456789', 
    '3274080005003',
    '3229820787152',
    '3560070462235'
  ]

  const fillDemoBarcode = () => {
    const randomBarcode = demoBarcodes[Math.floor(Math.random() * demoBarcodes.length)]
    setBarcode(randomBarcode)
    Alert.alert('Code de démo', `Code-barres de démonstration rempli: ${randomBarcode}`)
  }

  const simulateScan = async () => {
    if (!barcode.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un code-barres')
      return
    }

    setScanning(true)
    setScannedProduct(null)
    
    try {
      console.log('🔍 Simulation scan:', barcode)
      
      // Simuler un délai de scan réaliste
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const product = await scanProduct(barcode)
      
      if (product) {
        setScannedProduct(product)
        console.log('✅ Produit trouvé:', product.name)
        Alert.alert(
          'Produit trouvé !', 
          `${product.name}${product.found_in_reference ? '\n(Ajouté depuis la base de référence)' : ''}`,
          [
            { text: 'Fermer', style: 'cancel' },
            { 
              text: product.found_in_reference ? 'Ajouter au stock' : 'Voir détails', 
              onPress: () => product.found_in_reference ? addToInventory(product) : viewProductDetails(product)
            }
          ]
        )
      } else {
        console.log('❌ Produit non trouvé')
        Alert.alert(
          'Produit non trouvé', 
          `Aucun produit trouvé pour le code ${barcode}.\nVoulez-vous l'ajouter manuellement ?`,
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Ajouter', onPress: () => addNewProduct() }
          ]
        )
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors du scan')
      console.error(error)
    } finally {
      setScanning(false)
    }
  }

  const addToInventory = async (product: any) => {
    try {
      console.log('➕ Ajout au stock:', product.name)
      
      const result = await createProduct({
        name: product.name,
        barcode: product.barcode,
        category: product.category,
        price: product.price
      })

      if (result.error) {
        Alert.alert('Erreur', 'Impossible d\'ajouter le produit au stock')
      } else {
        Alert.alert('Succès', `${product.name} ajouté au stock !`)
        setBarcode('')
        setScannedProduct(null)
      }
    } catch (error) {
      console.error(error)
      Alert.alert('Erreur', 'Erreur lors de l\'ajout')
    }
  }

  const viewProductDetails = (product: any) => {
    Alert.alert(
      'Détails du produit',
      `Nom: ${product.name}\nCode: ${product.barcode}\nAjouté le: ${new Date(product.created_at).toLocaleDateString()}`,
      [{ text: 'OK' }]
    )
  }

  const addNewProduct = async () => {
    Alert.prompt(
      'Nouveau produit',
      'Nom du produit :',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Ajouter', 
          onPress: async (name) => {
            if (name) {
              const result = await createProduct({
                name: name,
                barcode: barcode
              })

              if (result.error) {
                Alert.alert('Erreur', 'Impossible d\'ajouter le produit')
              } else {
                Alert.alert('Succès', 'Produit ajouté avec succès !')
                setBarcode('')
                onClose()
              }
            }
          }
        }
      ],
      'plain-text',
      `Produit ${barcode}`
    )
  }

  const handleClose = () => {
    setBarcode('')
    setScannedProduct(null)
    setScanning(false)
    onClose()
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Scanner un produit</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.scanArea}>
              <Scan size={64} color={scanning ? '#10B981' : '#6B7280'} />
              <Text style={styles.scanText}>
                {scanning ? 'Scan en cours...' : 'Entrez un code-barres'}
              </Text>
              {scanning && (
                <View style={styles.scanAnimation}>
                  <View style={styles.scanLine} />
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.demoButton} onPress={fillDemoBarcode}>
              <Package size={16} color="#2563EB" />
              <Text style={styles.demoButtonText}>Utiliser un code de démo</Text>
            </TouchableOpacity>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Code-barres</Text>
              <TextInput
                style={styles.input}
                value={barcode}
                onChangeText={setBarcode}
                placeholder="Ex: 3045320073034"
                keyboardType="numeric"
              />
            </View>

            {scannedProduct && (
              <View style={styles.productInfo}>
                <CheckCircle size={24} color="#10B981" />
                <View style={styles.productDetails}>
                  <Text style={styles.productName}>{scannedProduct.name}</Text>
                  <Text style={styles.productBarcode}>Code: {scannedProduct.barcode}</Text>
                  {scannedProduct.category && (
                    <Text style={styles.productCategory}>Catégorie: {scannedProduct.category}</Text>
                  )}
                  {scannedProduct.price && (
                    <Text style={styles.productPrice}>Prix: {scannedProduct.price}€</Text>
                  )}
                </View>
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={handleClose}
              disabled={scanning}
            >
              <Text style={styles.cancelButtonText}>Fermer</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.scanButton, scanning && styles.scanButtonDisabled]} 
              onPress={simulateScan}
              disabled={scanning || !barcode.trim()}
            >
              <Scan size={20} color="#FFFFFF" />
              <Text style={styles.scanButtonText}>
                {scanning ? 'Scan...' : 'Scanner'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 25,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    marginBottom: 24,
  },
  scanArea: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  scanText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
  scanAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanLine: {
    width: '80%',
    height: 2,
    backgroundColor: '#10B981',
    opacity: 0.7,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  demoButtonText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    fontFamily: 'monospace',
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#DCFCE7',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  productDetails: {
    marginLeft: 12,
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  productBarcode: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 12,
    color: '#059669',
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '500',
  },
  scanButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#059669',
    borderRadius: 8,
  },
  scanButtonDisabled: {
    opacity: 0.5,
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
})