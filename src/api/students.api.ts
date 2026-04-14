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
