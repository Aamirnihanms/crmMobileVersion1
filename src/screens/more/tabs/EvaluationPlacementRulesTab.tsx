import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import React, { useState } from 'react';
import { 
    ActivityIndicator, 
    StyleSheet, 
    View, 
    Pressable, 
    Modal, 
    ScrollView, 
    Platform, 
    Alert 
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import AppButton from '@/src/components/common/AppButton';
import AppCard from '@/src/components/common/AppCard';
import AppInput from '@/src/components/common/AppInput';
import AppSelect from '@/src/components/common/AppSelect';
import AppText from '@/src/components/common/AppText';
import { 
    usePlacementRules, 
    useCreatePlacementRule,
    useUpdatePlacementRule,
    useDeletePlacementRule
} from '@/src/queries/evaluation.query';
import { colors, spacing } from '@/src/theme';

export default function EvaluationPlacementRulesTab({ 
    templateUid, 
    criteriaCodes = [] 
}: { 
    templateUid: string;
    criteriaCodes?: string[];
}) {
    const { data: rules, isLoading, refetch } = usePlacementRules(templateUid);
    const createMutation = useCreatePlacementRule(templateUid);
    const updateMutation = useUpdatePlacementRule(templateUid);
    const deleteMutation = useDeletePlacementRule(templateUid);
    
    const [isModalVisible, setModalVisible] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        min_overall_percent: '',
        selected_code: '',
        min_code_score: '',
        is_active: true,
    });
    const [errors, setErrors] = useState<any>({});

    const validate = () => {
        const newErrors: any = {};
        if (!formData.name) newErrors.name = 'Name is required';
        if (!formData.min_overall_percent) newErrors.min_overall_percent = 'Overall % is required';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        try {
            const payload: any = {
                template_uid: templateUid,
                name: formData.name,
                min_overall_percent: Number(formData.min_overall_percent),
                is_active: formData.is_active,
                required_codes: [],
                min_score_by_code: {},
            };

            if (formData.selected_code) {
                payload.required_codes = [formData.selected_code];
                payload.min_score_by_code = {
                    [formData.selected_code]: Number(formData.min_code_score || 0)
                };
            }

            if (isEditing && editingId) {
                await updateMutation.mutateAsync({
                    uid: editingId,
                    payload
                });
                Alert.alert('Success', 'Placement rule updated successfully');
            } else {
                await createMutation.mutateAsync(payload);
                Alert.alert('Success', 'Placement rule added successfully');
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
            'Delete Placement Rule',
            `Are you sure you want to delete "${item.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteMutation.mutateAsync(item.uid);
                            Alert.alert('Success', 'Placement rule deleted successfully');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete placement rule');
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
            
            const firstCode = item.required_codes?.[0] || '';
            const firstScore = firstCode ? (item.min_score_by_code?.[firstCode] || '') : '';

            setFormData({
                name: item.name,
                min_overall_percent: String(parseFloat(item.min_overall_percent || 0)),
                selected_code: firstCode,
                min_code_score: String(parseFloat(firstScore || 0)),
                is_active: item.is_active,
            });
        } else {
            setIsEditing(false);
            setEditingId(null);
            setFormData({
                name: '',
                min_overall_percent: '',
                selected_code: '',
                min_code_score: '',
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
        <AppCard style={styles.card}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <View style={styles.titleRow}>
                        <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                        <AppText variant="subtitle" style={styles.ruleName}>{item.name}</AppText>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: item.is_active ? colors.success + '15' : colors.danger + '15' }]}>
                        <AppText variant="caption" color={item.is_active ? colors.success : colors.danger} style={{ fontWeight: '700' }}>
                            {item.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </AppText>
                    </View>
                </View>
                <View style={styles.headerActions}>
                    <Pressable onPress={() => openModal(item)} style={styles.actionBtn}>
                        <Ionicons name="create-outline" size={20} color={colors.primary} />
                    </Pressable>
                    <Pressable onPress={() => handleDelete(item)} style={styles.actionBtn}>
                        <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    </Pressable>
                </View>
            </View>

            <View style={styles.body}>
                <View style={styles.mainMetrics}>
                    <View style={styles.metricCard}>
                        <AppText variant="caption" color={colors.textMuted}>Overall Score</AppText>
                        <AppText variant="h2" color={colors.primary}>{parseFloat(item.min_overall_percent || 0).toFixed(0)}%</AppText>
                    </View>
                    <View style={styles.metricCard}>
                        <AppText variant="caption" color={colors.textMuted}>Attendance</AppText>
                        <AppText variant="h2" color={colors.secondary}>{item.min_attendance_percent ? `${parseFloat(item.min_attendance_percent).toFixed(0)}%` : 'N/A'}</AppText>
                    </View>
                </View>

                <View style={styles.detailsList}>
                    {item.min_technical_percent && (
                        <View style={styles.detailRow}>
                            <Ionicons name="code-working" size={16} color={colors.textMuted} />
                            <AppText variant="body" style={styles.detailText}>Technical: {parseFloat(item.min_technical_percent).toFixed(0)}%</AppText>
                        </View>
                    )}
                    {item.min_mock_interview_score && (
                        <View style={styles.detailRow}>
                            <Ionicons name="chatbubbles-outline" size={16} color={colors.textMuted} />
                            <AppText variant="body" style={styles.detailText}>Mock Interview: {item.min_mock_interview_score}</AppText>
                        </View>
                    )}
                </View>

                {item.required_codes && item.required_codes.length > 0 && (
                    <View style={styles.section}>
                        <AppText variant="caption" style={styles.sectionTitle}>REQUIRED CODES</AppText>
                        <View style={styles.badgeRow}>
                            {item.required_codes.map((code: string) => (
                                <View key={code} style={styles.codeBadge}>
                                    <AppText variant="caption" color="white" style={{ fontWeight: '700' }}>{code}</AppText>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {item.min_score_by_code && Object.keys(item.min_score_by_code).length > 0 && (
                    <View style={styles.section}>
                        <AppText variant="caption" style={styles.sectionTitle}>MIN SCORE BY CODE</AppText>
                        {Object.entries(item.min_score_by_code).map(([code, score]: [string, any]) => (
                            <View key={code} style={styles.scoreRow}>
                                <AppText variant="body" style={{ fontWeight: '600' }}>{code}</AppText>
                                <View style={styles.scoreLine} />
                                <AppText variant="body" color={colors.primary} style={{ fontWeight: '700' }}>{score}%</AppText>
                            </View>
                        ))}
                    </View>
                )}
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
                data={rules}
                keyExtractor={(item) => item.uid}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="shield-outline" size={48} color={colors.textMuted} />
                        <AppText style={styles.emptyText}>No placement rules found</AppText>
                        <AppButton 
                            title="Add First Rule" 
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
                <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
                    <Pressable style={styles.dismissArea} onPress={closeModal} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <AppText variant="h2">{isEditing ? 'Edit Placement Rule' : 'Add Placement Rule'}</AppText>
                            <Pressable onPress={closeModal} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={colors.textMuted} />
                            </Pressable>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
                            <View style={styles.form}>
                                <AppInput
                                    label="Rule Name *"
                                    placeholder="e.g. Standard Placement Criteria"
                                    value={formData.name}
                                    onChangeText={(text) => {
                                        setFormData({ ...formData, name: text });
                                        if (errors.name) setErrors({ ...errors, name: null });
                                    }}
                                    error={Array.isArray(errors.name) ? errors.name[0] : errors.name}
                                />
                                <AppInput
                                    label="Min Overall Percentage *"
                                    placeholder="e.g. 55"
                                    keyboardType="numeric"
                                    value={formData.min_overall_percent}
                                    onChangeText={(text) => {
                                        setFormData({ ...formData, min_overall_percent: text });
                                        if (errors.min_overall_percent) setErrors({ ...errors, min_overall_percent: null });
                                    }}
                                    error={Array.isArray(errors.min_overall_percent) ? errors.min_overall_percent[0] : errors.min_overall_percent}
                                />
                                
                                <View style={styles.row}>
                                    <View style={{ flex: 1, marginRight: spacing.sm }}>
                                        <AppSelect
                                            label="Required Code"
                                            options={criteriaCodes.map(code => ({ label: code, value: code }))}
                                            value={formData.selected_code}
                                            onSelect={(val) => setFormData({ ...formData, selected_code: val })}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <AppInput
                                            label="Min Score %"
                                            placeholder="0"
                                            keyboardType="numeric"
                                            value={formData.min_code_score}
                                            onChangeText={(text) => setFormData({ ...formData, min_code_score: text })}
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
                                    title={isEditing ? 'Update Rule' : 'Add Rule'}
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
    card: {
        marginBottom: spacing.md,
        padding: spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.md,
    },
    titleContainer: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    ruleName: {
        fontWeight: '700',
        marginLeft: spacing.sm,
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
    },
    body: {
        gap: spacing.md,
    },
    mainMetrics: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    metricCard: {
        flex: 1,
        backgroundColor: colors.neutralSoft,
        borderRadius: 12,
        padding: spacing.md,
        alignItems: 'center',
    },
    detailsList: {
        gap: spacing.xs,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        marginLeft: spacing.sm,
        fontSize: 13,
        color: colors.textSecondary,
    },
    section: {
        marginTop: spacing.xs,
    },
    sectionTitle: {
        fontWeight: '700',
        color: colors.textMuted,
        marginBottom: spacing.sm,
        fontSize: 10,
        letterSpacing: 0.5,
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
    },
    codeBadge: {
        backgroundColor: colors.secondary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    scoreLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.divider,
        marginHorizontal: spacing.sm,
        opacity: 0.5,
    },
    emptyContainer: {
        paddingTop: 100,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: spacing.md,
        color: colors.textMuted,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
});
