import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { colors, spacing } from '@/src/theme';
import AppCard from '../../components/common/AppCard';
import AppText from '../../components/common/AppText';
import AddCompanyJobModal from '../../components/jobs/AddCompanyJobModal';
import AddPortalUserModal from '../../components/jobs/AddPortalUserModal';
import type { MoreStackParamList } from '../../navigation/MoreStack';
import {
  useCompanyDetail,
  useCompanyFieldTemplates,
  useCompanyJobs,
  useCompanyPortalUsers,
  useDeleteCompany,
} from '../../queries/jobs.query';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type CompanyDetailRouteProp = RouteProp<MoreStackParamList, 'CompanyDetail'>;

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const openLink = (url: string | null) => {
  if (url) Linking.openURL(url);
};

/* ─── Mini inline loader ─── */
function SectionLoader() {
  return (
    <View style={{ paddingVertical: 20, alignItems: 'center' }}>
      <ActivityIndicator size="small" color={colors.primary} />
    </View>
  );
}

/* ─── Section header ─── */
function SectionHeader({
  title,
  count,
  onAdd,
}: {
  title: string;
  count?: number;
  onAdd?: () => void;
}) {
  return (
    <View style={sectionStyles.header}>
      <AppText variant="h3" style={sectionStyles.title}>{title}</AppText>
      {count !== undefined && (
        <View style={sectionStyles.countBadge}>
          <AppText variant="caption" color={colors.primary} style={{ fontWeight: '700' }}>{count}</AppText>
        </View>
      )}
      {onAdd && (
        <Pressable onPress={onAdd} style={sectionStyles.addBtn}>
          <Ionicons name="add-circle" size={26} color={colors.primary} />
        </Pressable>
      )}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginLeft: 4,
  },
  title: {
    fontWeight: '800',
    color: colors.textPrimary,
    flex: 1,
  },
  countBadge: {
    backgroundColor: colors.primaryLight + '20',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.primaryLight + '30',
    marginRight: spacing.sm,
  },
  addBtn: {
    padding: 2,
  },
});

export default function CompanyDetailScreen() {
  const route = useRoute<CompanyDetailRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const { uid } = route.params;

  const { data: companyRes, isLoading, isError, error, refetch } = useCompanyDetail(uid);
  const { data: portalUsersRes, isLoading: loadingUsers, refetch: refetchUsers } = useCompanyPortalUsers(uid);
  const { data: templatesRes, isLoading: loadingTemplates, refetch: refetchTemplates } = useCompanyFieldTemplates(uid);
  const { data: jobsRes, isLoading: loadingJobs, refetch: refetchJobs } = useCompanyJobs(uid);

  const deleteMutation = useDeleteCompany();

  const handleDelete = () => {
    if (!companyRes) return;
    Alert.alert(
      'Delete Company',
      `Are you sure you want to delete "${companyRes.company.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(uid, {
              onSuccess: () => navigation.goBack(),
              onError: (error: any) =>
                Alert.alert('Error', error?.response?.data?.message || 'Failed to delete company'),
            });
          },
        },
      ]
    );
  };

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddJobModal, setShowAddJobModal] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !companyRes) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <AppText color={colors.danger} style={styles.errorText}>
          {(() => {
            const err = error as any;
            return err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Failed to load company';
          })()}
        </AppText>
        <Pressable onPress={() => refetch()} style={styles.retryBtn}>
          <AppText color={colors.primary}>Try Again</AppText>
        </Pressable>
      </View>
    );
  }

  const { company } = companyRes;
  const initials = company.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ── HEADER ── */}
      <View style={styles.headerSection}>
        <LinearGradient
          colors={[colors.info, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBg}
        />
        <View style={styles.headerContent}>
          {/* Logo */}
          <View style={styles.logoWrapper}>
            {company.logo ? (
              <Image source={{ uri: company.logo }} style={styles.logoImage} />
            ) : (
              <AppText style={styles.initialsText}>{initials}</AppText>
            )}
          </View>

          <AppText variant="h1" color={colors.surface} style={styles.companyName}>
            {company.name}
          </AppText>

          {/* Status row */}
          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, company.is_active ? styles.activeBadge : styles.inactiveBadge]}>
              <View style={[styles.statusDot, company.is_active ? styles.activeDot : styles.inactiveDot]} />
              <AppText variant="caption" color={company.is_active ? colors.success : colors.textMuted} style={{ fontWeight: '700' }}>
                {company.is_active ? 'Active' : 'Inactive'}
              </AppText>
            </View>
            {company.portal_slug && (
              <View style={styles.slugBadge}>
                <Ionicons name="globe-outline" size={12} color={colors.surface} />
                <AppText variant="caption" color={colors.surface} style={{ marginLeft: 4 }}>
                  {company.portal_slug}
                </AppText>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.content}>

        {/* ── CONTACT INFO ── */}
        <AppCard style={styles.card}>
          <AppText variant="subtitle" style={styles.cardLabel}>Contact Information</AppText>

          {company.website && (
            <Pressable style={styles.infoRow} onPress={() => openLink(company.website)}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="globe-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.infoText}>
                <AppText variant="caption" color={colors.textMuted}>Website</AppText>
                <AppText variant="body" color={colors.primary}>{company.website}</AppText>
              </View>
              <Ionicons name="open-outline" size={16} color={colors.textMuted} />
            </Pressable>
          )}

          {company.contact_email && (
            <Pressable style={styles.infoRow} onPress={() => openLink(`mailto:${company.contact_email}`)}>
              <View style={[styles.iconCircle, { backgroundColor: colors.info + '15' }]}>
                <Ionicons name="mail-outline" size={18} color={colors.info} />
              </View>
              <View style={styles.infoText}>
                <AppText variant="caption" color={colors.textMuted}>Email</AppText>
                <AppText variant="body" color={colors.textPrimary}>{company.contact_email}</AppText>
              </View>
            </Pressable>
          )}

          {company.contact_phone && (
            <Pressable style={styles.infoRow} onPress={() => openLink(`tel:${company.contact_phone}`)}>
              <View style={[styles.iconCircle, { backgroundColor: colors.success + '15' }]}>
                <Ionicons name="call-outline" size={18} color={colors.success} />
              </View>
              <View style={styles.infoText}>
                <AppText variant="caption" color={colors.textMuted}>Phone</AppText>
                <AppText variant="body" color={colors.textPrimary}>{company.contact_phone}</AppText>
              </View>
            </Pressable>
          )}

          {company.address && (
            <View style={[styles.infoRow, styles.noBorder]}>
              <View style={[styles.iconCircle, { backgroundColor: colors.warning + '15' }]}>
                <Ionicons name="location-outline" size={18} color={colors.warning} />
              </View>
              <View style={styles.infoText}>
                <AppText variant="caption" color={colors.textMuted}>Address</AppText>
                <AppText variant="body" color={colors.textPrimary}>{company.address.replace(/\r?\n/g, ', ')}</AppText>
              </View>
            </View>
          )}
        </AppCard>

        {/* ── REPRESENTATIVES ── */}
        {company.representatives && company.representatives.length > 0 && (
          <>
            <SectionHeader title="Representatives" count={company.representatives.length} />
            <AppCard style={styles.card}>
              {company.representatives.map((rep: any, i: number) => (
                <View key={rep.uid || i} style={[styles.repRow, i === company.representatives.length - 1 && styles.noBorder]}>
                  <View style={styles.repAvatar}>
                    <AppText style={styles.repAvatarText}>
                      {rep.full_name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
                    </AppText>
                  </View>
                  <View style={styles.repInfo}>
                    <AppText variant="subtitle" style={{ fontWeight: '700' }}>{rep.full_name}</AppText>
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                      {rep.email && (
                        <Pressable onPress={() => openLink(`mailto:${rep.email}`)} style={styles.repContact}>
                          <Ionicons name="mail-outline" size={13} color={colors.info} />
                          <AppText variant="caption" color={colors.textMuted} style={{ marginLeft: 4 }}>{rep.email}</AppText>
                        </Pressable>
                      )}
                      {rep.phone && (
                        <Pressable onPress={() => openLink(`tel:${rep.phone}`)} style={styles.repContact}>
                          <Ionicons name="call-outline" size={13} color={colors.success} />
                          <AppText variant="caption" color={colors.textMuted} style={{ marginLeft: 4 }}>{rep.phone}</AppText>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </AppCard>
          </>
        )}

        {/* ── PORTAL USERS ── */}
        <SectionHeader
          title="Portal Users"
          count={portalUsersRes?.count}
          onAdd={() => setShowAddUserModal(true)}
        />
        <AppCard style={styles.card}>
          {loadingUsers ? <SectionLoader /> : (
            portalUsersRes && portalUsersRes.results.length > 0 ? (
              portalUsersRes.results.map((user, i) => (
                <View key={user.uid} style={[styles.repRow, i === portalUsersRes.results.length - 1 && styles.noBorder]}>
                  <View style={[styles.repAvatar, { backgroundColor: colors.info + '15' }]}>
                    <AppText style={[styles.repAvatarText, { color: colors.info }]}>
                      {user.full_name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
                    </AppText>
                  </View>
                  <View style={styles.repInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <AppText variant="subtitle" style={{ fontWeight: '700' }}>{user.full_name}</AppText>
                      <View style={[styles.microBadge, user.is_active ? styles.microActive : styles.microInactive]}>
                        <AppText variant="caption" color={user.is_active ? colors.success : colors.textMuted} style={{ fontSize: 10, fontWeight: '700' }}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </AppText>
                      </View>
                    </View>
                    <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 2 }}>@{user.username} · {user.email}</AppText>
                    <AppText variant="caption" color={colors.textMuted}>
                      Last login: {user.last_login_at ? formatDate(user.last_login_at) : 'Never'}
                    </AppText>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptySection}>
                <Ionicons name="person-outline" size={28} color={colors.textMuted} />
                <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 6 }}>No portal users</AppText>
              </View>
            )
          )}
        </AppCard>

        {/* ── FIELD TEMPLATES ── */}
        <SectionHeader
          title="Field Templates"
          count={templatesRes?.count}
          onAdd={() => navigation.navigate('CreateEditFieldTemplate', { companyUid: uid })}
        />
        <AppCard style={styles.card}>
          {loadingTemplates ? <SectionLoader /> : (
            templatesRes && templatesRes.results.length > 0 ? (
              templatesRes.results.map((tmpl, i) => (
                <Pressable
                  key={tmpl.uid}
                  onPress={() => navigation.navigate('FieldTemplateDetail', { companyUid: uid, templateUid: tmpl.uid })}
                  style={[styles.repRow, i === templatesRes.results.length - 1 && styles.noBorder]}
                >
                  <View style={[styles.iconCircle, { backgroundColor: colors.warning + '15', marginRight: spacing.md }]}>
                    <Ionicons name="document-text-outline" size={20} color={colors.warning} />
                  </View>
                  <View style={styles.repInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <AppText variant="subtitle" style={{ fontWeight: '700', flex: 1 }}>{tmpl.name}</AppText>
                      <AppText variant="caption" color={colors.textMuted}>{tmpl.items_count} field{tmpl.items_count !== 1 ? 's' : ''}</AppText>
                    </View>
                    {tmpl.description ? (
                      <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 2 }}>{tmpl.description}</AppText>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>
              ))
            ) : (
              <View style={styles.emptySection}>
                <Ionicons name="document-outline" size={28} color={colors.textMuted} />
                <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 6 }}>No field templates</AppText>
              </View>
            )
          )}
        </AppCard>

        {/* ── COMPANY JOBS ── */}
        <SectionHeader
          title="Jobs"
          count={jobsRes?.count}
          onAdd={() => setShowAddJobModal(true)}
        />
        {loadingJobs ? (
          <AppCard style={styles.card}><SectionLoader /></AppCard>
        ) : jobsRes && jobsRes.results.length > 0 ? (
          jobsRes.results.map((job) => (
            <Pressable
              key={job.uid}
              onPress={() => navigation.navigate('JobDetail', { uid: job.uid })}
            >
              <AppCard style={[styles.card, styles.jobCard]}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15', marginRight: spacing.md }]}>
                    <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="subtitle" style={{ fontWeight: '700' }} numberOfLines={1}>{job.title}</AppText>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 4 }}>
                      {job.location ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                          <AppText variant="caption" color={colors.textMuted} style={{ marginLeft: 3 }}>{job.location}</AppText>
                        </View>
                      ) : null}
                      {job.expires_at ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                          <AppText variant="caption" color={colors.textMuted} style={{ marginLeft: 3 }}>Exp: {formatDate(job.expires_at)}</AppText>
                        </View>
                      ) : null}
                    </View>
                    <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 2 }}>
                      Posted by {job.creator.full_name}
                    </AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </View>
              </AppCard>
            </Pressable>
          ))
        ) : (
          <AppCard style={styles.card}>
            <View style={styles.emptySection}>
              <Ionicons name="briefcase-outline" size={28} color={colors.textMuted} />
              <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 6 }}>No jobs posted yet</AppText>
            </View>
          </AppCard>
        )}

        {/* Footer metadata */}
        <AppCard style={[styles.card, { marginTop: spacing.sm }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <AppText variant="caption" color={colors.textMuted}>Created</AppText>
              <AppText variant="body" style={{ fontWeight: '600' }}>{formatDate(company.created_at)}</AppText>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <AppText variant="caption" color={colors.textMuted}>Last Updated</AppText>
              <AppText variant="body" style={{ fontWeight: '600' }}>{formatDate(company.updated_at)}</AppText>
            </View>
          </View>
        </AppCard>

        {/* Danger Zone */}
        <AppCard style={[styles.card, styles.dangerCard]}>
          <View style={styles.dangerHeader}>
            <Ionicons name="warning-outline" size={18} color={colors.danger} />
            <AppText variant="subtitle" style={styles.dangerTitle}>Danger Zone</AppText>
          </View>
          <AppText variant="caption" color={colors.textMuted} style={styles.dangerSubtitle}>
            Deleting this company is permanent and cannot be undone.
          </AppText>
          <Pressable
            onPress={handleDelete}
            disabled={deleteMutation.isPending}
            style={({ pressed }) => [
              styles.deleteBtn,
              { opacity: pressed || deleteMutation.isPending ? 0.7 : 1 },
            ]}
          >
            <Ionicons
              name={deleteMutation.isPending ? 'hourglass-outline' : 'trash-outline'}
              size={18}
              color={colors.surface}
            />
            <AppText variant="body" color={colors.surface} style={styles.deleteBtnText}>
              {deleteMutation.isPending ? 'Deleting…' : 'Delete Company'}
            </AppText>
          </Pressable>
        </AppCard>

        <View style={{ height: 40 }} />
      </View>

      {companyRes && (
        <AddPortalUserModal
          visible={showAddUserModal}
          companyId={companyRes.company.id}
          companyUid={uid}
          onClose={() => setShowAddUserModal(false)}
          onSuccess={() => {
            setShowAddUserModal(false);
            refetchUsers();
          }}
        />
      )}

      {templatesRes && (
        <AddCompanyJobModal
          visible={showAddJobModal}
          companyUid={uid}
          templates={templatesRes.results}
          onClose={() => setShowAddJobModal(false)}
          onSuccess={() => {
            setShowAddJobModal(false);
            refetchJobs();
          }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  errorText: {
    marginTop: spacing.md,
    textAlign: 'center',
    fontWeight: '600',
  },
  retryBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primaryLight + '15',
  },
  /* Header */
  headerSection: {
    position: 'relative',
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: 48,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    alignItems: 'center',
  },
  headerBg: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  logoWrapper: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  initialsText: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.primary,
  },
  companyName: {
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  activeBadge: { backgroundColor: colors.success + '20' },
  inactiveBadge: { backgroundColor: 'rgba(255,255,255,0.1)' },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  activeDot: { backgroundColor: colors.success },
  inactiveDot: { backgroundColor: colors.textMuted },
  slugBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  /* Content */
  content: {
    padding: spacing.lg,
    marginTop: -24,
  },
  card: {
    borderRadius: 20,
    marginBottom: spacing.xl,
  },
  jobCard: {
    marginBottom: spacing.md,
  },
  cardLabel: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  /* Info rows */
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSubtle,
  },
  noBorder: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  infoText: {
    flex: 1,
  },
  /* Reps */
  repRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSubtle,
  },
  repAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  repAvatarText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 15,
  },
  repInfo: {
    flex: 1,
  },
  repContact: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  microBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  microActive: { backgroundColor: colors.success + '15', borderColor: colors.success + '30' },
  microInactive: { backgroundColor: colors.surfaceSubtle, borderColor: colors.surfaceSubtle },
  emptySection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  /* Danger zone */
  dangerCard: {
    borderWidth: 1,
    borderColor: colors.danger + '30',
    backgroundColor: colors.dangerBgSoft,
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  dangerTitle: {
    fontWeight: '800',
    color: colors.dangerStrong,
  },
  dangerSubtitle: {
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.danger,
    paddingVertical: 12,
    borderRadius: 12,
  },
  deleteBtnText: {
    fontWeight: '700',
  },
});
