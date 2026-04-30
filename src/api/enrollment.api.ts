import { http } from './http';

export type EmiInstallment = {
  uid: string;
  installment_number: number;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  due_date: string;
  status: string;
  paid_date: string | null;
  is_overdue: boolean;
  days_overdue: number;
};

export type PaymentTransaction = {
  uid: string;
  transaction_id: string;
  amount: string;
  payment_method_display: string;
  status_display: string;
  payment_date: string;
};

export type EnrollmentDetailsResponse = {
  uid: string;
  enrollment_number: string;

  batch?: {
    uid?: string;
    batch_name: string;
    course_name: string;
    start_date: string;
    end_date: string;
    status: string;
    time: string;
    fee_structure?: {
      course_fees: number;
      course_fees_discount: number;
      admission_fees: number;
    };
  };

  status_object?: {
    id: number;
    name: string;
    value: string;
    color: string;
  };

  student_name: string;
  student_email: string;
  student_phone: string;
  student: string;

  total_amount_paid: string;
  total_pending_amount: string;
  net_fees: number;
  original_course_fees_discount?: string | number;
  original_admission_fees?: string | number;
  original_course_fees?: string | number;
  total_discount_amount?: string | number;

  payment_type: string;
  payment_type_display: string;

  emi_installments?: EmiInstallment[];
  payment_transactions?: PaymentTransaction[];

  admission_counselor_uid?: string;
  attendance_mode?: {
    id: number;
    name: string;
    value: string;
  };
  certificate_data_collected?: boolean;

  created_at: string;
  updated_at: string;
};

export type EmiPlan = {
  uid: string;
  name: string;
  installment_count: number;
  first_emi_after_days: number;
  installment_frequency_days: number;
  minimum_amount: string;
  maximum_amount: string;
  is_active: boolean;
  description: string;
  total_duration_days: number;
  emi_frequency_display: string;
  amount_range_display: string;
  is_single_payment: boolean;
  estimated_duration_months: number;
};

export type EmiPreviewResponse = {
  status: string;
  message: string;
  emi_preview: {
    emi_plan_name: string;
    installment_count: number;
    total_emi_amount: number;
    first_emi_date: string;
    last_emi_date: string;
  };
  installment_breakdown: {
    schedule: Array<{
      installment_number: number;
      due_date: string;
      amount: number;
      formatted_due_date: string;
    }>;
  };
  next_steps: {
    required_payload: {
      enrollment_id: string;
      emi_plan_id: string;
      first_emi_date: string;
      emi_amounts: number[];
      confirmation: boolean;
    };
  };
};

export const fetchEnrollmentById = async (id: string) => {
  console.log('➡️ GET enrollment/', id);

  const res = await http.get<EnrollmentDetailsResponse>(
    `/enrollment/${id}/`
  );

  console.log('✅ Enrollment response:', res.data);

  return res.data;
};

export const fetchEmiPlans = async () => {
  const res = await http.get<{ data: EmiPlan[] }>('/emi-plans/');
  return res.data.data;
};

export const fetchEmiPreview = async (payload: { enrollment_id: string; emi_plan_id: string }) => {
  const res = await http.post<EmiPreviewResponse>('/student-enrollment/emi-preview/', payload);
  return res.data;
};

export const confirmEmi = async (payload: any) => {
  const res = await http.post('/student-enrollment/emi-confirm/', payload);
  return res.data;
};

export const completeFullPayment = async (payload: any) => {
  const res = await http.post('/student-enrollment/complete-full-payment/', payload);
  return res.data;
};

export const revertEmi = async (payload: { enrollment_id: string; confirmation: boolean }) => {
  const res = await http.post('/student-enrollment/emi-revert/', payload);
  return res.data;
};

export const markInstallmentPaid = async (id: string, payload: { notes: string, payment_method: string }) => {
  const res = await http.post(`/enrollments/emi/installments/${id}/mark-paid/`, payload);
  return res.data;
};

const isEndpointFallbackError = (error: any) => {
  const status = error?.response?.status;
  return status === 404 || status === 405;
};

export const updateInstallment = async (id: string, payload: { new_amount: number, new_due_date: string, notes: string, redistribute_remaining: boolean }) => {
  let lastError: unknown;

  // Try canonical DRF detail endpoint first, then support legacy custom edit action.
  const requesters = [
    () => http.patch(`/enrollments/emi/installments/${id}/`, payload),
    () => http.put(`/enrollments/emi/installments/${id}/edit/`, payload),
  ];

  for (const request of requesters) {
    try {
      const res = await request();
      return res.data;
    } catch (error) {
      lastError = error;
      if (!isEndpointFallbackError(error)) {
        throw error;
      }
    }
  }

  throw lastError;
};

export const markInstallmentUnpaid = async (id: string, payload: { notes: string }) => {
  const res = await http.post(`/enrollments/emi/installments/${id}/mark-as-incomplete/`, payload);
  return res.data;
};

export const dropEnrollment = async (id: string, payload: { drop_date: string; drop_reason: string; notes?: string }) => {
  const res = await http.post(`/student-enrollment/${id}/drop/`, payload);
  return res.data;
};

export const rejoinStudent = async (studentId: string, payload: any) => {
  const res = await http.post(`/student-enrollment/rejoin/${studentId}/`, payload);
  return res.data;
};

export const toggleEnrollmentAccess = async (id: string, is_active: boolean) => {
  const res = await http.patch(`/student/${id}/toggle/`, { is_active });
  return res.data;
};

export type EditEnrollmentPayload = {
  admission_counselor_uid: string;
  attendance_mode_uid: string;
  certificate_data_collected: boolean;
  remarks?: string;
};

export const editEnrollment = async (uid: string, payload: EditEnrollmentPayload) => {
  const res = await http.patch(`/student-enrollment/${uid}/edit/`, payload);
  return res.data;
};
