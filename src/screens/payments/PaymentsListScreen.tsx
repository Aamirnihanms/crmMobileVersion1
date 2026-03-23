import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

import AppCard from '@/src/components/common/AppCard';
import AppText from '@/src/components/common/AppText';
import { colors, spacing } from '@/src/theme';

function PaymentItem({ name, amount, date, status, isLast = false }: any) {
    const isReceived = status === 'Received';
    const statusColor = isReceived ? '#10B981' : '#F59E0B';

    return (
        <View>
            <View style={styles.paymentItem}>
                <View style={[styles.paymentIcon, { backgroundColor: statusColor + '15' }]}>
                    <Ionicons name={isReceived ? "arrow-down-outline" : "time-outline"} size={20} color={statusColor} />
                </View>
                <View style={styles.paymentContent}>
                    <AppText variant="subtitle" style={{ fontWeight: '700' }}>{name}</AppText>
                    <AppText variant="caption" color={colors.textMuted}>{date}</AppText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <AppText variant="subtitle" style={{ fontWeight: '800', color: colors.textPrimary }}>₹{amount}</AppText>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '10' }]}>
                        <AppText variant="caption" style={{ color: statusColor, fontSize: 10, fontWeight: '700' }}>{status}</AppText>
                    </View>
                </View>
            </View>
            {!isLast && <View style={styles.divider} />}
        </View>
    );
}

export default function PaymentsListScreen() {
    return (
        <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
            <View style={styles.container}>
                <AppCard style={styles.summaryCard}>
                    <LinearGradient
                        colors={['#8B5CF6', '#6366F1']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.summaryGradient}
                    />
                    <View style={styles.summaryContent}>
                        <View style={styles.summaryRow}>
                            <View>
                                <AppText variant="caption" color="rgba(255,255,255,0.7)" style={{ fontWeight: '600' }}>Total Revenue</AppText>
                                <AppText variant="h1" color="#fff" style={{ fontWeight: '800', fontSize: 28 }}>₹24.50L</AppText>
                            </View>
                            <View style={styles.summaryIcon}>
                                <Ionicons name="stats-chart" size={24} color="#fff" />
                            </View>
                        </View>
                        <View style={styles.summaryFooter}>
                            <View style={styles.summaryStat}>
                                <AppText variant="caption" color="rgba(255,255,255,0.6)">Collected</AppText>
                                <AppText variant="subtitle" color="#fff" style={{ fontWeight: '700' }}>₹18.2L</AppText>
                            </View>
                            <View style={styles.summaryStat}>
                                <AppText variant="caption" color="rgba(255,255,255,0.6)">Pending</AppText>
                                <AppText variant="subtitle" color="#fff" style={{ fontWeight: '700' }}>₹6.3L</AppText>
                            </View>
                        </View>
                    </View>
                </AppCard>

                <View style={styles.sectionHeader}>
                    <AppText variant="h3" style={styles.sectionTitle}>Recent Transactions</AppText>
                    <Pressable>
                        <Ionicons name="filter" size={20} color={colors.primary} />
                    </Pressable>
                </View>

                <AppCard style={styles.transactionsCard}>
                    <PaymentItem name="Sanjay Kumar" amount="15,000" date="23 Mar, 2024" status="Received" />
                    <PaymentItem name="Priya Singh" amount="12,500" date="22 Mar, 2024" status="Pending" />
                    <PaymentItem name="Rahul Verma" amount="25,000" date="21 Mar, 2024" status="Received" />
                    <PaymentItem name="Anjali Devi" amount="8,000" date="20 Mar, 2024" status="Received" />
                    <PaymentItem name="Vikram Rathore" amount="30,000" date="19 Mar, 2024" status="Pending" isLast />
                </AppCard>

                <AppCard style={styles.actionCard}>
                    <Ionicons name="receipt-outline" size={32} color={colors.primary} />
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                        <AppText variant="subtitle" style={{ fontWeight: '700' }}>Generate Reports</AppText>
                        <AppText variant="caption" color={colors.textMuted}>Download monthly financial statements</AppText>
                    </View>
                    <Pressable style={styles.downloadBtn}>
                        <Ionicons name="download-outline" size={20} color="#fff" />
                    </Pressable>
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
    container: {
        padding: spacing.lg,
    },
    summaryCard: {
        padding: 0,
        borderRadius: 28,
        marginBottom: spacing.xl,
        overflow: 'hidden',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 8,
    },
    summaryGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    summaryContent: {
        padding: spacing.xl,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    summaryIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryFooter: {
        flexDirection: 'row',
        gap: spacing.xl,
        paddingTop: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    summaryStat: {
        flex: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontWeight: '800',
        color: colors.textPrimary,
    },
    transactionsCard: {
        padding: 0,
        borderRadius: 24,
        marginBottom: spacing.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    paymentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
    },
    paymentIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    paymentContent: {
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginHorizontal: spacing.lg,
    },
    actionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        borderRadius: 24,
        backgroundColor: colors.primaryLight + '10',
        borderWidth: 1,
        borderColor: colors.primaryLight + '20',
    },
    downloadBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
