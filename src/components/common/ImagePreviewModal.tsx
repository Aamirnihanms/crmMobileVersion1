import React from 'react';
import { StyleSheet, View, Pressable, Modal } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/src/theme';
import AppText from './AppText';

interface ImagePreviewModalProps {
  visible: boolean;
  imageUrl: string | null;
  onClose: () => void;
  title?: string;
}

export default function ImagePreviewModal({
  visible,
  imageUrl,
  onClose,
  title,
}: ImagePreviewModalProps) {
  const { colors } = useAppTheme();

  if (!visible || !imageUrl) return null;

  return (
    <Modal
      statusBarTranslucent
      navigationBarTranslucent
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Header bar */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.backButton} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.titleContainer}>
            <AppText style={styles.title} numberOfLines={1}>
              {title || 'Profile Picture'}
            </AppText>
          </View>
        </View>

        {/* Centered Image */}
        <Pressable style={styles.imageContainer} onPress={onClose}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="contain"
          />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50, // Space for status bar
    paddingBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 10,
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
