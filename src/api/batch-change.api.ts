import { http } from './http';

export type BatchChangeRequest = {
  uid: string;
  request_number: string;
  student: {
    student_id: string;
    full_name: string;
    email: string;
    phone: string;
  };
  change_details: {
    from_batch: {
      name: string;
      course: string;
    };
    to_batch: {
      name: string;
      course: string;
    };
    attendance_mode: string;
  };
  fees_impact: {
    fees_difference: number;
    impact_type: 'increase' | 'decrease' | 'no_change';
    old_total_fees: number;
    new_total_fees: number;
  };
  request_info: {
    status: 'pending' | 'processed' | 'approved' | 'rejected' | string;
    priority: 'low' | 'medium' | 'high' | string;
    reason: string;
    remarks: string;
    requested_by: string;
    requested_at: string;
    approved_by: string | null;
    approved_at: string | null;
    expires_at: string;
    is_expired: boolean;
    can_be_approved: boolean;
    can_be_processed: boolean;
  };
};

export type BatchChangeRequestDetail = {
  request_info: {
    uid: string;
    request_number: string;
    status: string;
    priority: string;
    reason: string;
    remarks: string;
    expires_at: string;
    is_expired: boolean;
  };
  student_info: {
    student_id: string;
    full_name: string;
    email: string;
    phone: string;
  };
  current_enrollment: {
    uid: string;
    enrollment_number: string;
    batch_name: string;
    course_name: string;
    status: string;
    total_paid: number;
    pending_amount: number;
    enrollment_date: string;
    attendance_mode: {
      id: number;
      name: string;
      value: string;
    };
    admission_counselor: {
      uid: string;
      full_name: string;
      email: string;
    };
  };
  requested_batch: {
    uid: string;
    batch_name: string;
    course_name: string;
    start_date: string;
    end_date: string;
  };
  change_request_details: {
    requested_attendance_mode: {
      id: number;
      name: string;
      value: string;
    };
    requested_counselor: {
      uid: string;
      full_name: string;
      email: string;
      phone: string;
    };
  };
  fees_analysis: {
    current_course_fees: number;
    current_admission_fees: number;
    current_total: number;
    new_course_fees: number;
    new_admission_fees: number;
    new_total: number;
    fees_difference: number;
    impact_type: 'increase' | 'decrease' | 'no_change';
  };
  workflow_info: {
    requested_by: string;
    requested_at: string;
    approved_by: string | null;
    approved_at: string | null;
    approval_notes: string;
    processed_by: string | null;
    processed_at: string | null;
    processing_notes: string;
  };
  new_enrollment_info: any | null;
  activity_logs: Array<{
    activity_type: string;
    title: string;
    description: string;
    performed_by: string;
    created_at: string;
  }>;
  actions_available: {
    can_approve: boolean;
    can_process: boolean;
    can_cancel: boolean;
  };
};

export type BatchChangeRequestDetailResponse = {
  status: string;
  data: BatchChangeRequestDetail;
};

export type BatchChangeRequestsResponse = {
  status: string;
  data: {
    requests: BatchChangeRequest[];
    pagination: {
      total_count: number;
      page: number;
      page_size: number;
      total_pages: number;
      has_next: boolean;
      has_previous: boolean;
      next_page: number | null;
      previous_page: number | null;
      start_index: number;
      end_index: number;
      page_range: number[];
    };
    filters: {
      status: string;
      priority: string | null;
      student_search: string | null;
    };
    summary: {
      total_requests: number;
      pending_count: number;
      approved_count: number;
    };
  };
};

export type BatchChangeRequestFilters = {
    status?: string;
    priority?: string;
    search?: string;
};

export type ApproveBatchChangeRequestPayload = {
    action: string;
    notes: string;
    processing_notes?: string;
};

export const fetchBatchChangeRequests = async (
  page: number = 1,
  pageSize: number = 10,
  filters: BatchChangeRequestFilters = {}
): Promise<BatchChangeRequestsResponse> => {
  console.log('➡️ GET batch change requests:', { page, pageSize, filters });

  const res = await http.get('/batch-change-requests/', {
    params: {
      page,
      page_size: pageSize,
      status: filters.status || 'all',
      priority: filters.priority || undefined,
      student_search: filters.search || undefined,
    },
  });

  return res.data;
};

export const fetchBatchChangeRequestDetail = async (uid: string): Promise<BatchChangeRequestDetailResponse> => {
    console.log('➡️ GET batch change request detail:', uid);
    const res = await http.get(`/batch-change-request/${uid}/`);
    return res.data;
};

export const approveBatchChangeRequest = async (uid: string, payload: ApproveBatchChangeRequestPayload) => {
    console.log('➡️ POST approve batch change request:', { uid, payload });
    const res = await http.post(`/batch-change-request/${uid}/approval/`, payload);
    return res.data;
};
