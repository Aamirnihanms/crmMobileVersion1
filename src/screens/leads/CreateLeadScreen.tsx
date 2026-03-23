import {
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { LeadsStackParamList } from '@/src/navigation/LeadsStack';
import { buildLeadPayload } from '@/src/utils/buildLeadPayload';

import LeadAdditionalSection from '@/src/components/leads/LeadAdditionalSection';
import LeadBasicInfoSection from '@/src/components/leads/LeadBasicInfoSection';
import LeadContactSection from '@/src/components/leads/LeadContactSection';
import LeadCourseSection from '@/src/components/leads/LeadCourseSection';

import AppLoader from '@/src/components/common/AppLoader';
import AppText from '@/src/components/common/AppText';

import { validateLead } from '@/src/utils/leadValidation';

import { useLeadDetails } from '@/src/queries/leadDetails.query';
import {
  useCreateLead,
  useUpdateLead,
} from '@/src/queries/leads.query';

import { useCounselors } from '@/src/queries/masters/counselors.query';
import { useCourses } from '@/src/queries/masters/courses.query';
import { useLeadSources } from '@/src/queries/masters/leadSources.query';
import { useLeadStatuses } from '@/src/queries/masters/leadStatuses.query';
import { useQualifications } from '@/src/queries/masters/qualifications.query';

import { colors, spacing } from '@/src/theme';

type Nav = NativeStackNavigationProp<
  LeadsStackParamList,
  'CreateLead'
>;

type CreateLeadRoute = RouteProp<
  LeadsStackParamList,
  'CreateLead'
>;

const initialFormState = {
  name: '',
  phone_number: '',
  whatsapp_number: '',
  email: '',
  address: '',
  city: '',
  parent_phone_number: '',
  parent_name: '',
  notes: '',
  counselor: null,
  course: null,
  course_mode: null,
  preferred_location: null,
  education_level: null,
  pass_out_year: null,
  lead_source: null,
  lead_status: null,
  reminder_date: '',
};

export default function CreateLeadScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<CreateLeadRoute>();
  const editLeadId = params?.id;
  const isEditMode = !!editLeadId;

  const scrollRef = useRef<ScrollView>(null);
  const hydratedRef = useRef(false);

  const [form, setForm] = useState<any>(initialFormState);

  const {
    data: editLead,
    isLoading: isEditLeadLoading,
    isError: isEditLeadError,
  } = useLeadDetails(editLeadId, isEditMode);

  const { data: courses = [], isLoading: coursesLoading } = useCourses();
  const { data: counselors = [], isLoading: counselorsLoading } =
    useCounselors();
  const { data: sources = [], isLoading: sourcesLoading } =
    useLeadSources();
  const { data: statuses = [], isLoading: statusesLoading } =
    useLeadStatuses();
  const { data: qualifications = [], isLoading: qualificationsLoading } =
    useQualifications();

  const mastersLoading =
    coursesLoading ||
    counselorsLoading ||
    sourcesLoading ||
    statusesLoading ||
    qualificationsLoading;

  const createLeadMutation = useCreateLead();
  const updateLeadMutation = useUpdateLead();

  const selectedCourse = useMemo(() => {
    return courses.find((c: any) => c.id === form.course);
  }, [form.course, courses]);

  useEffect(() => {
    hydratedRef.current = false;
    if (!isEditMode) {
      setForm(initialFormState);
    }
  }, [editLeadId, isEditMode]);

  useEffect(() => {
    if (!isEditMode || !editLead || hydratedRef.current) return;

    const lead: any = editLead;

    setForm({
      name: lead.name ?? '',
      phone_number: lead.phone_number ?? '',
      whatsapp_number: lead.whatsapp_number ?? '',
      email: lead.email ?? '',
      address: lead.address ?? '',
      city: lead.city ?? '',
      parent_phone_number: lead.parent_phone_number ?? '',
      parent_name: lead.parent_name ?? '',
      notes: lead.notes ?? '',
      counselor:
        lead.counselor ?? lead.counselor_details?.id ?? null,
      course: lead.course ?? lead.course_details?.id ?? null,
      course_mode:
        lead.course_mode ??
        lead.course_mode_details?.id ??
        null,
      preferred_location:
        lead.preferred_location ??
        lead.preferred_location_details?.id ??
        null,
      education_level:
        lead.education_level ??
        lead.education_level_details?.id ??
        null,
      pass_out_year: lead.pass_out_year ?? null,
      lead_source:
        lead.lead_source ?? lead.lead_source_details?.id ?? null,
      lead_status:
        lead.lead_status ?? lead.lead_status_details?.id ?? null,
      reminder_date: lead.reminder_date
        ? String(lead.reminder_date).split('T')[0]
        : '',
    });

    hydratedRef.current = true;
  }, [isEditMode, editLead]);

  const handleSubmit = () => {
    const mutationPending =
      createLeadMutation.isPending || updateLeadMutation.isPending;

    if (mutationPending) return;

    const error = validateLead(form);

    if (error) {
      Alert.alert('Validation Error', error);

      scrollRef.current?.scrollTo({
        y: 0,
        animated: true,
      });

      return;
    }

    const payload = buildLeadPayload(form);

    const onSuccess = (data: any) => {
      const leadId = data?.lead?.id || data?.id || editLeadId;

      if (!leadId) {
        Alert.alert(
          'Incomplete Operation',
          isEditMode
            ? 'Lead updated, but id missing in response'
            : 'Lead created, but id missing in response'
        );
        return;
      }

      if (isEditMode) {
        if (navigation.canGoBack()) {
          navigation.goBack();
          return;
        }
      }

      navigation.replace('LeadDetails', {
        id: leadId,
      });
    };

    const onError = (err: any) => {
      const action = isEditMode ? 'Update' : 'Create';
      console.log(`❌ ${action} Lead Error:`, err?.response?.data);
      Alert.alert('Error', `Failed to ${action.toLowerCase()} lead. Please try again.`);
    };

    if (isEditMode && editLeadId) {
      updateLeadMutation.mutate(
        {
          id: editLeadId,
          payload,
        },
        {
          onSuccess,
          onError,
        }
      );
      return;
    }

    createLeadMutation.mutate(payload, {
      onSuccess,
      onError,
    });
  };

  if (isEditMode && isEditLeadLoading) {
    return <AppLoader />;
  }

  if (isEditMode && (isEditLeadError || !editLead)) {
    return (
      <View style={styles.errorContainer}>
        <AppText>Unable to load lead for edit</AppText>
      </View>
    );
  }

  const mutationPending =
    createLeadMutation.isPending || updateLeadMutation.isPending;

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
          <LeadBasicInfoSection
            form={form}
            setForm={setForm}
          />

          <LeadContactSection
            form={form}
            setForm={setForm}
          />

          <LeadCourseSection
            form={form}
            setForm={setForm}
            courses={courses}
            selectedCourse={selectedCourse}
            qualifications={qualifications}
          />

          <LeadAdditionalSection
            form={form}
            setForm={setForm}
            counselors={counselors}
            sources={sources}
            statuses={statuses}
            qualifications={qualifications}
            passOutYears={[]}
          />
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleSubmit}
          disabled={mutationPending || mastersLoading}
          style={{ width: '100%' }}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            style={[styles.saveBtn, (mutationPending || mastersLoading) && { opacity: 0.7 }]}
          >
            <AppText style={styles.saveBtnText}>
              {mutationPending
                ? isEditMode
                  ? 'Updating...'
                  : 'Creating...'
                : mastersLoading
                  ? 'Loading...'
                  : isEditMode
                    ? 'Update Lead'
                    : 'Create Lead'
              }
            </AppText>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  container: {
    padding: spacing.lg,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
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
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FE',
  },
});
