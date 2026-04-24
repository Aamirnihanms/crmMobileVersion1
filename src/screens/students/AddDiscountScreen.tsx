import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import AppButton from '@/src/components/common/AppButton';
import AppCard from '@/src/components/common/AppCard';
import AppInput from '@/src/components/common/AppInput';
import AppLoader from '@/src/components/common/AppLoader';
import AppSelect from '@/src/components/common/AppSelect';
import AppText from '@/src/components/common/AppText';
import { useAddDiscount, useDeleteDiscount, useDiscountPolicies, useEnrollmentDiscounts } from '@/src/queries/discount.query';
import { colors, spacing } from '@/src/theme';
import type { StudentsStackParamList } from '../../navigation/StudentsStack';

export default function AddDiscountScreen() {
  const route = useRoute<RouteProp<StudentsStackParamList, 'AddDiscount'>>();
  const { enrollmentId, studentId } = route.params;
  const navigation = useNavigation();

  const { data: discountsData, isLoading: isDiscountsLoading } = useEnrollmentDiscounts(studentId, enrollmentId);
  const { data: policiesData, isLoading: isPoliciesLoading } = useDiscountPolicies();

  const addDiscountMutation = useAddDiscount();
  const deleteDiscountMutation = useDeleteDiscount();

  const [selectedPolicyId, setSelectedPolicyId] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [reason, setReason] = useState('');

  const isLoading = isDiscountsLoading || isPoliciesLoading;

  const handleDeleteDiscount = (uid: string) => {
    Alert.alert(
      'Delete Discount',
      'Are you sure you want to delete this applied discount?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteDiscountMutation.mutate(uid, {
              onSuccess: () => {
                Alert.alert('Success', 'Discount deleted successfully');
              },
              onError: (error: any) => {
                Alert.alert('Error', error?.response?.data?.message || 'Failed to delete discount');
              }
            });
          }
        }
      ]
    );
  };

  const handleAddDiscount = () => {
    if (!selectedPolicyId) {
      Alert.alert('Error', 'Please select a discount policy');
      return;
    }
    if (!reason) {
      Alert.alert('Error', 'Please enter a reason');
      return;
    }

    addDiscountMutation.mutate({
      enrollment_id: enrollmentId,
      discount_policy_id: selectedPolicyId,
      manual_discount_amount: Number(manualAmount) || 0,
      reason,
    }, {
      onSuccess: () => {
        Alert.alert('Success', 'Discount added successfully');
        navigation.goBack();
      },
      onError: (error: any) => {
        Alert.alert('Error', error?.response?.data?.message || 'Failed to add discount');
      }
    });
  };

  if (isLoading) return <AppLoader />;

  const policyOptions = policiesData?.discount_policies.map(p => ({
    label: `${p.name} (${p.discount_type_display})`,
    value: p.uid
  })) || [];

  return (
    <KeyboardAwareScrollView 
      style={styles.root} 
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      bottomOffset={50}
    >
      {/* Existing Discounts Section */}
      <View style={styles.sectionHeader}>
        <AppText variant="h3" style={styles.sectionTitle}>Applied Discounts</AppText>
      </View>

      {discountsData?.enrollment_discounts && discountsData.enrollment_discounts.length > 0 ? (
        <AppCard style={styles.listCard}>
          {discountsData.enrollment_discounts.map((discount, index) => (
            <View key={discount.uid} style={[styles.listItem, index === discountsData.enrollment_discounts.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.listItemIcon}>
                <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="body" style={{ fontWeight: '700' }}>{discount.discount_policy_name}</AppText>
                <AppText variant="caption" color={colors.textMuted}>{discount.reason}</AppText>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <AppText variant="subtitle" style={{ color: colors.successStrong, fontWeight: '800' }}>- ₹{discount.discount_amount}</AppText>
                <AppText variant="caption" style={{ fontSize: 9 }} color={colors.textMuted}>
                  {new Date(discount.applied_date).toLocaleDateString()}
                </AppText>
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteDiscount(discount.uid)}
              >
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.summaryRow}>
            <AppText variant="caption" style={{ fontWeight: '700' }}>Total Discount</AppText>
            <AppText variant="subtitle" style={{ color: colors.successStrong, fontWeight: '800' }}>
              ₹{discountsData.summary.total_discount_amount}
            </AppText>
          </View>
        </AppCard>
      ) : (
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="pricetags-outline" size={32} color={colors.primary} />
          </View>
          <AppText variant="subtitle" style={styles.emptyTitle}>No Discounts Applied</AppText>
          <AppText variant="caption" color={colors.textMuted} style={styles.emptyText}>
            This enrollment currently has no discounts. You can apply a discount policy using the form below.
          </AppText>
        </View>
      )}

      {/* Add New Discount Section */}
      <View style={styles.sectionHeader}>
        <AppText variant="h3" style={styles.sectionTitle}>Add New Discount</AppText>
      </View>

      <AppCard style={styles.formCard}>
        <AppSelect
          label="Select Discount Policy"
          options={policyOptions}
          value={selectedPolicyId}
          onSelect={setSelectedPolicyId}
        />

        <AppInput
          label="Manual Discount Amount (Optional)"
          value={manualAmount}
          onChangeText={setManualAmount}
          keyboardType="numeric"
          placeholder="0.00"
        />

        <AppInput
          label="Reason"
          value={reason}
          onChangeText={setReason}
          multiline
          placeholder="Why is this discount being applied?"
        />

        <AppButton
          title="Apply Discount"
          onPress={handleAddDiscount}
          loading={addDiscountMutation.isPending}
          style={styles.submitButton}
        />
      </AppCard>

      <View style={{ height: 40 }} />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.lg,
  },
  sectionHeader: {
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  listCard: {
    padding: spacing.md,
    borderRadius: 20,
    marginBottom: spacing.xl,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceSubtle,
  },
  listItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primaryLight + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceSubtle,
    borderStyle: 'dashed',
  },
  emptyStateContainer: {
    padding: spacing.xl * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontWeight: '800',
    color: colors.textPrimary,
    fontSize: 16,
    marginBottom: 4,
  },
  emptyText: {
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    lineHeight: 20,
    fontSize: 13,
  },
  deleteBtn: {
    marginLeft: spacing.md,
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.danger + '10',
  },
  formCard: {
    padding: spacing.xl,
    borderRadius: 24,
    gap: spacing.lg,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});
