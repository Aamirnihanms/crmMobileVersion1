import AppModal from '@/src/components/common/AppModal';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import AppButton from '@/src/components/common/AppButton';
import AppDatePicker from '@/src/components/common/AppDatePicker';
import AppInput from '@/src/components/common/AppInput';
import AppSelect from '@/src/components/common/AppSelect';
import AppText from '@/src/components/common/AppText';
import { useCreateCompanyJob } from '@/src/queries/jobs.query';
import { useAppTheme, spacing } from '@/src/theme';

type TemplateOption = {
    uid: string;
    name: string;
    items_count: number;
};

type Props = {
    visible: boolean;
    companyUid: string;
    templates: TemplateOption[];
    onClose: () => void;
    onSuccess: () => void;
};

const toIsoFromYmd = (ymd: string): string => {
    if (!ymd) return '';
    const d = new Date(`${ymd}T00:00:00.000Z`);
    return d.toISOString();
};

export default function AddCompanyJobModal({
    visible,
    companyUid,
    templates,
    onClose,
    onSuccess,
}: Props) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
    const createMutation = useCreateCompanyJob(companyUid);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [isPublished, setIsPublished] = useState(true);
    const [templateUid, setTemplateUid] = useState<string | null>(null);

    const [fieldErrors, setFieldErrors] = useState<{
        title?: string;
        location?: string;
        expiresAt?: string;
    }>({});

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setLocation('');
        setExpiresAt('');
        setIsPublished(true);
        setTemplateUid(null);
        setFieldErrors({});
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const validate = (): boolean => {
        const errs: { title?: string; location?: string; expiresAt?: string } = {};
        if (!title.trim()) errs.title = 'Title is required.';
        if (!location.trim()) errs.location = 'Location is required.';
        if (!expiresAt) errs.expiresAt = 'Expiry date is required.';
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        try {
            await createMutation.mutateAsync({
                title: title.trim(),
                description: description.trim(),
                location: location.trim(),
                expires_at: toIsoFromYmd(expiresAt),
                is_published: isPublished,
                custom_field_template_uid: templateUid,
            });

            Alert.alert('Success', 'Job created successfully');
            resetForm();
            onSuccess();
        } catch (err: any) {
            const data = err?.response?.data;
            const msg =
                data?.detail ||
                data?.error ||
                data?.message ||
                (data && typeof data === 'object'
                    ? Object.values(data).flat().join('\n')
                    : null) ||
                'Failed to create job.';
            Alert.alert('Error', String(msg));
        }
    };

    const templateOptions = [
        { label: 'None', value: '' },
        ...templates.map((t) => ({
            label: `${t.name} (${t.items_count} field${t.items_count !== 1 ? 's' : ''})`,
            value: t.uid,
        })),
    ];

    return (
        <AppModal statusBarTranslucent navigationBarTranslucent
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <Pressable style={styles.backdrop} onPress={handleClose} />

            <KeyboardAvoidingView
                behavior="padding"
                style={styles.sheetWrapper}
            >
                <View style={styles.sheet}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={styles.headerIcon}>
                                <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
                            </View>
                            <AppText variant="h3" style={styles.headerTitle}>Add New Job</AppText>
                        </View>
                        <Pressable onPress={handleClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={22} color={colors.textMuted} />
                        </Pressable>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.body}
                        keyboardShouldPersistTaps="handled"
                    >
                        <AppInput
                            label="Title *"
                            placeholder="e.g. Senior Frontend Developer"
                            value={title}
                            onChangeText={(v) => {
                                setTitle(v);
                                if (fieldErrors.title) {
                                    setFieldErrors((prev) => ({ ...prev, title: undefined }));
                                }
                            }}
                            error={fieldErrors.title}
                        />

                        <AppInput
                            label="Description"
                            placeholder="Brief description of the role"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={3}
                        />

                        <AppInput
                            label="Location *"
                            placeholder="e.g. Kochi, Kerala"
                            value={location}
                            onChangeText={(v) => {
                                setLocation(v);
                                if (fieldErrors.location) {
                                    setFieldErrors((prev) => ({ ...prev, location: undefined }));
                                }
                            }}
                            error={fieldErrors.location}
                        />

                        <AppDatePicker
                            label="Expires At *"
                            value={expiresAt}
                            onChange={(v) => {
                                setExpiresAt(v);
                                if (fieldErrors.expiresAt) {
                                    setFieldErrors((prev) => ({ ...prev, expiresAt: undefined }));
                                }
                            }}
                            placeholder="Select expiry date"
                            minimumDate={new Date()}
                            error={fieldErrors.expiresAt}
                        />

                        <AppSelect
                            label="Field Template"
                            value={templateUid ?? ''}
                            options={templateOptions}
                            onSelect={(val) => setTemplateUid(val ? String(val) : null)}
                            placeholder="None — no template"
                        />

                        <View style={styles.switchRow}>
                            <View style={{ flex: 1 }}>
                                <AppText style={styles.switchLabel}>Publish Immediately</AppText>
                                <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 2 }}>
                                    Make this job visible to applicants
                                </AppText>
                            </View>
                            <Switch
                                value={isPublished}
                                onValueChange={setIsPublished}
                                trackColor={{ false: colors.border, true: colors.success + '80' }}
                                thumbColor={isPublished ? colors.success : '#f4f3f4'}
                            />
                        </View>

                        <AppButton
                            title="Create Job"
                            onPress={handleSubmit}
                            loading={createMutation.isPending}
                            style={styles.submitBtn}
                        />
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </AppModal>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheetWrapper: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: '92%',
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.surfaceSubtle,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: colors.primaryLight + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    headerTitle: {
        fontWeight: '800',
        color: colors.textPrimary,
    },
    closeBtn: {
        padding: 4,
    },
    body: {
        padding: spacing.lg,
        paddingBottom: spacing.xl,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        marginTop: spacing.xs,
        marginBottom: spacing.md,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.surfaceSubtle,
    },
    switchLabel: {
        fontWeight: '600',
        color: colors.textPrimary,
        fontSize: 15,
    },
    submitBtn: {
        marginTop: spacing.md,
        height: 54,
        borderRadius: 16,
    },
});
