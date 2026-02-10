import { View, StyleSheet, ScrollView } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';

import AppText from '../../components/common/AppText';
import AppLoader from '../../components/common/AppLoader';
import { spacing } from '../../theme';
import { useLeadDetails } from '../../queries/leadDetails.query';
import type { LeadsStackParamList } from '../../navigation/LeadsStack';

import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { callNumber, openWhatsApp } from '../../utils/contactActions';
import { colors } from '../../theme';


type LeadDetailsRouteProp =
  RouteProp<LeadsStackParamList, 'LeadDetails'>;

export default function LeadDetailsScreen() {
  const route = useRoute<LeadDetailsRouteProp>();
  const { id } = route.params;

  const { data, isLoading, isError } = useLeadDetails(id);

  if (isLoading) {
    return <AppLoader />;
  }

  if (isError || !data) {
    return (
      <View style={styles.center}>
        <AppText color="red">Failed to load lead details</AppText>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* NAME */}
      <AppText variant="title">
        {data.name || 'Unnamed Lead'}
      </AppText>

      {/* STATUS */}
      <AppText
        variant="caption"
        style={{ color: data.lead_status_details.color }}
      >
        {data.lead_status_details.name}
      </AppText>

      {/* CONTACT */}
      <View style={styles.section}>
        <AppText variant="subtitle">Contact</AppText>
       <AppText>{data.phone_number || '—'}</AppText>
        <AppText>{data.whatsapp_number || '—'}</AppText>
        {data.email ? <AppText>{data.email}</AppText> : null}
      </View>

      {/* ACTION BUTTONS */}
<View style={styles.actionsRow}>
  {/* CALL */}
  <Pressable
    disabled={!data.phone_number}
    style={[
      styles.actionButton,
      styles.callButton,
      !data.phone_number && styles.disabledButton,
    ]}
    onPress={() => callNumber(data.phone_number)}
  >
    <Ionicons name="call-outline" size={20} color="white" />
    <AppText style={styles.actionText}>Call</AppText>
  </Pressable>

  {/* WHATSAPP */}
  <Pressable
    disabled={!data.whatsapp_number}
    style={[
      styles.actionButton,
      styles.whatsappButton,
      !data.whatsapp_number && styles.disabledButton,
    ]}
    onPress={() => openWhatsApp(data.whatsapp_number)}
  >
    <Ionicons name="logo-whatsapp" size={20} color="white" />
    <AppText style={styles.actionText}>WhatsApp</AppText>
  </Pressable>
</View>



      {/* SOURCE */}
      <View style={styles.section}>
        <AppText variant="subtitle">Source</AppText>
        <AppText>
          {data.lead_source_details?.label ?? '—'}
        </AppText>
      </View>

      {/* COUNSELOR */}
      <View style={styles.section}>
        <AppText variant="subtitle">Counselor</AppText>
        <AppText>
          {data.counselor_details?.full_name ?? '—'}
        </AppText>
      </View>

      {/* COURSE */}
      {data.course_details && (
        <View style={styles.section}>
          <AppText variant="subtitle">Course</AppText>
          <AppText>{data.course_details.course_name}</AppText>
          <AppText>
            Fee: ₹{data.course_details.course_fee}
          </AppText>
        </View>
      )}

      {/* FOLLOWUPS */}
      <View style={styles.section}>
        <AppText variant="subtitle">Follow-ups</AppText>
        <AppText>
          Pending: {data.pending_followups}
        </AppText>
        <AppText>
          Completed: {data.completed_followups}
        </AppText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  section: {
    marginTop: spacing.lg,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsRow: {
  flexDirection: 'row',
  gap: spacing.md,
  marginTop: spacing.lg,
},

actionButton: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: spacing.md,
  borderRadius: 8,
  gap: spacing.sm,
},

callButton: {
  backgroundColor: colors.primary,
},

whatsappButton: {
  backgroundColor: '#25D366',
},

actionText: {
  color: 'white',
},
disabledButton: {
  opacity: 0.4,
},


});
