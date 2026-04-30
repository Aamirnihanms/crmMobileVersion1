import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Pressable, RefreshControl, ScrollView, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/src/theme';
import AppText from '@/src/components/common/AppText';
import AppInput from '@/src/components/common/AppInput';
import AppButton from '@/src/components/common/AppButton';
import { useBatchSessions, useCreateBatchSession } from '@/src/queries/batches.query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MoreStackParamList } from '@/src/navigation/MoreStack';

interface BatchSessionsTabProps {
    batchUid: string;
}

export default function BatchSessionsTab({ batchUid }: BatchSessionsTabProps) {
    const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [minimumAttendanceDuration, setMinimumAttendanceDuration] = useState('');

    const { data, isLoading, isError, refetch, isRefetching } = useBatchSessions(batchUid);
    const { mutate: createSession, isPending: isCreating } = useCreateBatchSession();

    const handleCreateSession = () => {
        if (!name.trim()) {
            Alert.alert('Validation Error', 'Session Name is required');
            return;
        }
        if (!minimumAttendanceDuration.trim()) {
            Alert.alert('Validation Error', 'Minimum Attendance Duration is required');
            return;
        }
        if (!description.trim()) {
            Alert.alert('Validation Error', 'Description is required');
            return;
        }

        const duration = parseInt(minimumAttendanceDuration, 10);
        if (isNaN(duration) || duration <= 0) {
            Alert.alert('Validation Error', 'Minimum Attendance Duration must be a valid positive number');
            return;
        }

        createSession(
            {
                batch: batchUid,
                name: name.trim(),
                description: description.trim(),
                minimum_attendance_duration: duration,
            },
            {
                onSuccess: () => {
                    setIsAddModalVisible(false);
                    setName('');
                    setDescription('');
                    setMinimumAttendanceDuration('');
                },
                onError: (error: any) => {
                    Alert.alert('Error', error?.response?.data?.message || 'Failed to create session');
                }
            }
        );
    };

    const renderItem = (item: any) => (
        <Pressable 
            key={item.uid} 
            style={styles.card}
            onPress={() => navigation.navigate('BatchSessionDetail', { uid: item.uid, batchUid: batchUid })}
        >
            <View style={styles.cardHeader}>
                <AppText variant="h3" style={styles.cardTitle}>{item.name}</AppText>
                <View style={styles.badge}>
                    <AppText color={colors.primary} style={styles.badgeText}>{item.duration_display}</AppText>
                </View>
            </View>
            <View style={styles.cardRow}>
                <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                <AppText color={colors.textMuted} style={styles.cardDetailText}>Min Duration: {item.minimum_attendance_duration} mins</AppText>
            </View>
            <View style={styles.cardRow}>
                <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                <AppText color={colors.textMuted} style={styles.cardDetailText}>Created: {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</AppText>
            </View>
            {item.description ? (
                <View style={styles.descriptionBox}>
                    <AppText style={styles.descriptionText}>{item.description}</AppText>
                </View>
            ) : null}
        </Pressable>
    );

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (isError) {
        return (
            <View style={styles.center}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
                <AppText color={colors.danger} style={styles.errorText}>Failed to load sessions.</AppText>
                <Pressable onPress={() => refetch()} style={styles.retryBtn}>
                    <AppText color={colors.primary}>Try Again</AppText>
                </Pressable>
            </View>
        );
    }

    const sessions = data?.sessions || [];

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                {sessions.length === 0 ? (
                    <View style={[styles.center, { marginTop: spacing.xxl * 2 }]}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="calendar-outline" size={40} color={colors.primary} />
                        </View>
                        <AppText variant="h3" style={styles.emptyText}>No Sessions Found</AppText>
                        <AppText color={colors.textMuted} style={styles.emptySubtext}>
                            There are no sessions added to this batch yet.
                        </AppText>
                    </View>
                ) : (
                    sessions.map(renderItem)
                )}
            </ScrollView>

            <View style={styles.floatingButtonContainer}>
                <Pressable style={styles.fab} onPress={() => setIsAddModalVisible(true)}>
                    <Ionicons name="add" size={24} color="#fff" />
                    <AppText style={styles.fabText}>Add Session</AppText>
                </Pressable>
            </View>

            <Modal visible={isAddModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <AppText variant="h2">Add Session</AppText>
                            <Pressable onPress={() => setIsAddModalVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={colors.textPrimary} />
                            </Pressable>
                        </View>

                        <ScrollView contentContainerStyle={styles.formContainer}>
                            <AppInput
                                label="Session Name"
                                placeholder="e.g. Session 1"
                                value={name}
                                onChangeText={setName}
                                containerStyle={styles.inputContainer}
                            />
                            <AppInput
                                label="Min. Attendance Duration (mins)"
                                placeholder="e.g. 60"
                                value={minimumAttendanceDuration}
                                onChangeText={setMinimumAttendanceDuration}
                                keyboardType="numeric"
                                containerStyle={styles.inputContainer}
                            />
                            <AppInput
                                label="Description"
                                placeholder="Enter session description..."
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={4}
                                containerStyle={styles.inputContainer}
                                style={styles.textArea}
                            />

                            <AppButton
                                title="Create Session"
                                onPress={handleCreateSession}
                                loading={isCreating}
                                disabled={isCreating}
                                style={styles.submitBtn}
                            />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    listContent: {
        padding: spacing.lg,
        paddingBottom: spacing.xxl * 3, // padding for fab
    },
    card: {
        backgroundColor: colors.surface,
        padding: spacing.lg,
        borderRadius: 16,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    cardTitle: {
        flex: 1,
        marginRight: spacing.sm,
        fontWeight: '700',
    },
    badge: {
        backgroundColor: colors.primaryLight + '20',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xs,
        gap: spacing.xs,
    },
    cardDetailText: {
        fontSize: 14,
    },
    descriptionBox: {
        marginTop: spacing.md,
        padding: spacing.md,
        backgroundColor: colors.background,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border + '50',
    },
    descriptionText: {
        fontSize: 14,
        color: colors.textPrimary,
        lineHeight: 20,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
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
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primaryLight + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    emptyText: {
        fontWeight: '700',
        marginBottom: 4,
    },
    emptySubtext: {
        textAlign: 'center',
        paddingHorizontal: 32,
        lineHeight: 20,
    },
    floatingButtonContainer: {
        position: 'absolute',
        bottom: spacing.lg,
        right: spacing.lg,
    },
    fab: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: 24,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        gap: spacing.sm,
    },
    fabText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '80%',
        padding: spacing.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    closeBtn: {
        padding: spacing.xs,
        backgroundColor: colors.surface,
        borderRadius: 20,
    },
    formContainer: {
        paddingBottom: spacing.xxl,
    },
    inputContainer: {
        marginBottom: spacing.md,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: spacing.sm,
    },
    submitBtn: {
        marginTop: spacing.lg,
    },
});
