// screens/CreateLeadScreen.tsx

import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  useNavigation,
  useRoute,
  RouteProp,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { buildLeadPayload } from '@/src/utils/buildLeadPayload';

import { LeadsStackParamList } from '@/src/navigation/LeadsStack';

import LeadBasicInfoSection from '@/src/components/leads/LeadBasicInfoSection';
import LeadContactSection from '@/src/components/leads/LeadContactSection';
import LeadCourseSection from '@/src/components/leads/LeadCourseSection';
import LeadAdditionalSection from '@/src/components/leads/LeadAdditionalSection';

import AppButton from '@/src/components/common/AppButton';
import AppLoader from '@/src/components/common/AppLoader';
import AppText from '@/src/components/common/AppText';

import { validateLead } from '@/src/utils/leadValidation';

import {
  useCreateLead,
  useUpdateLead,
} from '@/src/queries/leads.query';
import { useLeadDetails } from '@/src/queries/leadDetails.query';

import { useCourses } from '@/src/queries/masters/courses.query';
import { useCounselors } from '@/src/queries/masters/counselors.query';
import { useLeadSources } from '@/src/queries/masters/leadSources.query';
import { useLeadStatuses } from '@/src/queries/masters/leadStatuses.query';
import { useQualifications } from '@/src/queries/masters/qualifications.query';

import { spacing, colors } from '@/src/theme';

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

  /* -------------------- FORM STATE -------------------- */

  const [form, setForm] = useState<any>(initialFormState);

  const {
    data: editLead,
    isLoading: isEditLeadLoading,
    isError: isEditLeadError,
  } = useLeadDetails(editLeadId, isEditMode);

  /* -------------------- MASTER DATA -------------------- */

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

  /* -------------------- CREATE MUTATION -------------------- */

  const createLeadMutation = useCreateLead();
  const updateLeadMutation = useUpdateLead();

  /* -------------------- COURSE DEPENDENCY -------------------- */

  const selectedCourse = useMemo(() => {
    return courses.find((c: any) => c.id === form.course);
  }, [form.course, courses]);

  /* -------------------- EDIT PREFILL -------------------- */

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

  /* -------------------- CLEAN PAYLOAD -------------------- */



  /* -------------------- SUBMIT -------------------- */

  const handleSubmit = () => {
    const mutationPending =
      createLeadMutation.isPending || updateLeadMutation.isPending;

    if (mutationPending) return;

    const error = validateLead(form);

    if (error) {
      Alert.alert(error);

      scrollRef.current?.scrollTo({
        y: 0,
        animated: true,
      });

      return;
    }

    const payload = buildLeadPayload(form); 

    console.log('🚀 Final Payload:', payload);

    const onSuccess = (data: any) => {
      const leadId = data?.lead?.id || data?.id || editLeadId;

      if (!leadId) {
        Alert.alert(
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
      Alert.alert(`Failed to ${action.toLowerCase()} lead`);
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

  /* -------------------- RENDER -------------------- */

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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.root}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
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
        </ScrollView>

        {/* -------- ENTERPRISE STICKY FOOTER -------- */}

        <View style={styles.footer}>
          <AppButton
            title={
              mutationPending
                ? isEditMode
                  ? 'Updating Lead...'
                  : 'Creating Lead...'
                : mastersLoading
                ? 'Loading Masters...'
                : isEditMode
                ? 'Update Lead'
                : 'Create Lead'
            }
            onPress={handleSubmit}
            disabled={
              mutationPending || mastersLoading
            }
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/* -------------------- STYLES -------------------- */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    padding: spacing.lg,
    paddingBottom: 120,
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
