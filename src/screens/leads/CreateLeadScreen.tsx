import {
  RouteProp,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import {
  COUNTRY_CODES,
  CountryCode,
  DEFAULT_COUNTRY,
} from '@/src/components/common/PhoneInputWithCode';
import { LeadsStackParamList } from '@/src/navigation/LeadsStack';
import { buildLeadPayload } from '@/src/utils/buildLeadPayload';

import LeadAdditionalSection from '@/src/components/leads/LeadAdditionalSection';
import LeadBasicInfoSection from '@/src/components/leads/LeadBasicInfoSection';
import LeadContactSection from '@/src/components/leads/LeadContactSection';
import LeadCourseSection from '@/src/components/leads/LeadCourseSection';

import AppLoader from '@/src/components/common/AppLoader';
import AppText from '@/src/components/common/AppText';

import { validateLead } from '@/src/utils/leadValidation';

import { useAddFollowUp } from '@/src/queries/followups.query';
import { useLeadDetails } from '@/src/queries/leadDetails.query';
import {
  useCreateLead,
  useUpdateLead,
} from '@/src/queries/leads.query';
import { useLeadStatuses } from '@/src/queries/masters/leadStatuses.query';
import { useCreateNote } from '@/src/queries/notes.query';

import AddFollowUpModal from '@/src/components/followups/AddFollowUpModal';
import AddEditNoteModal from '@/src/components/notes/AddEditNoteModal';

import { useAppTheme, spacing } from '@/src/theme';

type Nav = NativeStackNavigationProp<
  LeadsStackParamList,
  'CreateLead'
>;

type CreateLeadRoute = RouteProp<
  LeadsStackParamList,
  'CreateLead'
>;

// Helper: strip a known country code prefix from a stored number
function extractCodeAndNumber(
  fullNumber: string | null | undefined
): { country: CountryCode; number: string } {
  if (!fullNumber) return { country: DEFAULT_COUNTRY, number: '' };
  const match = COUNTRY_CODES.find(
    (c) => fullNumber.startsWith(c.code) && c.name !== 'Canada' // avoid +1 ambiguity
  );
  if (match) {
    return {
      country: match,
      number: fullNumber.slice(match.code.length),
    };
  }
  return { country: DEFAULT_COUNTRY, number: fullNumber };
}

const initialFormState = {
  name: '',
  phone_number: '',
  phone_country_code: DEFAULT_COUNTRY,
  whatsapp_number: '',
  whatsapp_country_code: DEFAULT_COUNTRY,
  email: '',
  address: '',
  city: '',
  parent_phone_number: '',
  parent_phone_country_code: DEFAULT_COUNTRY,
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
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<CreateLeadRoute>();
  const editLeadId = params?.id;
  const isEditMode = !!editLeadId;

  const scrollRef = useRef<ScrollView>(null);
  const hydratedRef = useRef(false);
  const initialStatusIdRef = useRef<number | null>(null);

  const [form, setForm] = useState<any>(initialFormState);

  const {
    data: editLead,
    isLoading: isEditLeadLoading,
    isError: isEditLeadError,
  } = useLeadDetails(editLeadId, isEditMode);

  const createLeadMutation = useCreateLead();
  const updateLeadMutation = useUpdateLead();
  const createNoteMutation = useCreateNote(editLeadId || '');
  const addFollowUpMutation = useAddFollowUp(editLeadId || '');

  const { data: statuses } = useLeadStatuses();

  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [isFollowUpModalVisible, setIsFollowUpModalVisible] = useState(false);
  const [tempFollowUpData, setTempFollowUpData] = useState<any>(null);

  const [isPhoneInvalid, setIsPhoneInvalid] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);

  const [isEmailInvalid, setIsEmailInvalid] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  useEffect(() => {
    hydratedRef.current = false;
    initialStatusIdRef.current = null;
    if (!isEditMode) {
      setForm(initialFormState);
    }
  }, [editLeadId, isEditMode]);

  useEffect(() => {
    if (!isEditMode || !editLead || hydratedRef.current) return;

    const lead: any = editLead;

    const phoneParsed = extractCodeAndNumber(lead.phone_number);
    const whatsappParsed = extractCodeAndNumber(lead.whatsapp_number);
    const parentPhoneParsed = extractCodeAndNumber(lead.parent_phone_number);

    const statusId = lead.lead_status ?? lead.lead_status_details?.id ?? null;
    initialStatusIdRef.current = statusId;

    setForm({
      name: lead.name ?? '',
      phone_number: phoneParsed.number,
      phone_country_code: phoneParsed.country,
      whatsapp_number: whatsappParsed.number,
      whatsapp_country_code: whatsappParsed.country,
      email: lead.email ?? '',
      address: lead.address ?? '',
      city: lead.city ?? '',
      parent_phone_number: parentPhoneParsed.number,
      parent_phone_country_code: parentPhoneParsed.country,
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
      lead_status: statusId,
      reminder_date: lead.reminder_date
        ? String(lead.reminder_date).split('T')[0]
        : '',
    });

    hydratedRef.current = true;
  }, [isEditMode, editLead]);

  const handleSubmit = () => {
    if (isPhoneInvalid) {
      Alert.alert('Validation Error', 'Phone number already exists. Please use a different number.');
      return;
    }
    if (isEmailInvalid) {
      Alert.alert('Validation Error', 'Email already exists. Please use a different email.');
      return;
    }
    if (isCheckingPhone || isCheckingEmail) return;

    const mutationPending =
      createLeadMutation.isPending ||
      updateLeadMutation.isPending ||
      createNoteMutation.isPending ||
      addFollowUpMutation.isPending;

    if (mutationPending) return;

    const error = validateLead(form, isEditMode);

    if (error) {
      Alert.alert('Validation Error', error);

      scrollRef.current?.scrollTo({
        y: 0,
        animated: true,
      });

      return;
    }

    if (isEditMode && editLeadId) {
      const followUpStatus = statuses?.find(s => s.value === 'follow_up');
      const isNowFollowUp = followUpStatus && Number(form.lead_status) === Number(followUpStatus.id);
      const wasFollowUp = followUpStatus && Number(initialStatusIdRef.current) === Number(followUpStatus.id);

      if (isNowFollowUp && !wasFollowUp) {
        setIsFollowUpModalVisible(true);
      } else {
        setIsNoteModalVisible(true);
      }
      return;
    }

    const payload = buildLeadPayload(form);

    const onSuccess = (data: any) => {
      const leadId = data?.lead?.id || data?.id || editLeadId;

      if (!leadId) {
        Alert.alert(
          'Incomplete Operation',
          'Lead created, but id missing in response'
        );
        return;
      }

      navigation.replace('LeadDetails', {
        id: leadId,
      });
    };

    const onError = (err: any) => {
      const action = 'Create';

      const errorData = err?.response?.data;
      console.log(`❌ ${action} Lead Error:`, errorData);

      const errorDetail = errorData?.detail;
      const errorMessage = errorData?.error;
      const fallbackMessage = `Failed to ${action.toLowerCase()} lead. Please try again.`;

      const displayMessage = errorDetail || errorMessage || fallbackMessage;

      Alert.alert('Error', displayMessage);
    };

    createLeadMutation.mutate(payload, {
      onSuccess,
      onError,
    });
  };

  const handleFollowUpSubmit = (data: any) => {
    setTempFollowUpData(data);
    setIsFollowUpModalVisible(false);
    // Proceed directly to update without asking for notes
    performUpdateSequence(null, data);
  };

  const performUpdateSequence = (
    notePayload: { content: string; importance: any } | null,
    followUpData: any | null
  ) => {
    const payload = buildLeadPayload(form);

    const onFinish = (data: any) => {
      const leadId = data?.lead?.id || data?.id || editLeadId;

      if (!leadId) {
        Alert.alert(
          'Incomplete Operation',
          'Lead updated, but id missing in response'
        );
        return;
      }

      if (navigation.canGoBack()) {
        navigation.goBack();
        return;
      }

      navigation.replace('LeadDetails', {
        id: leadId,
      });
    };

    const onError = (err: any) => {
      const errorData = err?.response?.data;
      console.log(`❌ Update Process Error:`, errorData);

      const errorDetail = errorData?.detail;
      const errorMessage = errorData?.error;
      const fallbackMessage = `Failed to complete update. Please try again.`;

      const displayMessage = errorDetail || errorMessage || fallbackMessage;

      Alert.alert('Error', displayMessage);
    };

    const updateLead = () => {
      updateLeadMutation.mutate(
        { id: editLeadId!, payload },
        { onSuccess: onFinish, onError }
      );
    };

    const addFollowUp = () => {
      if (followUpData) {
        addFollowUpMutation.mutate(followUpData, {
          onSuccess: updateLead,
          onError: (err: any) => {
            console.log('❌ Follow-up creation failed:', err?.response?.data);
            Alert.alert('Partial Success', 'Follow-up failed. Updating lead anyway...');
            updateLead();
          }
        });
      } else {
        updateLead();
      }
    };

    if (notePayload) {
      // Note -> FollowUp -> Lead Update
      createNoteMutation.mutate(notePayload, {
        onSuccess: addFollowUp,
        onError: (err: any) => {
          const errorData = err?.response?.data;
          console.log(`❌ Create Note Error:`, errorData);
          Alert.alert('Error', 'Failed to save note. Edit cancelled.');
        }
      });
    } else {
      // FollowUp -> Lead Update
      addFollowUp();
    }
  };

  const handleUpdateLeadWithNote = (notePayload: { content: string; importance: any }) => {
    setIsNoteModalVisible(false);
    performUpdateSequence(notePayload, tempFollowUpData);
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

  const isMutating =
    createLeadMutation.isPending ||
    updateLeadMutation.isPending ||
    createNoteMutation.isPending ||
    addFollowUpMutation.isPending;

  const isFormDisabled =
    isMutating ||
    isCheckingPhone ||
    isPhoneInvalid ||
    isCheckingEmail ||
    isEmailInvalid;

  const editLeadAny = editLead as any;
  const originalPhone = isEditMode && editLeadAny?.phone_number ? editLeadAny.phone_number.replace('+', '') : undefined;
  const originalEmail = isEditMode && editLeadAny?.email ? editLeadAny.email : undefined;

  const initialCourseDetails = editLeadAny?.course_details ?? null;
  const initialEducationOption =
    editLeadAny?.education_level_details?.id
      ? {
        label: editLeadAny.education_level_details.name,
        value: editLeadAny.education_level_details.id,
      }
      : null;

  const initialCounselorOption =
    editLeadAny?.counselor_details?.id
      ? {
        label: editLeadAny.counselor_details.full_name,
        value: editLeadAny.counselor_details.id,
      }
      : null;

  const initialSourceOption =
    editLeadAny?.lead_source_details?.id
      ? {
        label: editLeadAny.lead_source_details.label,
        value: editLeadAny.lead_source_details.id,
      }
      : null;

  const initialStatusOption =
    editLeadAny?.lead_status_details?.id
      ? {
        label: editLeadAny.lead_status_details.name,
        value: editLeadAny.lead_status_details.id,
      }
      : null;

  return (
    <View style={styles.root}>
      {isNoteModalVisible && (
        <AddEditNoteModal
          visible={isNoteModalVisible}
          onClose={() => setIsNoteModalVisible(false)}
          onSubmit={handleUpdateLeadWithNote}
        />
      )}
      {isFollowUpModalVisible && (
        <AddFollowUpModal
          visible={isFollowUpModalVisible}
          onClose={() => setIsFollowUpModalVisible(false)}
          onSubmit={handleFollowUpSubmit}
        />
      )}
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
            onPhoneStatusChange={(isChecking, hasError) => {
              setIsCheckingPhone(isChecking);
              setIsPhoneInvalid(hasError);
            }}
            onEmailStatusChange={(isChecking, hasError) => {
              setIsCheckingEmail(isChecking);
              setIsEmailInvalid(hasError);
            }}
            originalPhone={originalPhone}
            originalEmail={originalEmail}
          />

          <LeadContactSection
            form={form}
            setForm={setForm}
          />

          <LeadCourseSection
            form={form}
            setForm={setForm}
            initialCourseDetails={initialCourseDetails}
            initialEducationOption={initialEducationOption}
          />

          <LeadAdditionalSection
            form={form}
            setForm={setForm}
            initialCounselorOption={initialCounselorOption}
            initialSourceOption={initialSourceOption}
            initialStatusOption={initialStatusOption}
          />
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleSubmit}
          disabled={isFormDisabled}
          style={{ width: '100%' }}
        >
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            style={[styles.saveBtn, isFormDisabled && { opacity: 0.7 }]}
          >
            <AppText style={styles.saveBtnText}>
              {isMutating
                ? isEditMode
                  ? 'Updating...'
                  : 'Creating...'
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

const getStyles = (colors: any) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
