import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

import AppCard from '@/src/components/common/AppCard';
import AppText from '@/src/components/common/AppText';
import { MoreStackParamList } from '@/src/navigation/MoreStack';
import { useAuthStore } from '@/src/store/auth.store';
import { colors, spacing } from '@/src/theme';

function MenuItem({ icon, label, sublabel, onPress, isLast = false, color = colors.primary }: any) {
    return (
        <View>
            <Pressable
                style={({ pressed }) => [
                    styles.menuItem,
                    pressed && { backgroundColor: colors.surfaceSubtle }
                ]}
                onPress={onPress}
            >
                <View style={[styles.menuIconContainer, { backgroundColor: color + '15' }]}>
                    <Ionicons name={icon} size={20} color={color} />
                </View>
                <View style={styles.menuTextContainer}>
                    <AppText variant="subtitle" style={{ fontWeight: '700' }}>{label}</AppText>
                    {sublabel && <AppText variant="caption" color={colors.textMuted}>{sublabel}</AppText>}
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
            {!isLast && <View style={styles.divider} />}
        </View>
    );
}

export default function MoreListScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList, 'MoreList'>>();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
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


    return (
        <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
            <View style={styles.container}>
                <AppCard style={styles.profileCard}>
                    <LinearGradient
                        colors={[colors.primary, colors.gradientEnd]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.profileGradient}
                    />
                    <View style={styles.profileContent}>
                        <View style={styles.avatar}>
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

                    {/* <MenuItem
                        icon="notifications-outline"
                        label="Notifications"
                        sublabel="Preference & alerts"
                        onPress={() => { }}
                        color={colors.primary}
                    /> */}
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
                    {/* <MenuItem
                        icon="people-outline"
                        label="Users"
                        sublabel="Manage staff access"
                        onPress={() => { }}
                        color={colors.info}
                    />
                    <MenuItem
                        icon="key-outline"
                        label="Role"
                        sublabel="Permissions & access levels"
                        onPress={() => { }}
                        color={colors.danger}
                        isLast
                    /> */}
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
                    />
                    <MenuItem
                        icon="create-outline"
                        label="Marking"
                        sublabel="Grade student performance"
                        onPress={() => navigation.navigate('Marking')}
                        color={colors.success}
                        isLast
                    />
                </AppCard>

                {/* <AppText variant="h3" style={styles.sectionTitle}>Support & About</AppText>
                <AppCard style={styles.menuCard}>
                    <MenuItem
                        icon="help-circle-outline"
                        label="Help Center"
                        sublabel="FAQs and support chat"
                        onPress={() => { }}
                        color={colors.warning}
                    />
                    <MenuItem
                        icon="information-circle-outline"
                        label="About App"
                        sublabel="v3.1.0 - Elite Edition"
                        onPress={() => { }}
                        color={colors.slate}
                        isLast
                    />
                </AppCard> */}

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
        </ScrollView>
    );
}

const styles = StyleSheet.create({
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
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 8,
    },
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
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 24,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
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
        color: colors.textPrimary,
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
        backgroundColor: colors.surfaceSubtle,
        marginHorizontal: spacing.xl,
    },
    footer: {
        marginTop: spacing.sm,
        paddingBottom: spacing.xl,
    },
});
