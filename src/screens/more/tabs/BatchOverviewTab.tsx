import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '@/src/components/common/AppText';
import AppCard from '@/src/components/common/AppCard';
import { useAppTheme, spacing } from '@/src/theme';
import { BatchDetail } from '@/src/api/batches.api';

interface BatchOverviewTabProps {
    batch: BatchDetail;
}

export default function BatchOverviewTab({ batch }: BatchOverviewTabProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
                {/* Dashboard Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <AppText variant="caption" color={colors.textMuted}>ENROLLED</AppText>
                        <AppText variant="h3" style={styles.statValue}>
                            {batch.current_enrollment_count}
                        </AppText>
                    </View>
                    <View style={styles.statCard}>
                        <AppText variant="caption" color={colors.textMuted}>CAPACITY</AppText>
                        <AppText variant="h3" style={styles.statValue}>
                            {batch.total_capacity}
                        </AppText>
                    </View>
                    <View style={styles.statCard}>
                        <AppText variant="caption" color={colors.textMuted}>SPOTS LEFT</AppText>
                        <AppText variant="h3" style={[styles.statValue, { color: colors.primary }]}>
                            {batch.available_spots}
                        </AppText>
                    </View>
                </View>

                {/* Seat Availability Section */}
                <SectionTitle title="Seat Availability" icon="people-outline" />
                <AppCard style={styles.infoCard}>
                    <AvailabilityRow 
                        label="Online" 
                        stats={batch.seat_availability?.online} 
                        color={colors.info}
                    />
                    <View style={styles.divider} />
                    <AvailabilityRow 
                        label="Offline" 
                        stats={batch.seat_availability?.offline} 
                        color={colors.success}
                    />
                    <View style={styles.divider} />
                    <View style={styles.totalRow}>
                       <AppText style={{ fontWeight: '700' }}>Overall Utilization</AppText>
                       <AppText variant="subtitle" color={colors.primary}>
                           {batch.seat_availability?.total?.utilization_percentage}%
                       </AppText>
                    </View>
                </AppCard>

                {/* Course & Fees Section */}
                <SectionTitle title="Course & Fees" icon="wallet-outline" />
                <AppCard style={styles.infoCard}>
                    <InfoRow icon="book" label="Course" value={batch.course_name} />
                    <InfoRow icon="cash" label="Course Fee" value={`₹${batch.fee_structure?.course_fees}`} />
                    <InfoRow icon="arrow-down-circle" label="Discount" value={`₹${batch.fee_structure?.course_fees_discount}`} color={colors.danger} />
                    <InfoRow icon="add-circle" label="Admission Fee" value={`₹${batch.fee_structure?.admission_fees}`} />
                </AppCard>

                {/* Logistics Section */}
                <SectionTitle title="Schedule & Logistics" icon="calendar-outline" />
                <AppCard style={styles.infoCard}>
                    <InfoRow icon="time" label="Time" value={batch.time} />
                    <InfoRow icon="calendar" label="Duration" value={batch.duration} />
                    <InfoRow icon="pin" label="Location" value={batch.location_details?.name} />
                    <InfoRow icon="business" label="Building" value={batch.building_details?.name} />
                    <InfoRow icon="school" label="Classroom" value={`${batch.classroom_details?.name} (Cap: ${batch.classroom_details?.capacity})`} />
                </AppCard>

                {/* Staff Section */}
                <SectionTitle title="Assigned Staff" icon="person-outline" />
                <AppCard style={styles.infoCard}>
                    <View style={{ marginBottom: spacing.md }}>
                        <AppText variant="caption" color={colors.textMuted} style={styles.staffLabel}>TRAINERS</AppText>
                        {batch.staff_summary?.trainers.map((t) => (
                            <View key={t.uid} style={styles.staffItem}>
                                <View style={styles.staffAvatar}>
                                    <AppText style={styles.staffAvatarText}>{t.name[0]}</AppText>
                                </View>
                                <View>
                                    <AppText style={styles.staffName}>{t.name}</AppText>
                                    <AppText variant="caption" color={colors.textMuted}>{t.email}</AppText>
                                </View>
                            </View>
                        ))}
                    </View>
                    <View>
                        <AppText variant="caption" color={colors.textMuted} style={styles.staffLabel}>COUNSELORS</AppText>
                        {batch.staff_summary?.counselors.map((c) => (
                            <View key={c.uid} style={styles.staffItem}>
                                <View style={[styles.staffAvatar, { backgroundColor: colors.info + '20' }]}>
                                    <AppText style={[styles.staffAvatarText, { color: colors.info }]}>{c.name[0]}</AppText>
                                </View>
                                <View>
                                    <AppText style={styles.staffName}>{c.name}</AppText>
                                    <AppText variant="caption" color={colors.textMuted}>{c.email}</AppText>
                                </View>
                            </View>
                        ))}
                    </View>
                </AppCard>

                {/* Additional Info */}
                {(batch.description || batch.notes) && (
                    <>
                        <SectionTitle title="Additional Information" icon="information-circle-outline" />
                        <AppCard style={styles.infoCard}>
                            {batch.description && (
                                <View style={{ marginBottom: spacing.md }}>
                                    <AppText variant="caption" color={colors.textMuted} style={styles.staffLabel}>DESCRIPTION</AppText>
                                    <AppText style={styles.descText}>{batch.description}</AppText>
                                </View>
                            )}
                            {batch.notes && (
                                <View>
                                    <AppText variant="caption" color={colors.textMuted} style={styles.staffLabel}>NOTES</AppText>
                                    <AppText style={styles.descText}>{batch.notes}</AppText>
                                </View>
                            )}
                        </AppCard>
                    </>
                )}

                <View style={{ height: spacing.xl * 2 }} />
            </View>
        </ScrollView>
    );
}

const SectionTitle = ({ title, icon }: { title: string; icon: keyof typeof Ionicons.glyphMap }) => {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    return (
    <View style={styles.sectionTitleRow}>
        <Ionicons name={icon} size={18} color={colors.primary} />
        <AppText variant="subtitle" style={styles.sectionTitle}>{title}</AppText>
    </View>
    );
};

const InfoRow = ({ icon, label, value, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; color?: string }) => {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    return (
    <View style={styles.infoRow}>
        <View style={styles.infoLabelGrp}>
            <Ionicons name={(icon + '-outline') as any} size={16} color={colors.textMuted} />
            <AppText color={colors.textMuted}>{label}</AppText>
        </View>
        <AppText style={[styles.infoValue, color ? { color } : {}]}>{value || 'N/A'}</AppText>
    </View>
    );
};

const AvailabilityRow = ({ label, stats, color }: { label: string; stats: any; color: string }) => {
    const { colors } = useAppTheme();
    const styles = getStyles(colors);
    if (!stats) return null;
    return (
        <View style={styles.availRow}>
            <View style={styles.availHeader}>
                <AppText style={{ fontWeight: '600' }}>{label}</AppText>
                <AppText variant="caption" color={colors.textMuted}>
                    {stats.enrolled} / {stats.capacity} Enrolled
                </AppText>
            </View>
            <View style={styles.progressBg}>
                <View 
                    style={[
                        styles.progressFill, 
                        { 
                            backgroundColor: color, 
                            width: `${Math.min(stats.utilization_percentage, 100)}%` 
                        }
                    ]} 
                />
            </View>
            <View style={styles.availFooter}>
                <AppText variant="caption" color={color} style={{ fontWeight: '700' }}>
                    {stats.utilization_percentage}% Used
                </AppText>
                <AppText variant="caption" color={colors.textMuted}>
                    {stats.available} Spots Available
                </AppText>
            </View>
        </View>
    );
};

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.lg,
        gap: spacing.sm,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    statValue: {
        fontWeight: '800',
        marginTop: 4,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
    },
    sectionTitle: {
        fontWeight: '700',
        color: colors.textPrimary,
    },
    infoCard: {
        padding: spacing.md,
        marginBottom: spacing.md,
        borderRadius: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingVertical: 10,
    },
    infoLabelGrp: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    infoValue: {
        fontWeight: '600',
        textAlign: 'right',
        flex: 1.5,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: 10,
        opacity: 0.5,
    },
    availRow: {
        paddingVertical: 6,
    },
    availHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressBg: {
        height: 8,
        backgroundColor: colors.border + '50',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    availFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 8,
    },
    staffLabel: {
        fontWeight: '700',
        marginBottom: spacing.sm,
        letterSpacing: 0.5,
    },
    staffItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    staffAvatar: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.primaryLight + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    staffAvatarText: {
        color: colors.primary,
        fontWeight: '700',
        fontSize: 18,
    },
    staffName: {
        fontWeight: '600',
        fontSize: 15,
    },
    descText: {
        lineHeight: 20,
        fontSize: 14,
        color: colors.textSecondary,
    },
});
