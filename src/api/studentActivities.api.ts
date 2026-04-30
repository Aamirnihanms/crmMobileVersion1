import { http } from './http';

export type StudentActivity = {
  uid: string;
  activity_type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  old_value: any;
  new_value: any;
  amount: string | null;
  performed_by: {
    uid: string;
    full_name: string;
    email: string;
    phone: string;
    is_active: boolean;
    id: number;
    branch: string | null;
  } | null;
  metadata: Record<string, any>;
  tags: string[];
  requires_follow_up: boolean;
  follow_up_date: string | null;
  follow_up_completed: boolean;
  created_at: string;
};

export type StudentActivitiesPageResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: StudentActivity[];
};

export const fetchStudentActivities = async (
  studentId: string,
  page: number,
  pageSize: number = 10
): Promise<StudentActivitiesPageResponse> => {
  const res = await http.get(`/students/${studentId}/activity-logs/`, {
    params: { page, page_size: pageSize },
  });
  return res.data;
};
