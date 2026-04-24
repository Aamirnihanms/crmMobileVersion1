import AppCard from '@/src/components/common/AppCard';
import AppText from '@/src/components/common/AppText';
import { colors, spacing } from '@/src/theme';
import { callNumber, openEmail, openWhatsApp } from '@/src/utils/contactActions';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, View } from 'react-native';
import { Image } from 'expo-image';
import { useEnableDisableStudent } from '@/src/queries/students.query';

export default function StudentHeader({ student }: any) {
  const profilePic = student.profile_pic || student.dashboard_data?.personal_info?.profile_picture;
  const initials = student.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?';

  const [isActive, setIsActive] = useState<boolean>(student.user?.is_active ?? true);
  const enableDisableMutation = useEnableDisableStudent();

  const handleToggle = (newValue: boolean) => {
    const newStatus = newValue ? 'enable' : 'disable';

    Alert.alert(
      newValue ? 'Enable Student' : 'Disable Student',
      newValue
        ? `Are you sure you want to enable "${student.full_name}"?`
        : `Are you sure you want to disable "${student.full_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: newValue ? 'Enable' : 'Disable',
          style: newValue ? 'default' : 'destructive',
          onPress: () => {
            setIsActive(newValue); // optimistic update
            enableDisableMutation.mutate(
              { student_id: student.student_id, status: newStatus },
              {
                onError: (err: any) => {
                  setIsActive(!newValue); // revert on error
                  const msg =
                    err?.response?.data?.detail ||
                    err?.response?.data?.error ||
                    err?.response?.data?.message ||
                    'Something went wrong. Please try again.';
                  Alert.alert('Error', msg);
                },
              }
            );
          },
        },
      ]
    );
  };

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
          {profilePic ? (
            <Image
              source={{ uri: profilePic }}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={styles.avatar}>
              <AppText variant="h1" color={colors.primary} style={styles.avatarText}>
                {initials}
              </AppText>
            </View>
          )}
          <View style={[styles.statusDot, { backgroundColor: student.status?.color || colors.successBright }]} />
        </View>

        <View style={styles.mainInfo}>
          <View style={styles.nameContainer}>
            <View style={{ flex: 1 }}>
              <AppText variant="h2" style={styles.name}>{student.full_name}</AppText>
              <AppText variant="caption" color={colors.textMuted}>Student ID: {student.student_id}</AppText>
            </View>
            <View style={styles.toggleWrapper}>
              {enableDisableMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Switch
                  value={isActive}
                  onValueChange={handleToggle}
                  trackColor={{ false: colors.danger + '40', true: colors.success + '40' }}
                  thumbColor={isActive ? colors.success : colors.danger}
                  style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                />
              )}
            </View>
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
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                !student.phone_number && styles.disabledBtn,
                pressed && styles.pressedBtn,
              ]}
              onPress={() => callNumber(student.phone_number)}
              disabled={!student.phone_number}
            >
              <Ionicons name="call-outline" size={20} color={student.phone_number ? colors.primary : colors.textMuted} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                { backgroundColor: colors.whatsapp + '15' },
                !(student.user?.whatsapp_number || student.phone_number) && styles.disabledBtn,
                pressed && styles.pressedBtn,
              ]}
              onPress={() => openWhatsApp(student.user?.whatsapp_number || student.phone_number)}
              disabled={!(student.user?.whatsapp_number || student.phone_number)}
            >
              <Ionicons name="logo-whatsapp" size={20} color={colors.whatsapp} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                !student.email && styles.disabledBtn,
                pressed && styles.pressedBtn,
              ]}
              onPress={() => openEmail(student.email)}
              disabled={!student.email}
            >
              <Ionicons name="mail-outline" size={20} color={student.email ? colors.primary : colors.textMuted} />
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
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
    borderWidth: 4,
    borderColor: colors.surface,
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
    borderColor: colors.surface,
  },
  mainInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  toggleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
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
  disabledBtn: {
    opacity: 0.4,
  },
  pressedBtn: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
});
