import AppCard from '@/src/components/common/AppCard';
import AppText from '@/src/components/common/AppText';
import { colors, spacing } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

export default function StudentHeader({ student }: any) {
  const initials = student.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?';

  return (
    <AppCard style={styles.card}>
      <LinearGradient
        colors={[colors.primary, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      />

      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <AppText variant="h1" color={colors.primary} style={styles.avatarText}>
              {initials}
            </AppText>
          </View>
          <View style={[styles.statusDot, { backgroundColor: student.status?.color || '#22C55E' }]} />
        </View>

        <View style={styles.mainInfo}>
          <View>
            <AppText variant="h2" style={styles.name}>{student.full_name}</AppText>
            <AppText variant="caption" color={colors.textMuted}>Student ID: {student.student_id}</AppText>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <AppText variant="caption" color={colors.textSecondary} style={styles.statText}>
                {student.location || 'Not Specified'}
              </AppText>
            </View>
            {student.admission_counselor && (
              <View style={styles.stat}>
                <Ionicons name="person-outline" size={14} color={colors.textMuted} />
                <AppText variant="caption" color={colors.textSecondary} style={styles.statText}>
                  {student.admission_counselor.full_name}
                </AppText>
              </View>
            )}
          </View>

          <View style={styles.actionRow}>
            <Pressable style={styles.actionBtn}>
              <Ionicons name="call-outline" size={20} color={colors.primary} />
            </Pressable>
            <Pressable style={styles.actionBtn}>
              <Ionicons name="mail-outline" size={20} color={colors.primary} />
            </Pressable>
            <Pressable style={[styles.actionBtn, styles.primaryAction]}>
              <AppText color="#fff" style={{ fontWeight: '700' }}>Edit Profile</AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
    padding: 0,
    borderRadius: 24,
    overflow: 'hidden',
  },
  gradientHeader: {
    height: 100,
    width: '100%',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    marginTop: -40,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 4,
    borderColor: '#fff',
  },
  avatarText: {
    fontWeight: '800',
  },
  statusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#fff',
  },
  mainInfo: {
    flex: 1,
  },
  name: {
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 4,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.primaryLight + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryAction: {
    flex: 1,
    height: 44,
    backgroundColor: colors.primary,
    flexDirection: 'row',
  },
});