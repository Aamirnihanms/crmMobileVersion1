import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    fetchCounselorsPage,
    fetchCoursesPage,
    fetchBuildingsPage,
    fetchClassroomsPage,
} from '@/src/api/masters/paginatedMasters.api';
import AppButton from '@/src/components/common/AppButton';
import AppInput from '@/src/components/common/AppInput';
import AppMultiSelect from '@/src/components/common/AppMultiSelect';
import AppSelect from '@/src/components/common/AppSelect';
import AppText from '@/src/components/common/AppText';
import AppLoader from '@/src/components/common/AppLoader';
import { MoreStackParamList } from '@/src/navigation/MoreStack';
import { useBatchDetail, useUpdateBatch } from '@/src/queries/batches.query';
import { useAppTheme, spacing } from '@/src/theme';

export default function BatchEditScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
    const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
    const route = useRoute<RouteProp<MoreStackParamList, 'BatchEdit'>>();
    const { uid } = route.params;
    const insets = useSafeAreaInsets();
    
    const { data: detailData, isLoading: isDetailLoading } = useBatchDetail(uid);
    const updateBatchMutation = useUpdateBatch();

    // Form State
    const [formData, setFormData] = useState({
        batch_name: '',
        course: '',
        course_mode: [] as number[],
        location: '',
        building: '',
        class_room: '',
        offline_batch_capacity: 0,
        online_batch_capacity: '0',
        course_fees: '',
        course_fees_discount: '',
        admission_fees: '',
        start_date: '',
        end_date: '',
        time: '',
        duration: '',
        trainers: [] as string[],
        academic_counselors: [] as string[],
        minimum_attendance_duration: '60',
        notes: '',
        description: '',
        certificate_enabled: true,
        is_active: true,
    });

    const [showStartDate, setShowStartDate] = useState(false);
    const [showEndDate, setShowEndDate] = useState(false);
    const [showTime, setShowTime] = useState(false);

    // Store raw course object for modes/locations logic
    const [selectedCourseObj, setSelectedCourseObj] = useState<any>(null);

    // Initialize form with detail data
    useEffect(() => {
        if (detailData?.batch) {
            const b = detailData.batch;
            setFormData({
                batch_name: b.batch_name || '',
                course: String(b.course_details?.id || ''),
                course_mode: b.course_mode_details?.map((m: any) => m.id) || [],
                location: String(b.location_details?.id || ''),
                building: String(b.building_details?.id || ''),
                class_room: String(b.classroom_details?.id || ''),
                offline_batch_capacity: b.offline_batch_capacity || 0,
                online_batch_capacity: String(b.online_batch_capacity || '0'),
                course_fees: String(b.fee_structure?.course_fees || ''),
                course_fees_discount: String(b.fee_structure?.course_fees_discount || ''),
                admission_fees: String(b.fee_structure?.admission_fees || ''),
                start_date: b.start_date || '',
                end_date: b.end_date || '',
                time: b.time || '',
                duration: b.duration || '',
                trainers: b.staff_summary?.trainers?.map((t: any) => t.uid) || [],
                academic_counselors: b.staff_summary?.counselors?.map((c: any) => c.uid) || [],
                minimum_attendance_duration: String(b.minimum_attendance_duration || '60'),
                notes: b.notes || '',
                description: b.description || '',
                certificate_enabled: b.certificate_enabled ?? true,
                is_active: b.is_active ?? true,
            });
            setSelectedCourseObj(b.course_details);
        }
    }, [detailData]);

    // Auto-calculate duration (copied from Create screen)
    useEffect(() => {
        if (formData.start_date && formData.end_date) {
            const start = new Date(formData.start_date);
            const end = new Date(formData.end_date);
            if (end > start) {
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const months = Math.floor(diffDays / 30);
                const remainingDaysAfterMonths = diffDays % 30;
                const weeks = Math.floor(remainingDaysAfterMonths / 7);
                const days = remainingDaysAfterMonths % 7;
                const durationStr = `${months} month(s), ${weeks} week(s), ${days} day(s)`;
                if (formData.duration !== durationStr) {
                    updateField('duration', durationStr);
                }
            }
        }
    }, [formData.start_date, formData.end_date]);

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // --- FETCHERS ---
    const fetchCourseOptions = useCallback(async (params: any) => {
        const res = await fetchCoursesPage(params);
        return {
            options: res.items.map(c => ({ label: c.course_name, value: c.id, raw: c })),
            hasNextPage: res.hasNextPage,
        };
    }, []);

    const fetchBuildingOptions = useCallback(async (params: any) => {
        if (!formData.location) return { options: [], hasNextPage: false };
        const res = await fetchBuildingsPage({ ...params, location_id: Number(formData.location) });
        return {
            options: res.items.map(b => ({ label: b.name, value: b.id })),
            hasNextPage: res.hasNextPage,
        };
    }, [formData.location]);

    const fetchClassroomOptions = useCallback(async (params: any) => {
        if (!formData.building) return { options: [], hasNextPage: false };
        const res = await fetchClassroomsPage({ ...params, building_id: Number(formData.building) });
        return {
            options: res.items.map(c => ({ label: c.name, value: c.id })),
            hasNextPage: res.hasNextPage,
        };
    }, [formData.building]);

    const fetchUserOptions = useCallback(async (params: any) => {
        const res = await fetchCounselorsPage(params);
        return {
            options: res.items.map(u => ({ label: u.full_name, value: u.uid || String(u.id) })),
            hasNextPage: res.hasNextPage,
        };
    }, []);

    const handleSubmit = async () => {
        if (!formData.batch_name || !formData.course || !formData.start_date) {
            Alert.alert('Missing Fields', 'Please fill in required fields (Name, Course, Start Date)');
            return;
        }

        try {
            await updateBatchMutation.mutateAsync({ uid, payload: formData });
            Alert.alert('Success', 'Batch updated successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', error?.response?.data?.message || 'Failed to update batch');
        }
    };

    const renderSectionHeader = (title: string, icon: any) => (
        <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
                <Ionicons name={icon} size={18} color={colors.primary} />
            </View>
            <AppText variant="h3" style={styles.sectionTitle}>{title}</AppText>
        </View>
    );

    if (isDetailLoading) {
        return (
            <View style={styles.center}>
                <AppLoader />
                <AppText style={{ marginTop: spacing.md }}>Loading details...</AppText>
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
                {/* BASIC INFO */}
                <View style={styles.card}>
                    {renderSectionHeader('Basic Information', 'information-circle-outline')}
                    <AppInput 
                        label="Batch Name"
                        placeholder="Enter batch name"
                        value={formData.batch_name}
                        onChangeText={v => updateField('batch_name', v)}
                    />
                    <AppSelect 
                        label="Course"
                        placeholder="Select course"
                        value={formData.course}
                        fetchOptions={fetchCourseOptions}
                        onSelect={(id, item) => {
                            const selected = item?.raw;
                            setSelectedCourseObj(selected);
                            setFormData(prev => ({
                                ...prev,
                                course: String(id),
                                course_fees: selected?.course_fee || '',
                                course_fees_discount: selected?.course_fee_discount || '',
                                admission_fees: selected?.admission_fee || '',
                                course_mode: [],
                                location: '',
                                building: '',
                                class_room: '',
                            }));
                        }}
                    />
                </View>

                {/* MODES & LOCATION */}
                <View style={styles.card}>
                    {renderSectionHeader('Location & Mode', 'location-outline')}
                    <AppMultiSelect 
                        label="Course Mode"
                        placeholder={!formData.course ? "Select a course first" : "Select modes"}
                        value={formData.course_mode}
                        onSelect={v => updateField('course_mode', v)}
                        options={selectedCourseObj?.course_mode_details?.map((m: any) => ({ label: m.name, value: m.id })) || []}
                    />
                    <AppSelect 
                        label="Location"
                        placeholder={!formData.course ? "Select a course first" : "Select location"}
                        value={formData.location}
                        onSelect={v => {
                            updateField('location', v);
                            updateField('building', '');
                            updateField('class_room', '');
                        }}
                        options={selectedCourseObj?.location_details?.map((l: any) => ({ label: l.name, value: String(l.id) })) || []}
                    />
                    <AppSelect 
                        label="Building"
                        placeholder={!formData.location ? "Select a location first" : "Select building"}
                        value={formData.building}
                        onSelect={v => {
                            updateField('building', v);
                            updateField('class_room', '');
                        }}
                        fetchOptions={fetchBuildingOptions}
                        queryKey={['buildings', formData.location]}
                    />
                    <AppSelect 
                        label="Classroom"
                        placeholder={!formData.building ? "Select a building first" : "Select classroom"}
                        value={formData.class_room}
                        onSelect={v => updateField('class_room', v)}
                        fetchOptions={fetchClassroomOptions}
                        queryKey={['classrooms', formData.building]}
                    />
                </View>

                {/* CAPACITY & FEES */}
                <View style={styles.card}>
                    {renderSectionHeader('Capacity & Fees', 'cash-outline')}
                    <View style={styles.row}>
                        <View style={{ flex: 1 }}>
                            <AppInput 
                                label="Offline Capacity"
                                value={String(formData.offline_batch_capacity)}
                                onChangeText={v => updateField('offline_batch_capacity', Number(v))}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={{ width: spacing.md }} />
                        <View style={{ flex: 1 }}>
                            <AppInput 
                                label="Online Capacity"
                                value={formData.online_batch_capacity}
                                onChangeText={v => updateField('online_batch_capacity', v)}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>
                    <AppInput 
                        label="Course Fees"
                        value={formData.course_fees}
                        onChangeText={v => updateField('course_fees', v)}
                        keyboardType="decimal-pad"
                    />
                    <AppInput 
                        label="Course Fees Discount"
                        value={formData.course_fees_discount}
                        onChangeText={v => updateField('course_fees_discount', v)}
                        keyboardType="decimal-pad"
                    />
                    <AppInput 
                        label="Admission Fees"
                        value={formData.admission_fees}
                        onChangeText={v => updateField('admission_fees', v)}
                        keyboardType="decimal-pad"
                    />
                </View>

                {/* SCHEDULE */}
                <View style={styles.card}>
                    {renderSectionHeader('Schedule', 'calendar-outline')}
                    <View style={styles.row}>
                        <Pressable style={{ flex: 1 }} onPress={() => setShowStartDate(true)}>
                            <AppInput 
                                label="Start Date"
                                value={formData.start_date}
                                editable={false}
                                placeholder="YYYY-MM-DD"
                                pointerEvents="none"
                            />
                        </Pressable>
                        <View style={{ width: spacing.md }} />
                        <Pressable style={{ flex: 1 }} onPress={() => setShowEndDate(true)}>
                            <AppInput 
                                label="End Date"
                                value={formData.end_date}
                                editable={false}
                                placeholder="YYYY-MM-DD"
                                pointerEvents="none"
                            />
                        </Pressable>
                    </View>
                    <View style={styles.row}>
                        <Pressable style={{ flex: 1 }} onPress={() => setShowTime(true)}>
                            <AppInput 
                                label="Time"
                                value={formData.time}
                                editable={false}
                                placeholder="HH:MM"
                                pointerEvents="none"
                            />
                        </Pressable>
                        <View style={{ width: spacing.md }} />
                        <View style={{ flex: 1 }}>
                            <AppInput 
                                label="Duration"
                                value={formData.duration}
                                onChangeText={v => updateField('duration', v)}
                                placeholder="e.g. 5 months"
                            />
                        </View>
                    </View>
                </View>

                {/* STAFF & OTHERS */}
                <View style={styles.card}>
                    {renderSectionHeader('Staff & Details', 'people-outline')}
                    <AppMultiSelect 
                        label="Trainers"
                        placeholder="Select trainers"
                        value={formData.trainers}
                        onSelect={v => updateField('trainers', v)}
                        fetchOptions={fetchUserOptions}
                    />
                    <AppMultiSelect 
                        label="Academic Counselors"
                        placeholder="Select counselors"
                        value={formData.academic_counselors}
                        onSelect={v => updateField('academic_counselors', v)}
                        fetchOptions={fetchUserOptions}
                    />
                    <AppInput 
                        label="Min. Attendance Duration (mins)"
                        value={formData.minimum_attendance_duration}
                        onChangeText={v => updateField('minimum_attendance_duration', v)}
                        keyboardType="numeric"
                    />
                    <AppInput 
                        label="Description"
                        value={formData.description}
                        onChangeText={v => updateField('description', v)}
                        multiline
                        numberOfLines={3}
                    />
                    <AppInput 
                        label="Notes"
                        value={formData.notes}
                        onChangeText={v => updateField('notes', v)}
                        multiline
                        numberOfLines={2}
                    />

                    <View style={styles.switchRow}>
                        <AppText style={styles.switchLabel}>Certificate Enabled</AppText>
                        <Switch 
                            value={formData.certificate_enabled}
                            onValueChange={v => updateField('certificate_enabled', v)}
                            trackColor={{ false: colors.border, true: colors.primaryLight }}
                            thumbColor={formData.certificate_enabled ? colors.primary : '#f4f3f4'}
                        />
                    </View>

                    <View style={styles.switchRow}>
                        <AppText style={styles.switchLabel}>Active</AppText>
                        <Switch 
                            value={formData.is_active}
                            onValueChange={v => updateField('is_active', v)}
                            trackColor={{ false: colors.border, true: colors.success + '80' }}
                            thumbColor={formData.is_active ? colors.success : '#f4f3f4'}
                        />
                    </View>
                </View>

                {/* ACTION */}
                <AppButton 
                    title="Update Batch"
                    onPress={handleSubmit}
                    loading={updateBatchMutation.isPending}
                    style={styles.submitBtn}
                />
            </ScrollView>

            {/* PICKERS */}
            {showStartDate && (
                <DateTimePicker 
                    value={formData.start_date ? new Date(formData.start_date) : new Date()}
                    mode="date"
                    onChange={(_, date) => {
                        setShowStartDate(false);
                        if (date) updateField('start_date', date.toISOString().split('T')[0]);
                    }}
                />
            )}
            {showEndDate && (
                <DateTimePicker 
                    value={formData.end_date ? new Date(formData.end_date) : new Date()}
                    mode="date"
                    onChange={(_, date) => {
                        setShowEndDate(false);
                        if (date) updateField('end_date', date.toISOString().split('T')[0]);
                    }}
                />
            )}
            {showTime && (
                <DateTimePicker 
                    value={new Date()} 
                    mode="time"
                    is24Hour={true}
                    onChange={(_, date) => {
                        setShowTime(false);
                        if (date) {
                            const hours = date.getHours().toString().padStart(2, '0');
                            const mins = date.getMinutes().toString().padStart(2, '0');
                            updateField('time', `${hours}:${mins}`);
                        }
                    }}
                />
            )}
        </KeyboardAvoidingView>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scroll: {
        padding: spacing.lg,
    },
    card: {
        backgroundColor: 'white',
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
        letterSpacing: 0.3,
    },
    row: {
        flexDirection: 'row',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.divider,
    },
    switchLabel: {
        fontWeight: '600',
        color: colors.textPrimary,
    },
    submitBtn: {
        marginTop: spacing.sm,
        height: 56,
        borderRadius: 16,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
});
