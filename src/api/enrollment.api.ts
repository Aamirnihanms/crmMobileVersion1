import { http } from './http';

export type EnrollmentDetailsResponse = {
  uid: string;
  enrollment_number: string;

  batch?: {
    batch_name: string;
    course_name: string;
    start_date: string;
    end_date: string;
    status: string;
    time: string;
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

  total_amount_paid: string;
  total_pending_amount: string;
  net_fees: number;

  payment_type_display: string;

  created_at: string;
  updated_at: string;
};

export const fetchEnrollmentById = async (id: string) => {
  console.log('➡️ GET enrollment/', id);

  const res = await http.get<EnrollmentDetailsResponse>(
    `/enrollment/${id}/`
  );

  console.log('✅ Enrollment response:', res.data);

  return res.data;
};