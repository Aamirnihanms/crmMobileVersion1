import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, Modal, ScrollView, Share, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

import AppButton from '@/src/components/common/AppButton';
import AppCard from '@/src/components/common/AppCard';
import AppInput from '@/src/components/common/AppInput';
import AppLoader from '@/src/components/common/AppLoader';
import AppSelect from '@/src/components/common/AppSelect';
import AppText from '@/src/components/common/AppText';
import { useDropEnrollment, useEditEnrollment, useEnrollmentDetails, useMarkInstallmentPaid, useMarkInstallmentUnpaid, useRevertEmi, useUpdateInstallment } from '@/src/queries/enrollment.query';
import { useCounselors } from '@/src/queries/masters/counselors.query';
import { colors, spacing } from '@/src/theme';
import type { StudentsStackParamList } from '../../navigation/StudentsStack';

type RootParamList = {
  EnrollmentDetails: { id: string; studentId: string };
};

export default function EnrollmentDetailsScreen() {
  const { params } =
    useRoute<RouteProp<RootParamList, 'EnrollmentDetails'>>();

  const navigation = useNavigation<NativeStackNavigationProp<StudentsStackParamList>>();

  const { data, isLoading, isError } =
    useEnrollmentDetails(params.id);

  const revertEmiMutation = useRevertEmi();
  const markPaidMutation = useMarkInstallmentPaid();
  const markUnpaidMutation = useMarkInstallmentUnpaid();
  const updateMutation = useUpdateInstallment();
  const dropMutation = useDropEnrollment();
  const editEnrollmentMutation = useEditEnrollment();

  const { data: counselors } = useCounselors();

  const ATTENDANCE_MODES = [
    { label: 'Online', value: '1' },
    { label: 'Offline', value: '2' },
    { label: 'Hybrid', value: '3' },
  ];


  // Modal States
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [unpaidModalVisible, setUnpaidModalVisible] = useState(false);
  const [dropModalVisible, setDropModalVisible] = useState(false);
  const [enrollEditModalVisible, setEnrollEditModalVisible] = useState(false);

  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string | null>(null);

  // Form States
  const [payMethod, setPayMethod] = useState('cash');
  const [payNotes, setPayNotes] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [unpaidNotes, setUnpaidNotes] = useState('');

  // Drop States
  const [dropReason, setDropReason] = useState('');
  const [dropDate, setDropDate] = useState(new Date().toISOString().split('T')[0]);
  const [dropNotes, setDropNotes] = useState('');
  const [confirmDropChecked, setConfirmDropChecked] = useState(false);

  // Enrollment Edit States
  const [editCounselorUid, setEditCounselorUid] = useState('');
  const [editAttendanceModeUid, setEditAttendanceModeUid] = useState('');
  const [editCertificateDataCollected, setEditCertificateDataCollected] = useState(false);
  const [editRemarks, setEditRemarks] = useState('');

  if (isLoading) return <AppLoader />;

  if (isError || !data) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <AppText style={styles.errorText}>Error loading enrollment details</AppText>
      </View>
    );
  }

  const handleSetPaymentMode = () => {
    navigation.navigate('SetPaymentMode', { enrollmentId: params.id });
  };

  const handleNavigateToDiscount = () => {
    navigation.navigate('AddDiscount', {
      enrollmentId: params.id,
      studentId: params.studentId
    });
  };

  const handleRevertEmi = () => {
    Alert.alert(
      'Revert EMI',
      'Are you sure you want to revert the EMI payment type? This will reset the enrollment to "Not Set" mode.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revert',
          style: 'destructive',
          onPress: () => {
            revertEmiMutation.mutate({
              enrollment_id: params.id,
              confirmation: true,
            }, {
              onSuccess: () => {
                Alert.alert('Success', 'EMI reverted successfully');
              },
              onError: (error: any) => {
                Alert.alert('Error', error?.response?.data?.message || 'Failed to revert EMI');
              }
            });
          }
        }
      ]
    );
  };

  const handleOpenPay = (installment: any) => {
    setSelectedInstallmentId(installment.uid);
    setPayModalVisible(true);
  };

  const handleConfirmPay = () => {
    if (!selectedInstallmentId) return;
    markPaidMutation.mutate({
      id: selectedInstallmentId,
      payload: { notes: payNotes, payment_method: payMethod }
    }, {
      onSuccess: () => {
        Alert.alert('Success', 'Installment marked as paid');
        setPayModalVisible(false);
        setPayNotes('');
      },
      onError: (error: any) => {
        Alert.alert('Error', error?.response?.data?.message || 'Failed to mark paid');
      }
    });
  };

  const handleOpenUnpaid = (installment: any) => {
    setSelectedInstallmentId(installment.uid);
    setUnpaidModalVisible(true);
  };

  const handleConfirmUnpaid = () => {
    if (!selectedInstallmentId) return;
    markUnpaidMutation.mutate({
      id: selectedInstallmentId,
      payload: { notes: unpaidNotes }
    }, {
      onSuccess: () => {
        Alert.alert('Success', 'Installment marked as unpaid');
        setUnpaidModalVisible(false);
        setUnpaidNotes('');
      },
      onError: (error: any) => {
        Alert.alert('Error', error?.response?.data?.message || 'Failed to mark unpaid');
      }
    });
  };

  const handleOpenEdit = (installment: any) => {
    setSelectedInstallmentId(installment.uid);
    setEditAmount(installment.total_amount.toString());
    setEditDate(installment.due_date);
    setEditModalVisible(true);
  };

  const handleConfirmEdit = () => {
    if (!selectedInstallmentId) return;
    updateMutation.mutate({
      id: selectedInstallmentId,
      payload: {
        new_amount: Number(editAmount),
        new_due_date: editDate,
        notes: editNotes,
        redistribute_remaining: true,
      }
    }, {
      onSuccess: () => {
        Alert.alert('Success', 'Installment updated successfully');
        setEditModalVisible(false);
        setEditNotes('');
      },
      onError: (error: any) => {
        Alert.alert('Error', error?.response?.data?.message || 'Failed to update installment');
      }
    });
  };

  const handleConfirmDrop = () => {
    if (!confirmDropChecked) {
      Alert.alert('Validation', 'Please confirm the drop by checking the checkbox.');
      return;
    }
    if (!dropReason.trim()) {
      Alert.alert('Validation', 'Please enter a reason for dropping.');
      return;
    }

    dropMutation.mutate({
      id: params.id,
      payload: {
        drop_date: new Date(dropDate).toISOString(),
        drop_reason: dropReason.trim(),
        notes: dropNotes.trim(),
      }
    }, {
      onSuccess: () => {
        Alert.alert('Success', 'Enrollment dropped successfully');
        setDropModalVisible(false);
        // Reset states
        setDropReason('');
        setDropNotes('');
        setConfirmDropChecked(false);
      },
      onError: (error: any) => {
        Alert.alert('Error', error?.response?.data?.message || 'Failed to drop enrollment');
      }
    });
  };

  const handleOpenEnrollEdit = () => {
    // Pre-populate with current values from enrollment data
    setEditCounselorUid(data?.admission_counselor_uid || '');
    setEditAttendanceModeUid(data?.attendance_mode?.id?.toString() || '');
    setEditCertificateDataCollected(data?.certificate_data_collected ?? false);
    setEditRemarks('');
    setEnrollEditModalVisible(true);
  };

  const handleConfirmEnrollEdit = () => {
    if (!editCounselorUid) {
      Alert.alert('Validation', 'Please select an admission counselor.');
      return;
    }
    if (!editAttendanceModeUid) {
      Alert.alert('Validation', 'Please select an attendance mode.');
      return;
    }
    editEnrollmentMutation.mutate({
      uid: params.id,
      payload: {
        admission_counselor_uid: editCounselorUid,
        attendance_mode_uid: editAttendanceModeUid,
        certificate_data_collected: editCertificateDataCollected,
        remarks: editRemarks.trim() || undefined,
      },
    }, {
      onSuccess: () => {
        Alert.alert('Success', 'Enrollment updated successfully');
        setEnrollEditModalVisible(false);
      },
      onError: (error: any) => {
        Alert.alert('Error', error?.response?.data?.message || 'Failed to update enrollment');
      },
    });
  };

  const handleSharePaymentLink = () => {
    const link = `https://student.luminartechnolab.com/payment-link/${data.uid}`;
    Share.share({
      message: `Complete your EMI payment here: ${link}`,
      url: link,
    });
  };

  const handleShareInstallmentLink = (installment: any) => {
    const link = `https://student.luminartechnolab.com/payment-link/${data.uid}?emi_id=${installment.uid}`;
    Share.share({
      message: `Complete your EMI installment (#${installment.installment_number}) payment here: ${link}`,
      url: link,
    });
  };

  const isRevertEnabled = data.payment_type === 'emi' &&
    data.emi_installments &&
    data.emi_installments.every(i => Number(i.paid_amount) === 0);

  const InfoRow = ({ icon, label, value, color = colors.textPrimary }: any) => (
    <View style={styles.infoRow}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.infoTextContainer}>
        <AppText variant="caption" color={colors.textMuted} style={styles.infoLabel}>{label}</AppText>
        <AppText style={[styles.infoValue, { color }]}>{value || 'N/A'}</AppText>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <AppCard style={styles.headerCard}>
          <LinearGradient
            colors={[colors.primary, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientHeader}
          >
            <AppText variant="h2" color={colors.surface} style={styles.headerTitle}>
              {data.batch?.batch_name || 'General Enrollment'}
            </AppText>
            <AppText variant="caption" color="rgba(255,255,255,0.8)">
              {data.batch?.course_name || 'No Course Specified'}
            </AppText>
          </LinearGradient>

          <View style={styles.headerBadgeContainer}>
            <View style={[styles.statusBadge, { backgroundColor: (data.status_object?.color || colors.primary) + '20' }]}>
              <View style={[styles.statusDot, { backgroundColor: data.status_object?.color || colors.primary }]} />
              <AppText variant="caption" style={{ color: data.status_object?.color || colors.primary, fontWeight: '700' }}>
                {data.status_object?.name || 'Active'}
              </AppText>
            </View>
            <View style={styles.idBadge}>
              <AppText variant="caption" color={colors.textMuted} style={{ fontWeight: '600' }}>
                #{data.enrollment_number}
              </AppText>
            </View>
          </View>
        </AppCard>


        <View style={styles.sectionHeader}>
          <AppText variant="h3" style={styles.sectionTitle}>Course & Student</AppText>
          <View style={styles.sectionHeaderActions}>
            {data.status_object?.value !== 'removed' && data.status_object?.value !== 'dropped' && (
              <TouchableOpacity
                style={styles.editHeaderBtn}
                onPress={handleOpenEnrollEdit}
              >
                <Ionicons name="create-outline" size={14} color={colors.info} />
                <AppText variant="caption" style={{ color: colors.info, fontWeight: '700' }}>Edit</AppText>
              </TouchableOpacity>
            )}
            {data.status_object?.value !== 'removed' && data.status_object?.value !== 'dropped' && (
              <TouchableOpacity
                style={styles.dropHeaderBtn}
                onPress={() => setDropModalVisible(true)}
              >
                <Ionicons name="close-circle-outline" size={14} color={colors.danger} />
                <AppText variant="caption" style={{ color: colors.danger, fontWeight: '700' }}>Drop</AppText>
              </TouchableOpacity>
            )}
          </View>
        </View>
        <AppCard style={styles.detailsCard}>
          <InfoRow icon="school-outline" label="Course" value={data.batch?.course_name} />
          <InfoRow icon="person-outline" label="Student Name" value={data.student_name} />
          <InfoRow icon="mail-outline" label="Email Address" value={data.student_email} />
          <InfoRow icon="call-outline" label="Phone Number" value={data.student_phone} />
        </AppCard>

        <AppText variant="h3" style={styles.sectionTitle}>Financial Summary</AppText>
        <AppCard style={styles.financialCard}>
          <View style={styles.feeGrid}>
            <View style={styles.feeItem}>
              <AppText variant="caption" color={colors.textMuted}>Total Fees after Discount</AppText>
              <AppText variant="h3">₹{Number(data.original_course_fees) - Number(data.total_discount_amount) || data.net_fees}</AppText>
            </View>
            <View style={styles.feeItem}>
              <AppText variant="caption" color={colors.textMuted}>Payment Mode</AppText>
              <AppText variant="h3" style={{ fontSize: 14 }}>{data.payment_type_display}</AppText>
            </View>
          </View>

          {data.status_object?.value !== 'removed' && data.status_object?.value !== 'dropped' && (
            <View style={styles.actionRow}>
              {data.payment_type === 'not_set' && (
                <TouchableOpacity
                  style={[styles.smallActionBtn, { backgroundColor: colors.primary + '10' }]}
                  onPress={handleSetPaymentMode}
                >
                  <Ionicons name="card-outline" size={16} color={colors.primary} />
                  <AppText variant="caption" style={{ color: colors.primary, fontWeight: '700' }}>Set Payment</AppText>
                </TouchableOpacity>
              )}
              {isRevertEnabled && (
                <TouchableOpacity
                  style={[styles.smallActionBtn, { backgroundColor: colors.danger + '10' }]}
                  onPress={handleRevertEmi}
                >
                  {revertEmiMutation.isPending ? (
                    <ActivityIndicator size="small" color={colors.danger} />
                  ) : (
                    <>
                      <Ionicons name="refresh-outline" size={16} color={colors.danger} />
                      <AppText variant="caption" style={{ color: colors.danger, fontWeight: '700' }}>Revert EMI</AppText>
                    </>
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.smallActionBtn, { backgroundColor: colors.success + '10' }]}
                onPress={handleNavigateToDiscount}
              >
                <Ionicons name="pricetag-outline" size={16} color={colors.success} />
                <AppText variant="caption" style={{ color: colors.success, fontWeight: '700' }}>Add Discount</AppText>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <AppText variant="caption" style={{ fontWeight: '700' }}>Collection Progress</AppText>
              <AppText variant="caption" color={colors.primary} style={{ fontWeight: '700' }}>
                {Number(data.net_fees) > 0 ? Math.round((Number(data.total_amount_paid) / Number(data.net_fees)) * 100) : 0}%
              </AppText>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Number(data.net_fees) > 0 ? (Number(data.total_amount_paid) / Number(data.net_fees)) * 100 : 0}%` }
                ]}
              />
            </View>
          </View>

          <View style={styles.financialStats}>
            <View style={[styles.fStat, { backgroundColor: colors.successBg }]}>
              <AppText variant="caption" color={colors.successStrong} style={{ fontWeight: '700' }}>Paid</AppText>
              <AppText variant="subtitle" style={{ color: colors.successStrong, fontWeight: '800' }}>₹{data.total_amount_paid}</AppText>
            </View>
            <View style={[styles.fStat, { backgroundColor: colors.dangerBg }]}>
              <AppText variant="caption" color={colors.dangerStrong} style={{ fontWeight: '700' }}>Remaining</AppText>
              <AppText variant="subtitle" style={{ color: colors.dangerStrong, fontWeight: '800' }}>₹{data.total_pending_amount}</AppText>
            </View>
          </View>
        </AppCard>

        {data.status_object?.value !== 'removed' && data.status_object?.value !== 'dropped' && data.emi_installments && data.emi_installments.length > 0 && (
          <>
            <AppText variant="h3" style={styles.sectionTitle}>EMI Installments</AppText>
            <AppCard style={styles.listCard}>
              {data.emi_installments?.map((installment: any, index: number) => {
                const isFirstUnpaid = data.emi_installments?.find((i: any) => Number(i.paid_amount) === 0)?.uid === installment.uid;
                const paidInstallments = data.emi_installments?.filter((i: any) => Number(i.paid_amount) > 0) || [];
                const isLastPaid = paidInstallments.length > 0 && paidInstallments[paidInstallments.length - 1].uid === installment.uid;


                return (
                  <View key={installment.uid} style={[styles.listItem, index === data.emi_installments!.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={styles.listItemNumber}>
                      <AppText variant="caption" style={{ fontWeight: '700', color: colors.primary }}>#{installment.installment_number}</AppText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText variant="body" style={{ fontWeight: '700', fontSize: 16 }}>₹{installment.total_amount}</AppText>
                      <AppText variant="caption" color={colors.textMuted}>{installment.due_date}</AppText>
                    </View>
                    <View style={styles.installmentRightSide}>
                      <View style={[styles.statusBadgeSmall, { backgroundColor: Number(installment.paid_amount) > 0 ? colors.successBg : (installment.is_overdue ? colors.dangerBg : colors.surfaceSubtle), alignSelf: 'flex-end', marginBottom: 8 }]}>
                        <AppText variant="caption" style={{ fontSize: 9, fontWeight: '800', color: Number(installment.paid_amount) > 0 ? colors.successStrong : (installment.is_overdue ? colors.dangerStrong : colors.textMuted) }}>
                          {Number(installment.paid_amount) > 0 ? 'PAID' : (installment.is_overdue ? 'OVERDUE' : 'PENDING')}
                        </AppText>
                      </View>
                      <View style={styles.installmentActions}>
                        {Number(installment.paid_amount) === 0 ? (
                          isFirstUnpaid && (
                            <>
                              <TouchableOpacity style={styles.actionIconMini} onPress={() => handleShareInstallmentLink(installment)}>
                                <Ionicons name="share-social-outline" size={16} color={colors.primary} />
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.actionIconMini} onPress={() => handleOpenPay(installment)}>
                                <Ionicons name="card-outline" size={16} color={colors.success} />
                              </TouchableOpacity>
                              <TouchableOpacity style={styles.actionIconMini} onPress={() => handleOpenEdit(installment)}>
                                <Ionicons name="create-outline" size={16} color={colors.info} />
                              </TouchableOpacity>
                            </>
                          )
                        ) : (
                          isLastPaid && (
                            <TouchableOpacity style={styles.actionIconMini} onPress={() => handleOpenUnpaid(installment)}>
                              <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
                            </TouchableOpacity>
                          )
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}

            </AppCard>
          </>
        )}

        {data.payment_transactions && data.payment_transactions.length > 0 && (
          <>
            <AppText variant="h3" style={styles.sectionTitle}>Payment History</AppText>
            <AppCard style={styles.listCard}>
              {data.payment_transactions.map((txn: any, index: number) => (
                <View key={txn.uid} style={[styles.listItem, index === data.payment_transactions!.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={[styles.listItemIcon, { backgroundColor: colors.info + '15' }]}>
                    <Ionicons name="receipt-outline" size={18} color={colors.info} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="body" style={{ fontWeight: '600' }}>₹{txn.amount}</AppText>
                    <AppText variant="caption" color={colors.textMuted}>{txn.transaction_id}</AppText>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <AppText variant="caption" style={{ fontWeight: '600' }}>{txn.payment_method_display}</AppText>
                    <AppText variant="caption" style={{ fontSize: 9 }} color={colors.textMuted}>
                      {new Date(txn.payment_date).toLocaleDateString()}
                    </AppText>
                  </View>
                </View>
              ))}
            </AppCard>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Pay Modal */}
      <Modal visible={payModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <AppCard style={styles.modalContent}>
            <AppText variant="h3" style={{ marginBottom: spacing.md }}>Mark as Paid</AppText>
            <AppSelect
              label="Payment Method"
              options={[
                { label: 'Cash', value: 'cash' },
                { label: 'UPI', value: 'upi' },
                { label: 'Bank Transfer', value: 'bank' },
              ]}
              value={payMethod}
              onSelect={setPayMethod}
            />
            <AppInput label="Notes" value={payNotes} onChangeText={setPayNotes} multiline />
            <View style={styles.modalButtons}>
              <AppButton title="Cancel" variant="outline" onPress={() => setPayModalVisible(false)} style={{ flex: 1, marginRight: spacing.md }} />
              <AppButton title="Confirm" onPress={handleConfirmPay} loading={markPaidMutation.isPending} style={{ flex: 1 }} />
            </View>
          </AppCard>
        </View>
      </Modal>

      {/* Unpaid Modal */}
      <Modal visible={unpaidModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <AppCard style={styles.modalContent}>
            <AppText variant="h3" style={{ marginBottom: spacing.md }}>Mark as Unpaid</AppText>
            <AppText variant="caption" color={colors.textMuted} style={{ marginBottom: spacing.md }}>
              Describe why this installment is being marked as unpaid. This action will reset the installment status.
            </AppText>
            <AppInput label="Notes / Reason" value={unpaidNotes} onChangeText={setUnpaidNotes} multiline placeholder="Enter reason here..." />
            <View style={styles.modalButtons}>
              <AppButton title="Cancel" variant="outline" onPress={() => setUnpaidModalVisible(false)} style={{ flex: 1, marginRight: spacing.md }} />
              <AppButton title="Confirm" onPress={handleConfirmUnpaid} loading={markUnpaidMutation.isPending} style={{ flex: 1, backgroundColor: colors.danger, borderColor: colors.danger }} />
            </View>
          </AppCard>
        </View>
      </Modal>


      {/* Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <AppCard style={styles.modalContent}>
            <AppText variant="h3" style={{ marginBottom: spacing.md }}>Edit Installment</AppText>
            <AppInput label="New Amount" value={editAmount} onChangeText={setEditAmount} keyboardType="numeric" />
            <AppInput label="New Due Date (YYYY-MM-DD)" value={editDate} onChangeText={setEditDate} />
            <AppInput label="Notes" value={editNotes} onChangeText={setEditNotes} multiline />
            <View style={styles.modalButtons}>
              <AppButton title="Cancel" variant="outline" onPress={() => setEditModalVisible(false)} style={{ flex: 1, marginRight: spacing.md }} />
              <AppButton title="Update" onPress={handleConfirmEdit} loading={updateMutation.isPending} style={{ flex: 1 }} />
            </View>
          </AppCard>
        </View>
      </Modal>

      {/* Drop Modal */}
      <Modal visible={dropModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <AppCard style={styles.modalContent}>
              <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
                <View style={[styles.bigIcon, { backgroundColor: colors.danger + '15' }]}>
                  <Ionicons name="warning-outline" size={32} color={colors.danger} />
                </View>
                <AppText variant="h2" style={{ marginTop: spacing.md, color: colors.danger, fontWeight: '800' }}>Drop Enrollment</AppText>
                <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center', marginTop: 4 }}>
                  This action cannot be undone. Please proceed with caution.
                </AppText>
              </View>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setConfirmDropChecked(!confirmDropChecked)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, confirmDropChecked && styles.checkboxChecked]}>
                  {confirmDropChecked && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <AppText variant="caption" style={{ flex: 1, fontWeight: '600' }}>
                  I confirm that I want to drop this enrollment permanently.
                </AppText>
              </TouchableOpacity>

              {confirmDropChecked && (
                <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
                  <AppInput
                    label="Drop Reason *"
                    value={dropReason}
                    onChangeText={setDropReason}
                    placeholder="Why is this student dropping out?"
                  />
                  <AppInput
                    label="Drop Date"
                    value={dropDate}
                    onChangeText={setDropDate}
                    placeholder="YYYY-MM-DD"
                  />
                  <AppInput
                    label="Additional Notes (Optional)"
                    value={dropNotes}
                    onChangeText={setDropNotes}
                    multiline
                    placeholder="Any extra context..."
                  />
                </View>
              )}

              <View style={styles.modalButtons}>
                <AppButton
                  title="Cancel"
                  variant="outline"
                  onPress={() => {
                    setDropModalVisible(false);
                    setConfirmDropChecked(false);
                  }}
                  style={{ flex: 1, marginRight: spacing.md }}
                />
                <AppButton
                  title="Drop"
                  onPress={handleConfirmDrop}
                  loading={dropMutation.isPending}
                  style={{ flex: 1, backgroundColor: colors.danger, borderColor: colors.danger }}
                  disabled={!confirmDropChecked}
                />
              </View>
            </AppCard>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Edit Enrollment Modal */}
      <Modal visible={enrollEditModalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <AppCard style={styles.modalContent}>
              {/* Header */}
              <View style={styles.editEnrollHeader}>
                <View style={[styles.bigIcon, { backgroundColor: colors.info + '15', width: 44, height: 44, borderRadius: 14 }]}>
                  <Ionicons name="create-outline" size={22} color={colors.info} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="h3" style={{ fontWeight: '800', color: colors.textPrimary }}>Edit Enrollment</AppText>
                  <AppText variant="caption" color={colors.textMuted}>Update counselor, attendance &amp; certificate info</AppText>
                </View>
              </View>

              {/* Counselor Dropdown */}
              <AppSelect
                label="Admission Counselor *"
                options={(counselors || []).map((c: any) => ({
                  label: c.full_name,
                  value: c.uid ?? c.id?.toString(),
                }))}
                value={editCounselorUid}
                onSelect={setEditCounselorUid}
              />

              {/* Attendance Mode */}
              <AppSelect
                label="Attendance Mode *"
                options={ATTENDANCE_MODES}
                value={editAttendanceModeUid}
                onSelect={setEditAttendanceModeUid}
              />

              {/* Certificate Data Collected Toggle */}
              <View style={styles.toggleRow}>
                <View style={styles.toggleLabelGroup}>
                  <Ionicons name="ribbon-outline" size={18} color={colors.primary} />
                  <View>
                    <AppText variant="body" style={{ fontWeight: '700' }}>Certificate Data Collected</AppText>
                    <AppText variant="caption" color={colors.textMuted}>Has student's certificate data been gathered?</AppText>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.toggleButton, editCertificateDataCollected && styles.toggleButtonActive]}
                  onPress={() => setEditCertificateDataCollected(!editCertificateDataCollected)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.toggleThumb, editCertificateDataCollected && styles.toggleThumbActive]} />
                </TouchableOpacity>
              </View>

              {/* Remarks (optional) */}
              <AppInput
                label="Remarks (Optional)"
                value={editRemarks}
                onChangeText={setEditRemarks}
                multiline
                placeholder="Add any remarks..."
              />

              <View style={styles.modalButtons}>
                <AppButton
                  title="Cancel"
                  variant="outline"
                  onPress={() => setEnrollEditModalVisible(false)}
                  style={{ flex: 1, marginRight: spacing.md }}
                />
                <AppButton
                  title="Update"
                  onPress={handleConfirmEnrollEdit}
                  loading={editEnrollmentMutation.isPending}
                  style={{ flex: 1.2 }}
                />
              </View>
            </AppCard>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    marginTop: spacing.md,
    color: colors.danger,
    textAlign: 'center',
  },
  headerCard: {
    padding: 0,
    borderRadius: 24,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  gradientHeader: {
    padding: spacing.xl,
    paddingBottom: spacing.xl * 1.5,
  },
  headerTitle: {
    fontWeight: '800',
    marginBottom: 4,
  },
  headerBadgeContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    marginTop: -spacing.lg,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  idBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.surfaceSubtle,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingRight: spacing.md,
  },
  sectionTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginLeft: 4,
  },
  detailsCard: {
    padding: spacing.lg,
    borderRadius: 20,
    marginBottom: spacing.xl,
    gap: spacing.lg,
  },
  financialCard: {
    padding: spacing.lg,
    borderRadius: 20,
    marginBottom: spacing.xl,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    textTransform: 'uppercase',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  infoValue: {
    fontWeight: '600',
    fontSize: 15,
  },
  feeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  feeItem: {
    flex: 1,
  },
  progressContainer: {
    marginBottom: spacing.xl,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  financialStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  fStat: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 16,
    gap: 2,
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
  listItemNumber: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primaryLight + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  listItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  revertButton: {
    marginBottom: spacing.xl,
    borderColor: colors.danger,
  },
  installmentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  installmentRightSide: {
    alignItems: 'flex-end',
  },
  actionIcon: {
    padding: 6,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceSubtle,
  },
  actionIconMini: {
    padding: 4,
    backgroundColor: colors.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.surfaceSubtle,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    padding: spacing.xl,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  smallActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  bigIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  dropHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.danger + '10',
    borderWidth: 1,
    borderColor: colors.danger + '20',
  },
  editHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.info + '10',
    borderWidth: 1,
    borderColor: colors.info + '25',
  },
  sectionHeaderActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  editEnrollHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
    marginVertical: spacing.sm,
  },
  toggleLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    marginRight: spacing.md,
  },
  toggleButton: {
    width: 48,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.divider,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.textMuted,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    backgroundColor: '#fff',
    alignSelf: 'flex-end',
  },
});