import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchCounselorsPage } from '@/src/api/masters/paginatedMasters.api';
import AppButton from '@/src/components/common/AppButton';
import AppInput from '@/src/components/common/AppInput';
import AppMultiSelect from '@/src/components/common/AppMultiSelect';
import AppText from '@/src/components/common/AppText';
import PhoneInputWithCode, {
    COUNTRY_CODES,
    CountryCode,
    DEFAULT_COUNTRY,
} from '@/src/components/common/PhoneInputWithCode';
import { MoreStackParamList } from '@/src/navigation/MoreStack';
import { useCompanyDetail, useUpdateCompany } from '@/src/queries/jobs.query';
import { colors, spacing } from '@/src/theme';

const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const parsePhoneWithCountry = (
    phone: string | null | undefined
): { country: CountryCode; number: string } => {
    if (!phone) return { country: DEFAULT_COUNTRY, number: '' };
    const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
    for (const c of sorted) {
        if (phone.startsWith(c.code)) {
            return { country: c, number: phone.slice(c.code.length) };
        }
    }
    return { country: DEFAULT_COUNTRY, number: phone };
};

function SectionHeader({ icon, title }: { icon: any; title: string }) {
    return (
        <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
                <Ionicons name={icon} size={18} color={colors.primary} />
            </View>
            <AppText variant="h3" style={styles.sectionTitle}>{title}</AppText>
        </View>
    );
}

export default function EditCompanyScreen() {
    const route = useRoute<RouteProp<MoreStackParamList, 'EditCompany'>>();
    const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
    const insets = useSafeAreaInsets();
    const { uid } = route.params;

    const { data, isLoading, isError, error, refetch } = useCompanyDetail(uid);
    const updateCompanyMutation = useUpdateCompany(uid);

    const [name, setName] = useState('');
    const [portalSlug, setPortalSlug] = useState('');
    const [website, setWebsite] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [phoneCountry, setPhoneCountry] = useState<CountryCode>(DEFAULT_COUNTRY);
    const [address, setAddress] = useState('');
    const [logo, setLogo] = useState<{ uri: string; name: string; type: string } | null>(null);
    const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);
    const [removeLogo, setRemoveLogo] = useState(false);
    const [representativeIds, setRepresentativeIds] = useState<number[]>([]);
    const [isActive, setIsActive] = useState(true);
    const [prefilled, setPrefilled] = useState(false);

    useEffect(() => {
        if (data?.company && !prefilled) {
            const c = data.company;
            setName(c.name);
            setPortalSlug(c.portal_slug);
            setWebsite(c.website ?? '');
            setContactEmail(c.contact_email ?? '');
            const { country, number } = parsePhoneWithCountry(c.contact_phone);
            setPhoneCountry(country);
            setContactPhone(number);
            setAddress(c.address ?? '');
            setLogo(null);
            setExistingLogoUrl(c.logo);
            setRemoveLogo(false);
            setRepresentativeIds(c.representatives?.map((r) => r.id) ?? []);
            setIsActive(c.is_active);
            setPrefilled(true);
        }
    }, [data, prefilled]);

    const pickLogo = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please allow access to your photo library.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            const ext = asset.uri.split('.').pop() ?? 'jpg';
            setLogo({
                uri: asset.uri,
                name: `logo.${ext}`,
                type: asset.mimeType ?? `image/${ext}`,
            });
            setRemoveLogo(false);
        }
    };

    const handleRemoveNewLogo = () => {
        setLogo(null);
    };

    const handleRemoveExistingLogo = () => {
        setLogo(null);
        setExistingLogoUrl(null);
        setRemoveLogo(true);
    };

    const fetchRepOptions = useCallback(async (params: any) => {
        const res = await fetchCounselorsPage(params);
        return {
            options: res.items.map((u: any) => ({
                label: u.full_name,
                value: u.id,
            })),
            hasNextPage: res.hasNextPage,
        };
    }, []);

    const validate = () => {
        if (!name.trim()) {
            Alert.alert('Validation Error', 'Company name is required.');
            return false;
        }
        if (!portalSlug.trim()) {
            Alert.alert('Validation Error', 'Portal slug is required.');
            return false;
        }
        if (!/^[a-z0-9_]+$/.test(portalSlug)) {
            Alert.alert('Validation Error', 'Portal slug can only contain lowercase letters, numbers, and underscores.');
            return false;
        }
        if (contactEmail && !isValidEmail(contactEmail)) {
            Alert.alert('Validation Error', 'Please enter a valid contact email address.');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        try {
            const payload: any = {
                name: name.trim(),
                portal_slug: portalSlug.trim(),
                website: website.trim() || undefined,
                contact_email: contactEmail.trim() || undefined,
                contact_phone: contactPhone.trim()
                    ? `${phoneCountry.code}${contactPhone.trim()}`
                    : undefined,
                address: address.trim() || undefined,
                representative_ids: representativeIds.length ? representativeIds : undefined,
                is_active: isActive,
            };

            if (logo) {
                payload.logo = logo;
            } else if (removeLogo) {
                payload.logo = null as any;
            }

            await updateCompanyMutation.mutateAsync(payload);

            Alert.alert('Success', 'Company updated successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error: any) {
            const msg =
                error?.response?.data?.message ||
                error?.response?.data?.detail ||
                Object.values(error?.response?.data ?? {})?.[0] ||
                'Failed to update company. Please try again.';
            Alert.alert('Error', String(msg));
        }
    };

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (isError || !data) {
        return (
            <View style={styles.center}>
                <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
                <AppText color={colors.danger} style={styles.errorText}>
                    {((error as any)?.response?.data?.detail) ||
                        ((error as any)?.response?.data?.error) ||
                        ((error as Error)?.message) ||
                        'Failed to load company'}
                </AppText>
                <Pressable onPress={() => refetch()} style={styles.retryBtn}>
                    <AppText color={colors.primary}>Try Again</AppText>
                </Pressable>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={100}
        >
            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xxl }]}
                showsVerticalScrollIndicator={false}
            >
                {/* ── LOGO ── */}
                <View style={styles.card}>
                    <SectionHeader icon="image-outline" title="Company Logo" />
                    <Pressable style={styles.logoPicker} onPress={pickLogo}>
                        {logo ? (
                            <Image source={{ uri: logo.uri }} style={styles.logoPreview} />
                        ) : existingLogoUrl ? (
                            <>
                                <Image source={{ uri: existingLogoUrl }} style={styles.logoPreview} />
                                <View style={styles.replaceOverlay}>
                                    <Ionicons name="camera-outline" size={20} color={colors.surface} />
                                    <AppText variant="caption" color={colors.surface} style={{ marginLeft: 6, fontWeight: '700' }}>
                                        Replace Logo
                                    </AppText>
                                </View>
                            </>
                        ) : (
                            <View style={styles.logoPlaceholder}>
                                <Ionicons name="cloud-upload-outline" size={32} color={colors.primary} />
                                <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 8 }}>
                                    Tap to upload logo
                                </AppText>
                            </View>
                        )}
                    </Pressable>
                    {logo ? (
                        <Pressable onPress={handleRemoveNewLogo} style={styles.removeLogo}>
                            <Ionicons name="trash-outline" size={16} color={colors.danger} />
                            <AppText variant="caption" color={colors.danger} style={{ marginLeft: 4 }}>Remove</AppText>
                        </Pressable>
                    ) : existingLogoUrl ? (
                        <Pressable onPress={handleRemoveExistingLogo} style={styles.removeLogo}>
                            <Ionicons name="trash-outline" size={16} color={colors.danger} />
                            <AppText variant="caption" color={colors.danger} style={{ marginLeft: 4 }}>Remove Logo</AppText>
                        </Pressable>
                    ) : null}
                </View>

                {/* ── BASIC INFO ── */}
                <View style={styles.card}>
                    <SectionHeader icon="business-outline" title="Company Details" />

                    <AppInput
                        label="Company Name *"
                        placeholder="e.g. Luminar Technolab"
                        value={name}
                        onChangeText={setName}
                    />

                    <AppInput
                        label="Portal Slug *"
                        placeholder="auto-generated from name"
                        value={portalSlug}
                        onChangeText={(v) => {
                            setPortalSlug(v.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                        }}
                        autoCapitalize="none"
                    />
                    <AppText variant="caption" color={colors.textMuted} style={styles.hint}>
                        Used in company portal URL. Only lowercase letters, numbers, and underscores.
                    </AppText>

                    <AppInput
                        label="Website"
                        placeholder="https://example.com"
                        value={website}
                        onChangeText={setWebsite}
                        keyboardType="url"
                        autoCapitalize="none"
                    />

                    <AppInput
                        label="Address"
                        placeholder="Enter company address"
                        value={address}
                        onChangeText={setAddress}
                        multiline
                        numberOfLines={3}
                    />
                </View>

                {/* ── CONTACT ── */}
                <View style={styles.card}>
                    <SectionHeader icon="call-outline" title="Contact Information" />

                    <AppInput
                        label="Contact Email"
                        placeholder="hr@company.com"
                        value={contactEmail}
                        onChangeText={setContactEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <PhoneInputWithCode
                        label="Contact Phone"
                        placeholder="Enter phone number"
                        value={contactPhone}
                        countryCode={phoneCountry}
                        onChangeText={setContactPhone}
                        onChangeCountryCode={setPhoneCountry}
                        containerStyle={{ marginBottom: spacing.md }}
                    />
                </View>

                {/* ── REPRESENTATIVES ── */}
                <View style={styles.card}>
                    <SectionHeader icon="people-outline" title="Representatives" />
                    <AppMultiSelect
                        label="Select Representatives"
                        placeholder="Search and select users"
                        value={representativeIds}
                        onSelect={(ids) => setRepresentativeIds(ids as number[])}
                        fetchOptions={fetchRepOptions}
                    />
                    <AppText variant="caption" color={colors.textMuted} style={styles.hint}>
                        These users will be assigned as company representatives.
                    </AppText>
                </View>

                {/* ── STATUS ── */}
                <View style={styles.card}>
                    <SectionHeader icon="power-outline" title="Status" />
                    <View style={styles.statusRow}>
                        <View style={{ flex: 1 }}>
                            <AppText style={styles.statusLabel}>
                                {isActive ? 'Active' : 'Inactive'}
                            </AppText>
                            <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 2 }}>
                                {isActive
                                    ? 'Company is visible and operational.'
                                    : 'Company is hidden and not operational.'}
                            </AppText>
                        </View>
                        <Switch
                            value={isActive}
                            onValueChange={setIsActive}
                            trackColor={{ false: colors.border, true: colors.success + '80' }}
                            thumbColor={isActive ? colors.success : '#f4f3f4'}
                        />
                    </View>
                </View>

                {/* ── SUBMIT ── */}
                <AppButton
                    title="Save Changes"
                    onPress={handleSubmit}
                    loading={updateCompanyMutation.isPending}
                    style={styles.submitBtn}
                />
            </ScrollView>
        </KeyboardAvoidingView>
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
        backgroundColor: colors.background,
    },
    errorText: {
        marginTop: spacing.md,
        textAlign: 'center',
        fontWeight: '600',
    },
    retryBtn: {
        marginTop: spacing.lg,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: 12,
        backgroundColor: colors.primaryLight + '15',
    },
    scroll: {
        padding: spacing.lg,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: spacing.xl,
        marginBottom: spacing.lg,
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    sectionIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: colors.primaryLight + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    sectionTitle: {
        fontWeight: '800',
        color: colors.textPrimary,
    },
    logoPicker: {
        borderWidth: 2,
        borderColor: colors.primaryLight + '40',
        borderStyle: 'dashed',
        borderRadius: 20,
        overflow: 'hidden',
        height: 160,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.primaryLight + '08',
    },
    logoPreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    logoPlaceholder: {
        alignItems: 'center',
    },
    replaceOverlay: {
        position: 'absolute',
        bottom: spacing.sm,
        right: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.55)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    removeLogo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.sm,
        paddingVertical: spacing.sm,
    },
    hint: {
        marginTop: -spacing.sm,
        marginBottom: spacing.md,
        lineHeight: 18,
    },
    submitBtn: {
        marginTop: spacing.sm,
        height: 56,
        borderRadius: 16,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statusLabel: {
        fontWeight: '700',
        color: colors.textPrimary,
        fontSize: 15,
    },
});
