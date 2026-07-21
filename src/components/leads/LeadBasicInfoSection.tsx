import { useAppTheme, spacing } from '@/src/theme';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import AppCard from './../common/AppCard';
import AppInput from './../common/AppInput';
import AppText from './../common/AppText';
import PhoneInputWithCode, { CountryCode } from './../common/PhoneInputWithCode';
import { checkPhoneExists, checkEmailExists } from '@/src/api/leads.api';

type Props = {
  form: any;
  setForm: (data: any) => void;
  onPhoneStatusChange?: (isChecking: boolean, hasError: boolean) => void;
  onEmailStatusChange?: (isChecking: boolean, hasError: boolean) => void;
  originalPhone?: string;
  originalEmail?: string;
};

export default function LeadBasicInfoSection({
  form,
  setForm,
  onPhoneStatusChange,
  onEmailStatusChange,
  originalPhone,
  originalEmail,
}: Props) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  useEffect(() => {
    const checkPhone = async () => {
      if (!form.phone_number || form.phone_number.length < 10) {
        setPhoneError(null);
        return;
      }

      const countryCode = (form.phone_country_code?.code || '+91').replace('+', '');
      const fullNumber = `${countryCode}${form.phone_number}`;

      if (originalPhone && fullNumber === originalPhone) {
        setPhoneError(null);
        return;
      }

      setIsCheckingPhone(true);
      try {
        const res = await checkPhoneExists(fullNumber);
        if (res?.exists) {
          setPhoneError(`This number already exists in ${res.found_in.join(', ')}. Please use a different number.`);
        } else {
          setPhoneError(null);
        }
      } catch (error) {
        console.log('Phone check error:', error);
        setPhoneError(null);
      } finally {
        setIsCheckingPhone(false);
      }
    };

    const timeout = setTimeout(checkPhone, 800);
    return () => clearTimeout(timeout);
  }, [form.phone_number, form.phone_country_code]);

  useEffect(() => {
    if (onPhoneStatusChange) {
      onPhoneStatusChange(isCheckingPhone, phoneError !== null);
    }
  }, [isCheckingPhone, phoneError, onPhoneStatusChange]);

  useEffect(() => {
    const checkEmail = async () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!form.email || !emailRegex.test(form.email)) {
        setEmailError(null);
        return;
      }

      if (originalEmail && form.email === originalEmail) {
        setEmailError(null);
        return;
      }

      setIsCheckingEmail(true);
      try {
        const res = await checkEmailExists(form.email);
        if (res?.exists) {
          setEmailError(`This email already exists in ${res.found_in.join(', ')}. Please use a different email.`);
        } else {
          setEmailError(null);
        }
      } catch (error) {
        console.log('Email check error:', error);
        setEmailError(null);
      } finally {
        setIsCheckingEmail(false);
      }
    };

    const timeout = setTimeout(checkEmail, 800);
    return () => clearTimeout(timeout);
  }, [form.email]);

  useEffect(() => {
    if (onEmailStatusChange) {
      onEmailStatusChange(isCheckingEmail, emailError !== null);
    }
  }, [isCheckingEmail, emailError, onEmailStatusChange]);

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

        <PhoneInputWithCode
          label="Phone Number"
          placeholder="Primary contact number"
          value={form.phone_number}
          countryCode={form.phone_country_code}
          onChangeText={(v) => setForm({ ...form, phone_number: v })}
          onChangeCountryCode={(c: CountryCode) =>
            setForm({ ...form, phone_country_code: c })
          }
          containerStyle={phoneError || isCheckingPhone ? { marginBottom: spacing.xs } : styles.inputContainer}
        />
        {isCheckingPhone && (
          <AppText variant="caption" color={colors.textSecondary} style={{ marginBottom: spacing.lg, marginLeft: 4 }}>
            Checking number...
          </AppText>
        )}
        {phoneError && !isCheckingPhone && (
          <AppText variant="caption" color={colors.danger} style={{ marginBottom: spacing.lg, marginLeft: 4 }}>
            {phoneError}
          </AppText>
        )}

        <View style={styles.labelRow}>
          <AppText
            variant="caption"
            color={colors.textSecondary}
            style={[styles.label, { marginBottom: 0 }]}
          >
            WhatsApp Number
          </AppText>
          <Pressable
            onPress={() => {
              setForm({
                ...form,
                whatsapp_number: form.phone_number,
                whatsapp_country_code: form.phone_country_code,
              });
            }}
            hitSlop={8}
          >
            <AppText variant="caption" color={colors.primary} style={styles.sameAsText}>
              Same as Phone
            </AppText>
          </Pressable>
        </View>
        <PhoneInputWithCode
          placeholder="Same as phone or different"
          value={form.whatsapp_number}
          countryCode={form.whatsapp_country_code}
          onChangeText={(v) => setForm({ ...form, whatsapp_number: v })}
          onChangeCountryCode={(c: CountryCode) =>
            setForm({ ...form, whatsapp_country_code: c })
          }
          containerStyle={styles.inputContainer}
        />

        <AppInput
          label="Email Address"
          placeholder="example@domain.com"
          keyboardType="email-address"
          value={form.email}
          onChangeText={(v) => setForm({ ...form, email: v })}
          containerStyle={emailError || isCheckingEmail ? { marginBottom: spacing.xs } : { marginBottom: 0 }}
        />
        {isCheckingEmail && (
          <AppText variant="caption" color={colors.textSecondary} style={{ marginBottom: spacing.lg, marginLeft: 4 }}>
            Checking email...
          </AppText>
        )}
        {emailError && !isCheckingEmail && (
          <AppText variant="caption" color={colors.danger} style={{ marginBottom: spacing.lg, marginLeft: 4 }}>
            {emailError}
          </AppText>
        )}
      </AppCard>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    paddingRight: 4,
  },
  label: {
    fontWeight: '600',
    marginLeft: 4,
  },
  sameAsText: {
    fontWeight: '700',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
