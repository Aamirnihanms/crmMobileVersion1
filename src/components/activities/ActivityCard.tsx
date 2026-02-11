import { View, StyleSheet } from 'react-native';
import AppText from '../common/AppText';
import { spacing, colors } from '../../theme';
import type { LeadActivity } from '../../api/activities.api';

export default function ActivityCard({
    activity,
}: {
    activity: LeadActivity;
}) {

    const actor = activity.performed_by_system
        ? 'System'
        : activity.performed_by_details?.full_name ?? 'Unknown';

    return (
        <View style={styles.card}>
            <AppText variant="subtitle">
                {activity.title}
            </AppText>

            <AppText style={styles.desc}>
                {activity.description}
            </AppText>

            <View style={styles.footer}>
                <AppText variant="caption" color={colors.textSecondary}>
                    {activity.time_since}
                </AppText>

                <AppText variant="caption" color={colors.primary}>
                    {actor}
                </AppText>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: 8,
        marginBottom: spacing.md,
    },
    desc: {
        marginTop: spacing.sm,
    },
    footer: {
        marginTop: spacing.sm,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
});
