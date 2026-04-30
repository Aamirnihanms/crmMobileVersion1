import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

import AppCard from '../../../components/common/AppCard';
import AppText from '../../../components/common/AppText';
import { MoreStackParamList } from '../../../navigation/MoreStack';
import { useDeleteGallery, useGalleryDetail } from '../../../queries/gallery.query';
import { colors, spacing } from '../../../theme';

export default function GalleryOverviewTab({ uid }: { uid: string }) {
    const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
    const { data: gallery, isLoading, error } = useGalleryDetail(uid);
    const deleteGalleryMutation = useDeleteGallery();

    const handleDelete = () => {
        Alert.alert(
            'Delete Gallery',
            'Are you sure you want to delete this gallery? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteGalleryMutation.mutateAsync(uid);
                            Alert.alert('Success', 'Gallery deleted successfully');
                            navigation.navigate('GalleryList');
                        } catch (err: any) {
                            Alert.alert('Error', err.response?.data?.message || 'Failed to delete gallery');
                        }
                    },
                },
            ]
        );
    };

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (error || !gallery) {
        return (
            <View style={styles.centered}>
                <AppText color={colors.danger}>Failed to load gallery details.</AppText>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
                <AppCard style={styles.card}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="images" size={24} color={colors.primary} />
                        </View>
                        <View style={styles.headerInfo}>
                            <View style={{ flex: 1 }}>
                                <AppText variant="h2" style={{ fontWeight: '800' }}>{gallery.name}</AppText>
                                <View style={[styles.statusBadge, { alignSelf: 'flex-start', backgroundColor: gallery.is_active ? colors.success + '20' : colors.danger + '20', marginTop: 4 }]}>
                                    <AppText variant="caption" style={{ color: gallery.is_active ? colors.success : colors.danger, fontWeight: '700' }}>
                                        {gallery.is_active ? 'Active' : 'Inactive'}
                                    </AppText>
                                </View>
                            </View>
                            <View style={styles.headerActions}>
                                <Pressable
                                    onPress={() => navigation.navigate('CreateGallery', { gallery })}
                                    style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
                                >
                                    <Ionicons name="create-outline" size={20} color={colors.primary} />
                                </Pressable>
                                <Pressable
                                    onPress={handleDelete}
                                    style={({ pressed }) => [styles.iconBtn, { backgroundColor: colors.danger + '10' }, pressed && { opacity: 0.7 }]}
                                    disabled={deleteGalleryMutation.isPending}
                                >
                                    {deleteGalleryMutation.isPending ? (
                                        <ActivityIndicator size="small" color={colors.danger} />
                                    ) : (
                                        <Ionicons name="trash-outline" size={20} color={colors.danger} />
                                    )}
                                </Pressable>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.section}>
                        <AppText variant="subtitle" style={styles.sectionTitle}>Description</AppText>
                        <AppText variant="body" color={colors.textSecondary}>
                            {gallery.description || 'No description provided.'}
                        </AppText>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <AppText variant="caption" color={colors.textMuted}>Created By</AppText>
                            <AppText variant="subtitle" style={{ fontWeight: '600' }}>{gallery.created_by_name}</AppText>
                        </View>
                        <View style={styles.infoItem}>
                            <AppText variant="caption" color={colors.textMuted}>Created At</AppText>
                            <AppText variant="subtitle" style={{ fontWeight: '600' }}>
                                {new Date(gallery.created_at).toLocaleDateString()}
                            </AppText>
                        </View>
                    </View>

                    {gallery.is_common && (
                        <View style={styles.commonNote}>
                            <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
                            <AppText variant="caption" color={colors.primary} style={styles.commonNoteText}>
                                This is a common gallery accessible to all students.
                            </AppText>
                        </View>
                    )}
                </AppCard>

                {!gallery.is_common && gallery.batches_assigned && gallery.batches_assigned.length > 0 && (
                    <View style={styles.batchesSection}>
                        <AppText variant="h3" style={styles.sectionHeader}>Assigned Batches</AppText>
                        {gallery.batches_assigned.map((batch) => (
                            <AppCard key={batch.uid} style={styles.batchCard}>
                                <View style={styles.batchIcon}>
                                    <Ionicons name="school-outline" size={20} color={colors.info} />
                                </View>
                                <View style={styles.batchInfo}>
                                    <AppText variant="subtitle" style={{ fontWeight: '700' }}>{batch.batch_name}</AppText>
                                    <AppText variant="caption" color={colors.textMuted}>
                                        {batch.start_date} to {batch.end_date}
                                    </AppText>
                                </View>
                            </AppCard>
                        ))}
                    </View>
                )}
            </View>
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
    card: {
        padding: spacing.xl,
        borderRadius: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    headerInfo: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.lg,
    },
    section: {
        marginBottom: spacing.md,
    },
    sectionTitle: {
        fontWeight: '700',
        marginBottom: spacing.xs,
        color: colors.textPrimary,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoItem: {
        flex: 1,
    },
    commonNote: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary + '08',
        padding: spacing.md,
        borderRadius: 12,
        marginTop: spacing.xl,
    },
    commonNoteText: {
        marginLeft: spacing.sm,
        fontWeight: '600',
    },
    batchesSection: {
        marginTop: spacing.xl,
    },
    sectionHeader: {
        fontWeight: '800',
        marginBottom: spacing.md,
        marginLeft: spacing.xs,
    },
    batchCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderRadius: 16,
    },
    batchIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.info + '10',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    batchInfo: {
        flex: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerActions: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    iconBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: colors.primary + '10',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
