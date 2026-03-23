import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';

import AppCard from '@/src/components/common/AppCard';
import AppText from '@/src/components/common/AppText';
import { colors, spacing } from '@/src/theme';

function MenuItem({ icon, label, sublabel, onPress, isLast = false, color = colors.primary }: any) {
    return (
        <View>
            <Pressable
                style={({ pressed }) => [
                    styles.menuItem,
                    pressed && { backgroundColor: '#F1F5F9' }
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
    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: () => console.log('Logout') },
            ]
        );
    };

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
                            <Ionicons name="person" size={40} color={colors.primary} />
                        </View>
                        <View style={styles.profileInfo}>
                            <AppText variant="h2" color="#fff" style={{ fontWeight: '800' }}>Aamir Nihan</AppText>
                            <AppText variant="caption" color="rgba(255,255,255,0.8)">Administrator</AppText>
                        </View>
                        <Pressable style={styles.editBtn}>
                            <Ionicons name="pencil" size={16} color="#fff" />
                        </Pressable>
                    </View>
                </AppCard>

                <AppText variant="h3" style={styles.sectionTitle}>General Settings</AppText>
                <AppCard style={styles.menuCard}>
                    <MenuItem
                        icon="person-outline"
                        label="Personal Profile"
                        sublabel="Manage your personal details"
                        onPress={() => { }}
                        color="#6366F1"
                    />
                    <MenuItem
                        icon="notifications-outline"
                        label="Notifications"
                        sublabel="Preference & alerts"
                        onPress={() => { }}
                        color="#8B5CF6"
                    />
                    <MenuItem
                        icon="shield-checkmark-outline"
                        label="Security"
                        sublabel="Password & authentication"
                        onPress={() => { }}
                        color="#10B981"
                        isLast
                    />
                </AppCard>

                <AppText variant="h3" style={styles.sectionTitle}>Support & About</AppText>
                <AppCard style={styles.menuCard}>
                    <MenuItem
                        icon="help-circle-outline"
                        label="Help Center"
                        sublabel="FAQs and support chat"
                        onPress={() => { }}
                        color="#F59E0B"
                    />
                    <MenuItem
                        icon="information-circle-outline"
                        label="About App"
                        sublabel="v3.1.0 - Elite Edition"
                        onPress={() => { }}
                        color="#64748B"
                    />
                    <MenuItem
                        icon="log-out-outline"
                        label="Logout"
                        onPress={handleLogout}
                        color={colors.danger}
                        isLast
                    />
                </AppCard>

                <View style={styles.footer}>
                    <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
                        Powered by TrekData CRM • 🇮🇳
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
        backgroundColor: '#F8F9FE',
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
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
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
        backgroundColor: '#F1F5F9',
        marginHorizontal: spacing.xl,
    },
    footer: {
        marginTop: spacing.sm,
        paddingBottom: spacing.xl,
    },
});
