import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import type { InfiniteData } from '@tanstack/react-query';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Switch,
    View,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import type { CompanyResponse, CompaniesPageResponse } from '../../api/jobs.api';
import CompanyCard from '../../components/cards/CompanyCard';
import AppButton from '../../components/common/AppButton';
import AppDatePicker from '../../components/common/AppDatePicker';
import AppInput from '../../components/common/AppInput';
import AppLoader from '../../components/common/AppLoader';
import AppSelect from '../../components/common/AppSelect';
import AppText from '../../components/common/AppText';
import type { MoreStackParamList } from '../../navigation/MoreStack';
import {
    useCompanyFieldTemplates,
    useCreateCompanyJob,
    useInfiniteCompanies,
} from '../../queries/jobs.query';
import { useAppTheme, spacing } from '../../theme';

type Step = 'pick-company' | 'form';

type FieldErrors = {
    title?: string;
    location?: string;
    expiresAt?: string;
};

const toIsoFromYmd = (ymd: string): string => {
    if (!ymd) return '';
    const d = new Date(`${ymd}T00:00:00.000Z`);
    return d.toISOString();
};

export default function CreateJobScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
    const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();

    const [step, setStep] = useState<Step>('pick-company');
    const [selectedCompany, setSelectedCompany] = useState<CompanyResponse | null>(null);

    /* ── Picker state ── */
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isManualRefreshing, setIsManualRefreshing] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(t);
    }, [search]);

    const {
        data: companiesData,
        isLoading: companiesLoading,
        isError: companiesIsError,
        error: companiesError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch: refetchCompanies,
    } = useInfiniteCompanies(debouncedSearch) as {
        data: InfiniteData<CompaniesPageResponse> | undefined;
        isLoading: boolean;
        isError: boolean;
        error: unknown;
        fetchNextPage: () => void;
        hasNextPage?: boolean;
        isFetchingNextPage: boolean;
        refetch: () => void;
    };

    const onRefreshCompanies = useCallback(async () => {
        try {
            setIsManualRefreshing(true);
            await refetchCompanies();
        } finally {
            setIsManualRefreshing(false);
        }
    }, [refetchCompanies]);

    const companies = companiesData?.pages.flatMap((p) => p.results) ?? [];

    /* ── Form state (Step 2) ── */
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [isPublished, setIsPublished] = useState(true);
    const [templateUid, setTemplateUid] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const { data: templatesRes, isLoading: templatesLoading } = useCompanyFieldTemplates(
        selectedCompany?.uid ?? '',
    );

    const createJobMutation = useCreateCompanyJob(selectedCompany?.uid ?? '');

    const resetForm = useCallback(() => {
        setTitle('');
        setDescription('');
        setLocation('');
        setExpiresAt('');
        setIsPublished(true);
        setTemplateUid(null);
        setFieldErrors({});
    }, []);

    useEffect(() => {
        if (step === 'pick-company') {
            resetForm();
        }
    }, [step, resetForm]);

    const handleSelectCompany = (company: CompanyResponse) => {
        setSelectedCompany(company);
        setStep('form');
    };

    const handleChangeCompany = () => {
        setSelectedCompany(null);
        setStep('pick-company');
    };

    const handleAddCompany = () => {
        navigation.navigate('CreateCompany', {
            onCreated: (newCompany) => {
                setSelectedCompany(newCompany);
                setStep('form');
            },
        });
    };

    const validate = (): boolean => {
        const errs: FieldErrors = {};
        if (!title.trim()) errs.title = 'Title is required.';
        if (!location.trim()) errs.location = 'Location is required.';
        if (!expiresAt) errs.expiresAt = 'Expiry date is required.';
        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate() || !selectedCompany) return;

        try {
            await createJobMutation.mutateAsync({
                title: title.trim(),
                description: description.trim(),
                location: location.trim(),
                expires_at: toIsoFromYmd(expiresAt),
                is_published: isPublished,
                custom_field_template_uid: templateUid,
            });
            navigation.goBack();
        } catch (err: any) {
            const data = err?.response?.data;
            const msg =
                data?.detail ||
                data?.error ||
                data?.message ||
                (data && typeof data === 'object'
                    ? Object.values(data).flat().join('\n')
                    : null) ||
                'Failed to create job.';
            setFieldErrors({ title: String(msg) });
        }
    };

    const templateOptions = [
        { label: 'None', value: '' },
        ...(templatesRes?.results ?? []).map((t) => ({
            label: `${t.name} (${t.items_count} field${t.items_count !== 1 ? 's' : ''})`,
            value: t.uid,
        })),
    ];

    /* ── Header title reflects the current step ── */
    useLayoutEffect(() => {
        navigation.setOptions({
            title: step === 'pick-company' ? 'Select Company' : 'New Job',
        });
    }, [navigation, step]);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={100}
        >
            {step === 'pick-company' ? (
                <PickerView
                    search={search}
                    onChangeSearch={setSearch}
                    companies={companies}
                    isLoading={companiesLoading}
                    isError={companiesIsError}
                    error={companiesError}
                    onRefresh={onRefreshCompanies}
                    isManualRefreshing={isManualRefreshing}
                    onEndReached={() => {
                        if (hasNextPage && !isFetchingNextPage) {
                            fetchNextPage();
                        }
                    }}
                    isFetchingNextPage={isFetchingNextPage}
                    onSelect={handleSelectCompany}
                    onAddCompany={handleAddCompany}
                    hasActiveSearch={debouncedSearch.trim().length > 0}
                />
            ) : (
                <FormView
                    company={selectedCompany!}
                    templatesLoading={templatesLoading}
                    templateOptions={templateOptions}
                    title={title}
                    onChangeTitle={setTitle}
                    description={description}
                    onChangeDescription={setDescription}
                    location={location}
                    onChangeLocation={setLocation}
                    expiresAt={expiresAt}
                    onChangeExpiresAt={setExpiresAt}
                    isPublished={isPublished}
                    onChangePublished={setIsPublished}
                    templateUid={templateUid}
                    onChangeTemplateUid={setTemplateUid}
                    fieldErrors={fieldErrors}
                    onChangeFieldErrors={setFieldErrors}
                    isSubmitting={createJobMutation.isPending}
                    onSubmit={handleSubmit}
                    onChangeCompany={handleChangeCompany}
                />
            )}
        </KeyboardAvoidingView>
    );
}

/* ─────────────────────────────────────────────────────────────
   PickerView
   ───────────────────────────────────────────────────────────── */

type PickerViewProps = {
    search: string;
    onChangeSearch: (v: string) => void;
    companies: CompanyResponse[];
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    onRefresh: () => Promise<void>;
    isManualRefreshing: boolean;
    onEndReached: () => void;
    isFetchingNextPage: boolean;
    onSelect: (c: CompanyResponse) => void;
    onAddCompany: () => void;
    hasActiveSearch: boolean;
};

function PickerView({
    search,
    onChangeSearch,
    companies,
    isLoading,
    isError,
    error,
    onRefresh,
    isManualRefreshing,
    onEndReached,
    isFetchingNextPage,
    onSelect,
    onAddCompany,
    hasActiveSearch,
}: PickerViewProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.searchWrapper}>
                    <Ionicons name="search-outline" size={20} color={colors.textMuted} style={styles.searchIcon} />
                    <AppInput
                        placeholder="Search companies..."
                        value={search}
                        onChangeText={onChangeSearch}
                        style={styles.searchInput}
                        containerStyle={styles.searchContainer}
                    />
                </View>
            </View>

            {isLoading ? (
                <View style={styles.center}>
                    <AppLoader />
                </View>
            ) : isError ? (
                <View style={styles.center}>
                    <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
                    <AppText color={colors.danger} style={styles.errorText}>
                        {(() => {
                            const err = error as any;
                            return (
                                err?.response?.data?.detail ||
                                err?.response?.data?.error ||
                                err?.message ||
                                'Failed to load companies'
                            );
                        })()}
                    </AppText>
                </View>
            ) : (
                <FlashList
                    data={companies}
                    keyExtractor={(item) => item.uid}
                    renderItem={({ item }) => (
                        <CompanyCard company={item} onPress={() => onSelect(item)} />
                    )}
                    contentContainerStyle={styles.list}
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.3}
                    ListHeaderComponent={
                        <Pressable onPress={onAddCompany} style={styles.addCompanyCard}>
                            <View style={styles.addCompanyIcon}>
                                <Ionicons name="add" size={22} color={colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <AppText variant="subtitle" style={styles.addCompanyTitle}>
                                    Add New Company
                                </AppText>
                                <AppText variant="caption" color={colors.textMuted}>
                                    Create a new company to post this job under
                                </AppText>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                        </Pressable>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyBlock}>
                            <View style={styles.emptyIconCircle}>
                                <Ionicons
                                    name={hasActiveSearch ? 'search-outline' : 'business-outline'}
                                    size={40}
                                    color={colors.primary}
                                />
                            </View>
                            <AppText variant="h3" style={styles.emptyText}>
                                {hasActiveSearch ? 'No Matches' : 'No Companies Yet'}
                            </AppText>
                            <AppText color={colors.textMuted} style={styles.emptySubtext}>
                                {hasActiveSearch
                                    ? 'No companies match your search.'
                                    : 'Create your first company to start posting jobs.'}
                            </AppText>
                            <AppButton
                                title="Add New Company"
                                onPress={onAddCompany}
                                style={styles.emptyAddBtn}
                            />
                        </View>
                    }
                    ListFooterComponent={
                        isFetchingNextPage ? <AppLoader /> : <View style={{ height: spacing.xl }} />
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={isManualRefreshing}
                            onRefresh={onRefresh}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                        />
                    }
                />
            )}
        </View>
    );
}

/* ─────────────────────────────────────────────────────────────
   FormView
   ───────────────────────────────────────────────────────────── */

type FormViewProps = {
    company: CompanyResponse;
    templatesLoading: boolean;
    templateOptions: { label: string; value: string }[];
    title: string;
    onChangeTitle: (v: string) => void;
    description: string;
    onChangeDescription: (v: string) => void;
    location: string;
    onChangeLocation: (v: string) => void;
    expiresAt: string;
    onChangeExpiresAt: (v: string) => void;
    isPublished: boolean;
    onChangePublished: (v: boolean) => void;
    templateUid: string | null;
    onChangeTemplateUid: (v: string | null) => void;
    fieldErrors: FieldErrors;
    onChangeFieldErrors: (updater: (prev: FieldErrors) => FieldErrors) => void;
    isSubmitting: boolean;
    onSubmit: () => void;
    onChangeCompany: () => void;
};

function FormView({
    company,
    templatesLoading,
    templateOptions,
    title,
    onChangeTitle,
    description,
    onChangeDescription,
    location,
    onChangeLocation,
    expiresAt,
    onChangeExpiresAt,
    isPublished,
    onChangePublished,
    templateUid,
    onChangeTemplateUid,
    fieldErrors,
    onChangeFieldErrors,
    isSubmitting,
    onSubmit,
    onChangeCompany,
}: FormViewProps) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.formScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.selectedBar}>
                <Pressable onPress={onChangeCompany} style={styles.changeCompanyBtn}>
                    <Ionicons name="chevron-back" size={16} color={colors.primary} />
                    <AppText variant="caption" color={colors.primary} style={styles.changeCompanyText}>
                        Change
                    </AppText>
                </Pressable>
                <View style={styles.selectedCompanyInfo}>
                    <View style={styles.selectedCompanyIcon}>
                        <Ionicons name="business-outline" size={16} color={colors.primary} />
                    </View>
                    <AppText variant="subtitle" style={styles.selectedCompanyName} numberOfLines={1}>
                        {company.name}
                    </AppText>
                </View>
            </View>

            <AppInput
                label="Title *"
                placeholder="e.g. Senior Frontend Developer"
                value={title}
                onChangeText={(v) => {
                    onChangeTitle(v);
                    if (fieldErrors.title) {
                        onChangeFieldErrors((prev) => ({ ...prev, title: undefined }));
                    }
                }}
                error={fieldErrors.title}
            />

            <AppInput
                label="Description"
                placeholder="Brief description of the role"
                value={description}
                onChangeText={onChangeDescription}
                multiline
                numberOfLines={3}
            />

            <AppInput
                label="Location *"
                placeholder="e.g. Kochi, Kerala"
                value={location}
                onChangeText={(v) => {
                    onChangeLocation(v);
                    if (fieldErrors.location) {
                        onChangeFieldErrors((prev) => ({ ...prev, location: undefined }));
                    }
                }}
                error={fieldErrors.location}
            />

            <AppDatePicker
                label="Expires At *"
                value={expiresAt}
                onChange={(v) => {
                    onChangeExpiresAt(v);
                    if (fieldErrors.expiresAt) {
                        onChangeFieldErrors((prev) => ({ ...prev, expiresAt: undefined }));
                    }
                }}
                placeholder="Select expiry date"
                minimumDate={new Date()}
                error={fieldErrors.expiresAt}
            />

            <View style={styles.templateRow}>
                <AppText style={styles.templateLabel}>Field Template</AppText>
                {templatesLoading ? (
                    <View style={styles.templateLoader}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <AppText variant="caption" color={colors.textMuted} style={{ marginLeft: 8 }}>
                            Loading templates...
                        </AppText>
                    </View>
                ) : (
                    <AppSelect
                        label="Field Template"
                        value={templateUid ?? ''}
                        options={templateOptions}
                        onSelect={(val) => onChangeTemplateUid(val ? String(val) : null)}
                        placeholder="None — no template"
                    />
                )}
            </View>

            <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                    <AppText style={styles.switchLabel}>Publish Immediately</AppText>
                    <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 2 }}>
                        Make this job visible to applicants
                    </AppText>
                </View>
                <Switch
                    value={isPublished}
                    onValueChange={onChangePublished}
                    trackColor={{ false: colors.border, true: colors.success + '80' }}
                    thumbColor={isPublished ? colors.success : '#f4f3f4'}
                />
            </View>

            <AppButton
                title="Create Job"
                onPress={onSubmit}
                loading={isSubmitting}
                style={styles.submitBtn}
            />
        </ScrollView>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    errorText: {
        marginTop: spacing.md,
        textAlign: 'center',
        fontWeight: '600',
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.md,
        paddingBottom: spacing.sm,
        backgroundColor: colors.background,
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primaryLight + '10',
        borderRadius: 16,
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: colors.primaryLight + '20',
    },
    searchIcon: {
        marginRight: spacing.xs,
    },
    searchContainer: {
        flex: 1,
        marginBottom: 0,
        backgroundColor: 'transparent',
        borderWidth: 0,
    },
    searchInput: {
        height: 48,
        fontSize: 15,
    },
    list: {
        padding: spacing.lg,
        paddingTop: spacing.sm,
    },
    addCompanyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: colors.primaryLight + '10',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.primaryLight + '30',
        borderStyle: 'dashed',
        marginBottom: spacing.md,
    },
    addCompanyIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.primaryLight + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    addCompanyTitle: {
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    emptyBlock: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
        paddingHorizontal: spacing.lg,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primaryLight + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    emptyText: {
        fontWeight: '700',
        marginBottom: 4,
    },
    emptySubtext: {
        textAlign: 'center',
        paddingHorizontal: 32,
        lineHeight: 20,
        marginBottom: spacing.lg,
    },
    emptyAddBtn: {
        minWidth: 220,
    },
    formScroll: {
        padding: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    selectedBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.primaryLight + '10',
        borderRadius: 14,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.primaryLight + '20',
    },
    changeCompanyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingRight: spacing.sm,
    },
    changeCompanyText: {
        fontWeight: '700',
        marginLeft: 2,
    },
    selectedCompanyInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectedCompanyIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    selectedCompanyName: {
        flex: 1,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    templateRow: {
        marginTop: spacing.xs,
        marginBottom: spacing.md,
    },
    templateLabel: {
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 6,
        fontSize: 14,
    },
    templateLoader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        marginTop: spacing.xs,
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
