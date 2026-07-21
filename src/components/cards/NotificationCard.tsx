import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppCard from '../common/AppCard';
import AppText from '../common/AppText';
import { useAppTheme, spacing } from '@/src/theme';
import type { Notification } from '@/src/api/notifications.api';

interface NotificationCardProps {
    notification: Notification;
    onPress?: () => void;
}

const getPriorityColor = (priority: string, colors: any) => {
    switch (priority?.toUpperCase()) {
        case 'HIGH':
            return colors.danger;
        case 'MEDIUM':
            return colors.warning;
        case 'LOW':
            return colors.info;
        default:
            return colors.slate;
    }
};

const formatRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
};

export default function NotificationCard({ notification, onPress }: NotificationCardProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
    const priorityColor = getPriorityColor(notification.priority, colors);
    const relativeTime = formatRelativeTime(notification.created_at);

    return (
        <Pressable onPress={onPress}>
            <AppCard style={[styles.card, !notification.is_read && styles.unreadCard]}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <View style={[styles.iconCircle, { backgroundColor: priorityColor + '15' }]}>
                            <Ionicons 
                                name={notification.priority === 'HIGH' ? 'alert-circle' : 'notifications'} 
                                size={20} 
                                color={priorityColor} 
                            />
                        </View>
                        {!notification.is_read && <View style={styles.unreadDot} />}
                    </View>
                    
                    <View style={styles.content}>
                        <View style={styles.titleRow}>
                            <AppText variant="subtitle" style={styles.title} numberOfLines={1}>
                                {notification.title}
                            </AppText>
                            <AppText variant="caption" color={colors.textMuted}>
                                {relativeTime}
                            </AppText>
                        </View>
                        
                        <AppText variant="body" color={colors.textSecondary} style={styles.message} numberOfLines={2}>
                            {notification.message}
                        </AppText>

                        {notification.priority && (
                             <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '10', borderColor: priorityColor + '30' }]}>
                                <AppText style={[styles.priorityText, { color: priorityColor }]}>
                                    {notification.priority}
                                </AppText>
                            </View>
                        )}
                    </View>
                </View>
            </AppCard>
        </Pressable>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    card: {
        marginBottom: spacing.sm,
        padding: spacing.md,
        borderLeftWidth: 0,
    },
    unreadCard: {
        backgroundColor: colors.primaryLight + '05',
        borderColor: colors.primary + '20',
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
    },
    header: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    iconContainer: {
        position: 'relative',
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadDot: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.primary,
        borderWidth: 2,
        borderColor: colors.surface,
    },
    content: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontWeight: '700',
        fontSize: 15,
        flex: 1,
        marginRight: spacing.sm,
    },
    message: {
        fontSize: 13,
        lineHeight: 18,
        marginBottom: spacing.xs,
    },
    priorityBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 0.5,
        marginTop: 4,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
});
