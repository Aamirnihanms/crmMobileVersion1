import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import type { LeadActivity } from '../../api/activities.api';
import { useAppTheme, spacing } from '@/src/theme';
import AppCard from '../common/AppCard';
import AppText from '../common/AppText';

export default function ActivityCard({
    activity,
}: {
    activity: LeadActivity;
}) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
    const isSystem = activity.performed_by_system;
    const actor = isSystem
        ? 'System'
        : activity.performed_by_details?.full_name ?? 'Unknown User';

    return (
        <AppCard style={styles.card}>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: isSystem ? colors.primaryLight + '15' : colors.secondary + '15' }]}>
                    <Ionicons
                        name={isSystem ? "settings-outline" : "person-outline"}
                        size={18}
                        color={isSystem ? colors.primary : colors.secondary}
                    />
                </View>
                <View style={styles.titleSection}>
                    <AppText variant="subtitle" style={styles.title}>
                        {activity.title}
                    </AppText>
                    <AppText variant="caption" color={colors.textMuted}>
                        {activity.time_since}
                    </AppText>
                </View>
            </View>

            <View style={styles.content}>
                <AppText style={styles.desc} color={colors.textSecondary}>
                    {activity.description}
                </AppText>
            </View>

            <View style={styles.footer}>
                <View style={styles.actorRow}>
                    <Ionicons name="finger-print-outline" size={12} color={colors.textMuted} />
                    <AppText variant="caption" color={colors.textMuted} style={styles.actorText}>
                        Performed by <AppText variant="caption" style={{ fontWeight: '700' }} color={colors.primary}>{actor}</AppText>
                    </AppText>
                </View>
            </View>
        </AppCard>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    card: {
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginBottom: spacing.sm,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleSection: {
        flex: 1,
    },
    title: {
        fontWeight: '700',
        fontSize: 14,
    },
    content: {
        paddingLeft: 48,
    },
    desc: {
        lineHeight: 18,
        fontSize: 13,
    },
    footer: {
        marginTop: spacing.md,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.divider,
        borderStyle: 'dashed',
        paddingLeft: 48,
    },
    actorRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actorText: {
        marginLeft: 4,
    },
});
