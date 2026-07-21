import AppModal from '@/src/components/common/AppModal';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@shopify/flash-list';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import AppButton from '@/src/components/common/AppButton';
import AppCard from '@/src/components/common/AppCard';
import AppDatePicker from '@/src/components/common/AppDatePicker';
import AppInput from '@/src/components/common/AppInput';
import AppSelect from '@/src/components/common/AppSelect';
import AppText from '@/src/components/common/AppText';
import {
    useCreateEvaluationTemplate,
    useDeleteEvaluationTemplate,
    useEvaluationTemplates,
    useUpdateEvaluationTemplate
} from '@/src/queries/evaluation.query';
import { useCourses } from '@/src/queries/masters/courses.query';
import { useAppTheme, spacing } from '@/src/theme';

function TemplateCard({ template, onPress, onEdit, onDelete }: {
    template: any,
    onPress: () => void,
    onEdit: () => void,
    onDelete: () => void
}) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
    return (
        <AppCard style={styles.templateCard} onPress={onPress}>
            <View style={styles.cardHeader}>
                <View style={styles.titleContainer}>
                    <AppText variant="subtitle" style={styles.templateName}>{template.name}</AppText>
                    <View style={styles.versionBadge}>
                        <AppText variant="caption" color={colors.primary} style={{ fontWeight: '700' }}>v{template.version}</AppText>
                    </View>
                </View>
                <View style={styles.headerActions}>
                    <Pressable
                        onPress={(e) => {
                            e.stopPropagation();
                            onEdit();
                        }}
                        style={styles.actionBtn}
                    >
                        <Ionicons name="create-outline" size={20} color={colors.primary} />
                    </Pressable>
                    <Pressable
                        onPress={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        style={styles.actionBtn}
                    >
                        <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    </Pressable>
                </View>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: template.is_active ? colors.success + '15' : colors.danger + '15' }]}>
                <AppText variant="caption" color={template.is_active ? colors.success : colors.danger} style={{ fontWeight: '700' }}>
                    {template.is_active ? 'ACTIVE' : 'INACTIVE'}
                </AppText>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <Ionicons name="book-outline" size={16} color={colors.textMuted} />
                    <AppText variant="body" color={colors.textSecondary} style={styles.infoText}>{template.course_name}</AppText>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
                    <AppText variant="body" color={colors.textSecondary} style={styles.infoText}>
                        Effective from: {template.effective_from}
                    </AppText>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <AppText variant="caption" color={colors.textMuted}>
                    Created: {new Date(template.created_at).toLocaleDateString()}
                </AppText>
                {template.is_locked && (
                    <View style={styles.lockedBadge}>
                        <Ionicons name="lock-closed" size={12} color={colors.warning} />
                        <AppText variant="caption" color={colors.warning} style={{ marginLeft: 4 }}>Locked</AppText>
                    </View>
                )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={styles.chevron} />
        </AppCard>
    );
}

export default function EvaluationTemplatesScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
    const navigation = useNavigation<any>();
    const { data: templates, isLoading } = useEvaluationTemplates();
    const { data: courses } = useCourses();
    const createMutation = useCreateEvaluationTemplate();
    const updateMutation = useUpdateEvaluationTemplate();
    const deleteMutation = useDeleteEvaluationTemplate();

    const [isModalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        course: '',
        version: '1',
        effective_from: new Date().toISOString().split('T')[0],
        is_active: true,
    });
    const [errors, setErrors] = useState<any>({});

    const courseOptions = useMemo(() =>
        courses?.map((c: any) => ({ label: c.course_name, value: String(c.id) })) || [],
        [courses]);

    const validate = () => {
        const newErrors: any = {};
        if (!formData.name) newErrors.name = 'Name is required';
        if (!formData.course) newErrors.course = 'Course is required';
        if (!formData.version) newErrors.version = 'Version is required';
        if (!formData.effective_from) newErrors.effective_from = 'Effective date is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        try {
            if (isEditing && editingTemplateId) {
                await updateMutation.mutateAsync({
                    uid: editingTemplateId,
                    payload: {
                        ...formData,
                        course: Number(formData.course),
                        version: Number(formData.version),
                    }
                });
                Alert.alert('Success', 'Template updated successfully');
            } else {
                await createMutation.mutateAsync({
                    ...formData,
                    course: Number(formData.course),
                    version: Number(formData.version),
                });
                Alert.alert('Success', 'Template created successfully');
            }
            closeModal();
        } catch (error: any) {
            const apiErrors = error?.response?.data?.errors;
            if (apiErrors) setErrors((prev: any) => ({ ...prev, ...apiErrors }));
        }
    };

    const handleDelete = (template: any) => {
        Alert.alert(
            'Delete Template',
            `Are you sure you want to delete "${template.name}"? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteMutation.mutateAsync(template.uid);
                            Alert.alert('Success', 'Template deleted successfully');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete template');
                        }
                    }
                }
            ]
        );
    };

    const openModal = (template?: any) => {
        if (template) {
            setIsEditing(true);
            setEditingTemplateId(template.uid);
            setFormData({
                name: template.name,
                course: String(template.course_id),
                version: String(template.version),
                effective_from: template.effective_from,
                is_active: template.is_active,
            });
        } else {
            setIsEditing(false);
            setEditingTemplateId(null);
            setFormData({
                name: '',
                course: '',
                version: '1',
                effective_from: new Date().toISOString().split('T')[0],
                is_active: true,
            });
        }
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setErrors({});
    };

    const renderItem = ({ item }: { item: any }) => (
        <TemplateCard
            template={item}
            onPress={() => navigation.navigate('EvaluationTemplateDetail', { uid: item.uid })}
            onEdit={() => openModal(item)}
            onDelete={() => handleDelete(item)}
        />
    );

    if (isLoading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
        </View>
    );

    return (
        <View style={styles.container}>
            <FlashList
                data={templates}
                keyExtractor={(item) => item.uid}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="document-text-outline" size={48} color={colors.textMuted} />
                        <AppText style={styles.emptyText}>No evaluation templates found</AppText>
                    </View>
                }
            />

            <Pressable
                style={styles.fab}
                onPress={() => openModal()}
            >
                <Ionicons name="add" size={32} color="white" />
            </Pressable>

            <AppModal statusBarTranslucent navigationBarTranslucent
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={closeModal}
            >
                <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
                    <Pressable style={styles.dismissArea} onPress={closeModal} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <AppText variant="h2">{isEditing ? 'Edit Template' : 'Add New Template'}</AppText>
                            <Pressable onPress={closeModal} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={colors.textMuted} />
                            </Pressable>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
                            <View style={styles.form}>
                                <AppInput
                                    label="Template Name *"
                                    placeholder="e.g. B.Tech Python Evaluation"
                                    value={formData.name}
                                    onChangeText={(text) => {
                                        setFormData({ ...formData, name: text });
                                        if (errors.name) setErrors({ ...errors, name: null });
                                    }}
                                    error={Array.isArray(errors.name) ? errors.name[0] : errors.name}
                                />
                                <AppSelect
                                    label="Course *"
                                    placeholder="Select Course"
                                    options={courseOptions}
                                    value={formData.course}
                                    onSelect={(val) => {
                                        setFormData({ ...formData, course: val });
                                        if (errors.course) setErrors({ ...errors, course: null });
                                    }}
                                    error={errors.course}
                                />
                                <View style={styles.row}>
                                    <View style={{ flex: 1, marginRight: spacing.sm }}>
                                        <AppInput
                                            label="Version *"
                                            placeholder="1"
                                            keyboardType="numeric"
                                            value={formData.version}
                                            onChangeText={(text) => setFormData({ ...formData, version: text })}
                                            error={errors.version}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <AppDatePicker
                                            label="Effective From *"
                                            value={formData.effective_from}
                                            onChange={(val) => setFormData({ ...formData, effective_from: val })}
                                            error={errors.effective_from}
                                        />
                                    </View>
                                </View>
                                <AppSelect
                                    label="Status"
                                    options={[
                                        { label: 'Active', value: 'true' },
                                        { label: 'Inactive', value: 'false' }
                                    ]}
                                    value={String(formData.is_active)}
                                    onSelect={(val) => setFormData({ ...formData, is_active: val === 'true' })}
                                />
                                <AppButton
                                    title={isEditing ? 'Update Template' : 'Create Template'}
                                    onPress={handleSave}
                                    loading={createMutation.isPending || updateMutation.isPending}
                                    style={styles.saveBtn}
                                />
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </AppModal>
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
    listContent: {
        padding: spacing.lg,
        paddingBottom: 100,
    },
    templateCard: {
        marginBottom: spacing.md,
        padding: spacing.lg,
        position: 'relative',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.xs,
    },
    titleContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    templateName: {
        fontWeight: '700',
        marginRight: spacing.sm,
    },
    versionBadge: {
        backgroundColor: colors.primary + '15',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtn: {
        padding: 6,
        marginLeft: spacing.xs,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: spacing.sm,
    },
    cardBody: {
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoText: {
        marginLeft: spacing.xs,
        fontSize: 14,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.divider + '50',
        paddingTop: spacing.sm,
    },
    lockedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.warning + '15',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    chevron: {
        position: 'absolute',
        right: spacing.md,
        top: '50%',
        marginTop: -10,
    },
    fab: {
        position: 'absolute',
        bottom: spacing.xl,
        right: spacing.xl,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    emptyContainer: {
        paddingTop: 100,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: spacing.md,
        color: colors.textMuted,
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
        marginBottom: spacing.xl,
    },
    closeBtn: {
        padding: 4,
    },
    modalScrollContent: {
        paddingBottom: spacing.xl,
    },
    form: {
        gap: spacing.md,
    },
    row: {
        flexDirection: 'row',
    },
    saveBtn: {
        marginTop: spacing.xl,
    },
});
