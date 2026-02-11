import { View, StyleSheet } from 'react-native';
import AppText from '../common/AppText';
import { spacing, colors } from '../../theme';
import type { LeadNote } from '../../api/notes.api';

export default function NoteCard({ note }: { note: LeadNote }) {
  return (
    <View style={styles.card}>
      <AppText>{note.content}</AppText>

      <View style={styles.footer}>
        <AppText variant="caption" color={colors.textSecondary}>
          {note.time_since_created}
        </AppText>

        <AppText variant="caption" color={colors.primary}>
          {note.created_by_details.full_name}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: 8,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
});
