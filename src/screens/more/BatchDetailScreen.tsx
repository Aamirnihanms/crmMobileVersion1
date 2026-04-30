import React from 'react';
import {
    View,
    StyleSheet,
    Pressable,
    Dimensions,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';

import AppText from '../../components/common/AppText';
import AppLoader from '../../components/common/AppLoader';
import { colors, spacing } from '@/src/theme';
import { useBatchDetail, useDeleteBatch, useMarkBatchCompleted } from '../../queries/batches.query';
import { MoreStackParamList } from '../../navigation/MoreStack';
import BatchDetailsTabs from '../../navigation/BatchDetailsTabs';

const { width } = Dimensions.get('window');

export default function BatchDetailScreen() {
    const route = useRoute<RouteProp<MoreStackParamList, 'BatchDetail'>>();
    const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
    const { uid } = route.params;

    const { data, isLoading, isError, refetch } = useBatchDetail(uid);
    const deleteMutation = useDeleteBatch();
    const markCompletedMutation = useMarkBatchCompleted();
    const batch = data?.batch;

    const handleMarkCompleted = () => {
        Alert.alert(
            'Mark Completed',
            'Are you sure you want to mark this batch as completed?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: () => {
                        markCompletedMutation.mutate(uid, {
                            onSuccess: () => {
                                Alert.alert('Success', 'Batch marked as completed');
                            },
                            onError: (error: any) => {
                                Alert.alert('Error', error?.response?.data?.message || 'Failed to mark batch as completed');
                            }
                        });
                    }
                }
            ]
        );
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Batch',
            'Are you sure you want to delete this batch? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        deleteMutation.mutate(uid, {
                            onSuccess: () => {
                                navigation.goBack();
                            },
                            onError: (error: any) => {
                                Alert.alert('Error', error?.response?.data?.message || 'Failed to delete batch');
                            }
                        });
                    }
                }
            ]
        );
    };

    React.useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {batch?.status !== 'Completed' && (
                        <Pressable 
                            onPress={handleMarkCompleted}
                            disabled={markCompletedMutation.isPending}
                            style={({ pressed }) => ({
                                opacity: pressed || markCompletedMutation.isPending ? 0.7 : 1,
                                marginRight: 8,
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: colors.success + '15',
                                alignItems: 'center',
                                justifyContent: 'center',
                            })}
                        >
                            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                        </Pressable>
                    )}
                    <Pressable 
                        onPress={handleDelete}
                        disabled={deleteMutation.isPending}
                        style={({ pressed }) => ({
                            opacity: pressed || deleteMutation.isPending ? 0.7 : 1,
                            marginRight: 8,
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: colors.danger + '15',
                            alignItems: 'center',
                            justifyContent: 'center',
                        })}
                    >
                        <Ionicons name="trash" size={20} color={colors.danger} />
                    </Pressable>
                    <Pressable 
                        onPress={() => navigation.navigate('BatchEdit', { uid })}
                        style={({ pressed }) => ({
                            opacity: pressed ? 0.7 : 1,
                            marginRight: 4,
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: colors.primaryLight + '15',
                            alignItems: 'center',
                            justifyContent: 'center',
                        })}
                    >
                        <Ionicons name="pencil" size={20} color={colors.primary} />
                    </Pressable>
                </View>
            ),
        });
    }, [navigation, uid, deleteMutation.isPending, markCompletedMutation.isPending, batch?.status]);

    if (isLoading) {
        return (
            <View style={styles.center}>
                <AppLoader />
                <AppText style={{ marginTop: spacing.md }}>Fetching batch details...</AppText>
            </View>
        );
    }

    if (isError || !batch) {
        return (
            <View style={styles.center}>
                <Ionicons name="alert-circle-outline" size={64} color={colors.danger} />
                <AppText variant="h3" style={{ marginTop: spacing.md }}>Oops!</AppText>
                <AppText color={colors.textMuted}>Failed to load batch info.</AppText>
                <Pressable onPress={() => refetch()} style={styles.retryBtn}>
                    <AppText color={colors.primary}>Try Again</AppText>
                </Pressable>
            </View>
        );
    }

    const initials = batch.batch_name.slice(0, 2).toUpperCase();
    const statusColor = batch.is_active ? colors.success : colors.danger;

    return (
        <View style={styles.container}>
            {/* Header Section */}
            <View style={styles.header}>
                <LinearGradient
                    colors={[colors.primary + '15', colors.background]}
                    style={styles.headerGradient}
                />
                <View style={styles.headerContent}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <AppText style={styles.avatarText}>{initials}</AppText>
                        </View>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    </View>
                    
                    <View style={styles.infoSection}>
                        <AppText variant="h3" style={styles.batchName} numberOfLines={1}>{batch.batch_name}</AppText>
                        <View style={styles.statusRow}>
                            <View style={[styles.badge, { backgroundColor: statusColor + '15', borderColor: statusColor }]}>
                                <AppText style={[styles.badgeText, { color: statusColor }]}>{batch.status}</AppText>
                            </View>
                            <View style={[styles.badge, { backgroundColor: colors.info + '15', borderColor: colors.info }]}>
                                <AppText style={[styles.badgeText, { color: colors.info }]} numberOfLines={1}>
                                    {batch.course_mode_names?.join(', ') || 
                                     batch.course_mode_details?.map((d: any) => d.name).join(', ') || 
                                     'N/A'}
                                </AppText>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            <View style={{ flex: 1 }}>
                <BatchDetailsTabs batch={batch} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    retryBtn: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: 12,
        backgroundColor: colors.primaryLight + '15',
    },
    header: {
        height: 90,
        backgroundColor: colors.background,
        justifyContent: 'center',
    },
    headerGradient: {
        ...StyleSheet.absoluteFillObject,
        height: 90,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: spacing.md,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 18,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    avatarText: {
        color: colors.surface,
        fontSize: 24,
        fontWeight: '800',
    },
    statusDot: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 3,
        borderColor: colors.background,
    },
    infoSection: {
        flex: 1,
        justifyContent: 'center',
    },
    batchName: {
        fontWeight: '800',
        marginBottom: 4,
        color: colors.textPrimary,
    },
    statusRow: {
        flexDirection: 'row',
        gap: spacing.xs,
        flexWrap: 'wrap',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
});
