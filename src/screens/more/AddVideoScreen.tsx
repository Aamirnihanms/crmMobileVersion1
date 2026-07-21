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
import { useAddVideo, useUpdateVideo } from '../../queries/gallery.query';
import { useAppTheme, spacing } from '../../theme';

export default function AddVideoScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
    const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
    const route = useRoute<RouteProp<MoreStackParamList, 'AddVideo'>>();
    const insets = useSafeAreaInsets();
    const { gallery_uid, folder_uid, video } = route.params;

    const addVideoMutation = useAddVideo();
    const updateVideoMutation = useUpdateVideo();

    const isEditing = !!video;

    const [formData, setFormData] = useState({
        title: video?.title || '',
        description: video?.description || '',
        video_url: video?.video_url || '',
    });

    const handleSubmit = async () => {
        if (!formData.title.trim()) {
            Alert.alert('Error', 'Please enter a video title');
            return;
        }
        if (!formData.video_url.trim()) {
            Alert.alert('Error', 'Please enter a video URL');
            return;
        }

        try {
            if (isEditing) {
                await updateVideoMutation.mutateAsync({
                    uid: video.uid,
                    payload: formData,
                });
                Alert.alert('Success', 'Video updated successfully');
            } else {
                await addVideoMutation.mutateAsync({
                    ...formData,
                    video_source: 'url',
                    is_active: true,
                    gallery: gallery_uid,
                    folder: folder_uid || null,
                });
                Alert.alert('Success', 'Video added successfully');
            }
            navigation.goBack();
        } catch (error: any) {
            const message = error.response?.data?.message || error.message || `Failed to ${isEditing ? 'update' : 'add'} video`;
            Alert.alert('Error', message);
        }
    };

    React.useLayoutEffect(() => {
        navigation.setOptions({
            title: isEditing ? 'Edit Video' : 'Add Video',
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
                    <View style={[styles.iconCircle, { backgroundColor: colors.info + '10' }]}>
                        <Ionicons name={isEditing ? "create-outline" : "videocam-outline"} size={32} color={colors.info} />
                    </View>
                    <AppText variant="h2" style={styles.title}>{isEditing ? 'Edit Video' : 'Add New Video'}</AppText>
                    <AppText color={colors.textMuted} style={styles.subtitle}>
                        {isEditing ? 'Update the details of this video.' : 'Add a video link to this gallery.'}
                    </AppText>
                </View>

                <View style={styles.form}>
                    <AppInput
                        label="Video Title"
                        placeholder="Enter video title"
                        value={formData.title}
                        onChangeText={(text) => setFormData({ ...formData, title: text })}
                    />

                    <AppInput
                        label="Video URL"
                        placeholder="Enter YouTube or video URL"
                        value={formData.video_url}
                        onChangeText={(text) => setFormData({ ...formData, video_url: text })}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <AppInput
                        label="Description"
                        placeholder="Enter video description"
                        value={formData.description}
                        onChangeText={(text) => setFormData({ ...formData, description: text })}
                        multiline
                        numberOfLines={4}
                        style={{ height: 100, textAlignVertical: 'top' }}
                    />

                    <AppButton
                        title={isEditing ? "Update Video" : "Add Video"}
                        onPress={handleSubmit}
                        loading={isEditing ? updateVideoMutation.isPending : addVideoMutation.isPending}
                        style={styles.submitBtn}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
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
