import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import React, { useState, useMemo } from 'react';
import { 
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
    useCreateEvaluationModule, 
    useCreateEvaluationCriteria,
    useUpdateEvaluationModule,
    useDeleteEvaluationModule,
    useUpdateEvaluationCriteria,
    useDeleteEvaluationCriteria
} from '@/src/queries/evaluation.query';
import { colors, spacing } from '@/src/theme';

export default function EvaluationModulesTab({ modules, templateUid }: { modules: any[], templateUid: string }) {
    const createModuleMutation = useCreateEvaluationModule(templateUid);
    const updateModuleMutation = useUpdateEvaluationModule(templateUid);
    const deleteModuleMutation = useDeleteEvaluationModule(templateUid);
    const createCriteriaMutation = useCreateEvaluationCriteria(templateUid);
    const updateCriteriaMutation = useUpdateEvaluationCriteria(templateUid);
    const deleteCriteriaMutation = useDeleteEvaluationCriteria(templateUid);
    
    const [isModuleModalVisible, setModuleModalVisible] = useState(false);
    const [isEditingModule, setIsEditingModule] = useState(false);
    const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
    
    const [isCriteriaModalVisible, setCriteriaModalVisible] = useState(false);
    const [isEditingCriteria, setIsEditingCriteria] = useState(false);
    const [editingCriteriaId, setEditingCriteriaId] = useState<string | null>(null);
    const [selectedModule, setSelectedModule] = useState<any>(null);
    
    // Auto-calculate next module sequence
    const nextModuleSequence = useMemo(() => {
        if (!modules || modules.length === 0) return 1;
        const maxSeq = Math.max(...modules.map(m => m.sequence_no || 0));
        return maxSeq + 1;
    }, [modules]);

    // Module Form State
    const [moduleFormData, setModuleFormData] = useState({
        module_name: '',
        module_code: '',
        description: '',
        sequence_no: String(nextModuleSequence),
        is_active: true,
    });
    
    // Criteria Form State
    const [criteriaFormData, setCriteriaFormData] = useState({
        name: '',
        code: '',
        score_type: 'numeric',
        max_score: '100',
        sequence_no: '1',
        weight_percent: '0',
        is_required: true,
    });
    
    const [errors, setErrors] = useState<any>({});

    const validateModule = () => {
        const newErrors: any = {};
        if (!moduleFormData.module_name) newErrors.module_name = 'Module name is required';
        if (!moduleFormData.sequence_no) newErrors.sequence_no = 'Sequence is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateCriteria = () => {
        const newErrors: any = {};
        if (!criteriaFormData.name) newErrors.name = 'Name is required';
        if (!criteriaFormData.code) newErrors.code = 'Code is required';
        if (!criteriaFormData.max_score) newErrors.max_score = 'Max score is required';
        if (!criteriaFormData.sequence_no) newErrors.sequence_no = 'Sequence is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSaveModule = async () => {
        if (!validateModule()) return;
        try {
            if (isEditingModule && editingModuleId) {
                await updateModuleMutation.mutateAsync({
                    uid: editingModuleId,
                    payload: {
                        ...moduleFormData,
                        sequence_no: Number(moduleFormData.sequence_no),
                    }
                });
                Alert.alert('Success', 'Module updated successfully');
            } else {
                await createModuleMutation.mutateAsync({
                    ...moduleFormData,
                    template_uid: templateUid,
                    sequence_no: Number(moduleFormData.sequence_no),
                });
                Alert.alert('Success', 'Module added successfully');
            }
            closeModuleModal();
        } catch (error: any) {
            const apiErrors = error?.response?.data?.errors;
            if (apiErrors) setErrors((prev: any) => ({ ...prev, ...apiErrors }));
        }
    };

    const handleDeleteModule = (module: any) => {
        Alert.alert(
            'Delete Module',
            `Are you sure you want to delete "${module.module_name}"? This will also delete all criteria within this module.`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteModuleMutation.mutateAsync(module.uid);
                            Alert.alert('Success', 'Module deleted successfully');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete module');
                        }
                    }
                }
            ]
        );
    };

    const closeModuleModal = () => {
        setModuleModalVisible(false);
        setIsEditingModule(false);
        setEditingModuleId(null);
        setModuleFormData({
            module_name: '',
            module_code: '',
            description: '',
            sequence_no: String(nextModuleSequence),
            is_active: true,
        });
        setErrors({});
    };

    const openModuleModal = (module?: any) => {
        if (module) {
            setIsEditingModule(true);
            setEditingModuleId(module.uid);
            setModuleFormData({
                module_name: module.module_name,
                module_code: module.module_code || '',
                description: module.description || '',
                sequence_no: String(module.sequence_no),
                is_active: module.is_active,
            });
        } else {
            setIsEditingModule(false);
            setEditingModuleId(null);
            setModuleFormData(prev => ({ ...prev, sequence_no: String(nextModuleSequence) }));
        }
        setModuleModalVisible(true);
    };

    const handleSaveCriteria = async () => {
        if (!validateCriteria()) return;
        try {
            if (isEditingCriteria && editingCriteriaId) {
                await updateCriteriaMutation.mutateAsync({
                    uid: editingCriteriaId,
                    payload: {
                        ...criteriaFormData,
                        max_score: Number(criteriaFormData.max_score),
                        sequence_no: Number(criteriaFormData.sequence_no),
                        weight_percent: Number(criteriaFormData.weight_percent),
                    }
                });
                Alert.alert('Success', 'Criteria updated successfully');
            } else {
                await createCriteriaMutation.mutateAsync({
                    ...criteriaFormData,
                    module_uid: selectedModule.uid,
                    max_score: Number(criteriaFormData.max_score),
                    sequence_no: Number(criteriaFormData.sequence_no),
                    weight_percent: Number(criteriaFormData.weight_percent),
                });
                Alert.alert('Success', 'Criteria added successfully');
            }
            closeCriteriaModal();
        } catch (error: any) {
            const apiErrors = error?.response?.data?.errors;
            if (apiErrors) setErrors((prev: any) => ({ ...prev, ...apiErrors }));
        }
    };

    const handleDeleteCriteria = (criteria: any) => {
        Alert.alert(
            'Delete Criteria',
            `Are you sure you want to delete "${criteria.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteCriteriaMutation.mutateAsync(criteria.uid);
                            Alert.alert('Success', 'Criteria deleted successfully');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete criteria');
                        }
                    }
                }
            ]
        );
    };

    const closeCriteriaModal = () => {
        setCriteriaModalVisible(false);
        setIsEditingCriteria(false);
        setEditingCriteriaId(null);
        setCriteriaFormData({
            name: '',
            code: '',
            score_type: 'numeric',
            max_score: '100',
            sequence_no: '1',
            weight_percent: '0',
            is_required: true,
        });
        setErrors({});
    };

    const openCriteriaModal = (module: any, criteria?: any) => {
        setSelectedModule(module);
        if (criteria) {
            setIsEditingCriteria(true);
            setEditingCriteriaId(criteria.uid);
            setCriteriaFormData({
                name: criteria.name,
                code: criteria.code,
                score_type: criteria.score_type,
                max_score: String(parseFloat(criteria.max_score)),
                sequence_no: String(criteria.sequence_no),
                weight_percent: String(parseFloat(criteria.weight_percent)),
                is_required: criteria.is_required,
            });
        } else {
            setIsEditingCriteria(false);
            setEditingCriteriaId(null);
            const nextCritSeq = (module.criteria?.length || 0) + 1;
            setCriteriaFormData({
                name: '',
                code: '',
                score_type: 'numeric',
                max_score: '100',
                sequence_no: String(nextCritSeq),
                weight_percent: '0',
                is_required: true,
            });
        }
        setCriteriaModalVisible(true);
    };

    const renderItem = ({ item }: { item: any }) => (
        <AppCard style={styles.card}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.titleRow}>
                        <AppText variant="subtitle" style={styles.moduleName}>{item.module_name}</AppText>
                        <View style={styles.sequenceBadge}>
                            <AppText variant="caption" color={colors.textMuted}>Seq: {item.sequence_no}</AppText>
                        </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: item.is_active ? colors.success + '15' : colors.danger + '15' }]}>
                        <AppText variant="caption" color={item.is_active ? colors.success : colors.danger} style={{ fontWeight: '700' }}>
                            {item.is_active ? 'ACTIVE' : 'INACTIVE'}
                        </AppText>
                    </View>
                </View>
                <View style={styles.headerActions}>
                    <Pressable onPress={() => openModuleModal(item)} style={styles.actionBtn}>
                        <Ionicons name="create-outline" size={20} color={colors.primary} />
                    </Pressable>
                    <Pressable onPress={() => handleDeleteModule(item)} style={styles.actionBtn}>
                        <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    </Pressable>
                </View>
            </View>
            <View style={styles.body}>
                <View style={styles.infoRow}>
                    <Ionicons name="barcode-outline" size={14} color={colors.textMuted} />
                    <AppText variant="body" color={colors.textSecondary} style={styles.infoText}>Code: {item.module_code || 'N/A'}</AppText>
                </View>
                
                {item.description && (
                    <AppText variant="caption" color={colors.textMuted} style={styles.description}>
                        {item.description}
                    </AppText>
                )}

                {item.criteria && item.criteria.length > 0 ? (
                    <View style={styles.criteriaContainer}>
                        <View style={styles.criteriaHeader}>
                            <View style={styles.criteriaHeaderLeft}>
                                <Ionicons name="list" size={16} color={colors.primary} />
                                <AppText variant="subtitle" style={styles.criteriaTitle}>Criteria ({item.criteria.length})</AppText>
                            </View>
                            <Pressable 
                                style={styles.addCriteriaIconBtn}
                                onPress={() => openCriteriaModal(item)}
                            >
                                <Ionicons name="add-circle" size={24} color={colors.primary} />
                            </Pressable>
                        </View>
                        {item.criteria.map((crit: any) => (
                            <View key={crit.uid} style={styles.criteriaItem}>
                                <View style={styles.criteriaTop}>
                                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                                        <AppText variant="body" style={styles.critName}>{crit.name}</AppText>
                                        <View style={styles.critCodeBadge}>
                                            <AppText variant="caption" color={colors.primary}>{crit.code}</AppText>
                                        </View>
                                    </View>
                                    <View style={styles.criteriaActions}>
                                        <Pressable onPress={() => openCriteriaModal(item, crit)} style={styles.criteriaActionBtn}>
                                            <Ionicons name="create-outline" size={16} color={colors.primary} />
                                        </Pressable>
                                        <Pressable onPress={() => handleDeleteCriteria(crit)} style={styles.criteriaActionBtn}>
                                            <Ionicons name="trash-outline" size={16} color={colors.danger} />
                                        </Pressable>
                                    </View>
                                </View>
                                <View style={styles.critMeta}>
                                    <View style={styles.critMetaItem}>
                                        <Ionicons name="options-outline" size={12} color={colors.textMuted} />
                                        <AppText variant="caption" color={colors.textSecondary} style={styles.critMetaText}>
                                            {crit.score_type}
                                        </AppText>
                                    </View>
                                    <View style={styles.critMetaItem}>
                                        <Ionicons name="analytics-outline" size={12} color={colors.textMuted} />
                                        <AppText variant="caption" color={colors.textSecondary} style={styles.critMetaText}>
                                            Max: {parseFloat(crit.max_score).toFixed(0)}
                                        </AppText>
                                    </View>
                                    <View style={styles.critMetaItem}>
                                        <Ionicons name="pie-chart-outline" size={12} color={colors.textMuted} />
                                        <AppText variant="caption" color={colors.textSecondary} style={styles.critMetaText}>
                                            {parseFloat(crit.weight_percent).toFixed(0)}% Weight
                                        </AppText>
                                    </View>
                                    {crit.is_required && (
                                        <View style={styles.reqBadge}>
                                            <AppText variant="caption" color="white" style={{ fontSize: 9, fontWeight: '700' }}>REQ</AppText>
                                        </View>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <Pressable 
                        style={styles.emptyCriteriaBtn}
                        onPress={() => openCriteriaModal(item)}
                    >
                        <Ionicons name="add-outline" size={18} color={colors.primary} />
                        <AppText variant="caption" color={colors.primary} style={styles.emptyCriteriaText}>Add First Criteria</AppText>
                    </Pressable>
                )}
            </View>
        </AppCard>
    );

    return (
        <View style={styles.container}>
            <FlashList
                data={modules}
                keyExtractor={(item) => item.uid}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="layers-outline" size={48} color={colors.textMuted} />
                        <AppText style={styles.emptyText}>No modules found</AppText>
                    </View>
                }
            />

            <Pressable 
                style={styles.fab}
                onPress={() => openModuleModal()}
            >
                <Ionicons name="add" size={24} color="white" />
            </Pressable>

            {/* Module Modal */}
            <Modal
                visible={isModuleModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={closeModuleModal}
            >
                <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
                    <Pressable style={styles.dismissArea} onPress={closeModuleModal} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <AppText variant="h2">{isEditingModule ? 'Edit Module' : 'Add New Module'}</AppText>
                            <Pressable onPress={closeModuleModal} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={colors.textMuted} />
                            </Pressable>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
                            <View style={styles.form}>
                                <AppInput
                                    label="Module Name *"
                                    placeholder="e.g. Theory Test"
                                    value={moduleFormData.module_name}
                                    onChangeText={(text) => {
                                        setModuleFormData({ ...moduleFormData, module_name: text });
                                        if (errors.module_name) setErrors({ ...errors, module_name: null });
                                    }}
                                    error={Array.isArray(errors.module_name) ? errors.module_name[0] : errors.module_name}
                                />
                                <View style={styles.row}>
                                    <View style={{ flex: 1, marginRight: spacing.sm }}>
                                        <AppInput
                                            label="Module Code"
                                            placeholder="e.g. MOD01"
                                            value={moduleFormData.module_code}
                                            onChangeText={(text) => {
                                                setModuleFormData({ ...moduleFormData, module_code: text });
                                                if (errors.module_code) setErrors({ ...errors, module_code: null });
                                            }}
                                            error={Array.isArray(errors.module_code) ? errors.module_code[0] : errors.module_code}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <AppInput
                                            label="Sequence No *"
                                            placeholder="1"
                                            keyboardType="numeric"
                                            value={moduleFormData.sequence_no}
                                            onChangeText={(text) => {
                                                setModuleFormData({ ...moduleFormData, sequence_no: text });
                                                if (errors.sequence_no) setErrors({ ...errors, sequence_no: null });
                                            }}
                                            error={Array.isArray(errors.sequence_no) ? errors.sequence_no[0] : errors.sequence_no}
                                        />
                                    </View>
                                </View>
                                <AppInput
                                    label="Description"
                                    placeholder="Module details..."
                                    multiline
                                    numberOfLines={3}
                                    value={moduleFormData.description}
                                    onChangeText={(text) => setModuleFormData({ ...moduleFormData, description: text })}
                                />
                                <AppSelect
                                    label="Status"
                                    options={[
                                        { label: 'Active', value: 'true' },
                                        { label: 'Inactive', value: 'false' }
                                    ]}
                                    value={String(moduleFormData.is_active)}
                                    onSelect={(val) => setModuleFormData({ ...moduleFormData, is_active: val === 'true' })}
                                />
                                <AppButton
                                    title={isEditingModule ? 'Update Module' : 'Add Module'}
                                    onPress={handleSaveModule}
                                    loading={createModuleMutation.isPending || updateModuleMutation.isPending}
                                    style={styles.saveBtn}
                                />
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Criteria Modal */}
            <Modal
                visible={isCriteriaModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={closeCriteriaModal}
            >
                <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
                    <Pressable style={styles.dismissArea} onPress={closeCriteriaModal} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <AppText variant="h2">{isEditingCriteria ? 'Edit Criteria' : 'Add Criteria'}</AppText>
                                <AppText variant="caption" color={colors.textMuted}>For: {selectedModule?.module_name}</AppText>
                            </View>
                            <Pressable onPress={closeCriteriaModal} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={colors.textMuted} />
                            </Pressable>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
                            <View style={styles.form}>
                                <AppInput
                                    label="Criteria Name *"
                                    placeholder="e.g. Technical Skills"
                                    value={criteriaFormData.name}
                                    onChangeText={(text) => {
                                        setCriteriaFormData({ ...criteriaFormData, name: text });
                                        if (errors.name) setErrors({ ...errors, name: null });
                                    }}
                                    error={Array.isArray(errors.name) ? errors.name[0] : errors.name}
                                />
                                <AppInput
                                    label="Criteria Code *"
                                    placeholder="e.g. TECH"
                                    autoCapitalize="characters"
                                    value={criteriaFormData.code}
                                    onChangeText={(text) => {
                                        setCriteriaFormData({ ...criteriaFormData, code: text });
                                        if (errors.code) setErrors({ ...errors, code: null });
                                    }}
                                    error={Array.isArray(errors.code) ? errors.code[0] : errors.code}
                                />
                                <View style={styles.row}>
                                    <View style={{ flex: 1, marginRight: spacing.sm }}>
                                        <AppSelect
                                            label="Score Type *"
                                            options={[
                                                { label: 'Numeric', value: 'numeric' },
                                                { label: 'Rubric', value: 'rubric' },
                                                { label: 'Boolean', value: 'boolean' },
                                                { label: 'Text', value: 'text' }
                                            ]}
                                            value={criteriaFormData.score_type}
                                            onSelect={(val) => setCriteriaFormData({ ...criteriaFormData, score_type: val })}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <AppInput
                                            label="Sequence No *"
                                            placeholder="1"
                                            keyboardType="numeric"
                                            value={criteriaFormData.sequence_no}
                                            onChangeText={(text) => {
                                                setCriteriaFormData({ ...criteriaFormData, sequence_no: text });
                                                if (errors.sequence_no) setErrors({ ...errors, sequence_no: null });
                                            }}
                                            error={Array.isArray(errors.sequence_no) ? errors.sequence_no[0] : errors.sequence_no}
                                        />
                                    </View>
                                </View>
                                <View style={styles.row}>
                                    <View style={{ flex: 1, marginRight: spacing.sm }}>
                                        <AppInput
                                            label="Max Score *"
                                            placeholder="100"
                                            keyboardType="numeric"
                                            value={criteriaFormData.max_score}
                                            onChangeText={(text) => {
                                                setCriteriaFormData({ ...criteriaFormData, max_score: text });
                                                if (errors.max_score) setErrors({ ...errors, max_score: null });
                                            }}
                                            error={Array.isArray(errors.max_score) ? errors.max_score[0] : errors.max_score}
                                        />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <AppInput
                                            label="Weight %"
                                            placeholder="0"
                                            keyboardType="numeric"
                                            value={criteriaFormData.weight_percent}
                                            onChangeText={(text) => setCriteriaFormData({ ...criteriaFormData, weight_percent: text })}
                                        />
                                    </View>
                                </View>
                                <View style={styles.row}>
                                    <View style={{ flex: 1 }}>
                                        <AppSelect
                                            label="Required *"
                                            options={[
                                                { label: 'Yes', value: 'true' },
                                                { label: 'No', value: 'false' }
                                            ]}
                                            value={String(criteriaFormData.is_required)}
                                            onSelect={(val) => setCriteriaFormData({ ...criteriaFormData, is_required: val === 'true' })}
                                        />
                                    </View>
                                </View>
                                <AppButton
                                    title={isEditingCriteria ? 'Update Criteria' : 'Add Criteria'}
                                    onPress={handleSaveCriteria}
                                    loading={createCriteriaMutation.isPending || updateCriteriaMutation.isPending}
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
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    headerLeft: {
        flex: 1,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionBtn: {
        padding: 8,
        marginLeft: spacing.xs,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    moduleName: {
        fontWeight: '700',
        marginRight: spacing.sm,
        fontSize: 16,
    },
    sequenceBadge: {
        backgroundColor: colors.neutralSoft,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    body: {
        gap: spacing.xs,
        marginBottom: spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoText: {
        marginLeft: spacing.xs,
        fontSize: 13,
    },
    description: {
        marginTop: 4,
        fontStyle: 'italic',
        marginBottom: spacing.xs,
    },
    criteriaContainer: {
        marginTop: spacing.md,
        backgroundColor: colors.neutralSoft,
        borderRadius: 12,
        padding: spacing.sm,
    },
    criteriaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
        paddingBottom: spacing.xs,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider + '50',
    },
    criteriaHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    addCriteriaIconBtn: {
        padding: 4,
    },
    emptyCriteriaBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.md,
        padding: spacing.sm,
        borderWidth: 1,
        borderColor: colors.primary + '30',
        borderStyle: 'dashed',
        borderRadius: 12,
        backgroundColor: colors.primary + '05',
    },
    emptyCriteriaText: {
        marginLeft: spacing.xs,
        fontWeight: '600',
    },
    criteriaTitle: {
        marginLeft: spacing.xs,
        fontWeight: '700',
        fontSize: 14,
    },
    criteriaItem: {
        backgroundColor: colors.surface,
        borderRadius: 8,
        padding: spacing.sm,
        marginBottom: spacing.xs,
    },
    criteriaTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    critName: {
        fontWeight: '600',
        fontSize: 13,
        flex: 1,
    },
    critCodeBadge: {
        backgroundColor: colors.primary + '10',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: spacing.sm,
    },
    criteriaActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    criteriaActionBtn: {
        padding: 4,
        marginLeft: 4,
    },
    critMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    critMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    critMetaText: {
        marginLeft: 4,
        fontSize: 11,
        textTransform: 'capitalize',
    },
    reqBadge: {
        backgroundColor: colors.danger,
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 4,
    },
    emptyContainer: {
        paddingTop: 100,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: spacing.md,
        color: colors.textMuted,
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
