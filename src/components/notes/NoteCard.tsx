import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import type { LeadNote } from '../../api/notes.api';
import { colors, spacing } from '@/src/theme';
import AppCard from '../common/AppCard';
import AppText from '../common/AppText';

export default function NoteCard({ note, onEdit }: { note: LeadNote; onEdit?: () => void }) {
  const initials = note.created_by_details?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?';

  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.authorRow}>
          <View style={styles.avatarMini}>
            <AppText variant="caption" color={colors.primary} style={styles.avatarText}>
              {initials}
            </AppText>
          </View>
          <View>
            <AppText variant="subtitle" style={styles.authorName}>
              {note.created_by_details?.full_name || 'Unknown User'}
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {note.time_since_created}
            </AppText>
          </View>
        </View>
        {onEdit && (
          <Pressable 
            onPress={onEdit}
            style={({ pressed }) => [
              styles.editButton,
              pressed && { opacity: 0.7 }
            ]}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
          </Pressable>
        )}
      </View>

      <AppText style={styles.content} color={colors.textPrimary}>
        {note.content}
      </AppText>

      {note.importance !== 'NORMAL' && (
        <View style={[
          styles.importanceBadge,
          { backgroundColor: note.importance === 'URGENT' ? colors.danger + '10' : colors.warning + '15' }
        ]}>
          <Ionicons
            name="alert-circle"
            size={12}
            color={note.importance === 'URGENT' ? colors.danger : colors.warning}
          />
          <AppText
            variant="caption"
            color={note.importance === 'URGENT' ? colors.danger : colors.warning}
            style={styles.importanceText}
          >
            {note.importance}
          </AppText>
        </View>
      )}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  editButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: colors.primaryLight + '10',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontWeight: '700',
    fontSize: 12,
  },
  authorName: {
    fontWeight: '700',
    fontSize: 13,
  },
  content: {
    lineHeight: 20,
    fontSize: 14,
  },
  importanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    backgroundColor: colors.danger + '10',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
  },
  importanceText: {
    fontWeight: '700',
    fontSize: 10,
    textTransform: 'uppercase',
  },
});
