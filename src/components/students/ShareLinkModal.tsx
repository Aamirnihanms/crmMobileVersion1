import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Share, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import AppText from '../common/AppText';
import { colors, spacing } from '@/src/theme';
import { BlurView } from 'expo-blur';

interface ShareLinkModalProps {
  visible: boolean;
  onClose: () => void;
  userId: number;
}

export default function ShareLinkModal({ visible, onClose, userId }: ShareLinkModalProps) {
  const link = `https://crm2.luminartechnolab.com/admission-form?simple=true&adc=${userId}`;

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(link);
    // You could add a toast here if you have a toast system
  };

  const onShare = async () => {
    try {
      await Share.share({
        message: `Register here: ${link}`,
        url: link,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={30} style={styles.overlay}>
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
        <View style={styles.content}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="share-social" size={28} color={colors.primary} />
            </View>
            <AppText variant="h2" style={styles.title}>Share Form</AppText>
            <AppText color={colors.textMuted} style={styles.subtitle}>
              Share this admission link with students to get them registered directly.
            </AppText>
          </View>

          <View style={styles.linkWrapper}>
            <AppText style={styles.linkText} numberOfLines={1}>{link}</AppText>
            <TouchableOpacity style={styles.copyIcon} onPress={copyToClipboard}>
              <Ionicons name="copy-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.secondaryBtn]} 
              onPress={copyToClipboard}
            >
              <Ionicons name="copy-outline" size={20} color={colors.primary} />
              <AppText color={colors.primary} style={styles.btnText}>Copy Link</AppText>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, styles.primaryBtn]} 
              onPress={onShare}
            >
              <Ionicons name="paper-plane-outline" size={20} color={colors.surface} />
              <AppText color={colors.surface} style={styles.btnText}>Share Now</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  dismissArea: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  linkWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border + '50',
    marginBottom: spacing.xl,
  },
  linkText: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
    marginRight: spacing.sm,
  },
  copyIcon: {
    padding: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  secondaryBtn: {
    backgroundColor: colors.primaryLight + '10',
    borderWidth: 1,
    borderColor: colors.primaryLight + '20',
  },
  primaryBtn: {
    backgroundColor: colors.primary,
  },
  btnText: {
    fontWeight: '600',
    fontSize: 15,
  },
});
