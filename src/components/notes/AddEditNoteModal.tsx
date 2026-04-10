import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import type { NoteImportance } from '../../api/notes.api';
import { colors, spacing } from '@/src/theme';
import AppText from '../common/AppText';

const IMPORTANCE: NoteImportance[] = [
  'NORMAL',
  'IMPORTANT',
  'URGENT',
];

export default function AddEditNoteModal({
  visible,
  initialContent = '',
  initialImportance = 'NORMAL',
  onClose,
  onSubmit,
}: {
  visible: boolean;
  initialContent?: string;
  initialImportance?: NoteImportance;
  onClose: () => void;
  onSubmit: (payload: {
    content: string;
    importance: NoteImportance;
  }) => void;
}) {
  const [content, setContent] = React.useState(initialContent);
  const [importance, setImportance] = React.useState<NoteImportance>(initialImportance);

  React.useEffect(() => {
    setContent(initialContent);
    setImportance(initialImportance);
  }, [initialContent, initialImportance]);

  const handleSave = () => {
    if (!content.trim()) return;
    onSubmit({ content, importance });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable style={styles.dismissArea} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.indicator} />

          <View style={styles.header}>
            <AppText variant="h2">
              {initialContent ? 'Edit Note' : 'New Internal Note'}
            </AppText>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <AppText style={styles.label}>Note Content</AppText>
            <TextInput
              placeholder="Type your observations here..."
              value={content}
              onChangeText={setContent}
              multiline
              style={styles.input}
              placeholderTextColor={colors.textMuted}
            />

            <AppText style={styles.label}>Importance</AppText>
            <View style={styles.importanceRow}>
              {IMPORTANCE.map((level) => {
                const isActive = importance === level;
                const activeColor = level === 'URGENT' ? colors.danger : level === 'IMPORTANT' ? colors.warning : colors.primary;

                return (
                  <Pressable
                    key={level}
                    onPress={() => setImportance(level)}
                    style={[
                      styles.chip,
                      isActive && { backgroundColor: activeColor + '15', borderColor: activeColor }
                    ]}
                  >
                    <AppText
                      style={[
                        styles.chipText,
                        isActive && { color: activeColor, fontWeight: '700' }
                      ]}
                    >
                      {level}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.footer}>
              <Pressable onPress={handleSave} style={{ flex: 1 }}>
                <LinearGradient
                  colors={[colors.gradientStart, colors.gradientEnd]}
                  style={styles.saveBtn}
                >
                  <AppText style={styles.saveBtnText}>
                    {initialContent ? 'Update Note' : 'Add Note'}
                  </AppText>
                </LinearGradient>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  dismissArea: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: spacing.xl,
    paddingTop: spacing.md,
    maxHeight: '80%',
  },
  indicator: {
    width: 40,
    height: 4,
    backgroundColor: colors.divider,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.primaryLight + '10',
    borderRadius: 16,
    padding: spacing.md,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  importanceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.divider,
    alignItems: 'center',
    backgroundColor: colors.backgroundSoft,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  footer: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  saveBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  saveBtnText: {
    color: colors.surface,
    fontWeight: '700',
    fontSize: 16,
  },
});
