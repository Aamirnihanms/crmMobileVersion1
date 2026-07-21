import AppModal from '@/src/components/common/AppModal';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

import AppCard from '@/src/components/common/AppCard';
import AppText from '@/src/components/common/AppText';
import { MoreStackParamList } from '@/src/navigation/MoreStack';
import { useAuthStore } from '@/src/store/auth.store';
import { useThemeStore } from '@/src/store/theme.store';
import { useAppTheme, spacing } from '@/src/theme';

function MenuItem({ icon, label, sublabel, onPress, isLast = false, color }: any) {
    const { colors } = useAppTheme();
    const activeColor = color || colors.primary;
    return (
        <View>
            <Pressable
                style={({ pressed }) => [
                    styles.menuItem,
                    pressed && { backgroundColor: colors.surfaceSubtle }
                ]}
                onPress={onPress}
            >
                <View style={[styles.menuIconContainer, { backgroundColor: activeColor + '15' }]}>
                    <Ionicons name={icon} size={20} color={activeColor} />
                </View>
                <View style={styles.menuTextContainer}>
                    <AppText variant="subtitle" style={{ fontWeight: '700' }}>{label}</AppText>
                    {sublabel && <AppText variant="caption" color={colors.textMuted}>{sublabel}</AppText>}
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
            {!isLast && <View style={[styles.divider, { backgroundColor: colors.surfaceSubtle }]} />}
        </View>
    );
}

export default function MoreListScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList, 'MoreList'>>();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const { colors, isDark } = useAppTheme();
    const { theme, setTheme } = useThemeStore();
    const [themeModalVisible, setThemeModalVisible] = useState(false);

    const avatarUri =
        typeof user?.profile_picture === 'string' && user.profile_picture.trim().length > 0
            ? user.profile_picture.trim()
            : null;
    const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                    },
                },
            ],
            { cancelable: true }
        );
    };

    useEffect(() => {
        setAvatarLoadFailed(false);
    }, [avatarUri]);

    const activeStyles = getStyles(colors, isDark);

    const getThemeLabel = () => {
        if (theme === 'light') return 'Light';
        if (theme === 'dark') return 'Dark';
        return 'System default';
    };

    return (
        <ScrollView style={activeStyles.screen} showsVerticalScrollIndicator={false}>
            <View style={activeStyles.container}>
                <AppCard style={activeStyles.profileCard}>
                    <LinearGradient
                        colors={[colors.primary, colors.gradientEnd]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.profileGradient}
                    />
                    <View style={styles.profileContent}>
                        <View style={activeStyles.avatar}>
                            {avatarUri && !avatarLoadFailed ? (
                                <Image
                                    source={{ uri: avatarUri }}
                                    style={styles.avatarImage}
                                    onError={() => setAvatarLoadFailed(true)}
                                />
                            ) : (
                                <Ionicons name="person" size={40} color={colors.primary} />
                            )}
                        </View>
                        <View style={styles.profileInfo}>
                            <AppText variant="h2" color={colors.surface} style={{ fontWeight: '800' }}>
                                {user?.full_name || 'My Account'}
                            </AppText>
                            <AppText variant="caption" color="rgba(255,255,255,0.8)">
                                {user?.role || 'User'}
                            </AppText>
                        </View>
                        <Pressable
                            style={styles.editBtn}
                            onPress={() => navigation.navigate('Profile')}
                        >
                            <Ionicons name="pencil" size={16} color={colors.surface} />
                        </Pressable>
                    </View>
                </AppCard>

                <AppText variant="h3" style={styles.sectionTitle}>General Settings</AppText>
                <AppCard style={styles.menuCard}>
                    <MenuItem
                        icon="color-palette-outline"
                        label="Theme"
                        sublabel={`Active: ${getThemeLabel()}`}
                        onPress={() => setThemeModalVisible(true)}
                        color={colors.primary}
                    />
                    <MenuItem
                        icon="shield-checkmark-outline"
                        label="Security"
                        sublabel="Password & authentication"
                        onPress={() => navigation.navigate('ChangePassword')}
                        color={colors.success}
                        isLast
                    />
                </AppCard>

                <AppText variant="h3" style={styles.sectionTitle}>Management</AppText>
                <AppCard style={styles.menuCard}>
                    <MenuItem
                        icon="calendar-outline"
                        label="My Followups"
                        sublabel="Track your leads and reminders"
                        onPress={() => navigation.navigate('FollowUps')}
                        color={colors.info}
                    />
                    <MenuItem
                        icon="layers-outline"
                        label="Batch"
                        sublabel="Manage training batches"
                        onPress={() => navigation.navigate('BatchList')}
                        color={colors.primary}
                    />
                    <MenuItem
                        icon="person-remove-outline"
                        label="Dropped Students"
                        sublabel="Rejoin dropped students"
                        onPress={() => navigation.navigate('DroppedStudents')}
                        color={colors.danger}
                    />
                    <MenuItem
                        icon="images-outline"
                        label="Gallery"
                        sublabel="Manage gallery contents"
                        onPress={() => navigation.navigate('GalleryList')}
                        color={colors.info}
                    />
                    <MenuItem
                        icon="git-pull-request-outline"
                        label="Batch Change Request"
                        sublabel="Review batch transfers"
                        onPress={() => navigation.navigate('BatchChangeRequestList')}
                        color={colors.warning}
                        isLast
                    />
                </AppCard>

                <AppText variant="h3" style={styles.sectionTitle}>Evaluation</AppText>
                <AppCard style={styles.menuCard}>
                    <MenuItem
                        icon="document-text-outline"
                        label="Templates"
                        sublabel="Manage evaluation templates"
                        onPress={() => navigation.navigate('EvaluationTemplates')}
                        color={colors.primary}
                    />
                    <MenuItem
                        icon="calendar-outline"
                        label="Exam Sessions"
                        sublabel="Schedule and manage exams"
                        onPress={() => navigation.navigate('ExamSessions')}
                        color={colors.warning}
                        isLast
                    />
                </AppCard>

                <AppText variant="h3" style={styles.sectionTitle}>Jobs & Companies</AppText>
                <AppCard style={styles.menuCard}>
                    <MenuItem
                        icon="briefcase-outline"
                        label="Jobs"
                        sublabel="Manage job postings"
                        onPress={() => navigation.navigate('JobsList')}
                        color={colors.primary}
                    />
                    <MenuItem
                        icon="business-outline"
                        label="Companies"
                        sublabel="Manage partner companies"
                        onPress={() => navigation.navigate('CompaniesList')}
                        color={colors.info}
                        isLast
                    />
                </AppCard>

                <AppText variant="h3" style={styles.sectionTitle}>Account Actions</AppText>
                <AppCard style={styles.menuCard}>
                    <MenuItem
                        icon="log-out-outline"
                        label="Logout"
                        sublabel="Sign out of your account"
                        onPress={handleLogout}
                        color={colors.danger}
                        isLast
                    />
                </AppCard>

                <View style={styles.footer}>
                    <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
                        Powered by Anvitha Infotech
                    </AppText>
                </View>
                <View style={{ height: 40 }} />
            </View>

            {/* Theme Selection Modal */}
            <AppModal statusBarTranslucent navigationBarTranslucent
                visible={themeModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setThemeModalVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setThemeModalVisible(false)}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <AppText variant="h2" style={{ marginBottom: spacing.lg, fontWeight: '800' }}>
                            Select Theme
                        </AppText>

                        <Pressable
                            style={[
                                styles.themeOption,
                                theme === 'light' && { backgroundColor: colors.primary + '15' }
                            ]}
                            onPress={async () => {
                                await setTheme('light');
                                setThemeModalVisible(false);
                            }}
                        >
                            <Ionicons
                                name="sunny-outline"
                                size={24}
                                color={theme === 'light' ? colors.primary : colors.textSecondary}
                            />
                            <AppText
                                variant="subtitle"
                                style={[
                                    styles.themeText,
                                    theme === 'light' && { color: colors.primary, fontWeight: '700' }
                                ]}
                            >
                                Light Theme
                            </AppText>
                            {theme === 'light' && (
                                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                            )}
                        </Pressable>

                        <Pressable
                            style={[
                                styles.themeOption,
                                theme === 'dark' && { backgroundColor: colors.primary + '15' }
                            ]}
                            onPress={async () => {
                                await setTheme('dark');
                                setThemeModalVisible(false);
                            }}
                        >
                            <Ionicons
                                name="moon-outline"
                                size={24}
                                color={theme === 'dark' ? colors.primary : colors.textSecondary}
                            />
                            <AppText
                                variant="subtitle"
                                style={[
                                    styles.themeText,
                                    theme === 'dark' && { color: colors.primary, fontWeight: '700' }
                                ]}
                            >
                                Dark Theme
                            </AppText>
                            {theme === 'dark' && (
                                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                            )}
                        </Pressable>

                        <Pressable
                            style={[
                                styles.themeOption,
                                theme === 'system' && { backgroundColor: colors.primary + '15' }
                            ]}
                            onPress={async () => {
                                await setTheme('system');
                                setThemeModalVisible(false);
                            }}
                        >
                            <Ionicons
                                name="settings-outline"
                                size={24}
                                color={theme === 'system' ? colors.primary : colors.textSecondary}
                            />
                            <AppText
                                variant="subtitle"
                                style={[
                                    styles.themeText,
                                    theme === 'system' && { color: colors.primary, fontWeight: '700' }
                                ]}
                            >
                                System Default
                            </AppText>
                            {theme === 'system' && (
                                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                            )}
                        </Pressable>
                    </View>
                </Pressable>
            </AppModal>
        </ScrollView>
    );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container: {
        padding: spacing.lg,
    },
    profileCard: {
        padding: 0,
        borderRadius: 28,
        marginBottom: spacing.xl,
        overflow: 'hidden',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: isDark ? 0.4 : 0.2,
        shadowRadius: 15,
        elevation: 8,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 24,
        backgroundColor: isDark ? colors.backgroundSoft : colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
});

const styles = StyleSheet.create({
    profileGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    profileContent: {
        padding: spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    profileInfo: {
        flex: 1,
        marginLeft: spacing.lg,
    },
    editBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontWeight: '800',
        marginBottom: spacing.md,
        marginLeft: 4,
    },
    menuCard: {
        padding: 0,
        borderRadius: 24,
        marginBottom: spacing.xl,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
    },
    menuIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    menuTextContainer: {
        flex: 1,
    },
    divider: {
        height: 1,
        marginHorizontal: spacing.xl,
    },
    footer: {
        marginTop: spacing.sm,
        paddingBottom: spacing.xl,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    modalContent: {
        width: '100%',
        borderRadius: 28,
        padding: spacing.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    themeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        borderRadius: 16,
        marginBottom: spacing.sm,
    },
    themeText: {
        flex: 1,
        marginLeft: spacing.md,
    },
});
