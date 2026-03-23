import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

import AppCard from '@/src/components/common/AppCard';
import AppText from '@/src/components/common/AppText';
import { colors, spacing } from '@/src/theme';

const { width } = Dimensions.get('window');

function StatCard({ title, value, icon, trend, color = colors.primary }: { title: string, value: string, icon: any, trend?: string, color?: string }) {
    return (
        <AppCard style={styles.statCard}>
            <View style={styles.statHeader}>
                <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
                    <Ionicons name={icon} size={20} color={color} />
                </View>
                {trend && (
                    <View style={styles.trendBadge}>
                        <Ionicons name="trending-up" size={12} color={colors.success} />
                        <AppText variant="caption" color={colors.success} style={styles.trendText}>
                            {trend}
                        </AppText>
                    </View>
                )}
            </View>
            <AppText variant="caption" color={colors.textMuted} style={styles.statLabel}>{title}</AppText>
            <AppText variant="h2" style={styles.statValue}>{value}</AppText>
        </AppCard>
    );
}

export default function DashboardScreen() {
    return (
        <ScrollView style={styles.screen} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.container}>
                <LinearGradient
                    colors={[colors.primary, colors.gradientEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroCard}
                >
                    <View style={styles.heroContent}>
                        <View>
                            <AppText variant="subtitle" color="rgba(255,255,255,0.8)" style={{ fontWeight: '600' }}>Overall Revenue</AppText>
                            <AppText variant="h1" color="#FFFFFF" style={styles.heroValue}>₹12,84,320</AppText>
                            <View style={styles.heroBadge}>
                                <Ionicons name="stats-chart" size={12} color="#FFFFFF" />
                                <AppText variant="caption" color="#FFFFFF" style={styles.heroBadgeText}>+18.4% growth</AppText>
                            </View>
                        </View>
                        <View style={styles.heroActionCircle}>
                            <Ionicons name="wallet" size={28} color="#FFFFFF" />
                        </View>
                    </View>

                    <View style={styles.heroFooter}>
                        <View style={styles.heroFooterItem}>
                            <AppText variant="caption" color="rgba(255,255,255,0.6)">Target</AppText>
                            <AppText variant="subtitle" color="#FFFFFF" style={{ fontWeight: '700' }}>₹15.0L</AppText>
                        </View>
                        <View style={styles.footerDivider} />
                        <View style={styles.heroFooterItem}>
                            <AppText variant="caption" color="rgba(255,255,255,0.6)">Last Month</AppText>
                            <AppText variant="subtitle" color="#FFFFFF" style={{ fontWeight: '700' }}>₹10.2L</AppText>
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.sectionHeader}>
                    <AppText variant="h3" style={styles.sectionTitle}>Performance</AppText>
                    <Pressable>
                        <AppText variant="caption" color={colors.primary} style={{ fontWeight: '700' }}>Monthly Report</AppText>
                    </Pressable>
                </View>

                <View style={styles.statsGrid}>
                    <StatCard
                        title="Total Leads"
                        value="1,248"
                        icon="people-outline"
                        trend="+12%"
                        color="#6366F1"
                    />
                    <StatCard
                        title="New Students"
                        value="384"
                        icon="school-outline"
                        trend="+8%"
                        color="#8B5CF6"
                    />
                </View>

                <View style={styles.statsGrid}>
                    <StatCard
                        title="Conversions"
                        value="32%"
                        icon="rocket-outline"
                        trend="+4%"
                        color="#EC4899"
                    />
                    <StatCard
                        title="Avg. Deal"
                        value="₹45k"
                        icon="cash-outline"
                        color="#F59E0B"
                    />
                </View>

                <View style={styles.sectionHeader}>
                    <AppText variant="h3" style={styles.sectionTitle}>Recent Activities</AppText>
                    <Pressable>
                        <AppText variant="caption" color={colors.textMuted}>View All</AppText>
                    </Pressable>
                </View>

                <AppCard style={styles.activityCard}>
                    <View style={styles.activityItem}>
                        <View style={[styles.activityIcon, { backgroundColor: '#EEF2FF' }]}>
                            <Ionicons name="person-add-outline" size={18} color="#6366F1" />
                        </View>
                        <View style={styles.activityContent}>
                            <AppText variant="subtitle" style={{ fontWeight: '700' }}>New Lead Generated</AppText>
                            <AppText variant="caption" color={colors.textSecondary}>Aman Sharma registered for UI/UX course</AppText>
                            <AppText variant="caption" color={colors.textMuted} style={styles.timeAgo}>2m ago</AppText>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.activityItem}>
                        <View style={[styles.activityIcon, { backgroundColor: '#ECFDF5' }]}>
                            <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                        </View>
                        <View style={styles.activityContent}>
                            <AppText variant="subtitle" style={{ fontWeight: '700' }}>Lead Converted</AppText>
                            <AppText variant="caption" color={colors.textSecondary}>Sanjay Gupta completed enrollment</AppText>
                            <AppText variant="caption" color={colors.textMuted} style={styles.timeAgo}>1h ago</AppText>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.activityItem}>
                        <View style={[styles.activityIcon, { backgroundColor: '#FFF7ED' }]}>
                            <Ionicons name="call-outline" size={18} color="#F59E0B" />
                        </View>
                        <View style={styles.activityContent}>
                            <AppText variant="subtitle" style={{ fontWeight: '700' }}>Follow-up Reminder</AppText>
                            <AppText variant="caption" color={colors.textSecondary}>Call with Rahul regarding Data Science</AppText>
                            <AppText variant="caption" color={colors.textMuted} style={styles.timeAgo}>3h ago</AppText>
                        </View>
                    </View>
                </AppCard>

                <View style={{ height: 40 }} />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F8F9FE',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    container: {
        padding: spacing.lg,
    },
    heroCard: {
        borderRadius: 28,
        padding: spacing.xl,
        marginBottom: spacing.xl,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    heroContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    heroValue: {
        fontSize: 32,
        fontWeight: '800',
        marginVertical: 4,
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        alignSelf: 'flex-start',
    },
    heroBadgeText: {
        marginLeft: 6,
        fontWeight: '700',
        fontSize: 11,
    },
    heroActionCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    heroFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
        paddingTop: spacing.lg,
    },
    heroFooterItem: {
        flex: 1,
    },
    footerDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginHorizontal: spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontWeight: '800',
        color: colors.textPrimary,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.md,
    },
    statCard: {
        flex: 1,
        padding: spacing.lg,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    statIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 8,
    },
    trendText: {
        fontSize: 10,
        fontWeight: '800',
        marginLeft: 2,
    },
    statLabel: {
        fontWeight: '700',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.textPrimary,
    },
    activityCard: {
        padding: 0,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    activityItem: {
        flexDirection: 'row',
        padding: spacing.lg,
        alignItems: 'flex-start',
    },
    activityIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    activityContent: {
        flex: 1,
    },
    timeAgo: {
        marginTop: 4,
        fontSize: 10,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginHorizontal: spacing.lg,
    },
});
