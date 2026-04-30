import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import AppButton from '@/src/components/common/AppButton';
import AppCard from '@/src/components/common/AppCard';
import AppInput from '@/src/components/common/AppInput';
import AppSelect from '@/src/components/common/AppSelect';
import AppText from '@/src/components/common/AppText';
import {
    useCreateGradeBand,
    useDeleteGradeBand,
    useGradeBands,
    useUpdateGradeBand
} from '@/src/queries/evaluation.query';
import { colors, spacing } from '@/src/theme';

export default function EvaluationGradeBandsTab({ templateUid }: { templateUid: string }) {
    const { data: gradeBands, isLoading, refetch } = useGradeBands(templateUid);
    const createMutation = useCreateGradeBand(templateUid);
    const updateMutation = useUpdateGradeBand(templateUid);
    const deleteMutation = useDeleteGradeBand(templateUid);

    const [isModalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        grade_name: '',
        min_percent: '',
        max_percent: '',
        sequence_no: '',
        is_pass: true,
    });
    const [errors, setErrors] = useState<any>({});

    const validate = () => {
        const newErrors: any = {};
        if (!formData.grade_name) newErrors.grade_name = 'Grade name is required';
        if (!formData.min_percent) newErrors.min_percent = 'Min % is required';
        if (!formData.max_percent) newErrors.max_percent = 'Max % is required';
        if (!formData.sequence_no) newErrors.sequence_no = 'Sequence is required';

        if (formData.min_percent && formData.max_percent) {
            if (Number(formData.max_percent) < Number(formData.min_percent)) {
                newErrors.max_percent = 'Max % must be greater than or equal to min %';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        try {
            if (isEditing && editingId) {
                await updateMutation.mutateAsync({
                    uid: editingId,
                    payload: {
                        ...formData,
                        min_percent: Number(formData.min_percent),
                        max_percent: Number(formData.max_percent),
                        sequence_no: Number(formData.sequence_no),
                    }
                });
                Alert.alert('Success', 'Grade band updated successfully');
            } else {
                await createMutation.mutateAsync({
                    ...formData,
                    template_uid: templateUid,
                    min_percent: Number(formData.min_percent),
                    max_percent: Number(formData.max_percent),
                    sequence_no: Number(formData.sequence_no),
                });
                Alert.alert('Success', 'Grade band added successfully');
            }
            closeModal();
        } catch (error: any) {
            const apiErrors = error?.response?.data?.errors;
            if (apiErrors) {
                setErrors((prev: any) => ({ ...prev, ...apiErrors }));
            }
        }
    };

    const handleDelete = (item: any) => {
        Alert.alert(
            'Delete Grade Band',
            `Are you sure you want to delete "${item.grade_name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteMutation.mutateAsync(item.uid);
                            Alert.alert('Success', 'Grade band deleted successfully');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete grade band');
                        }
                    }
                }
            ]
        );
    };

    const openModal = (item?: any) => {
        if (item) {
            setIsEditing(true);
            setEditingId(item.uid);
            setFormData({
                grade_name: item.grade_name,
                min_percent: String(parseFloat(item.min_percent)),
                max_percent: String(parseFloat(item.max_percent)),
                sequence_no: String(item.sequence_no),
                is_pass: item.is_pass,
            });
        } else {
            setIsEditing(false);
            setEditingId(null);
            setFormData({
                grade_name: '',
                min_percent: '',
                max_percent: '',
                sequence_no: String((gradeBands?.length || 0) + 1),
                is_pass: true,
            });
        }
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setErrors({});
    };

    const renderItem = ({ item }: { item: any }) => (
        <AppCard style={styles.card}>
            <View style={styles.gradeRow}>
                <View style={styles.gradeInfo}>
                    <View style={styles.gradeBadge}>
                        <AppText variant="title" color={colors.primary} style={{ fontWeight: '800' }}>{item.grade_name}</AppText>
                    </View>
                    <View style={styles.percentRow}>
                        <AppText variant="body" style={{ fontWeight: '600' }}>{parseFloat(item.min_percent).toFixed(0)}% - {parseFloat(item.max_percent).toFixed(0)}%</AppText>
                    </View>
                </View>
                <View style={styles.gradeActionsContainer}>
                    <View style={styles.statusRow}>
                        <View style={[styles.passBadge, { backgroundColor: item.is_pass ? colors.success + '15' : colors.danger + '15' }]}>
                            <AppText variant="caption" color={item.is_pass ? colors.success : colors.danger} style={{ fontWeight: '700' }}>
                                {item.is_pass ? 'PASS' : 'FAIL'}
                            </AppText>
                        </View>
                        <AppText variant="caption" color={colors.textMuted}>Seq: {item.sequence_no}</AppText>
                    </View>
                    <View style={styles.actions}>
                        <Pressable onPress={() => openModal(item)} style={styles.actionBtn}>
                            <Ionicons name="create-outline" size={18} color={colors.primary} />
                        </Pressable>
                        <Pressable onPress={() => handleDelete(item)} style={styles.actionBtn}>
                            <Ionicons name="trash-outline" size={18} color={colors.danger} />
                        </Pressable>
                    </View>
                </View>
            </View>
        </AppCard>
    );

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlashList
                data={gradeBands}
                keyExtractor={(item) => item.uid}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="ribbon-outline" size={48} color={colors.textMuted} />
                        <AppText style={styles.emptyText}>No grade bands configured</AppText>
                        <AppButton
                            title="Add First Grade Band"
                            onPress={() => openModal()}
                            style={{ marginTop: spacing.md }}
                            variant="outline"
                        />
                    </View>
                }
                onRefresh={refetch}
                refreshing={isLoading}
            />

            <Pressable
                style={styles.fab}
                onPress={() => openModal()}
            >
                <Ionicons name="add" size={24} color="white" />
            </Pressable>

            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={closeModal}
            >
                <KeyboardAvoidingView
                    behavior="padding"
                    style={styles.modalOverlay}
                >
                    <Pressable style={styles.dismissArea} onPress={closeModal} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <AppText variant="h2">{isEditing ? 'Edit Grade Band' : 'Add Grade Band'}</AppText>
                            <Pressable onPress={closeModal} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={colors.textMuted} />
                            </Pressable>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.modalScrollContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.form}>
                                <AppInput
                                    label="Grade Name *"
                                    placeholder="e.g. A+, B, C"
                                    value={formData.grade_name}
                                    onChangeText={(text) => {
                                        setFormData({ ...formData, grade_name: text });
                                        if (errors.grade_name) setErrors({ ...errors, grade_name: null });
                                    }}
                                    error={Array.isArray(errors.grade_name) ? errors.grade_name[0] : errors.grade_name}
                                />

                                <View style={styles.row}>
                                    <View style={{ flex: 1, marginRight: spacing.sm }}>
                                        <AppInput
                                            label="Min Percentage *"
                                            placeholder="0"
                                            keyboardType="numeric"
                                            value={formData.min_percent}
                                            onChangeText={(text) => {
                                                setFormData({ ...formData, min_percent: text });
                                                if (errors.min_percent) setErrors({ ...errors, min_percent: null });
                                            }}
                                            error={Array.isArray(errors.min_percent) ? errors.min_percent[0] : errors.min_percent}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <AppInput
                                            label="Max Percentage *"
                                            placeholder="100"
                                            keyboardType="numeric"
                                            value={formData.max_percent}
                                            onChangeText={(text) => {
                                                setFormData({ ...formData, max_percent: text });
                                                if (errors.max_percent) setErrors({ ...errors, max_percent: null });
                                            }}
                                            error={Array.isArray(errors.max_percent) ? errors.max_percent[0] : errors.max_percent}
                                        />
                                    </View>
                                </View>

                                <View style={styles.row}>
                                    <View style={{ flex: 1, marginRight: spacing.sm }}>
                                        <AppInput
                                            label="Sequence No *"
                                            placeholder="1"
                                            keyboardType="numeric"
                                            value={formData.sequence_no}
                                            onChangeText={(text) => {
                                                setFormData({ ...formData, sequence_no: text });
                                                if (errors.sequence_no) setErrors({ ...errors, sequence_no: null });
                                            }}
                                            error={Array.isArray(errors.sequence_no) ? errors.sequence_no[0] : errors.sequence_no}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <AppSelect
                                            label="Result Status *"
                                            options={[
                                                { label: 'Pass', value: 'true' },
                                                { label: 'Fail', value: 'false' }
                                            ]}
                                            value={String(formData.is_pass)}
                                            onSelect={(val) => {
                                                setFormData({ ...formData, is_pass: val === 'true' });
                                                if (errors.is_pass) setErrors({ ...errors, is_pass: null });
                                            }}
                                            error={Array.isArray(errors.is_pass) ? errors.is_pass[0] : errors.is_pass}
                                        />
                                    </View>
                                </View>

                                <AppButton
                                    title={isEditing ? 'Update Grade Band' : 'Add Grade Band'}
                                    onPress={handleSave}
                                    loading={createMutation.isPending || updateMutation.isPending}
                                    style={styles.saveBtn}
                                />
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
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
        paddingBottom: 100,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        marginBottom: spacing.md,
        padding: spacing.md,
    },
    gradeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    gradeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    gradeBadge: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
    percentRow: {
        gap: 2,
    },
    gradeActionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    statusRow: {
        alignItems: 'flex-end',
        gap: spacing.xs,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtn: {
        padding: 6,
        marginLeft: spacing.xs,
    },
    passBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    fab: {
        position: 'absolute',
        bottom: spacing.xl,
        right: spacing.xl,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    dismissArea: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
        paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    closeBtn: {
        padding: 4,
    },
    modalScrollContent: {
        paddingBottom: spacing.xl,
    },
    form: {
        gap: spacing.xs,
    },
    row: {
        flexDirection: 'row',
    },
    saveBtn: {
        marginTop: spacing.lg,
    },
    emptyContainer: {
        paddingTop: 100,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: spacing.md,
        color: colors.textMuted,
    },
});
