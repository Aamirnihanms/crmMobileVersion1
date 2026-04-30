import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Pressable, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing } from '@/src/theme';
import AppText from '@/src/components/common/AppText';
import AppButton from '@/src/components/common/AppButton';
import AppInput from '@/src/components/common/AppInput';
import { MoreStackParamList } from '@/src/navigation/MoreStack';
import { useBatchSessionDetail, useUpdateBatchSession, useDeleteBatchSession } from '@/src/queries/batches.query';

export default function BatchSessionDetailScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
    const { uid, batchUid } = route.params;

    const { data: sessionResponse, isLoading, isError, refetch } = useBatchSessionDetail(uid);
    const { mutate: updateSession, isPending: isUpdating } = useUpdateBatchSession();
    const { mutate: deleteSession, isPending: isDeleting } = useDeleteBatchSession();

    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [minimumAttendanceDuration, setMinimumAttendanceDuration] = useState('');

    const session = sessionResponse?.session;

    useEffect(() => {
        if (session) {
            setName(session.name || '');
            setDescription(session.description || '');
            setMinimumAttendanceDuration(session.minimum_attendance_duration?.toString() || '');
        }
    }, [session]);

    const handleUpdateSession = () => {
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

        updateSession(
            {
                uid,
                payload: {
                    name: name.trim(),
                    description: description.trim(),
                    minimum_attendance_duration: duration,
                }
            },
            {
                onSuccess: () => {
                    setIsEditModalVisible(false);
                },
                onError: (error: any) => {
                    Alert.alert('Error', error?.response?.data?.message || 'Failed to update session');
                }
            }
        );
    };

    const handleDeleteSession = () => {
        Alert.alert(
            'Delete Session',
            'Are you sure you want to delete this session? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        deleteSession(
                            { uid, batchUid },
                            {
                                onSuccess: () => {
                                    navigation.goBack();
                                },
                                onError: (error: any) => {
                                    Alert.alert('Error', error?.response?.data?.message || 'Failed to delete session');
                                }
                            }
                        );
                    }
                }
            ]
        );
    };

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (isError || !session) {
        return (
            <View style={styles.center}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
                <AppText color={colors.danger} style={styles.errorText}>Failed to load session details.</AppText>
                <Pressable onPress={() => refetch()} style={styles.retryBtn}>
                    <AppText color={colors.primary}>Try Again</AppText>
                </Pressable>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.headerCard}>
                <View style={styles.headerActions}>
                    <Pressable 
                        onPress={handleDeleteSession} 
                        style={({ pressed }) => [
                            styles.iconButton, 
                            { backgroundColor: colors.danger + '10' },
                            pressed && { opacity: 0.7 }
                        ]}
                    >
                        <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    </Pressable>
                    <Pressable 
                        onPress={() => setIsEditModalVisible(true)} 
                        style={({ pressed }) => [
                            styles.iconButton, 
                            { backgroundColor: colors.primary + '10' },
                            pressed && { opacity: 0.7 }
                        ]}
                    >
                        <Ionicons name="pencil-outline" size={20} color={colors.primary} />
                    </Pressable>
                </View>
                <AppText variant="h2" style={styles.title}>{session.name}</AppText>
                <View style={styles.badgeRow}>
                    <View style={styles.badge}>
                        <AppText color={colors.primary} style={styles.badgeText}>{session.duration_display}</AppText>
                    </View>
                </View>
            </View>

            <View style={styles.sectionCard}>
                <AppText variant="h3" style={styles.sectionTitle}>Details</AppText>
                
                <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={20} color={colors.textMuted} />
                    <View style={styles.detailTextContainer}>
                        <AppText style={styles.detailLabel}>Minimum Attendance</AppText>
                        <AppText style={styles.detailValue}>{session.minimum_attendance_duration} mins</AppText>
                    </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
                    <View style={styles.detailTextContainer}>
                        <AppText style={styles.detailLabel}>Created At</AppText>
                        <AppText style={styles.detailValue}>
                            {new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </AppText>
                    </View>
                </View>

                {session.updated_at && session.updated_at !== session.created_at && (
                    <>
                        <View style={styles.divider} />
                        <View style={styles.detailRow}>
                            <Ionicons name="sync-outline" size={20} color={colors.textMuted} />
                            <View style={styles.detailTextContainer}>
                                <AppText style={styles.detailLabel}>Last Updated</AppText>
                                <AppText style={styles.detailValue}>
                                    {new Date(session.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </AppText>
                            </View>
                        </View>
                    </>
                )}

                {session.batch_details && (
                    <>
                        <View style={styles.divider} />
                        <View style={styles.detailRow}>
                            <Ionicons name="school-outline" size={20} color={colors.textMuted} />
                            <View style={styles.detailTextContainer}>
                                <AppText style={styles.detailLabel}>Batch Name</AppText>
                                <AppText style={styles.detailValue}>{session.batch_details.batch_name}</AppText>
                                <AppText style={styles.detailSubValue}>{session.batch_details.course_name}</AppText>
                                
                                <View style={styles.batchDatesRow}>
                                    <View style={styles.batchDateCol}>
                                        <AppText style={styles.detailLabel}>Start Date</AppText>
                                        <AppText style={styles.detailValue}>
                                            {new Date(session.batch_details.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </AppText>
                                    </View>
                                    <View style={styles.batchDateCol}>
                                        <AppText style={styles.detailLabel}>End Date</AppText>
                                        <AppText style={styles.detailValue}>
                                            {new Date(session.batch_details.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </AppText>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </>
                )}
            </View>

            <View style={styles.sectionCard}>
                <AppText variant="h3" style={styles.sectionTitle}>Description</AppText>
                <AppText style={styles.descriptionText}>{session.description || 'No description provided.'}</AppText>
            </View>



            {/* Edit Modal */}
            <Modal visible={isEditModalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <AppText variant="h2">Edit Session</AppText>
                            <Pressable onPress={() => setIsEditModalVisible(false)} style={styles.closeBtn}>
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
                                title="Save Changes"
                                onPress={handleUpdateSession}
                                loading={isUpdating}
                                disabled={isUpdating}
                                style={styles.submitBtn}
                            />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: spacing.lg,
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
    headerCard: {
        backgroundColor: colors.surface,
        padding: spacing.xl,
        borderRadius: 16,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        alignItems: 'center',
    },
    title: {
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    badgeRow: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    badge: {
        backgroundColor: colors.primaryLight + '20',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 14,
        fontWeight: '700',
    },
    sectionCard: {
        backgroundColor: colors.surface,
        padding: spacing.lg,
        borderRadius: 16,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sectionTitle: {
        marginBottom: spacing.md,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: spacing.sm,
    },
    detailTextContainer: {
        marginLeft: spacing.md,
        flex: 1,
    },
    detailLabel: {
        fontSize: 13,
        color: colors.textMuted,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 15,
        color: colors.textPrimary,
        fontWeight: '500',
    },
    detailSubValue: {
        fontSize: 13,
        color: colors.textMuted,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.sm,
    },
    descriptionText: {
        fontSize: 15,
        lineHeight: 22,
        color: colors.textPrimary,
    },
    headerActions: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        flexDirection: 'row',
        gap: spacing.sm,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    batchDatesRow: {
        flexDirection: 'row',
        marginTop: spacing.sm,
        gap: spacing.lg,
    },
    batchDateCol: {
        flex: 1,
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
