import DateTimePicker from '@react-native-community/datetimepicker';
import {
    RouteProp,
    useNavigation,
    useRoute,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import AppCard from '@/src/components/common/AppCard';
import AppInput from '@/src/components/common/AppInput';
import AppLoader from '@/src/components/common/AppLoader';
import AppSelect from '@/src/components/common/AppSelect';
import AppText from '@/src/components/common/AppText';
import PhoneInputWithCode, {
    COUNTRY_CODES,
    CountryCode,
    DEFAULT_COUNTRY,
} from '@/src/components/common/PhoneInputWithCode';
import {
    fetchQualificationsPage,
    fetchSpecializationsPage,
} from '@/src/api/masters/paginatedMasters.api';
import { StudentsStackParamList } from '@/src/navigation/StudentsStack';
import {
    useStudentProfile,
    useUpdateStudent,
} from '@/src/queries/students.query';
import { colors, spacing } from '@/src/theme';
import { generatePassOutYears } from '@/src/utils/passOutYears';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Nav = NativeStackNavigationProp<StudentsStackParamList, 'EditStudent'>;
type Route = RouteProp<StudentsStackParamList, 'EditStudent'>;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function extractCodeAndNumber(
    fullNumber: string | null | undefined
): { country: CountryCode; number: string } {
    if (!fullNumber) return { country: DEFAULT_COUNTRY, number: '' };
    const match = COUNTRY_CODES.find(
        (c) => fullNumber.startsWith(c.code) && c.name !== 'Canada'
    );
    if (match) {
        return {
            country: match,
            number: fullNumber.slice(match.code.length),
        };
    }
    return { country: DEFAULT_COUNTRY, number: fullNumber };
}

const GENDER_OPTIONS = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
];

const PROFILE_TYPE_OPTIONS = [
    { label: 'Student', value: 'student' },
    { label: 'Working Professional', value: 'working_professional' },
];

const YES_NO_OPTIONS = [
    { label: 'Yes', value: 'true' },
    { label: 'No', value: 'false' },
];

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function EditStudentScreen() {
    const navigation = useNavigation<Nav>();
    const { params } = useRoute<Route>();
    const studentId = params.id;

    const scrollRef = useRef<ScrollView>(null);
    const hydratedRef = useRef(false);

    const { data: student, isLoading, isError } = useStudentProfile(studentId);
    const updateMutation = useUpdateStudent();

    const passOutYearOptions = generatePassOutYears().reverse().map((y) => ({
        label: String(y),
        value: String(y),
    }));

    const fetchQualificationOptions = useCallback(
        async ({ page, pageSize, search }: { page: number; pageSize: number; search?: string }) => {
            const result = await fetchQualificationsPage({ page, pageSize, search });
            return {
                options: result.items.map((item) => ({
                    label: item.name,
                    value: item.id,
                })),
                hasNextPage: result.hasNextPage,
            };
        },
        []
    );

    const fetchSpecializationOptions = useCallback(
        async ({ page, pageSize, search }: { page: number; pageSize: number; search?: string }) => {
            const result = await fetchSpecializationsPage({ page, pageSize, search });
            return {
                options: result.items.map((item) => ({
                    label: item.name,
                    value: item.value,
                })),
                hasNextPage: result.hasNextPage,
            };
        },
        []
    );

    const [form, setForm] = useState<any>({
        full_name: '',
        email: '',
        phone_number: '',
        phone_country_code: DEFAULT_COUNTRY,
        whatsapp_number: '',
        whatsapp_country_code: DEFAULT_COUNTRY,
        parent_name: '',
        parent_phone_number: '',
        parent_phone_country_code: DEFAULT_COUNTRY,
        address: '',
        district: '',
        pincode: '',
        date_of_birth: '',
        gender: '',
        student_or_working_professional: '',
        preferred_job_location: '',
        placement_assistance: '',
        // Educational
        education_level: null as number | null,
        college: '',
        specialization: '',
        pass_out_year: '',
        cgpa: '',
        any_arrears: '',
    });

    const [showDatePicker, setShowDatePicker] = useState(false);

    /* Hydrate form once student data arrives */
    useEffect(() => {
        if (!student || hydratedRef.current) return;

        const personal = student.dashboard_data?.personal_info ?? {};
        const academic = student.dashboard_data?.academic_info ?? {};

        const phoneParsed = extractCodeAndNumber(
            student.phone_number ?? personal.phone_number
        );
        const waParsed = extractCodeAndNumber(
            student.whatsapp_number ??
            student.user?.whatsapp_number ??
            personal.whatsapp_number
        );
        const parentParsed = extractCodeAndNumber(student.parent_phone_number);

        setForm({
            full_name: student.full_name ?? '',
            email: student.email ?? personal.email ?? '',
            phone_number: phoneParsed.number,
            phone_country_code: phoneParsed.country,
            whatsapp_number: waParsed.number,
            whatsapp_country_code: waParsed.country,
            parent_name: student.parent_name ?? '',
            parent_phone_number: parentParsed.number,
            parent_phone_country_code: parentParsed.country,
            address: personal.address ?? student.address ?? '',
            district: personal.district ?? student.district ?? '',
            pincode: personal.pincode ?? student.pincode ?? '',
            date_of_birth: student.date_of_birth
                ? String(student.date_of_birth).split('T')[0]
                : '',
            gender: student.gender ?? '',
            student_or_working_professional:
                student.student_or_working_professional ?? '',
            preferred_job_location: student.preferred_job_location ?? '',
            placement_assistance:
                student.placement_assistance === true
                    ? 'true'
                    : student.placement_assistance === false
                        ? 'false'
                        : '',
            // Educational
            education_level:
                academic.qualification_id ??
                student.education_level ??
                null,
            college: academic.college ?? student.college ?? '',
            specialization: academic.specialization ?? student.specialization ?? '',
            pass_out_year: academic.pass_out_year
                ? String(academic.pass_out_year)
                : student.pass_out_year
                    ? String(student.pass_out_year)
                    : '',
            cgpa: academic.cgpa !== null && academic.cgpa !== undefined
                ? String(academic.cgpa)
                : '',
            any_arrears:
                academic.any_arrears === true
                    ? 'true'
                    : academic.any_arrears === false
                        ? 'false'
                        : '',
        });

        hydratedRef.current = true;
    }, [student]);

    /* ---------------------------------------------------------------- */
    /* Date Picker Handler                                              */
    /* ---------------------------------------------------------------- */

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            const dateString = selectedDate.toISOString().split('T')[0];
            setForm({ ...form, date_of_birth: dateString });
        }
    };

    const getDateForPicker = (): Date => {
        if (form.date_of_birth) {
            return new Date(form.date_of_birth);
        }
        return new Date();
    };

    /* ---------------------------------------------------------------- */
    /* Submit                                                            */
    /* ---------------------------------------------------------------- */

    const handleSubmit = () => {
        if (updateMutation.isPending) return;

        if (!form.full_name.trim()) {
            Alert.alert('Validation Error', 'Full name is required.');
            scrollRef.current?.scrollTo({ y: 0, animated: true });
            return;
        }

        const phoneNumber =
            form.phone_number
                ? `${form.phone_country_code.code}${form.phone_number}`
                : undefined;

        const whatsappNumber =
            form.whatsapp_number
                ? `${form.whatsapp_country_code.code}${form.whatsapp_number}`
                : undefined;

        const parentPhone =
            form.parent_phone_number
                ? `${form.parent_phone_country_code.code}${form.parent_phone_number}`
                : undefined;

        const payload: Record<string, any> = {
            full_name: form.full_name.trim(),
        };

        if (form.email) payload.email = form.email.trim();
        if (phoneNumber) payload.phone_number = phoneNumber;
        if (whatsappNumber) payload.whatsapp_number = whatsappNumber;
        if (form.parent_name) payload.parent_name = form.parent_name.trim();
        if (parentPhone) payload.parent_phone_number = parentPhone;
        if (form.address) payload.address = form.address.trim();
        if (form.district) payload.district = form.district.trim();
        if (form.pincode) payload.pincode = form.pincode.trim();
        if (form.date_of_birth) payload.date_of_birth = form.date_of_birth;
        if (form.gender) payload.gender = form.gender;
        if (form.student_or_working_professional)
            payload.student_or_working_professional =
                form.student_or_working_professional;
        if (form.preferred_job_location)
            payload.preferred_job_location = form.preferred_job_location.trim();
        if (form.placement_assistance !== '')
            payload.placement_assistance = form.placement_assistance === 'true';
        // Educational
        if (form.education_level) payload.education_level = form.education_level;
        if (form.college) payload.college = form.college.trim();
        if (form.specialization) payload.specialization = form.specialization.trim();
        if (form.pass_out_year) payload.pass_out_year = Number(form.pass_out_year);
        if (form.cgpa) payload.cgpa = parseFloat(form.cgpa);
        if (form.any_arrears !== '') payload.any_arrears = form.any_arrears === 'true';

        updateMutation.mutate(
            { id: studentId, payload },
            {
                onSuccess: () => {
                    if (navigation.canGoBack()) {
                        navigation.goBack();
                    }
                },
                onError: (err: any) => {
                    console.log('❌ Update student error:', err?.response?.data);
                    Alert.alert(
                        'Error',
                        'Failed to update student profile. Please try again.'
                    );
                },
            }
        );
    };

    /* ---------------------------------------------------------------- */
    /* Render guards                                                     */
    /* ---------------------------------------------------------------- */

    if (isLoading) return <AppLoader />;

    if (isError || !student) {
        return (
            <View style={styles.errorContainer}>
                <AppText>Unable to load student profile for edit.</AppText>
            </View>
        );
    }

    const qualificationFallback =
        student?.dashboard_data?.academic_info?.qualification &&
            form.education_level
            ? [{
                label: student.dashboard_data.academic_info.qualification,
                value: form.education_level,
            }]
            : [];

    const specializationFallback = form.specialization
        ? [{ label: form.specialization, value: form.specialization }]
        : [];

    /* ---------------------------------------------------------------- */
    /* Render                                                            */
    /* ---------------------------------------------------------------- */

    return (
        <View style={styles.root}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <ScrollView
                    ref={scrollRef}
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Basic Information ── */}
                    <AppText variant="h3" style={styles.sectionTitle}>
                        Basic Information
                    </AppText>
                    <AppCard style={styles.card}>
                        <AppInput
                            label="Full Name"
                            placeholder="Enter student's full name"
                            value={form.full_name}
                            onChangeText={(v: string) => setForm({ ...form, full_name: v })}
                            containerStyle={styles.inputGap}
                        />
                        <AppInput
                            label="Email Address"
                            placeholder="example@domain.com"
                            keyboardType="email-address"
                            value={form.email}
                            onChangeText={(v: string) => setForm({ ...form, email: v })}
                            containerStyle={styles.inputGap}
                        />
                        <PhoneInputWithCode
                            label="Phone Number"
                            placeholder="Primary contact number"
                            value={form.phone_number}
                            countryCode={form.phone_country_code}
                            onChangeText={(v: string) => setForm({ ...form, phone_number: v })}
                            onChangeCountryCode={(c: CountryCode) =>
                                setForm({ ...form, phone_country_code: c })
                            }
                            containerStyle={styles.inputGap}
                        />
                        <PhoneInputWithCode
                            label="WhatsApp Number"
                            placeholder="Same as phone or different"
                            value={form.whatsapp_number}
                            countryCode={form.whatsapp_country_code}
                            onChangeText={(v: string) => setForm({ ...form, whatsapp_number: v })}
                            onChangeCountryCode={(c: CountryCode) =>
                                setForm({ ...form, whatsapp_country_code: c })
                            }
                        />
                    </AppCard>

                    {/* ── Parent / Guardian ── */}
                    <AppText variant="h3" style={styles.sectionTitle}>
                        Parent / Guardian
                    </AppText>
                    <AppCard style={styles.card}>
                        <AppInput
                            label="Parent Name"
                            placeholder="Parent or guardian's name"
                            value={form.parent_name}
                            onChangeText={(v: string) => setForm({ ...form, parent_name: v })}
                            containerStyle={styles.inputGap}
                        />
                        <PhoneInputWithCode
                            label="Parent Phone Number"
                            placeholder="Parent contact number"
                            value={form.parent_phone_number}
                            countryCode={form.parent_phone_country_code}
                            onChangeText={(v: string) =>
                                setForm({ ...form, parent_phone_number: v })
                            }
                            onChangeCountryCode={(c: CountryCode) =>
                                setForm({ ...form, parent_phone_country_code: c })
                            }
                        />
                    </AppCard>

                    {/* ── Address Details ── */}
                    <AppText variant="h3" style={styles.sectionTitle}>
                        Address Details
                    </AppText>
                    <AppCard style={styles.card}>
                        <AppInput
                            label="Address"
                            placeholder="Street / area"
                            value={form.address}
                            onChangeText={(v: string) => setForm({ ...form, address: v })}
                            containerStyle={styles.inputGap}
                        />
                        <AppInput
                            label="District"
                            placeholder="District"
                            value={form.district}
                            onChangeText={(v: string) => setForm({ ...form, district: v })}
                            containerStyle={styles.inputGap}
                        />
                        <AppInput
                            label="Pincode"
                            placeholder="6-digit pincode"
                            keyboardType="numeric"
                            value={form.pincode}
                            onChangeText={(v: string) => setForm({ ...form, pincode: v })}
                        />
                    </AppCard>

                    {/* ── Personal Details ── */}
                    <AppText variant="h3" style={styles.sectionTitle}>
                        Personal Details
                    </AppText>
                    <AppCard style={styles.card}>
                        <View style={styles.inputGap}>
                            <AppText
                                style={{
                                    fontWeight: '600',
                                    fontSize: 14,
                                    color: colors.textPrimary,
                                    marginBottom: 8,
                                }}
                            >
                                Date of Birth
                            </AppText>
                            <TouchableOpacity
                                onPress={() => setShowDatePicker(true)}
                                style={styles.datePickerButton}
                            >
                                <AppText
                                    style={{
                                        fontSize: 16,
                                        color: form.date_of_birth
                                            ? colors.textPrimary
                                            : colors.textSecondary,
                                    }}
                                >
                                    {form.date_of_birth || 'Select date of birth'}
                                </AppText>
                            </TouchableOpacity>
                        </View>
                        <AppSelect
                            label="Gender"
                            value={form.gender}
                            options={GENDER_OPTIONS}
                            onSelect={(v: string) => setForm({ ...form, gender: v })}
                            placeholder="Select gender"
                        />
                        <AppSelect
                            label="Profile Type"
                            value={form.student_or_working_professional}
                            options={PROFILE_TYPE_OPTIONS}
                            onSelect={(v: string) =>
                                setForm({ ...form, student_or_working_professional: v })
                            }
                            placeholder="Student or working professional?"
                        />
                    </AppCard>

                    {/* ── Educational Information ── */}
                    <AppText variant="h3" style={styles.sectionTitle}>
                        Educational Information
                    </AppText>
                    <AppCard style={styles.card}>
                        <AppSelect
                            label="Qualification"
                            value={form.education_level}
                            options={qualificationFallback}
                            fetchOptions={fetchQualificationOptions}
                            queryKey={['student-edit', 'qualifications']}
                            onSelect={(v: any) =>
                                setForm({ ...form, education_level: Number(v) })
                            }
                            placeholder="Select qualification"
                        />
                        <AppInput
                            label="College / Institution"
                            placeholder="e.g. Anna University"
                            value={form.college}
                            onChangeText={(v: string) => setForm({ ...form, college: v })}
                            containerStyle={styles.inputGap}
                        />
                        <AppSelect
                            label="Specialization"
                            value={form.specialization}
                            options={specializationFallback}
                            fetchOptions={fetchSpecializationOptions}
                            queryKey={['student-edit', 'specializations']}
                            onSelect={(v: string) =>
                                setForm({ ...form, specialization: v })
                            }
                            placeholder="Select specialization"
                        />
                        <AppSelect
                            label="Pass Out Year"
                            value={form.pass_out_year}
                            options={passOutYearOptions}
                            onSelect={(v: string) =>
                                setForm({ ...form, pass_out_year: v })
                            }
                            placeholder="Select year"
                        />
                        <AppInput
                            label="CGPA"
                            placeholder="e.g. 8.5"
                            keyboardType="decimal-pad"
                            value={form.cgpa}
                            onChangeText={(v: string) => setForm({ ...form, cgpa: v })}
                            containerStyle={styles.inputGap}
                        />
                        <AppSelect
                            label="Any Arrears?"
                            value={form.any_arrears}
                            options={YES_NO_OPTIONS}
                            onSelect={(v: string) =>
                                setForm({ ...form, any_arrears: v })
                            }
                            placeholder="Select"
                        />
                    </AppCard>

                    {/* ── Additional Info ── */}
                    <AppText variant="h3" style={styles.sectionTitle}>
                        Additional Information
                    </AppText>
                    <AppCard style={styles.card}>
                        <AppInput
                            label="Preferred Job Location"
                            placeholder="e.g. Bangalore, Remote"
                            value={form.preferred_job_location}
                            onChangeText={(v: string) =>
                                setForm({ ...form, preferred_job_location: v })
                            }
                            containerStyle={styles.inputGap}
                        />
                        <AppSelect
                            label="Placement Assistance"
                            value={form.placement_assistance}
                            options={YES_NO_OPTIONS}
                            onSelect={(v: string) =>
                                setForm({ ...form, placement_assistance: v })
                            }
                            placeholder="Select"
                        />
                    </AppCard>

                    <View style={{ height: 100 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ── Footer Save Button ── */}
            <View style={styles.footer}>
                <Pressable
                    onPress={handleSubmit}
                    disabled={updateMutation.isPending}
                    style={{ width: '100%' }}
                >
                    <LinearGradient
                        colors={[colors.gradientStart, colors.gradientEnd]}
                        style={[
                            styles.saveBtn,
                            updateMutation.isPending && { opacity: 0.7 },
                        ]}
                    >
                        <AppText style={styles.saveBtnText}>
                            {updateMutation.isPending ? 'Updating...' : 'Update Student'}
                        </AppText>
                    </LinearGradient>
                </Pressable>
            </View>

            {/* ── Date Picker Modal ── */}
            {showDatePicker && (
                <DateTimePicker
                    value={getDateForPicker()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                />
            )}
        </View>
    );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container: {
        padding: spacing.lg,
    },
    sectionTitle: {
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: spacing.md,
        marginLeft: 4,
    },
    card: {
        padding: spacing.lg,
        marginBottom: spacing.xl,
    },
    inputGap: {
        marginBottom: spacing.lg,
    },
    footer: {
        padding: spacing.lg,
        paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderColor: colors.border,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 10,
    },
    saveBtn: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveBtnText: {
        color: colors.surface,
        fontWeight: '700',
        fontSize: 16,
        letterSpacing: 0.5,
    },
    datePickerButton: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        justifyContent: 'center',
        backgroundColor: colors.surface,
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
    },
});
