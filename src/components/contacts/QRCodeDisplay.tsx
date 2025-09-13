import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Dimensions, Share, Alert } from 'react-native';
import { X, Download, Share2, Copy } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';

import { IOSText, IOSButton, IOSCard } from '../ios';

interface QRCodeDisplayProps {
  visible: boolean;
  onClose: () => void;
  data: string;
  title: string;
  description?: string;
  size?: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  visible,
  onClose,
  data,
  title,
  description,
  size = 200,
}) => {
  const [qrRef, setQrRef] = useState<any>(null);

  const handleCopyToClipboard = async () => {
    try {
      await Clipboard.setStringAsync(data);
      Alert.alert('Copied', 'Link copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${title}\n\n${description || ''}\n\n${data}`,
        title: title,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share');
    }
  };

  const handleSaveQR = () => {
    // In a real implementation, you would save the QR code as an image
    // For now, we'll show an alert
    Alert.alert(
      'Save QR Code',
      'QR code saving functionality would be implemented here. The QR code contains the following data:\n\n' + data,
      [{ text: 'OK' }]
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <IOSCard style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleContainer}>
                <IOSText style={styles.title}>{title}</IOSText>
                {description && (
                  <IOSText style={styles.description}>{description}</IOSText>
                )}
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            {/* QR Code */}
            <View style={styles.qrContainer}>
              <View style={styles.qrCodeWrapper}>
                <QRCode
                  value={data}
                  size={size}
                  color="#1C1C1E"
                  backgroundColor="#FFFFFF"
                  getRef={(ref) => setQrRef(ref)}
                />
              </View>
            </View>

            {/* Instructions */}
            <View style={styles.instructions}>
              <IOSText style={styles.instructionTitle}>How to use:</IOSText>
              <IOSText style={styles.instructionText}>
                1. Open WhatsApp on your device
              </IOSText>
              <IOSText style={styles.instructionText}>
                2. Tap the QR scanner icon
              </IOSText>
              <IOSText style={styles.instructionText}>
                3. Point your camera at this QR code
              </IOSText>
              <IOSText style={styles.instructionText}>
                4. Tap "Join Group" when prompted
              </IOSText>
            </View>

            {/* Data Display */}
            <View style={styles.dataContainer}>
              <IOSText style={styles.dataLabel}>Group Link:</IOSText>
              <TouchableOpacity onPress={handleCopyToClipboard} style={styles.dataRow}>
                <IOSText style={styles.dataText} numberOfLines={2}>
                  {data}
                </IOSText>
                <Copy size={16} color="#007AFF" />
              </TouchableOpacity>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <IOSButton
                title="Copy Link"
                onPress={handleCopyToClipboard}
                variant="secondary"
                size="small"
                icon={<Copy size={16} color="#007AFF" />}
                style={styles.actionButton}
              />
              
              <IOSButton
                title="Share"
                onPress={handleShare}
                variant="secondary"
                size="small"
                icon={<Share2 size={16} color="#007AFF" />}
                style={styles.actionButton}
              />
              
              <IOSButton
                title="Save QR"
                onPress={handleSaveQR}
                variant="primary"
                size="small"
                icon={<Download size={16} color="#FFFFFF" />}
                style={styles.actionButton}
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <IOSText style={styles.footerText}>
                This QR code provides quick access to join the WhatsApp group
              </IOSText>
            </View>
          </IOSCard>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: Math.min(screenWidth - 40, 380),
    maxHeight: screenHeight - 100,
  },
  card: {
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 16,
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#3C3C43',
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
  },
  qrContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  qrCodeWrapper: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructions: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#3C3C43',
    marginBottom: 4,
    lineHeight: 20,
  },
  dataContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dataLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  dataText: {
    flex: 1,
    fontSize: 12,
    color: '#3C3C43',
    marginRight: 8,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 0.5,
    borderTopColor: '#C6C6C8',
    paddingTop: 16,
  },
  footerText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 16,
  },
});