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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { buildLeadPayload } from '@/src/utils/buildLeadPayload';

import { LeadsStackParamList } from '@/src/navigation/LeadsStack';

import LeadBasicInfoSection from '@/src/components/leads/LeadBasicInfoSection';
import LeadContactSection from '@/src/components/leads/LeadContactSection';
import LeadCourseSection from '@/src/components/leads/LeadCourseSection';
import LeadAdditionalSection from '@/src/components/leads/LeadAdditionalSection';

import AppButton from '@/src/components/common/AppButton';

import { validateLead } from '@/src/utils/leadValidation';

import { useCreateLead } from '@/src/queries/leads.query';

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

export default function CreateLeadScreen() {
  const navigation = useNavigation<Nav>();

  const scrollRef = useRef<ScrollView>(null);

  /* -------------------- FORM STATE -------------------- */

  const [form, setForm] = useState<any>({
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
  });

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

  /* -------------------- COURSE DEPENDENCY -------------------- */

  const selectedCourse = useMemo(() => {
    return courses.find((c: any) => c.id === form.course);
  }, [form.course, courses]);

  // ENTERPRISE FIX: reset dependent fields when course changes
  useEffect(() => {
    setForm((prev: any) => ({
      ...prev,
      course_mode: null,
      preferred_location: null,
    }));
  }, [form.course]);

  /* -------------------- CLEAN PAYLOAD -------------------- */



  /* -------------------- SUBMIT -------------------- */

  const handleSubmit = () => {
    if (createLeadMutation.isPending) return;

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

    createLeadMutation.mutate(payload, {
      onSuccess: (data: any) => {
        const leadId = data?.lead?.id || data?.id;

        navigation.replace('LeadDetails', {
          id: leadId,
        });
      },

      onError: (err: any) => {
        console.log('❌ Create Lead Error:', err?.response?.data);
        Alert.alert('Failed to create lead');
      },
    });
  };

  /* -------------------- RENDER -------------------- */

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
              createLeadMutation.isPending
                ? 'Creating Lead...'
                : mastersLoading
                ? 'Loading Masters...'
                : 'Create Lead'
            }
            onPress={handleSubmit}
            disabled={
              createLeadMutation.isPending || mastersLoading
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
});
