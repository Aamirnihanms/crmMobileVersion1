import { colors, spacing } from '@/src/theme';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppCard from './../common/AppCard';
import AppInput from './../common/AppInput';
import AppText from './../common/AppText';
import PhoneInputWithCode, { CountryCode } from './../common/PhoneInputWithCode';

type Props = {
  form: any;
  setForm: (data: any) => void;
};

export default function LeadContactSection({
  form,
  setForm,
}: Props) {
  return (
    <View style={styles.container}>
      <AppText variant="h3" style={styles.title}>Contact Details</AppText>

      <AppCard style={styles.card}>
        <AppInput
          label="Parent/Guardian Name"
          placeholder="Enter parent's name"
          value={form.parent_name}
          onChangeText={(v) => setForm({ ...form, parent_name: v })}
          containerStyle={styles.inputContainer}
        />

        <PhoneInputWithCode
          label="Parent Phone"
          placeholder="Emergency contact number"
          value={form.parent_phone_number}
          countryCode={form.parent_phone_country_code}
          onChangeText={(v) => setForm({ ...form, parent_phone_number: v })}
          onChangeCountryCode={(c: CountryCode) =>
            setForm({ ...form, parent_phone_country_code: c })
          }
          containerStyle={
            form.parent_phone_number &&
            `${form.phone_country_code?.code || ''}${form.phone_number}` ===
              `${form.parent_phone_country_code?.code || ''}${form.parent_phone_number}`
              ? { marginBottom: spacing.xs }
              : styles.inputContainer
          }
        />
        {form.parent_phone_number &&
          `${form.phone_country_code?.code || ''}${form.phone_number}` ===
            `${form.parent_phone_country_code?.code || ''}${form.parent_phone_number}` && (
            <AppText variant="caption" color={colors.danger} style={{ marginBottom: spacing.lg, marginLeft: 4 }}>
              Lead phone and parent phone must be different
            </AppText>
          )}

        <AppInput
          label="City"
          placeholder="Lead's current city"
          value={form.city}
          onChangeText={(v) => setForm({ ...form, city: v })}
          containerStyle={styles.inputContainer}
        />

        <AppInput
          label="Detailed Address"
          placeholder="Street, area, building details"
          multiline
          value={form.address}
          onChangeText={(v) => setForm({ ...form, address: v })}
          style={{ height: 100, textAlignVertical: 'top' }}
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
