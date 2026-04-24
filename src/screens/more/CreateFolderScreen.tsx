import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import AppText from '../../components/common/AppText';
import { MoreStackParamList } from '../../navigation/MoreStack';
import { useCreateFolder, useUpdateFolder } from '../../queries/gallery.query';
import { colors, spacing } from '../../theme';

export default function CreateFolderScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
    const route = useRoute<RouteProp<MoreStackParamList, 'CreateFolder'>>();
    const insets = useSafeAreaInsets();
    const { gallery_uid, parent_folder_uid, folder } = route.params;

    const createFolderMutation = useCreateFolder();
    const updateFolderMutation = useUpdateFolder();

    const isEditing = !!folder;

    const [formData, setFormData] = useState({
        name: folder?.name || '',
        description: folder?.description || '',
    });

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            Alert.alert('Error', 'Please enter a folder name');
            return;
        }

        try {
            if (isEditing) {
                await updateFolderMutation.mutateAsync({
                    uid: folder.uid,
                    payload: formData,
                });
                Alert.alert('Success', 'Folder updated successfully');
            } else {
                await createFolderMutation.mutateAsync({
                    ...formData,
                    gallery: gallery_uid,
                    parent_folder: parent_folder_uid || null,
                });
                Alert.alert('Success', 'Folder created successfully');
            }
            navigation.goBack();
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || `Failed to ${isEditing ? 'update' : 'create'} folder`;
            Alert.alert('Error', message);
        }
    };

    React.useLayoutEffect(() => {
        navigation.setOptions({
            title: isEditing ? 'Edit Folder' : 'Create Folder',
        });
    }, [navigation, isEditing]);

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                style={styles.container}
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
            >
                <View style={styles.header}>
                    <View style={styles.iconCircle}>
                        <Ionicons name={isEditing ? "create-outline" : "folder-outline"} size={32} color={colors.primary} />
                    </View>
                    <AppText variant="h2" style={styles.title}>{isEditing ? 'Edit Folder' : 'Create New Folder'}</AppText>
                    <AppText color={colors.textMuted} style={styles.subtitle}>
                        {isEditing ? 'Update the details of this folder.' : 'Organize your gallery by adding a new folder.'}
                    </AppText>
                </View>

                <View style={styles.form}>
                    <AppInput
                        label="Folder Name"
                        placeholder="Enter folder name"
                        value={formData.name}
                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                    />

                    <AppInput
                        label="Description"
                        placeholder="Enter folder description"
                        value={formData.description}
                        onChangeText={(text) => setFormData({ ...formData, description: text })}
                        multiline
                        numberOfLines={4}
                        style={{ height: 100, textAlignVertical: 'top' }}
                    />

                    <AppButton
                        title={isEditing ? "Update Folder" : "Create Folder"}
                        onPress={handleSubmit}
                        loading={isEditing ? updateFolderMutation.isPending : createFolderMutation.isPending}
                        style={styles.submitBtn}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: spacing.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        fontWeight: '800',
        marginBottom: spacing.xs,
    },
    subtitle: {
        textAlign: 'center',
        paddingHorizontal: spacing.xl,
    },
    form: {
        gap: spacing.md,
    },
    submitBtn: {
        marginTop: spacing.lg,
    },
});
