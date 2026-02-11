import React from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TextInput,
  Pressable,
} from 'react-native';
import AppText from '../common/AppText';
import { spacing, colors } from '../../theme';
import type { NoteImportance } from '../../api/notes.api';

const IMPORTANCE: NoteImportance[] = [
  'IMPORTANT',
  'NORMAL',
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
  const [content, setContent] =
    React.useState(initialContent);
  const [importance, setImportance] =
    React.useState<NoteImportance>(
      initialImportance
    );

  React.useEffect(() => {
    setContent(initialContent);
    setImportance(initialImportance);
  }, [initialContent, initialImportance]);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <AppText variant="subtitle">
            {initialContent ? 'Edit Note' : 'Add Note'}
          </AppText>

          <TextInput
            placeholder="Write note..."
            value={content}
            onChangeText={setContent}
            multiline
            style={styles.input}
          />

          <View style={styles.row}>
            {IMPORTANCE.map((level) => (
              <Pressable
                key={level}
                onPress={() => setImportance(level)}
                style={[
                  styles.chip,
                  importance === level &&
                    styles.activeChip,
                ]}
              >
                <AppText
                  style={
                    importance === level
                      ? styles.activeText
                      : undefined
                  }
                >
                  {level}
                </AppText>
              </Pressable>
            ))}
          </View>

          <View style={styles.actions}>
            <Pressable onPress={onClose}>
              <AppText>Cancel</AppText>
            </Pressable>

            <Pressable
              onPress={() => {
                if (!content.trim()) return;
                onSubmit({ content, importance });
              }}
            >
              <AppText color={colors.primary}>
                Save
              </AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  card: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    minHeight: 80,
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  activeChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  activeText: {
    color: 'white',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
});
