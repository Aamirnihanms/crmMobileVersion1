import { http } from './http';

export type Batch = {
  uid: string;
  batch_name: string;
  course_name: string;
  course_mode_names: string[];
  location_name: string;
  start_date: string;
  end_date: string;
  time: string;
  status: string;
  current_enrollment_count: number;
  total_capacity: number;
  available_spots: number;
  is_active: boolean;
  admission_fees?: number;
  seat_availability?: {
    online?: {
      capacity: number;
      enrolled: number;
      available: number;
    };
    offline?: {
      capacity: number;
      enrolled: number;
      available: number;
    };
    total: {
      capacity: number;
      enrolled: number;
      available: number;
    };
    can_enroll_online?: boolean;
    can_enroll_offline?: boolean;
  };
};

export type StaffMember = {
  uid: string;
  full_name: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  is_active: boolean;
  id: number;
};

export type BatchDetail = Batch & {
  description: string;
  notes: string;
  online_batch_capacity: string | number;
  offline_batch_capacity: number;
  minimum_attendance_duration: string | number;
  certificate_enabled: boolean;
  course_details: {
    id: number;
    course_name: string;
    course_fee: string;
    course_fee_discount: string;
    admission_fee: string;
    location_details: Array<{
        id: number;
        name: string;
        value: string;
    }>;
  };
  course_mode_details: Array<{
    id: number;
    name: string;
    value: string;
  }>;
  location_details: {
    id: number;
    name: string;
  };
  building_details: {
    id: number;
    name: string;
  };
  classroom_details: {
    id: number;
    name: string;
    capacity: number;
  };
  staff_summary: {
    counselors: Array<{ uid: string; name: string; email: string }>;
    trainers: Array<{ uid: string; name: string; email: string }>;
    total_staff: number;
  };
  fee_structure: {
    course_fees: number;
    course_fees_discount: number;
    admission_fees: number;
  };
  seat_availability: {
    online: any;
    offline: any;
    total: any;
    can_enroll_online: boolean;
    can_enroll_offline: boolean;
    enrollment_status: string;
  };
  start_date_formatted: string;
  end_date_formatted: string;
  duration: string;
  sessions: any[];
  is_enrollment_open: boolean;
  status: string;
};

export type BatchDetailResponse = {
  status: string;
  batch: BatchDetail;
};


export type BatchesFilters = {
  location_id?: string;
  course_id?: string;
  trainer_id?: string;
  counselor_id?: string;
  start_date_from?: string;
  start_date_to?: string;
  inactive?: boolean;
};

export type BatchesPageResponse = {
  batches: Batch[];
  pagination: {
    total_count: number;
    current_page: number;
    total_pages: number;
    page_size: number;
  };
  summary: any;
};

export const fetchBatches = async (
  courseId?: number
): Promise<Batch[]> => {
  console.log('➡️ GET batches, course:', courseId);

  const res = await http.get('/batch/', {
    params: {
      course_id: courseId || undefined,
    },
  });

  return res.data.batches || res.data.data || [];
};

export const fetchPaginatedBatches = async (
  page: number = 1,
  pageSize: number = 10,
  search: string = '',
  filters: BatchesFilters = {}
): Promise<BatchesPageResponse> => {
  console.log('➡️ GET paginated batches:', { page, search, filters });

  const res = await http.get('/batch/', {
    params: {
      page,
      page_size: pageSize,
      search: search || undefined,
      inactive: filters.inactive ?? true,
      is_active: filters.inactive === false ? 'True' : undefined, // Example showed is_active=True
      location_id: filters.location_id || undefined,
      course_id: filters.course_id || undefined,
      trainer_id: filters.trainer_id || undefined,
      counselor_id: filters.counselor_id || undefined,
      start_date_from: filters.start_date_from || undefined,
      start_date_to: filters.start_date_to || undefined,
    },
  });

  return res.data;
};

export const fetchBatchDetail = async (uid: string): Promise<BatchDetailResponse> => {
  console.log('➡️ GET batch detail:', uid);
  const res = await http.get(`/batch/${uid}/`);
  return res.data;
};

export const createBatch = async (payload: any): Promise<{ status: string; message?: string; batch?: any }> => {
  console.log('➡️ POST create batch:', payload);
  const res = await http.post('/batch/create/', payload);
  return res.data;
};

export const updateBatch = async (uid: string, payload: any): Promise<{ status: string; message?: string; batch?: any }> => {
  console.log('➡️ PUT update batch:', uid, payload);
  const res = await http.put(`/batch/${uid}/`, payload);
  return res.data;
};

export const deleteBatch = async (uid: string): Promise<{ status: string; message?: string }> => {
  console.log('➡️ DELETE batch:', uid);
  const res = await http.delete(`/batch/${uid}/`);
  return res.data;
};

export const markBatchCompleted = async (uid: string): Promise<{ status: string; message?: string }> => {
  console.log('➡️ POST mark batch completed:', uid);
  const res = await http.post(`/batch/${uid}/mark-completed/`);
  return res.data;
};

export type BatchSession = {
    uid: string;
    batch: string;
    batch_uid: string;
    batch_name: string;
    name: string;
    minimum_attendance_duration: number;
    duration_display: string;
    description: string;
    created_at: string;
    updated_at: string;
};

export type BatchSessionsResponse = {
    status: string;
    sessions: BatchSession[];
    pagination: {
        total_count: number;
        current_page: number;
        total_pages: number;
        page_size: number;
    };
};

export const fetchBatchSessions = async (batchId: string): Promise<BatchSessionsResponse> => {
  const res = await http.get(`/batch/sessions/`, { params: { batch_id: batchId } });
  return res.data;
};

export const createBatchSession = async (payload: { batch: string; description: string; minimum_attendance_duration: number; name: string }): Promise<any> => {
  const res = await http.post('/batch/sessions/create/', payload);
  return res.data;
};

export const fetchBatchSessionDetail = async (uid: string): Promise<any> => {
  const res = await http.get(`/batch/sessions/${uid}/`);
  return res.data;
};

export const updateBatchSession = async (uid: string, payload: { description: string; minimum_attendance_duration: number; name: string }): Promise<any> => {
  const res = await http.patch(`/batch/sessions/${uid}/update/`, payload);
  return res.data;
};

export const deleteBatchSession = async (uid: string): Promise<any> => {
  const res = await http.delete(`/batch/sessions/${uid}/delete/`);
  return res.data;
};