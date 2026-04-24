import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchBatches } from '../../api/batches.api';
import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import AppMultiSelect from '../../components/common/AppMultiSelect';
import AppText from '../../components/common/AppText';
import { MoreStackParamList } from '../../navigation/MoreStack';
import { useCreateGallery, useUpdateGallery } from '../../queries/gallery.query';
import { colors, spacing } from '../../theme';

export default function CreateGalleryScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
    const route = useRoute<RouteProp<MoreStackParamList, 'CreateGallery'>>();
    const insets = useSafeAreaInsets();
    
    const { gallery } = route.params || {};
    const isEditing = !!gallery;

    const createGalleryMutation = useCreateGallery();
    const updateGalleryMutation = useUpdateGallery();

    const [formData, setFormData] = useState({
        name: gallery?.name || '',
        description: gallery?.description || '',
        is_active: gallery?.is_active ?? true,
        is_common: gallery?.is_common ?? false,
        batch_uids: gallery?.batches_assigned?.map((b: any) => b.uid) || [],
    });

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const fetchBatchOptions = useCallback(async (params: any) => {
        const batches = await fetchBatches();
        return {
            options: batches.map(b => ({ label: b.batch_name, value: b.uid })),
            hasNextPage: false,
        };
    }, []);

    const handleSubmit = async () => {
        if (!formData.name) {
            Alert.alert('Missing Fields', 'Please enter a gallery name');
            return;
        }

        if (!formData.is_common && formData.batch_uids.length === 0) {
            Alert.alert('Missing Fields', 'Please select at least one batch or make it a common gallery');
            return;
        }

        try {
            if (isEditing) {
                await updateGalleryMutation.mutateAsync({
                    uid: gallery.uid,
                    payload: formData,
                });
                Alert.alert('Success', 'Gallery updated successfully', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                await createGalleryMutation.mutateAsync(formData);
                Alert.alert('Success', 'Gallery created successfully', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            }
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} gallery`);
        }
    };

    React.useLayoutEffect(() => {
        navigation.setOptions({
            title: isEditing ? 'Edit Gallery' : 'Create Gallery',
        });
    }, [navigation, isEditing]);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={100}
        >
            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xxl }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionIcon}>
                            <Ionicons name={isEditing ? "create-outline" : "images-outline"} size={18} color={colors.primary} />
                        </View>
                        <AppText variant="h3" style={styles.sectionTitle}>{isEditing ? 'Update Gallery' : 'Gallery Details'}</AppText>
                    </View>

                    <AppInput
                        label="Gallery Name"
                        placeholder="Enter gallery name"
                        value={formData.name}
                        onChangeText={v => updateField('name', v)}
                    />

                    <AppInput
                        label="Description"
                        placeholder="Enter gallery description"
                        value={formData.description}
                        onChangeText={v => updateField('description', v)}
                        multiline
                        numberOfLines={3}
                    />

                    <View style={styles.switchRow}>
                        <View style={styles.switchInfo}>
                            <AppText style={styles.switchLabel}>Active</AppText>
                            <AppText variant="caption" color={colors.textMuted}>Visible to users</AppText>
                        </View>
                        <Switch
                            value={formData.is_active}
                            onValueChange={v => updateField('is_active', v)}
                            trackColor={{ false: colors.border, true: colors.success + '80' }}
                            thumbColor={formData.is_active ? colors.success : '#f4f3f4'}
                        />
                    </View>

                    <View style={styles.switchRow}>
                        <View style={styles.switchInfo}>
                            <AppText style={styles.switchLabel}>Common Gallery</AppText>
                            <AppText variant="caption" color={colors.textMuted}>Accessible to all batches</AppText>
                        </View>
                        <Switch
                            value={formData.is_common}
                            onValueChange={v => {
                                updateField('is_common', v);
                                if (v) updateField('batch_uids', []);
                            }}
                            trackColor={{ false: colors.border, true: colors.primaryLight }}
                            thumbColor={formData.is_common ? colors.primary : '#f4f3f4'}
                        />
                    </View>

                    {!formData.is_common && (
                        <View style={{ marginTop: spacing.md }}>
                            <AppMultiSelect
                                label="Assign Batches"
                                placeholder="Select batches"
                                value={formData.batch_uids}
                                onSelect={v => updateField('batch_uids', v)}
                                fetchOptions={fetchBatchOptions}
                            />
                        </View>
                    )}
                </View>

                <AppButton
                    title={isEditing ? "Update Gallery" : "Create Gallery"}
                    onPress={handleSubmit}
                    loading={isEditing ? updateGalleryMutation.isPending : createGalleryMutation.isPending}
                    style={styles.submitBtn}
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scroll: {
        padding: spacing.lg,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: spacing.xl,
        marginBottom: spacing.lg,
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    sectionIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    sectionTitle: {
        fontWeight: '800',
        color: colors.textPrimary,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
    },
    switchInfo: {
        flex: 1,
    },
    switchLabel: {
        fontWeight: '700',
        color: colors.textPrimary,
    },
    submitBtn: {
        marginTop: spacing.sm,
        height: 56,
        borderRadius: 16,
    },
});
