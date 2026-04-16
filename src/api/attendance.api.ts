import { http } from './http';

export type AttendanceMode = 'online' | 'offline' | 'recording';

export type AttendanceRecord = {
  date: string;
  attendance: AttendanceMode | 'absent';
  reason: string | null;
};

export type AttendanceSummary = {
  total_classes: number;
  online: number;
  offline: number;
  recording: number;
  attendance_percentage: number;
};

export type StudentAttendance = {
  student_name: string;
  id: string; // This is the visible ID (e.g., LUM2026115)
  email: string;
  phone: string;
  mode: string;
  enrollment_status: string;
  attendance_summary: AttendanceSummary;
  attendance: AttendanceRecord[];
};

export type AttendanceListResponse = {
  status: string;
  data: StudentAttendance[];
  filters_applied: {
    search: string | null;
    enrollment_status: string | null;
    exclude_enrollment_status: string | null;
    mode: string | null;
    attendance_status: string | null;
    date: string | null;
    start_date: string | null;
    end_date: string | null;
    session_id: string | null;
  };
  pagination: {
    page: number;
    page_size: number;
    total_students: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
};

export type AttendanceFilters = {
  batch_id: string;
  page?: number;
  page_size?: number;
  search?: string;
  exclude_enrollment_status?: string;
  start_date?: string;
  end_date?: string;
  attendance_status?: string;
};

export type UpdateAttendancePayload = {
  batch_id: string;
  student_id: string;
  date: string;
  status: AttendanceMode | 'absent';
  reason: string;
};

export const fetchAttendanceList = async (
  filters: AttendanceFilters
): Promise<AttendanceListResponse> => {
  const res = await http.get('/attendance/list/', {
    params: {
        ...filters,
        batch_id: filters.batch_id,
        page: filters.page || 1,
        page_size: filters.page_size || 50,
        exclude_enrollment_status: filters.exclude_enrollment_status || 'dropped,removed',
    },
  });
  return res.data;
};

export const updateAttendance = async (payload: UpdateAttendancePayload): Promise<any> => {
  const res = await http.put('/attendance/update/', payload);
  return res.data;
};
