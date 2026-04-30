import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '@/src/components/common/AppText';
import { colors, spacing } from '@/src/theme';

export default function ExamSessionsScreen() {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.center}>
                <View style={[styles.iconCircle, { backgroundColor: colors.warning + '15' }]}>
                    <Ionicons name="calendar-outline" size={48} color={colors.warning} />
                </View>
                <AppText variant="h2" style={styles.title}>Exam Sessions</AppText>
                <AppText color={colors.textMuted} style={styles.subtitle}>
                    Schedule, monitor and manage exam sessions for active batches.
                </AppText>
                
                <View style={[styles.comingSoonBadge, { backgroundColor: colors.warning + '10', borderColor: colors.warning + '20' }]}>
                    <AppText color={colors.warning} style={styles.comingSoonText}>COMING SOON</AppText>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: spacing.xl,
    },
    center: {
        alignItems: 'center',
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    title: {
        fontWeight: '800',
        marginBottom: spacing.sm,
    },
    subtitle: {
        textAlign: 'center',
        paddingHorizontal: spacing.xl,
        lineHeight: 22,
        marginBottom: spacing.xl,
    },
    comingSoonBadge: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        borderRadius: 100,
        borderWidth: 1,
    },
    comingSoonText: {
        fontWeight: '800',
        fontSize: 12,
        letterSpacing: 1,
    },
});
