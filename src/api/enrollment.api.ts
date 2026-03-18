import { http } from './http';

export type EnrollmentDetailsResponse = {
  status: 'success';
  enrollment: any; // later you can strongly type
};

export const fetchEnrollmentById = async (id: string) => {
  console.log('➡️ GET enrollment/', id);

  const res = await http.get<EnrollmentDetailsResponse>(
    `/enrollment/${id}/`
  );

  console.log('✅ Enrollment response:', res.data);

  return res.data;
};