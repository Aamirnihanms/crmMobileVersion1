import AppText from '@/src/components/common/AppText';
import { colors, spacing } from '@/src/theme';
import { callNumber, openEmail, openWhatsApp } from '@/src/utils/contactActions';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { useEnableDisableStudent } from '@/src/queries/students.query';

export default function StudentHeader({ student }: any) {
  const profilePic =
    student.profile_pic ||
    student.dashboard_data?.personal_info?.profile_picture;
  const initials =
    student.full_name
      ?.split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase() || '?';

  const [isActive, setIsActive] = useState<boolean>(
    student.user?.is_active ?? true
  );
  const enableDisableMutation = useEnableDisableStudent();

  const handleToggle = (newValue: boolean) => {
    Alert.alert(
      newValue ? 'Enable Student' : 'Disable Student',
      `${newValue ? 'Enable' : 'Disable'} "${student.full_name}" portal access?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: newValue ? 'Enable' : 'Disable',
          style: newValue ? 'default' : 'destructive',
          onPress: () => {
            setIsActive(newValue);
            enableDisableMutation.mutate(
              { student_id: student.student_id, status: newValue ? 'enable' : 'disable' },
              {
                onError: (err: any) => {
                  setIsActive(!newValue);
                  Alert.alert(
                    'Error',
                    err?.response?.data?.detail ||
                      err?.response?.data?.error ||
                      'Something went wrong.'
                  );
                },
              }
            );
          },
        },
      ]
    );
  };

  const statusColor = student.status?.color || colors.successBright;

  return (
    <View style={styles.card}>
      {/* ── Top row: avatar + info + toggle ── */}
      <View style={styles.topRow}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {profilePic ? (
            <Image
              source={{ uri: profilePic }}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <AppText style={styles.initials}>{initials}</AppText>
            </View>
          )}
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        </View>

        {/* Name + ID + chips */}
        <View style={styles.infoBlock}>
          <AppText style={styles.name} numberOfLines={1}>
            {student.full_name}
          </AppText>
          <AppText style={styles.studentId}>{student.student_id}</AppText>

          <View style={styles.chipsRow}>
            {!!student.location && (
              <View style={styles.chip}>
                <Ionicons name="location-outline" size={10} color={colors.textMuted} />
                <AppText style={styles.chipTxt} numberOfLines={1}>
                  {student.location}
                </AppText>
              </View>
            )}
            {!!student.admission_counselor && (
              <View style={styles.chip}>
                <Ionicons name="person-outline" size={10} color={colors.textMuted} />
                <AppText style={styles.chipTxt} numberOfLines={1}>
                  {student.admission_counselor.full_name}
                </AppText>
              </View>
            )}
          </View>
        </View>

        {/* Active toggle */}
        <View style={styles.toggleWrap}>
          {enableDisableMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Switch
              value={isActive}
              onValueChange={handleToggle}
              trackColor={{ false: colors.danger + '50', true: colors.success + '50' }}
              thumbColor={isActive ? colors.success : colors.danger}
              style={{ transform: [{ scaleX: 0.78 }, { scaleY: 0.78 }] }}
            />
          )}
          <AppText
            style={[
              styles.toggleLabel,
              { color: isActive ? colors.successStrong : colors.dangerStrong },
            ]}
          >
            {isActive ? 'Active' : 'Inactive'}
          </AppText>
        </View>
      </View>

      {/* ── Divider ── */}
      <View style={styles.divider} />

      {/* ── Contact buttons ── */}
      <View style={styles.contactRow}>
        <Pressable
          style={({ pressed }) => [
            styles.contactBtn,
            pressed && styles.pressed,
            !student.phone_number && styles.disabled,
          ]}
          onPress={() => callNumber(student.phone_number)}
          disabled={!student.phone_number}
        >
          <Ionicons
            name="call-outline"
            size={17}
            color={student.phone_number ? colors.primary : colors.textMuted}
          />
          <AppText
            style={[
              styles.contactTxt,
              { color: student.phone_number ? colors.primary : colors.textMuted },
            ]}
          >
            Call
          </AppText>
        </Pressable>

        <View style={styles.vDivider} />

        <Pressable
          style={({ pressed }) => [
            styles.contactBtn,
            pressed && styles.pressed,
            !(student.user?.whatsapp_number || student.phone_number) && styles.disabled,
          ]}
          onPress={() =>
            openWhatsApp(student.user?.whatsapp_number || student.phone_number)
          }
          disabled={!(student.user?.whatsapp_number || student.phone_number)}
        >
          <Ionicons name="logo-whatsapp" size={17} color={colors.whatsapp} />
          <AppText style={[styles.contactTxt, { color: colors.whatsapp }]}>
            WhatsApp
          </AppText>
        </Pressable>

        <View style={styles.vDivider} />

        <Pressable
          style={({ pressed }) => [
            styles.contactBtn,
            pressed && styles.pressed,
            !student.email && styles.disabled,
          ]}
          onPress={() => openEmail(student.email)}
          disabled={!student.email}
        >
          <Ionicons
            name="mail-outline"
            size={17}
            color={student.email ? colors.primary : colors.textMuted}
          />
          <AppText
            style={[
              styles.contactTxt,
              { color: student.email ? colors.primary : colors.textMuted },
            ]}
          >
            Email
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  avatarWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 15,
  },
  avatarFallback: {
    backgroundColor: colors.primary + '18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  statusDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  infoBlock: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 1,
  },
  studentId: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 5,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: colors.surfaceSubtle,
  },
  chipTxt: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
    maxWidth: 100,
  },
  toggleWrap: {
    alignItems: 'center',
    flexShrink: 0,
  },
  toggleLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: -2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.md,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
  },
  contactTxt: {
    fontSize: 12,
    fontWeight: '700',
  },
  vDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.divider,
  },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.6, transform: [{ scale: 0.97 }] },
});
