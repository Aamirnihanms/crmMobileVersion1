import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { RouteProp, useRoute } from '@react-navigation/native';
import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppText from '@/src/components/common/AppText';
import { useEvaluationTemplateDetail } from '@/src/queries/evaluation.query';
import { useAppTheme, spacing } from '@/src/theme';
// Removed circular import to MoreStackParamList

import EvaluationModulesTab from './tabs/EvaluationModulesTab';
import EvaluationGradeBandsTab from './tabs/EvaluationGradeBandsTab';
import EvaluationPlacementRulesTab from './tabs/EvaluationPlacementRulesTab';

const Tab = createMaterialTopTabNavigator();

type RouteProps = RouteProp<any, 'EvaluationTemplateDetail'>;

export default function EvaluationTemplateDetailScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
    const { params } = useRoute<any>();
    const { uid } = params;
    const { data: template, isLoading } = useEvaluationTemplateDetail(uid);

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!template) {
        return (
            <View style={styles.center}>
                <AppText>Template not found</AppText>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.titleContainer}>
                        <AppText variant="h1" style={styles.title}>{template.name}</AppText>
                        <View style={styles.versionBadge}>
                            <AppText variant="caption" color={colors.primary} style={{ fontWeight: '700' }}>v{template.version}</AppText>
                        </View>
                    </View>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusBadge, { backgroundColor: template.is_active ? colors.success + '15' : colors.danger + '15' }]}>
                            <AppText variant="caption" color={template.is_active ? colors.success : colors.danger} style={{ fontWeight: '700' }}>
                                {template.is_active ? 'ACTIVE' : 'INACTIVE'}
                            </AppText>
                        </View>
                        {template.is_locked && (
                            <View style={styles.lockedBadge}>
                                <Ionicons name="lock-closed" size={12} color={colors.warning} />
                                <AppText variant="caption" color={colors.warning} style={{ fontWeight: '700', marginLeft: 4 }}>LOCKED</AppText>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.metaContainer}>
                    <View style={styles.metaItem}>
                        <Ionicons name="book-outline" size={16} color={colors.textMuted} />
                        <AppText variant="body" color={colors.textSecondary} style={styles.metaText}>
                            {template.course_name}
                        </AppText>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                        <AppText variant="body" color={colors.textSecondary} style={styles.metaText}>
                            Effective: {template.effective_from} {template.effective_to ? `- ${template.effective_to}` : '(Ongoing)'}
                        </AppText>
                    </View>
                </View>

                {template.description && (
                    <View style={styles.descriptionContainer}>
                        <AppText variant="body" color={colors.textSecondary} numberOfLines={2}>
                            {template.description}
                        </AppText>
                    </View>
                )}

                <View style={styles.headerFooter}>
                    <AppText variant="caption" color={colors.textMuted}>
                        Created by ID: {template.created_by}
                    </AppText>
                    <AppText variant="caption" color={colors.textMuted}>
                        Updated: {new Date(template.updated_at).toLocaleDateString()}
                    </AppText>
                </View>
            </View>

            <Tab.Navigator
                screenOptions={{
                    tabBarIndicatorStyle: { backgroundColor: colors.primary, height: 3, borderRadius: 3 },
                    tabBarLabelStyle: { fontSize: 13, fontWeight: '700', textTransform: 'none' },
                    tabBarActiveTintColor: colors.primary,
                    tabBarInactiveTintColor: colors.textMuted,
                    tabBarStyle: { elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: colors.divider },
                }}
            >
                <Tab.Screen name="Modules">
                    {() => <EvaluationModulesTab modules={template.modules || []} templateUid={uid} />}
                </Tab.Screen>
                <Tab.Screen name="Grade Bands">
                    {() => <EvaluationGradeBandsTab templateUid={uid} />}
                </Tab.Screen>
                <Tab.Screen name="Placement Rules">
                    {() => {
                        const criteriaCodes = Array.from(new Set(
                            template.modules?.flatMap((m: any) => m.criteria?.map((c: any) => c.code) || []) || []
                        )).filter(Boolean);
                        return <EvaluationPlacementRulesTab templateUid={uid} criteriaCodes={criteriaCodes as string[]} />;
                    }}
                </Tab.Screen>
            </Tab.Navigator>
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: colors.surface,
        padding: spacing.lg,
        paddingBottom: spacing.md,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
    },
    titleContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    title: {
        fontWeight: '800',
        marginRight: spacing.sm,
    },
    versionBadge: {
        backgroundColor: colors.primary + '10',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusRow: {
        flexDirection: 'row',
        gap: spacing.xs,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    lockedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.warning + '10',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    metaContainer: {
        gap: spacing.xs,
        marginBottom: spacing.sm,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        marginLeft: spacing.sm,
        fontSize: 13,
    },
    descriptionContainer: {
        marginTop: spacing.xs,
        padding: spacing.sm,
        backgroundColor: colors.neutralSoft,
        borderRadius: 12,
        marginBottom: spacing.sm,
    },
    headerFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.sm,
        paddingTop: spacing.xs,
        borderTopWidth: 1,
        borderTopColor: colors.divider + '50',
    },
});
