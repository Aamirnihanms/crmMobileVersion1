import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import AppText from './AppText';
import { colors, spacing } from '@/src/theme';

interface EmptyStateProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
}

export default function EmptyState({ icon, title, description }: EmptyStateProps) {
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={64} color={colors.primary + '40'} />
            </View>
            <AppText variant="h3" style={styles.title}>{title}</AppText>
            <AppText variant="body" color={colors.textMuted} style={styles.description}>
                {description}
            </AppText>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xxl,
        marginTop: spacing.xxl,
    },
    iconContainer: {
        marginBottom: spacing.lg,
    },
    title: {
        textAlign: 'center',
        marginBottom: spacing.sm,
        fontWeight: '700',
    },
    description: {
        textAlign: 'center',
    },
});
