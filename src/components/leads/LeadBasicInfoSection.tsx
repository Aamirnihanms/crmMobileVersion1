import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { spacing, colors } from '../../theme';
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
      <AppText variant="subtitle">Basic Info</AppText>

      <TextInput
        placeholder="Full Name"
        value={form.name}
        onChangeText={(v) =>
          setForm({ ...form, name: v })
        }
        style={styles.input}
      />

      <TextInput
        placeholder="Phone Number"
        keyboardType="phone-pad"
        value={form.phone_number}
        onChangeText={(v) =>
          setForm({ ...form, phone_number: v })
        }
        style={styles.input}
      />

      <TextInput
        placeholder="WhatsApp Number"
        keyboardType="phone-pad"
        value={form.whatsapp_number}
        onChangeText={(v) =>
          setForm({ ...form, whatsapp_number: v })
        }
        style={styles.input}
      />

      <TextInput
        placeholder="Email"
        keyboardType="email-address"
        value={form.email}
        onChangeText={(v) =>
          setForm({ ...form, email: v })
        }
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
  },
});
