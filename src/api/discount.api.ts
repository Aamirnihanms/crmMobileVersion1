import { http } from './http';

export type EnrollmentDiscount = {
  uid: string;
  enrollment: string;
  enrollment_number: string;
  student_name: string;
  discount_policy: string;
  discount_policy_name: string;
  discount_policy_code: string;
  discount_amount: string;
  reason: string;
  applied_by: number;
  applied_by_name: string;
  applied_date: string;
  is_active: boolean;
};

export type DiscountPolicy = {
  uid: string;
  name: string;
  code: string;
  discount_type: string;
  discount_type_display: string;
  percentage_value: string;
  fixed_amount: string;
  max_discount_amount: string;
  min_enrollment_amount: string;
  valid_from: string | null;
  valid_until: string | null;
  usage_limit_per_student: number;
  total_usage_limit: number;
  current_usage: number;
  auto_apply: boolean;
  auto_apply_conditions: any;
  is_active: boolean;
  description: string;
  created_at: string;
  created_by: number | null;
  created_by_name?: string;
  can_see: number[];
};

export type DiscountListResponse = {
  status: string;
  enrollment_discounts: EnrollmentDiscount[];
  pagination: {
    current_page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
  summary: {
    total_discounts: number;
    total_discount_amount: string;
  };
};

export type DiscountPoliciesResponse = {
  status: string;
  discount_policies: DiscountPolicy[];
  count: number;
};

export type AddDiscountPayload = {
  discount_policy_id: string;
  enrollment_id: string;
  manual_discount_amount: number;
  reason: string;
};

export const fetchEnrollmentDiscounts = async (studentId: string, enrollmentId: string) => {
  const res = await http.get<DiscountListResponse>(
    `/student/discount/list/?student_id=${studentId}&enrollment_id=${enrollmentId}`
  );
  return res.data;
};

export const fetchDiscountPolicies = async () => {
  const res = await http.get<DiscountPoliciesResponse>('/discount/list/');
  return res.data;
};

export const addDiscountToStudent = async (payload: AddDiscountPayload) => {
  const res = await http.post('/add-discount-to-student/', payload);
  return res.data;
};

export const deleteDiscount = async (uid: string) => {
  const res = await http.delete(`/enrollment-discount/delete/${uid}/`);
  return res.data;
};
