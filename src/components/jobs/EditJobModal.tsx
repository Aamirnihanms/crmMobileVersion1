import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
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
import AppText from '@/src/components/common/AppText';
import { useUpdateJob } from '@/src/queries/jobs.query';
import { colors, spacing } from '@/src/theme';
import type { JobResponse } from '@/src/api/jobs.api';

type Props = {
    visible: boolean;
    companyUid: string;
    job: JobResponse;
    onClose: () => void;
    onSuccess: () => void;
};

const toIsoFromYmd = (ymd: string): string => {
    if (!ymd) return '';
    const d = new Date(`${ymd}T00:00:00.000Z`);
    return d.toISOString();
};

const ymdFromIso = (iso: string | null): string => {
    if (!iso) return '';
    try {
        return new Date(iso).toISOString().slice(0, 10);
    } catch {
        return '';
    }
};

export default function EditJobModal({
    visible,
    companyUid,
    job,
    onClose,
    onSuccess,
}: Props) {
    const updateMutation = useUpdateJob(companyUid);

    const [title, setTitle] = useState(job.title);
    const [description, setDescription] = useState(job.description ?? '');
    const [location, setLocation] = useState(job.location ?? '');
    const [expiresAt, setExpiresAt] = useState(ymdFromIso(job.expires_at));
    const [isPublished, setIsPublished] = useState(job.is_published);

    const [fieldErrors, setFieldErrors] = useState<{
        title?: string;
        location?: string;
        expiresAt?: string;
    }>({});

    useEffect(() => {
        if (visible) {
            setTitle(job.title);
            setDescription(job.description ?? '');
            setLocation(job.location ?? '');
            setExpiresAt(ymdFromIso(job.expires_at));
            setIsPublished(job.is_published);
            setFieldErrors({});
        }
    }, [visible, job]);

    const handleClose = () => {
        if (updateMutation.isPending) return;
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
            await updateMutation.mutateAsync({
                jobUid: job.uid,
                data: {
                    title: title.trim(),
                    description: description.trim(),
                    location: location.trim(),
                    expires_at: toIsoFromYmd(expiresAt),
                    is_published: isPublished,
                },
            });

            Alert.alert('Success', 'Job updated successfully');
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
                'Failed to update job.';
            Alert.alert('Error', String(msg));
        }
    };

    return (
        <Modal
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
                            <AppText variant="h3" style={styles.headerTitle}>Edit Job</AppText>
                        </View>
                        <Pressable onPress={handleClose} style={styles.closeBtn} disabled={updateMutation.isPending}>
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
                            error={fieldErrors.expiresAt}
                        />

                        <View style={styles.readOnlyRow}>
                            <AppText variant="caption" color={colors.textMuted}>Field Template</AppText>
                            <AppText variant="body" style={styles.readOnlyValue}>
                                {job.custom_field_template_uid ? 'Custom template attached' : 'None'}
                            </AppText>
                            <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 2 }}>
                                Template cannot be changed after creation.
                            </AppText>
                        </View>

                        <View style={styles.switchRow}>
                            <View style={{ flex: 1 }}>
                                <AppText style={styles.switchLabel}>Published</AppText>
                                <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 2 }}>
                                    {isPublished ? 'Job is visible to applicants' : 'Job is hidden from applicants'}
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
                            title="Save Changes"
                            onPress={handleSubmit}
                            loading={updateMutation.isPending}
                            style={styles.submitBtn}
                        />
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
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
    readOnlyRow: {
        paddingVertical: spacing.md,
        marginTop: spacing.xs,
        marginBottom: spacing.md,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.surfaceSubtle,
    },
    readOnlyValue: {
        fontWeight: '600',
        marginTop: 4,
        color: colors.textPrimary,
    },
    submitBtn: {
        marginTop: spacing.md,
        height: 54,
        borderRadius: 16,
    },
});
