import { View, StyleSheet, Pressable } from 'react-native';
import AppCard from '../common/AppCard';
import AppText from '../common/AppText';
import { spacing } from '../../theme';

export type Lead = {
  id: string;
  name: string | null;
  phone_number: string;
  lead_status_details: {
    name: string;
    color: string;
  };
  lead_source_details?: {
    label: string;
  } | null;
};

type LeadCardProps = {
  lead: Lead;
  onPress?: () => void;
};

export default function LeadCard({ lead, onPress }: LeadCardProps) {
  return (
    <Pressable onPress={onPress}>
      <AppCard style={styles.card}>
        <View style={styles.row}>
          <AppText variant="subtitle">
            {lead.name ?? 'Unknown'}
          </AppText>

          <AppText
            variant="caption"
            style={{ color: lead.lead_status_details.color }}
          >
            {lead.lead_status_details.name}
          </AppText>
        </View>

        {lead.lead_source_details?.label ? (
          <AppText variant="caption">
            Source: {lead.lead_source_details.label}
          </AppText>
        ) : null}
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
});
