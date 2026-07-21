import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import React, { useCallback, useLayoutEffect, useState } from 'react';
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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAppTheme, spacing } from '@/src/theme';
import { API_CONFIG } from '@/src/config/api.config';
import AppCard from '../../components/common/AppCard';
import AppText from '../../components/common/AppText';
import EditJobModal from '../../components/jobs/EditJobModal';
import ShareJobModal from '../../components/jobs/ShareJobModal';
import type { MoreStackParamList } from '../../navigation/MoreStack';
import { useDeleteJob, useJobDetail } from '../../queries/jobs.query';
import { JobStage } from '../../api/jobs.api';

type JobDetailRouteProp = RouteProp<MoreStackParamList, 'JobDetail'>;

export default function JobDetailScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const route = useRoute<JobDetailRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const { uid } = route.params;

  const { data: detailResponse, isLoading, isError, error, refetch } = useJobDetail(uid);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const deleteMutation = useDeleteJob(detailResponse?.company_uid ?? '');

  const handleDelete = useCallback(() => {
    if (!detailResponse) return;
    Alert.alert(
      'Delete Job',
      `Are you sure you want to delete "${detailResponse.job.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(detailResponse.job.uid, {
              onSuccess: () => navigation.goBack(),
              onError: (error: any) =>
                Alert.alert('Error', error?.response?.data?.message || 'Failed to delete job'),
            });
          },
        },
      ]
    );
  }, [detailResponse, deleteMutation, navigation]);

  useLayoutEffect(() => {
    if (!detailResponse) return;
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            onPress={() => setShowEditModal(true)}
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primaryLight + '15',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 8,
            })}
          >
            <Ionicons name="pencil" size={20} color={colors.primary} />
          </Pressable>
          <Pressable
            onPress={handleDelete}
            disabled={deleteMutation.isPending}
            style={({ pressed }) => ({
              opacity: pressed || deleteMutation.isPending ? 0.7 : 1,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.danger + '15',
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <Ionicons
              name={deleteMutation.isPending ? 'hourglass-outline' : 'trash-outline'}
              size={20}
              color={colors.danger}
            />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, detailResponse, deleteMutation, handleDelete]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !detailResponse) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <AppText color={colors.danger} style={styles.errorText}>
          {((error as any)?.response?.data?.detail) || ((error as any)?.response?.data?.error) || ((error as Error)?.message || 'Failed to load job details')}
        </AppText>
        <Pressable onPress={() => refetch()} style={styles.retryBtn}>
          <AppText color={colors.primary}>Try Again</AppText>
        </Pressable>
      </View>
    );
  }

  const { job, custom_fields, stages } = detailResponse;
  const isExpired = job.is_expired;
  
  // Sort stages by sort_order
  const sortedStages = [...(stages || [])].sort((a, b) => a.sort_order - b.sort_order);

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

  return (
    <>
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View style={styles.headerSection}>
        <LinearGradient
          colors={[colors.primary, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBackground}
        />
        <View style={styles.headerContent}>
          <View style={styles.headerTopRow}>
            <View style={[styles.statusBadge, isExpired ? styles.statusExpired : styles.statusActive]}>
              <AppText variant="caption" color={isExpired ? colors.danger : colors.success} style={{ fontWeight: '700' }}>
                {isExpired ? 'Expired' : 'Active'}
              </AppText>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={styles.dateBadge}>
                <Ionicons name="calendar-outline" size={14} color={colors.surface} />
                <AppText variant="caption" color={colors.surface} style={{ marginLeft: 4 }}>
                  {formatDate(job.published_at || job.created_at)}
                </AppText>
              </View>
              {job.expires_at && (
                <View style={[styles.dateBadge, { backgroundColor: 'rgba(255,0,0,0.2)' }]}>
                  <Ionicons name="time-outline" size={14} color={colors.surface} />
                  <AppText variant="caption" color={colors.surface} style={{ marginLeft: 4 }}>
                    Exp: {formatDate(job.expires_at)}
                  </AppText>
                </View>
              )}
            </View>
          </View>
          <AppText variant="h1" color={colors.surface} style={styles.jobTitle}>
            {job.title}
          </AppText>
          <View style={styles.headerDetailsRow}>
            <View style={styles.headerDetailItem}>
              <Ionicons name="location-outline" size={16} color={colors.surface} />
              <AppText variant="body" color={colors.surface} style={styles.headerDetailText}>
                {job.location || 'Not Specified'}
              </AppText>
            </View>
            <View style={styles.headerDetailItem}>
              <Ionicons name="people-outline" size={16} color={colors.surface} />
              <AppText variant="body" color={colors.surface} style={styles.headerDetailText}>
                {job.applications_count} Apps
              </AppText>
            </View>
            {job.creator && (
              <View style={styles.headerDetailItem}>
                <Ionicons name="person-outline" size={16} color={colors.surface} />
                <AppText variant="body" color={colors.surface} style={styles.headerDetailText} numberOfLines={1}>
                  By {job.creator.full_name}
                </AppText>
              </View>
            )}
          </View>
        </View>
      </View>

      <View style={styles.contentContainer}>
        {/* Company Section */}
        <AppCard style={styles.companyCard}>
          <View style={styles.companyHeader}>
            <View style={styles.companyLogoContainer}>
              {job.company.logo ? (
                <Image source={{ uri: job.company.logo }} style={styles.companyLogo} />
              ) : (
                <Ionicons name="business-outline" size={32} color={colors.primary} />
              )}
            </View>
            <View style={styles.companyInfo}>
              <AppText variant="h3" style={{ fontWeight: '700' }}>
                {job.company.name}
              </AppText>
              {job.company.website && (
                <Pressable onPress={() => openLink(job.company.website)}>
                  <AppText variant="caption" color={colors.primary} style={{ marginTop: 2 }}>
                    Visit Website
                  </AppText>
                </Pressable>
              )}
            </View>
          </View>
          
          <View style={styles.companyContactRow}>
            {job.company.contact_email && (
              <Pressable style={styles.contactItem} onPress={() => openLink(`mailto:${job.company.contact_email}`)}>
                <View style={styles.contactIconCircle}>
                  <Ionicons name="mail-outline" size={18} color={colors.info} />
                </View>
                <AppText variant="caption" color={colors.textPrimary}>{job.company.contact_email}</AppText>
              </Pressable>
            )}
            {job.company.contact_phone && (
              <Pressable style={styles.contactItem} onPress={() => openLink(`tel:${job.company.contact_phone}`)}>
                <View style={styles.contactIconCircle}>
                  <Ionicons name="call-outline" size={18} color={colors.success} />
                </View>
                <AppText variant="caption" color={colors.textPrimary}>{job.company.contact_phone}</AppText>
              </Pressable>
            )}
          </View>
        </AppCard>

        {/* Quick Actions */}
        <View style={styles.actionRow}>
          <Pressable
            onPress={() => navigation.navigate('JobApplications', {
              companyUid: detailResponse.company_uid,
              jobUid: job.uid,
              jobTitle: job.title,
            })}
            style={styles.actionButton}
          >
            <View style={styles.actionIconWrap}>
              <Ionicons name="people-outline" size={22} color={colors.primary} />
            </View>
            <AppText variant="caption" style={styles.actionLabel}>Applicants</AppText>
            {job.active_applications_count > 0 && (
              <View style={styles.actionBadge}>
                <AppText variant="caption" color={colors.surface} style={{ fontSize: 11, fontWeight: '800' }}>
                  {job.active_applications_count}
                </AppText>
              </View>
            )}
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('JobInterviews', {
              companyUid: detailResponse.company_uid,
              jobUid: job.uid,
              jobTitle: job.title,
            })}
            style={styles.actionButton}
          >
            <View style={styles.actionIconWrap}>
              <Ionicons name="calendar-outline" size={22} color={colors.primary} />
            </View>
            <AppText variant="caption" style={styles.actionLabel}>Interviews</AppText>
          </Pressable>
          <Pressable
            onPress={async () => {
              const link = `${API_CONFIG.JOB_PORTAL_URL}/job/${job.uid}/apply`;
              await Clipboard.setStringAsync(link);
              Alert.alert('Link Copied', 'Job link has been copied to clipboard.');
            }}
            style={styles.actionButton}
          >
            <View style={styles.actionIconWrap}>
              <Ionicons name="link-outline" size={22} color={colors.primary} />
            </View>
            <AppText variant="caption" style={styles.actionLabel}>Link</AppText>
          </Pressable>
          <Pressable
            onPress={() => setShowShareModal(true)}
            style={styles.actionButton}
          >
            <View style={styles.actionIconWrap}>
              <Ionicons name="share-outline" size={22} color={colors.primary} />
            </View>
            <AppText variant="caption" style={styles.actionLabel}>Share</AppText>
          </Pressable>
        </View>

        {/* Representatives Section */}
        {job.company.representatives && job.company.representatives.length > 0 && (
          <>
            <AppText variant="h3" style={styles.sectionTitle}>Representatives</AppText>
            <AppCard style={styles.card}>
              {job.company.representatives.map((rep: any, index: number) => (
                <View key={rep.uid || index} style={[styles.fieldRow, index === job.company.representatives.length - 1 && styles.noBorder]}>
                  <View style={styles.fieldIcon}>
                    <Ionicons name="person-outline" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.fieldInfo}>
                    <AppText variant="subtitle" style={{ fontWeight: '600' }}>
                      {rep.full_name}
                    </AppText>
                    <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                      {rep.email && (
                        <Pressable onPress={() => openLink(`mailto:${rep.email}`)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="mail-outline" size={14} color={colors.textMuted} />
                          <AppText variant="caption" color={colors.textMuted} style={{ marginLeft: 4 }}>{rep.email}</AppText>
                        </Pressable>
                      )}
                      {rep.phone && (
                        <Pressable onPress={() => openLink(`tel:${rep.phone}`)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name="call-outline" size={14} color={colors.textMuted} />
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

        {/* Description Section */}
        <AppText variant="h3" style={styles.sectionTitle}>Job Description</AppText>
        <AppCard style={styles.card}>
          <AppText color={colors.textSecondary} style={styles.descriptionText}>
            {job.description || 'No description provided.'}
          </AppText>
        </AppCard>

        {/* Custom Fields Section */}
        {custom_fields && custom_fields.length > 0 && (
          <>
            <AppText variant="h3" style={styles.sectionTitle}>Required Information</AppText>
            <AppCard style={styles.card}>
              {custom_fields.map((field, index) => (
                <View key={field.uid} style={[styles.fieldRow, index === custom_fields.length - 1 && styles.noBorder]}>
                  <View style={styles.fieldIcon}>
                    <Ionicons 
                      name={field.field_type === 'file' ? 'document-outline' : 'text-outline'} 
                      size={20} 
                      color={colors.primary} 
                    />
                  </View>
                  <View style={styles.fieldInfo}>
                    <AppText variant="subtitle" style={{ fontWeight: '600' }}>
                      {field.label} {field.is_required && <AppText color={colors.danger}>*</AppText>}
                    </AppText>
                    <AppText variant="caption" color={colors.textMuted}>
                      Type: {field.field_type.toUpperCase()}
                    </AppText>
                  </View>
                </View>
              ))}
            </AppCard>
          </>
        )}

        {/* Stages Section */}
        {sortedStages && sortedStages.length > 0 && (
          <>
            <AppText variant="h3" style={styles.sectionTitle}>Application Pipeline</AppText>
            <AppCard style={styles.card}>
              <View style={styles.stagesContainer}>
                {sortedStages.map((stage, index) => (
                  <View key={stage.uid} style={styles.stageItem}>
                    <View style={[
                      styles.stageNode, 
                      stage.is_terminal ? styles.stageNodeTerminal : styles.stageNodeActive
                    ]}>
                      <Ionicons 
                        name={stage.is_terminal ? "flag" : "checkmark"} 
                        size={14} 
                        color={stage.is_terminal ? colors.danger : colors.primary} 
                      />
                    </View>
                    <View style={styles.stageContent}>
                      <AppText variant="subtitle" style={{ fontWeight: '600' }}>
                        {stage.name}
                      </AppText>
                      <AppText variant="caption" color={colors.textMuted}>
                        Stage {stage.sort_order + 1} {stage.is_terminal ? '(Terminal)' : ''}
                      </AppText>
                    </View>
                    {index < sortedStages.length - 1 && (
                      <View style={styles.stageConnector} />
                    )}
                  </View>
                ))}
              </View>
            </AppCard>
          </>
        )}

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
    {detailResponse && (
      <>
        <EditJobModal
          visible={showEditModal}
          companyUid={detailResponse.company_uid}
          job={detailResponse.job}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            refetch();
          }}
        />
        <ShareJobModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          companyUid={detailResponse.company_uid}
          jobUid={detailResponse.job.uid}
          jobTitle={detailResponse.job.title}
          companyName={detailResponse.job.company.name}
        />
      </>
    )}
  </>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerSection: {
    padding: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: 40,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    position: 'relative',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerContent: {
    position: 'relative',
    zIndex: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  statusActive: {
    backgroundColor: colors.success + '20',
  },
  statusExpired: {
    backgroundColor: colors.danger + '20',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  jobTitle: {
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  headerDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  headerDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerDetailText: {
    marginLeft: 6,
    fontWeight: '500',
  },
  contentContainer: {
    padding: spacing.lg,
    marginTop: -20,
  },
  companyCard: {
    borderRadius: 24,
    marginBottom: spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  companyLogoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.primaryLight + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    overflow: 'hidden',
  },
  companyLogo: {
    width: '100%',
    height: '100%',
  },
  companyInfo: {
    flex: 1,
  },
  companyContactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSubtle,
    paddingTop: spacing.md,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  contactIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginLeft: 4,
  },
  card: {
    borderRadius: 20,
    marginBottom: spacing.xl,
  },
  descriptionText: {
    lineHeight: 24,
    fontSize: 15,
  },
  fieldRow: {
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
  fieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  fieldInfo: {
    flex: 1,
  },
  stagesContainer: {
    paddingVertical: spacing.sm,
  },
  stageItem: {
    flexDirection: 'row',
    position: 'relative',
    marginBottom: spacing.xl,
  },
  stageNode: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    zIndex: 2,
  },
  stageNodeActive: {
    backgroundColor: colors.primaryLight + '20',
  },
  stageNodeTerminal: {
    backgroundColor: colors.danger + '20',
  },
  stageConnector: {
    position: 'absolute',
    left: 15,
    top: 32,
    bottom: -spacing.xl,
    width: 2,
    backgroundColor: colors.surfaceSubtle,
    zIndex: 1,
  },
  stageContent: {
    flex: 1,
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.surface,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryLight + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  actionLabel: {
    fontWeight: '600',
    marginTop: 2,
    fontSize: 12,
  },
  actionBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
});
