import AppButton from '@/src/components/common/AppButton';
import AppCard from '@/src/components/common/AppCard';
import AppInput from '@/src/components/common/AppInput';
import AppText from '@/src/components/common/AppText';
import ScreenShell from '@/src/components/common/ScreenShell';
import { useChangePassword } from '@/src/queries/auth.query';
import { useAppTheme, spacing } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

export default function ChangePasswordScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
    const navigation = useNavigation();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { mutate: changePassword, isPending } = useChangePassword();

    const handleUpdate = () => {
        setError(null);

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            setError('Password must contain at least one uppercase letter, one lowercase letter, and one digit');
            return;
        }

        changePassword(
            {
                current_password: currentPassword,
                new_password: newPassword,
                confirm_password: confirmPassword,
            },
            {
                onSuccess: () => {
                    Alert.alert('Success', 'Password changed successfully', [
                        { text: 'OK', onPress: () => navigation.goBack() }
                    ]);
                },
                onError: (err: any) => {
                    console.log('Change password error:', err?.response?.data);
                    const errorData = err?.response?.data;
                    let message = 'Failed to change password';

                    if (errorData?.errors) {
                        const errors = errorData.errors;
                        if (errors.non_field_errors && Array.isArray(errors.non_field_errors)) {
                            message = errors.non_field_errors[0];
                        } else {
                            const fieldErrors = Object.keys(errors)
                                .map(key => `${key}: ${errors[key].join(', ')}`)
                                .join('\n');
                            if (fieldErrors) message = fieldErrors;
                        }
                    } else if (errorData?.message) {
                        message = errorData.message;
                    } else if (err?.message) {
                        message = err.message;
                    }

                    setError(message);
                },
            }
        );
    };

    return (
        <ScreenShell>
            <ScrollView 
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
                    </View>
                    <AppText variant="h2" style={styles.title}>Update Password</AppText>
                    <AppText color={colors.textSecondary} style={styles.subtitle}>
                        Create a strong, unique password to keep your account secure and protected.
                    </AppText>
                </View>

                {error && (
                    <View style={styles.errorBanner}>
                        <View style={styles.errorBannerContent}>
                            <Ionicons name="alert-circle" size={22} color={colors.danger} />
                            <AppText style={styles.errorText} color={colors.danger}>{error}</AppText>
                        </View>
                        <Pressable onPress={() => setError(null)} hitSlop={10}>
                            <Ionicons name="close" size={20} color={colors.textMuted} />
                        </Pressable>
                    </View>
                )}

                <AppCard style={styles.card}>
                    <AppInput
                        label="Current Password"
                        placeholder="••••••••"
                        secureTextEntry={!showCurrent}
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        leftElement={
                            <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} />
                        }
                        rightElement={
                            <Pressable onPress={() => setShowCurrent(!showCurrent)} hitSlop={10}>
                                <Ionicons 
                                    name={showCurrent ? "eye-off-outline" : "eye-outline"} 
                                    size={20} 
                                    color={colors.textMuted} 
                                />
                            </Pressable>
                        }
                    />

                    <AppInput
                        label="New Password"
                        placeholder="••••••••"
                        secureTextEntry={!showNew}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        leftElement={
                            <Ionicons name="key-outline" size={20} color={colors.textMuted} />
                        }
                        rightElement={
                            <Pressable onPress={() => setShowNew(!showNew)} hitSlop={10}>
                                <Ionicons 
                                    name={showNew ? "eye-off-outline" : "eye-outline"} 
                                    size={20} 
                                    color={colors.textMuted} 
                                />
                            </Pressable>
                        }
                    />

                    <AppInput
                        label="Confirm New Password"
                        placeholder="••••••••"
                        secureTextEntry={!showConfirm}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        containerStyle={{ marginBottom: 0 }}
                        leftElement={
                            <Ionicons name="checkmark-circle-outline" size={20} color={colors.textMuted} />
                        }
                        rightElement={
                            <Pressable onPress={() => setShowConfirm(!showConfirm)} hitSlop={10}>
                                <Ionicons 
                                    name={showConfirm ? "eye-off-outline" : "eye-outline"} 
                                    size={20} 
                                    color={colors.textMuted} 
                                />
                            </Pressable>
                        }
                    />
                </AppCard>

                <View style={styles.footer}>
                    <AppButton
                        title="Save New Password"
                        onPress={handleUpdate}
                        loading={isPending}
                        style={styles.button}
                    />
                    <AppText variant="caption" color={colors.textMuted} style={styles.securityHint}>
                        <Ionicons name="information-circle-outline" size={12} color={colors.textMuted} />
                        {" "}Must be 8+ characters with uppercase, lowercase, and a digit.
                    </AppText>
                </View>
            </ScrollView>
        </ScreenShell>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    scrollContent: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xl,
        paddingBottom: spacing.xxl,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xl,
        paddingHorizontal: spacing.md,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        fontWeight: '800',
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        textAlign: 'center',
        lineHeight: 20,
        fontSize: 14,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: spacing.md,
        backgroundColor: colors.danger + '10',
        borderRadius: 16,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: colors.danger + '20',
    },
    errorBannerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    errorText: {
        flex: 1,
        marginLeft: spacing.sm,
        fontSize: 13,
        fontWeight: '600',
    },
    card: {
        padding: spacing.xl,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border + '50',
    },
    footer: {
        marginTop: spacing.sm,
    },
    button: {
        borderRadius: 14,
        height: 52,
    },
    securityHint: {
        textAlign: 'center',
        marginTop: spacing.lg,
        fontSize: 12,
    },
});
