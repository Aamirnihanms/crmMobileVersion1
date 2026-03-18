import { http } from './http';

export type Batch = {
  uid: string;
  batch_name: string;
  course_name: string;
  start_date: string;
  status: string;
};

export const fetchBatches = async (
  courseId?: number
): Promise<Batch[]> => {
  console.log('➡️ GET batches, course:', courseId);

  const res = await http.get('/batch/', {
    params: {
      course_id: courseId || undefined, // ✅ optional param
    },
  });

  console.log('✅ batches response:', res);

  return res.data.batches || res.data.data || [];
};