import AppButton from '@/src/components/common/AppButton';
import AppInput from '@/src/components/common/AppInput';
import AppText from '@/src/components/common/AppText';
import ScreenShell from '@/src/components/common/ScreenShell';
import { useChangePassword } from '@/src/queries/auth.query';
import { colors, spacing } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

export default function ChangePasswordScreen() {
    const navigation = useNavigation();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

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

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters long');
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
                            // Collect other field errors
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
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <AppText variant="h2" style={styles.title}>Secure Your Account</AppText>
                    <AppText color={colors.textSecondary} style={styles.subtitle}>
                        Change your password regularly to keep your account safe.
                    </AppText>
                </View>

                {error && (
                    <View style={styles.errorBanner}>
                        <Ionicons name="alert-circle" size={20} color={colors.danger} />
                        <AppText style={styles.errorText} color={colors.danger}>{error}</AppText>
                        <Pressable onPress={() => setError(null)}>
                            <Ionicons name="close" size={20} color={colors.textMuted} />
                        </Pressable>
                    </View>
                )}

                <View style={styles.form}>
                    <AppInput
                        label="Current Password"
                        placeholder="Enter current password"
                        secureTextEntry
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                    />
                    <View style={{ height: spacing.xs }} />
                    <AppInput
                        label="New Password"
                        placeholder="Enter new password"
                        secureTextEntry
                        value={newPassword}
                        onChangeText={setNewPassword}
                    />
                    <View style={{ height: spacing.xs }} />
                    <AppInput
                        label="Confirm New Password"
                        placeholder="Confirm new password"
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />

                    <AppButton
                        title="Update Password"
                        onPress={handleUpdate}
                        loading={isPending}
                        style={styles.button}
                    />
                </View>
            </ScrollView>
        </ScreenShell>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
    },
    header: {
        marginBottom: spacing.xxl,
    },
    title: {
        fontWeight: '800',
        marginBottom: spacing.xs,
    },
    subtitle: {
        lineHeight: 20,
    },
    form: {
        // gap: spacing.sm,
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.danger + '15',
        borderRadius: 12,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.danger + '30',
    },
    errorText: {
        flex: 1,
        marginLeft: spacing.sm,
        fontSize: 13,
        fontWeight: '500',
    },
    button: {
        marginTop: spacing.xl,
    },
});
