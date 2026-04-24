import { http } from './http';

/* ---------- TYPES ---------- */

export type StudentBatch = {
  uid: string;
  name: string;
  course: string;
  start_date: string;
  status: string;

  enrollment_status: {
    name: string;
    value: string;
    color: string;
  };

  admission_counsellor: string;

  attendance_mode: {
    id: string;
    name: string;
    value: string;
  };
};

export type StudentResponse = {
  uid: string;
  student_id: string;
  full_name: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  batches: StudentBatch[];
  location: string;
  profile_pic: string | null;
  is_active: boolean;

  lead_source?: {
    source_name: string;
  };
};

export type StudentsPageResponse = {
  students: StudentResponse[];
  pagination: {
    current_page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
};

export type StudentFilters = {
  course_id?: string;
  counselor?: string;
  trainer?: string;
  academic_counselor?: string;
  batch?: string;
  location?: string;
};

/* ---------- API ---------- */

export const fetchStudents = async (
  page: number,
  pageSize = 50,
  search = '',
  filters?: StudentFilters
): Promise<StudentsPageResponse> => {
  const params = {
    page,
    page_size: pageSize,
    search: search || undefined,
    ...filters,
  };

  const res = await http.get('/students/', {
    params,
  });

  // 🔥 IMPORTANT — unwrap API response
  return res.data.data;
};


export type StudentProfileResponse = {
  status: string;
  message: string;
  student: any;
};

export const fetchStudentProfile = async (id: string) => {
  const res = await http.get<StudentProfileResponse>(
    `/student/profile/${id}/`
  );

  return res.data.student;
};




/* ---------------- UPDATE STUDENT PROFILE ---------------- */

export const updateStudent = async (
  id: string,
  payload: any
) => {
  try {
    console.log(`➡️ PATCH /student/profile/${id}/update/ payload:`, payload);

    const res = await http.patch(
      `/student/profile/${id}/update/`,
      payload
    );

    console.log(`✅ PATCH /student/profile/${id}/update/ success:`, res.data);

    return res.data;
  } catch (error: any) {
    console.log(
      `❌ PATCH /student/profile/${id}/update/ error:`,
      error?.response?.data || error
    );
    throw error;
  }
};


/* ---------------- CONVERT LEAD → STUDENT ---------------- */

export const convertLeadToStudent = async (payload: any) => {
  console.log('🚀 CONVERTING LEAD TO STUDENT:', JSON.stringify(payload, null, 2));

  try {
    const res = await http.post(
      '/lead-to-student-conversion/',
      payload
    );

    console.log('✅ Lead converted:', res.data);

    return res.data;
  } catch (err: any) {
    console.log(
      '❌ Convert Lead Error:',
      err?.response?.data || err
    );
    throw err;
  }
};


/* ---------------- ENABLE / DISABLE STUDENT ---------------- */

export const enableDisableStudent = async (payload: {
  student_id: string;
  status: 'enable' | 'disable';
}) => {
  try {
    console.log('➡️ POST /students/enable-and-disable/ payload:', payload);

    const res = await http.post(
      '/students/enable-and-disable/',
      payload
    );

    console.log('✅ Enable/Disable student success:', res.data);

    return res.data;
  } catch (error: any) {
    console.log(
      '❌ Enable/Disable student error:',
      error?.response?.data || error
    );
    throw error;
  }
};


/* ---------------- ADD NEW ENROLLMENT ---------------- */

export type NewEnrollmentPayload = {
  student_id: string;
  batch_id: string;
  attendance_mode_id: string;
  admission_counselor_id: string;
  payment_method?: string;
  payment_reference?: string;
  payment_type?: string;
};

export const addNewEnrollment = async (payload: NewEnrollmentPayload) => {
  try {
    console.log('➡️ POST /add-new-enrollment/ payload:', payload);

    const res = await http.post(
      '/add-new-enrollment/',
      payload
    );

    console.log('✅ New enrollment created:', res.data);

    return res.data;
  } catch (error: any) {
    console.log(
      '❌ New enrollment error:',
      error?.response?.data || error
    );
    throw error;
  }
};


/* ---------------- DROPPED STUDENTS ---------------- */

export type DroppedStudent = {
  uid: string;
  student_id: string;
  full_name: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profile_pic: string | null;
  dropped_enrollments_count: number;
  total_enrollments: number;
  college: string;
  pass_out_year: number | null;
  specialization: string;
  admission_date: string;
  qualification: string | null;
  preferred_location: string;
  current_status: {
    name: string;
    value: string;
    color: string;
  };
  admission_counselor: {
    uid: string;
    name: string;
    email: string;
  };
  dropped_enrollments: Array<{
    uid: string;
    enrollment_number: string;
    enrollment_date: string;
    last_updated: string;
    batch: {
      uid: string;
      name: string;
      course: string;
    };
    status: {
      name: string;
      value: string;
      color: string;
    };
    batch_dates: {
      start_date: string;
      end_date: string;
    };
    financial: {
      amount_paid: number;
      pending_amount: number;
    };
    payment_type: string;
    source: string;
    drop_notes: string;
  }>;
  active_enrollments_count: number;
  active_enrollments?: Array<any>;
};

export type DroppedStudentsPageResponse = {
  students: DroppedStudent[];
  pagination: {
    current_page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
  summary_stats?: any;
};

export const fetchDroppedStudents = async (
  page: number,
  pageSize = 25,
  search = '',
  filters?: any
): Promise<DroppedStudentsPageResponse> => {
  const params = {
    page,
    page_size: pageSize,
    search: search || undefined,
    ...filters,
  };

  const res = await http.get('/dropped-students/', {
    params,
  });

  return res.data.data;
};
