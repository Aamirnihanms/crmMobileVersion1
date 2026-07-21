import NotificationCard from '@/src/components/cards/NotificationCard';
import AppText from '@/src/components/common/AppText';
import { useMarkAllNotificationsRead, useNotifications } from '@/src/queries/notifications.query';
import { useAppTheme, spacing } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useLayoutEffect } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View, Pressable } from 'react-native';

export default function NotificationListScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
    const navigation = useNavigation<any>();
    const {
        data,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        refetch,
        isRefetching
    } = useNotifications();

    const { mutate: markAllRead, isPending: isMarkingRead } = useMarkAllNotificationsRead();

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <Pressable
                    onPress={() => markAllRead()}
                    style={({ pressed }) => [
                        styles.headerRightBtn,
                        pressed && { opacity: 0.7 }
                    ]}
                    disabled={isMarkingRead}
                >
                    {isMarkingRead ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                        <Ionicons name="checkmark-done-circle-outline" size={24} color={colors.primary} />
                    )}
                </Pressable>
            )
        });
    }, [navigation, markAllRead, isMarkingRead]);

    const notifications = useMemo(() => {
        return data?.pages.flatMap(page => page.results) ?? [];
    }, [data]);

    const handleNotificationPress = (notification: any) => {


        // Basic link mapping
        if (notification.link) {
            if (notification.link.includes('batch-request')) {
                // Navigate directly in the local stack to preserve back button 
                // and prevent overriding the 'More' tab's state.
                navigation.navigate('BatchChangeRequestList');
            }
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <NotificationCard
            notification={item}
            onPress={() => handleNotificationPress(item)}
        />
    );

    const renderFooter = () => {
        if (!isFetchingNextPage) return <View style={{ height: 40 }} />;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary} />
            </View>
        );
    };

    const renderEmpty = () => {
        if (isLoading) return null;
        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                    <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
                </View>
                <AppText variant="subtitle" color={colors.textMuted} style={styles.emptyText}>
                    No notifications yet
                </AppText>
                <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center', marginTop: 8 }}>
                    We'll notify you when something important happens.
                </AppText>
            </View>
        );
    };

    if (isLoading && !isRefetching) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={(item) => item.uid}
                contentContainerStyle={styles.listContent}
                onEndReached={() => {
                    if (hasNextPage && !isFetchingNextPage) {
                        fetchNextPage();
                    }
                }}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={renderEmpty}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        colors={[colors.primary]}
                    />
                }
            />
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    listContent: {
        padding: spacing.md,
        flexGrow: 1,
    },
    footerLoader: {
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
        paddingHorizontal: spacing.xl,
    },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
    },
    headerRightBtn: {
        marginRight: spacing.md,
        padding: spacing.xs,
    },
});
