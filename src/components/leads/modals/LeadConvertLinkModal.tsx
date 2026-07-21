import { useAppTheme, spacing } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import React, { useState } from 'react';
import { Modal, Share, StyleSheet, TouchableOpacity, View } from 'react-native';
import AppText from '../../common/AppText';

interface LeadConvertLinkModalProps {
  visible: boolean;
  onClose: () => void;
  leadId: string;
  userId: number;
}

export default function LeadConvertLinkModal({ visible, onClose, leadId, userId }: LeadConvertLinkModalProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const [selectedType, setSelectedType] = useState<'withSeats' | 'withoutSeats' | null>(null);

  const generateLink = (withSeats: boolean) => {
    const paymentId = 'pay_' + Math.random().toString(36).substring(2, 11);
    const baseUrl = 'https://crm2.luminartechnolab.com/admission-form';
    return `${baseUrl}?payment_id=${paymentId}&lead_id=${leadId}&batch=${withSeats}&simple=true&adc=${userId}`;
  };

  const currentLink = selectedType ? generateLink(selectedType === 'withSeats') : '';

  const copyToClipboard = async () => {
    if (!currentLink) return;
    await Clipboard.setStringAsync(currentLink);
    // You could add a toast here
  };

  const onShare = async () => {
    if (!currentLink) return;
    try {
      await Share.share({
        message: `Please complete your admission form here: ${currentLink}`,
        url: currentLink,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleBack = () => {
    setSelectedType(null);
  };

  return (
    <Modal statusBarTranslucent navigationBarTranslucent visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView intensity={30} style={styles.overlay}>
        <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />
        <View style={styles.content}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {!selectedType ? (
            <>
              <View style={styles.header}>
                <View style={styles.iconCircle}>
                  <Ionicons name="link-outline" size={28} color={colors.primary} />
                </View>
                <AppText variant="h2" style={styles.title}>Convert Link</AppText>
                <AppText color={colors.textMuted} style={styles.subtitle}>
                  Select the type of admission link you want to share with the lead.
                </AppText>
              </View>

              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={styles.optionCard}
                  onPress={() => setSelectedType('withSeats')}
                >
                  <View style={[styles.optionIcon, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="people-outline" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.optionInfo}>
                    <AppText style={styles.optionTitle}>Link with seats</AppText>
                    <AppText variant="caption" color={colors.textMuted}>Include batch seat reservation</AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.divider} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.optionCard}
                  onPress={() => setSelectedType('withoutSeats')}
                >
                  <View style={[styles.optionIcon, { backgroundColor: colors.info + '15' }]}>
                    <Ionicons name="person-outline" size={24} color={colors.info} />
                  </View>
                  <View style={styles.optionInfo}>
                    <AppText style={styles.optionTitle}>Link without seats</AppText>
                    <AppText variant="caption" color={colors.textMuted}>Standard admission without seat lock</AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.divider} />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                  <Ionicons name="arrow-back" size={20} color={colors.primary} />
                </TouchableOpacity>
                <View style={styles.iconCircle}>
                  <Ionicons name="share-social" size={28} color={colors.primary} />
                </View>
                <AppText variant="h2" style={styles.title}>Share Link</AppText>
                <AppText color={colors.textMuted} style={styles.subtitle}>
                  {selectedType === 'withSeats' ? 'Link with Seats' : 'Link without Seats'} generated successfully.
                </AppText>
              </View>

              <View style={styles.linkWrapper}>
                <AppText style={styles.linkText} numberOfLines={1}>{currentLink}</AppText>
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
                  <AppText color={colors.primary} style={styles.btnText}>Copy</AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.primaryBtn]}
                  onPress={onShare}
                >
                  <Ionicons name="paper-plane-outline" size={20} color={colors.surface} />
                  <AppText color={colors.surface} style={styles.btnText}>Share</AppText>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </BlurView>
    </Modal>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
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
  backButton: {
    position: 'absolute',
    top: spacing.lg,
    left: spacing.lg,
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
  optionsContainer: {
    gap: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.divider + '50',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
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
