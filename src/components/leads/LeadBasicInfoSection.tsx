import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../../theme';
import AppCard from './../common/AppCard';
import AppInput from './../common/AppInput';
import AppText from './../common/AppText';

type Props = {
  form: any;
  setForm: (data: any) => void;
};

export default function LeadBasicInfoSection({
  form,
  setForm,
}: Props) {
  return (
    <View style={styles.container}>
      <AppText variant="h3" style={styles.title}>Basic Information</AppText>

      <AppCard style={styles.card}>
        <AppInput
          label="Full Name"
          placeholder="Enter lead's full name"
          value={form.name}
          onChangeText={(v) => setForm({ ...form, name: v })}
          containerStyle={styles.inputContainer}
        />

        <AppInput
          label="Phone Number"
          placeholder="Primary contact number"
          keyboardType="phone-pad"
          value={form.phone_number}
          onChangeText={(v) => setForm({ ...form, phone_number: v })}
          containerStyle={styles.inputContainer}
        />

        <AppInput
          label="WhatsApp Number"
          placeholder="Same as phone or different"
          keyboardType="phone-pad"
          value={form.whatsapp_number}
          onChangeText={(v) => setForm({ ...form, whatsapp_number: v })}
          containerStyle={styles.inputContainer}
        />

        <AppInput
          label="Email Address"
          placeholder="example@domain.com"
          keyboardType="email-address"
          value={form.email}
          onChangeText={(v) => setForm({ ...form, email: v })}
          containerStyle={{ marginBottom: 0 }}
        />
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  title: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginLeft: 4,
  },
  card: {
    padding: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
});
