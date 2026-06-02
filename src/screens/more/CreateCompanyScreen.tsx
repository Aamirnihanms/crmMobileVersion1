import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchCounselorsPage } from '@/src/api/masters/paginatedMasters.api';
import AppButton from '@/src/components/common/AppButton';
import AppInput from '@/src/components/common/AppInput';
import AppMultiSelect from '@/src/components/common/AppMultiSelect';
import AppText from '@/src/components/common/AppText';
import PhoneInputWithCode, {
    CountryCode,
    DEFAULT_COUNTRY,
} from '@/src/components/common/PhoneInputWithCode';
import { MoreStackParamList } from '@/src/navigation/MoreStack';
import { useCreateCompany } from '@/src/queries/jobs.query';
import { colors, spacing } from '@/src/theme';

/* ─── helpers ─── */
const toSlug = (name: string) =>
    name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s_]/g, '')
        .replace(/\s+/g, '_');

const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/* ─── section header ─── */
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

export default function CreateCompanyScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
    const insets = useSafeAreaInsets();
    const createCompanyMutation = useCreateCompany();

    /* ─── form state ─── */
    const [name, setName] = useState('');
    const [portalSlug, setPortalSlug] = useState('');
    const [slugEdited, setSlugEdited] = useState(false);
    const [website, setWebsite] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [phoneCountry, setPhoneCountry] = useState<CountryCode>(DEFAULT_COUNTRY);
    const [address, setAddress] = useState('');
    const [logo, setLogo] = useState<{ uri: string; name: string; type: string } | null>(null);
    const [representativeIds, setRepresentativeIds] = useState<number[]>([]);

    /* ─── auto slug from name ─── */
    useEffect(() => {
        if (!slugEdited) {
            setPortalSlug(toSlug(name));
        }
    }, [name, slugEdited]);

    /* ─── image picker ─── */
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
        }
    };

    /* ─── representatives (uses /users/ endpoint, ID as number) ─── */
    const fetchRepOptions = useCallback(async (params: any) => {
        const res = await fetchCounselorsPage(params);
        return {
            options: res.items.map((u: any) => ({
                label: u.full_name,
                value: u.id,                // integer ID for representative_ids payload
            })),
            hasNextPage: res.hasNextPage,
        };
    }, []);

    /* ─── validation ─── */
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

    /* ─── submit ─── */
    const handleSubmit = async () => {
        if (!validate()) return;

        try {
            await createCompanyMutation.mutateAsync({
                name: name.trim(),
                portal_slug: portalSlug.trim(),
                website: website.trim() || undefined,
                contact_email: contactEmail.trim() || undefined,
                contact_phone: contactPhone.trim()
                    ? `${phoneCountry.code}${contactPhone.trim()}`
                    : undefined,
                address: address.trim() || undefined,
                logo: logo ?? undefined,
                representative_ids: representativeIds.length ? representativeIds : undefined,
            });

            Alert.alert('Success', 'Company created successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error: any) {
            const msg =
                error?.response?.data?.message ||
                error?.response?.data?.detail ||
                Object.values(error?.response?.data ?? {})?.[0] ||
                'Failed to create company. Please try again.';
            Alert.alert('Error', String(msg));
        }
    };

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
                        ) : (
                            <View style={styles.logoPlaceholder}>
                                <Ionicons name="cloud-upload-outline" size={32} color={colors.primary} />
                                <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 8 }}>
                                    Tap to upload logo
                                </AppText>
                            </View>
                        )}
                    </Pressable>
                    {logo && (
                        <Pressable
                            onPress={() => setLogo(null)}
                            style={styles.removeLogo}
                        >
                            <Ionicons name="trash-outline" size={16} color={colors.danger} />
                            <AppText variant="caption" color={colors.danger} style={{ marginLeft: 4 }}>Remove</AppText>
                        </Pressable>
                    )}
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
                            setSlugEdited(true);
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

                {/* ── SUBMIT ── */}
                <AppButton
                    title="Create Company"
                    onPress={handleSubmit}
                    loading={createCompanyMutation.isPending}
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
});
