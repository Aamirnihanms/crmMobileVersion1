import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { spacing, colors } from '../../theme';
import AppText from './../common/AppText';

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
      <AppText variant="subtitle">Contact Details</AppText>

      <TextInput
        placeholder="Parent Name"
        value={form.parent_name}
        onChangeText={(v) =>
          setForm({ ...form, parent_name: v })
        }
        style={styles.input}
      />

      <TextInput
        placeholder="Parent Phone"
        keyboardType="phone-pad"
        value={form.parent_phone_number}
        onChangeText={(v) =>
          setForm({
            ...form,
            parent_phone_number: v,
          })
        }
        style={styles.input}
      />

      <TextInput
        placeholder="City"
        value={form.city}
        onChangeText={(v) =>
          setForm({ ...form, city: v })
        }
        style={styles.input}
      />

      <TextInput
        placeholder="Address"
        multiline
        value={form.address}
        onChangeText={(v) =>
          setForm({ ...form, address: v })
        }
        style={[styles.input, { height: 80 }]}
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
