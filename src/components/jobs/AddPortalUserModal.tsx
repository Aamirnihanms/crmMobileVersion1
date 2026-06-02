import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import PhoneInputWithCode, {
    CountryCode,
    DEFAULT_COUNTRY,
} from '@/src/components/common/PhoneInputWithCode';
import AppButton from '@/src/components/common/AppButton';
import AppInput from '@/src/components/common/AppInput';
import AppText from '@/src/components/common/AppText';
import { useCreatePortalUser } from '@/src/queries/jobs.query';
import { colors, spacing } from '@/src/theme';

type Props = {
    visible: boolean;
    companyId: number;       // integer ID for payload
    companyUid: string;      // uid for cache invalidation
    onClose: () => void;
    onSuccess: () => void;
};

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function AddPortalUserModal({
    visible,
    companyId,
    companyUid,
    onClose,
    onSuccess,
}: Props) {
    const createMutation = useCreatePortalUser(companyUid);

    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [phoneCountry, setPhoneCountry] = useState<CountryCode>(DEFAULT_COUNTRY);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isActive, setIsActive] = useState(true);

    const resetForm = () => {
        setFullName('');
        setUsername('');
        setEmail('');
        setPhone('');
        setPhoneCountry(DEFAULT_COUNTRY);
        setPassword('');
        setShowPassword(false);
        setIsActive(true);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const validate = (): string | null => {
        if (!fullName.trim()) return 'Full name is required.';
        if (!username.trim()) return 'Username is required.';
        if (!/^[a-z0-9_]+$/.test(username.trim())) return 'Username can only contain lowercase letters, numbers, and underscores.';
        if (!email.trim()) return 'Email is required.';
        if (!isValidEmail(email.trim())) return 'Please enter a valid email address.';
        if (!phone.trim()) return 'Phone number is required.';
        if (!password.trim()) return 'Password is required.';
        if (password.trim().length < 4) return 'Password must be at least 4 characters.';
        return null;
    };

    const handleSubmit = async () => {
        const error = validate();
        if (error) {
            Alert.alert('Validation Error', error);
            return;
        }

        try {
            await createMutation.mutateAsync({
                company: companyId,
                full_name: fullName.trim(),
                username: username.trim(),
                email: email.trim(),
                phone: `${phoneCountry.code}${phone.trim()}`,
                password: password.trim(),
                is_active: isActive,
            });

            resetForm();
            onSuccess();
        } catch (err: any) {
            const data = err?.response?.data;
            const msg =
                data?.detail ||
                data?.error ||
                data?.message ||
                (data && typeof data === 'object' ? Object.values(data).flat().join('\n') : null) ||
                'Failed to create portal user.';
            Alert.alert('Error', String(msg));
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={handleClose}
        >
            <Pressable style={styles.backdrop} onPress={handleClose} />

            <KeyboardAvoidingView
                behavior="padding"
                style={styles.sheetWrapper}
            >
                <View style={styles.sheet}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={styles.headerIcon}>
                                <Ionicons name="person-add-outline" size={20} color={colors.primary} />
                            </View>
                            <AppText variant="h3" style={styles.headerTitle}>Add Portal User</AppText>
                        </View>
                        <Pressable onPress={handleClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={22} color={colors.textMuted} />
                        </Pressable>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.body}
                        keyboardShouldPersistTaps="handled"
                    >
                        <AppInput
                            label="Full Name *"
                            placeholder="e.g. John Doe"
                            value={fullName}
                            onChangeText={setFullName}
                        />

                        <AppInput
                            label="Username *"
                            placeholder="e.g. john_doe"
                            value={username}
                            onChangeText={(v) => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                            autoCapitalize="none"
                        />

                        <AppInput
                            label="Email *"
                            placeholder="john@example.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <PhoneInputWithCode
                            label="Phone *"
                            placeholder="Enter phone number"
                            value={phone}
                            countryCode={phoneCountry}
                            onChangeText={setPhone}
                            onChangeCountryCode={setPhoneCountry}
                            containerStyle={styles.phoneField}
                        />

                        <View style={styles.passwordWrapper}>
                            <AppInput
                                label="Password *"
                                placeholder="Enter password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                            />
                            <Pressable
                                onPress={() => setShowPassword((v) => !v)}
                                style={styles.eyeBtn}
                            >
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color={colors.textMuted}
                                />
                            </Pressable>
                        </View>

                        <View style={styles.switchRow}>
                            <AppText style={styles.switchLabel}>Active</AppText>
                            <Switch
                                value={isActive}
                                onValueChange={setIsActive}
                                trackColor={{ false: colors.border, true: colors.success + '80' }}
                                thumbColor={isActive ? colors.success : '#f4f3f4'}
                            />
                        </View>

                        <AppButton
                            title="Create Portal User"
                            onPress={handleSubmit}
                            loading={createMutation.isPending}
                            style={styles.submitBtn}
                        />
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheetWrapper: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        maxHeight: '90%',
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.surfaceSubtle,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: colors.primaryLight + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    headerTitle: {
        fontWeight: '800',
        color: colors.textPrimary,
    },
    closeBtn: {
        padding: 4,
    },
    body: {
        padding: spacing.lg,
        paddingBottom: spacing.xl,
    },
    phoneField: {
        marginBottom: spacing.md,
    },
    passwordWrapper: {
        position: 'relative',
    },
    eyeBtn: {
        position: 'absolute',
        right: spacing.md,
        top: 38,
        padding: 4,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        marginBottom: spacing.md,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.surfaceSubtle,
    },
    switchLabel: {
        fontWeight: '600',
        color: colors.textPrimary,
        fontSize: 15,
    },
    submitBtn: {
        marginTop: spacing.md,
        height: 54,
        borderRadius: 16,
    },
});
