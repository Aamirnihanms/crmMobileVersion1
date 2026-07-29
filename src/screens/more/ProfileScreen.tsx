import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View, TextInput, TouchableOpacity } from 'react-native';

import AppCard from '@/src/components/common/AppCard';
import AppLoader from '@/src/components/common/AppLoader';
import AppText from '@/src/components/common/AppText';
import { useProfile } from '@/src/queries/profile.query';
import { useLeadStatuses } from '@/src/queries/masters/leadStatuses.query';
import { useAuthStore } from '@/src/store/auth.store';
import { useAppTheme, spacing } from '@/src/theme';
import {
  getCustomLeadFilters,
  saveCustomLeadFilter,
  deleteCustomLeadFilter,
  type CustomLeadFilter,
} from '@/src/utils/customFiltersStorage';

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <View style={styles.infoTextWrap}>
        <AppText variant="caption" color={colors.textMuted}>
          {label}
        </AppText>
        <AppText variant="subtitle" style={styles.infoValue}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Not available';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return date.toLocaleString('en-IN');
};

const getInitials = (name?: string | null) => {
  if (!name) return '?';

  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

const getBranchLabel = (branch: { name?: string } | string | null) => {
  if (!branch) return 'Not assigned';
  if (typeof branch === 'string') return branch;
  return branch.name || 'Not assigned';
};

function ProfileLeadFiltersConfig() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  
  const [filterName, setFilterName] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [savedFilters, setSavedFilters] = useState<CustomLeadFilter[]>([]);

  // Fetch lead statuses list
  const { data: statuses } = useLeadStatuses();

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    const list = await getCustomLeadFilters();
    setSavedFilters(list);
  };

  const handleSave = async () => {
    if (!filterName.trim()) {
      Alert.alert('Error', 'Please enter a filter name.');
      return;
    }
    if (!selectedStatus) {
      Alert.alert('Error', 'Please select a lead status.');
      return;
    }

    const updatedList = await saveCustomLeadFilter(filterName.trim(), selectedStatus);
    setSavedFilters(updatedList);
    setFilterName('');
    setSelectedStatus('');
    Alert.alert('Success', 'Lead filter button saved!');
  };

  const handleDelete = async (id: string) => {
    const updatedList = await deleteCustomLeadFilter(id);
    setSavedFilters(updatedList);
  };

  return (
    <AppCard style={styles.sectionCard}>
      <AppText variant="title" style={styles.sectionTitle}>
        Create Custom Filter Button
      </AppText>
      
      <TextInput
        style={styles.configInput}
        placeholder="Button Name (e.g. Hot Leads)"
        placeholderTextColor={colors.textMuted}
        value={filterName}
        onChangeText={setFilterName}
      />

      <AppText variant="caption" color={colors.textSecondary} style={{ marginBottom: spacing.xs }}>
        Select Lead Status:
      </AppText>
      <View style={styles.statusRow}>
        {statuses?.map((st) => {
          const isActive = selectedStatus === String(st.id);
          return (
            <TouchableOpacity 
              key={st.id} 
              style={[styles.statusChip, isActive && styles.statusChipActive]}
              onPress={() => setSelectedStatus(String(st.id))}
            >
              <AppText style={[styles.chipText, isActive && styles.chipTextActive]}>
                {st.name}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      <Pressable style={styles.saveFilterBtn} onPress={handleSave}>
        <AppText variant="button" color={colors.surface}>
          Save Filter Button
        </AppText>
      </Pressable>

      <AppText variant="title" style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
        Saved Buttons
      </AppText>
      {savedFilters.length === 0 ? (
        <AppText color={colors.textMuted} variant="body">
          No custom filter buttons saved yet.
        </AppText>
      ) : (
        savedFilters.map((item) => (
          <View key={item.id} style={styles.savedFilterRow}>
            <View style={{ flex: 1 }}>
              <AppText variant="subtitle" style={{ fontWeight: '600' }}>
                {item.name}
              </AppText>
              <AppText variant="caption" color={colors.textMuted}>
                Status: {statuses?.find(st => String(st.id) === item.options.lead_status)?.name || `ID ${item.options.lead_status}`}
              </AppText>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: spacing.xs }}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
          </View>
        ))
      )}
    </AppCard>
  );
}

export default function ProfileScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<any>();
  const { data: user, isLoading, isError, refetch, isRefetching } = useProfile();
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        },
      ]
    );
  };

  if (isLoading) return <AppLoader />;

  if (isError || !user) {
    return (
      <View style={styles.errorWrap}>
        <Ionicons name="cloud-offline-outline" size={30} color={colors.danger} />
        <AppText variant="subtitle" style={styles.errorTitle}>
          Unable to load profile
        </AppText>
        <AppText variant="body" color={colors.textSecondary} style={styles.errorText}>
          Please check your network and try again.
        </AppText>
        <Pressable style={styles.retryButton} onPress={() => refetch()}>
          <AppText variant="button" color={colors.surface}>
            {isRefetching ? 'Retrying...' : 'Retry'}
          </AppText>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <AppCard style={styles.headerCard}>
        <LinearGradient
          colors={[colors.primary, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />

        <View style={styles.headerContent}>
          <View style={styles.avatarWrap}>
            {user.profile_pic ? (
              <Image source={{ uri: user.profile_pic }} style={styles.avatarImage} />
            ) : (
              <AppText variant="h1" color={colors.primary} style={styles.avatarText}>
                {getInitials(user.full_name)}
              </AppText>
            )}
          </View>

          <View style={styles.headerInfo}>
            <AppText variant="h2" color={colors.surface} style={styles.name}>
              {user.full_name || 'Unknown User'}
            </AppText>
            <AppText variant="subtitle" color="rgba(255,255,255,0.9)">
              {user.role_details?.label || 'User'}
            </AppText>

            <View style={styles.badgesRow}>
              <View style={[styles.badge, { backgroundColor: user.is_active ? colors.success : colors.danger }]}>
                <AppText variant="caption" color={colors.surface} style={styles.badgeText}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </AppText>
              </View>
              {/* <View style={[styles.badge, { backgroundColor: user.phone_verified ? colors.successDeep : colors.warning }]}>
                <AppText variant="caption" color={colors.surface} style={styles.badgeText}>
                  {user.phone_verified ? 'Phone Verified' : 'Phone Not Verified'}
                </AppText>
              </View> */}
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.editBtn, pressed && styles.pressedBtn]}
            onPress={() => navigation.navigate('EditProfile', { user })}
          >
            <Ionicons name="create-outline" size={22} color={colors.surface} />
          </Pressable>
        </View>

        {/* <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              !user.phone && styles.actionDisabled,
              pressed && styles.pressedBtn,
            ]}
            onPress={() => callNumber(user.phone)}
            disabled={!user.phone}
          >
            <Ionicons name="call-outline" size={20} color={user.phone ? colors.primary : colors.textMuted} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              styles.whatsappBtn,
              !user.whatsapp_number && styles.actionDisabled,
              pressed && styles.pressedBtn,
            ]}
            onPress={() => openWhatsApp(user.whatsapp_number)}
            disabled={!user.whatsapp_number}
          >
            <Ionicons name="logo-whatsapp" size={20} color={colors.whatsapp} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              !user.email && styles.actionDisabled,
              pressed && styles.pressedBtn,
            ]}
            onPress={() => openEmail(user.email)}
            disabled={!user.email}
          >
            <Ionicons name="mail-outline" size={20} color={user.email ? colors.primary : colors.textMuted} />
          </Pressable>
        </View> */}
      </AppCard>

      <AppCard style={styles.sectionCard}>
        <AppText variant="title" style={styles.sectionTitle}>
          Contact Details
        </AppText>
        <InfoRow icon="mail-outline" label="Email" value={user.email || 'Not available'} />
        <InfoRow icon="call-outline" label="Phone" value={user.phone || 'Not available'} />
        <InfoRow icon="logo-whatsapp" label="WhatsApp" value={user.whatsapp_number || 'Not available'} />
      </AppCard>

      <AppCard style={styles.sectionCard}>
        <AppText variant="title" style={styles.sectionTitle}>
          Account Details
        </AppText>
        <InfoRow icon="shield-checkmark-outline" label="Role" value={user.role_details?.label || String(user.role)} />
        <InfoRow icon="people-outline" label="Branch" value={getBranchLabel(user.branch)} />
        {/* <InfoRow icon="finger-print-outline" label="User ID" value={user.uid} /> */}
        <InfoRow icon="person-outline" label="Staff Access" value={user.is_staff ? 'Yes' : 'No'} />
        <InfoRow icon="flash-outline" label="Superuser Access" value={user.is_superuser ? 'Yes' : 'No'} />
      </AppCard>

      <AppCard style={styles.sectionCard}>
        <AppText variant="title" style={styles.sectionTitle}>
          Activity
        </AppText>
        <InfoRow icon="log-in-outline" label="Last Login" value={formatDateTime(user.last_login)} />
        <InfoRow icon="calendar-outline" label="Created At" value={formatDateTime(user.created_at)} />
        <InfoRow icon="refresh-outline" label="Updated At" value={formatDateTime(user.updated_at)} />
      </AppCard>

      <ProfileLeadFiltersConfig />

      <AppCard style={styles.logoutCard}>
        <Pressable
          style={({ pressed }) => [styles.logoutButton, pressed && styles.pressedBtn]}
          onPress={handleLogout}
        >
          <View style={styles.logoutIconWrapper}>
            <Ionicons name="log-out-outline" size={22} color={colors.danger} />
          </View>
          <View style={styles.logoutTextWrapper}>
            <AppText variant="subtitle" color={colors.danger} style={styles.logoutLabel}>
              Sign Out
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              Securely log out of your account
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      </AppCard>
    </ScrollView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xl + spacing.lg,
  },
  headerCard: {
    padding: 0,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xl,
    paddingBottom: spacing.lg,
  },
  avatarWrap: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontWeight: '800',
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  name: {
    fontWeight: '800',
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  badgesRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDisabled: {
    opacity: 0.45,
  },
  whatsappBtn: {
    backgroundColor: colors.whatsapp + '15',
  },
  pressedBtn: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  sectionCard: {
    marginBottom: spacing.lg,
    borderRadius: 18,
    paddingVertical: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.md,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  infoIconWrap: {
    width: 28,
    paddingTop: 2,
    alignItems: 'center',
  },
  infoTextWrap: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  infoValue: {
    marginTop: 2,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
  errorTitle: {
    marginTop: spacing.md,
    fontWeight: '700',
  },
  errorText: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  configInput: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.md,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    fontSize: 14,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  statusChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  statusChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  chipText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  chipTextActive: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: 'bold',
  },
  saveFilterBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  savedFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logoutCard: {
    padding: 0,
    borderRadius: 20,
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.danger + '15',
    overflow: 'hidden',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
  },
  logoutIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.danger + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  logoutTextWrapper: {
    flex: 1,
  },
  logoutLabel: {
    fontWeight: '800',
  },
});
