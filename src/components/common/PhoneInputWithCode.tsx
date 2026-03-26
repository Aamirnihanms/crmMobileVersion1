import { colors, spacing } from '@/src/theme';
import React, { useState } from 'react';
import {
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    TextInput,
    View,
    ViewStyle,
} from 'react-native';
import AppText from './AppText';

export type CountryCode = {
    code: string;   // e.g. "+91"
    flag: string;   // emoji flag
    name: string;
};

export const COUNTRY_CODES: CountryCode[] = [
    { code: '+91', flag: '🇮🇳', name: 'India' },
    { code: '+1', flag: '🇺🇸', name: 'United States' },
    { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
    { code: '+971', flag: '🇦🇪', name: 'UAE' },
    { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
    { code: '+974', flag: '🇶🇦', name: 'Qatar' },
    { code: '+965', flag: '🇰🇼', name: 'Kuwait' },
    { code: '+968', flag: '🇴🇲', name: 'Oman' },
    { code: '+973', flag: '🇧🇭', name: 'Bahrain' },
    { code: '+61', flag: '🇦🇺', name: 'Australia' },
    { code: '+1', flag: '🇨🇦', name: 'Canada' },
    { code: '+49', flag: '🇩🇪', name: 'Germany' },
    { code: '+33', flag: '🇫🇷', name: 'France' },
    { code: '+81', flag: '🇯🇵', name: 'Japan' },
    { code: '+86', flag: '🇨🇳', name: 'China' },
    { code: '+65', flag: '🇸🇬', name: 'Singapore' },
    { code: '+60', flag: '🇲🇾', name: 'Malaysia' },
    { code: '+92', flag: '🇵🇰', name: 'Pakistan' },
    { code: '+880', flag: '🇧🇩', name: 'Bangladesh' },
    { code: '+94', flag: '🇱🇰', name: 'Sri Lanka' },
    { code: '+977', flag: '🇳🇵', name: 'Nepal' },
];

export const DEFAULT_COUNTRY: CountryCode = COUNTRY_CODES[0]; // India +91

type Props = {
    label?: string;
    placeholder?: string;
    value: string;
    countryCode: CountryCode;
    onChangeText: (text: string) => void;
    onChangeCountryCode: (country: CountryCode) => void;
    containerStyle?: ViewStyle;
    error?: string;
};

export default function PhoneInputWithCode({
    label,
    placeholder = 'Enter number',
    value,
    countryCode,
    onChangeText,
    onChangeCountryCode,
    containerStyle,
    error,
}: Props) {
    const [showPicker, setShowPicker] = useState(false);

    return (
        <View style={[styles.wrapper, containerStyle]}>
            {label ? (
                <AppText
                    variant="caption"
                    color={colors.textSecondary}
                    style={styles.label}
                >
                    {label}
                </AppText>
            ) : null}

            <View style={[styles.row, error && styles.errorBorder]}>
                {/* Country Code Button */}
                <Pressable
                    style={styles.codeBtn}
                    onPress={() => setShowPicker(true)}
                    android_ripple={{ color: colors.border }}
                >
                    <AppText style={styles.flag}>{countryCode.flag}</AppText>
                    <AppText style={styles.codeText}>{countryCode.code}</AppText>
                    <AppText style={styles.chevron}>▾</AppText>
                </Pressable>

                <View style={styles.divider} />

                {/* Number Input */}
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                />
            </View>

            {error ? (
                <AppText variant="caption" color={colors.danger} style={styles.errorText}>
                    {error}
                </AppText>
            ) : null}

            {/* Country Picker Modal */}
            <Modal
                visible={showPicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowPicker(false)}
            >
                <Pressable style={styles.backdrop} onPress={() => setShowPicker(false)} />
                <View style={styles.sheet}>
                    <View style={styles.sheetHeader}>
                        <AppText variant="h3" style={styles.sheetTitle}>
                            Select Country
                        </AppText>
                        <Pressable onPress={() => setShowPicker(false)}>
                            <AppText style={styles.closeBtn}>✕</AppText>
                        </Pressable>
                    </View>

                    <FlatList
                        data={COUNTRY_CODES}
                        keyExtractor={(item, idx) => `${item.code}-${item.name}-${idx}`}
                        renderItem={({ item }) => {
                            const isSelected =
                                item.code === countryCode.code && item.name === countryCode.name;
                            return (
                                <Pressable
                                    style={[styles.countryItem, isSelected && styles.selectedItem]}
                                    onPress={() => {
                                        onChangeCountryCode(item);
                                        setShowPicker(false);
                                    }}
                                >
                                    <AppText style={styles.countryFlag}>{item.flag}</AppText>
                                    <AppText style={styles.countryName}>{item.name}</AppText>
                                    <AppText style={styles.countryCode}>{item.code}</AppText>
                                    {isSelected && (
                                        <AppText style={styles.checkmark}>✓</AppText>
                                    )}
                                </Pressable>
                            );
                        }}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {},
    label: {
        marginBottom: spacing.xs,
        marginLeft: spacing.xs,
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: colors.border,
        borderRadius: 12,
        backgroundColor: colors.surface,
        height: 52,
        overflow: 'hidden',
    },
    errorBorder: {
        borderColor: colors.danger,
    },
    codeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        height: '100%',
        gap: 4,
        maxWidth: 90,
        flexShrink: 0,
    },
    flag: {
        fontSize: 18,
    },
    codeText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.textPrimary,
    },
    chevron: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 1,
    },
    divider: {
        width: 1,
        height: 26,
        backgroundColor: colors.border,
    },
    input: {
        flex: 1,
        paddingHorizontal: spacing.md,
        fontSize: 15,
        color: colors.textPrimary,
        height: '100%',
        minWidth: 0,
    },
    errorText: {
        marginTop: spacing.xs,
        marginLeft: spacing.xs,
    },
    // Modal
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '65%',
        paddingBottom: 24,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        borderBottomWidth: 1,
        borderColor: colors.border,
    },
    sheetTitle: {
        fontWeight: '700',
        color: colors.textPrimary,
    },
    closeBtn: {
        fontSize: 16,
        color: colors.textSecondary,
        padding: 4,
    },
    countryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderColor: colors.border + '40',
        gap: spacing.md,
    },
    selectedItem: {
        backgroundColor: colors.primary + '12',
    },
    countryFlag: {
        fontSize: 22,
        width: 30,
    },
    countryName: {
        flex: 1,
        fontSize: 15,
        color: colors.textPrimary,
    },
    countryCode: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    checkmark: {
        fontSize: 16,
        color: colors.primary,
        fontWeight: '700',
        marginLeft: 4,
    },
});
