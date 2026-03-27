import type { CreateLeadPayload } from '../types/createLead';
import { http } from './http';

/* ------------------ LEAD TYPE ------------------ */
export type LeadResponse = {
  id: string;
  name: string | null;
  phone_number: string;
  email: string | null;
  city: string;
  created_at: string;

  lead_status_details: {
    id: number;
    name: string;
    value: string;
    color: string;
  };

  lead_source_details: {
    id: string;
    label: string;
    value: string;
  } | null;

  counselor_details: {
    id: number;
    uid: string;
    full_name: string;
    email: string;
    phone: string;
  } | null;

  followup_count: number;
  pending_followups: number;
  completed_followups: number;
};

/* ------------------ PAGINATION TYPE ------------------ */
export type LeadsPageResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: LeadResponse[];
};

/* ------------------ API CALL ------------------ */

export const fetchLeads = async (
  page: number,
  pageSize = 5,
  search = '',
  filters?: LeadsFilters
): Promise<LeadsPageResponse> => {
  const res = await http.get('/leads/', {
    params: {
      page,
      page_size: pageSize,
      search: search || undefined,
      ...filters, // 🔥 THIS ENABLES FILTERING
    },
  });

  return res.data;
};

/* ---------- LEAD DETAIL TYPES ---------- */

export type LeadStatusDetails = {
  id: number;
  name: string;
  value: string;
  color: string;
  is_active: boolean;
  provide_link: boolean;
};

export type LeadSourceDetails = {
  id: string;
  label: string;
  value: string;
};

export type CounselorDetails = {
  id: number;
  uid: string;
  full_name: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  profile_pic: string | null;
};

export type CourseDetails = {
  id: number;
  course_name: string;
  course_fee: string;
  course_fee_discount: string;
  admission_fee: string;
  course_mode_details: {
    id: number;
    name: string;
    value: string;
  }[];
  location_details: {
    id: number;
    name: string;
    value: string;
  }[];
};

export type LeadDetail = {
  id: string;
  name: string;
  phone_number: string;
  whatsapp_number: string;
  email: string | null;
  city: string;

  lead_status_details: LeadStatusDetails;
  lead_source_details: LeadSourceDetails | null;
  counselor_details: CounselorDetails | null;
  course_details: CourseDetails | null;

  followup_count: number;
  pending_followups: number;
  completed_followups: number;

  created_at: string;
  is_editable: boolean;
  is_deletable: boolean;
};

export type LeadDetailResponse = {
  status: 'success';
  lead: LeadDetail;
};

export type LeadsFilters = {
  course?: string;
  counselor?: string;
  qualification?: string;
  lead_status?: string;
  lead_source?: string;
};


/* ------------------ API CALL ------------------ */
export const fetchLeadById = async (
  id: string
): Promise<LeadDetail> => {
  const res = await http.get<LeadDetailResponse>(`/leads/${id}/`);
  return res.data.lead;
};


// create lead
export const createLead = async (
  payload: CreateLeadPayload
) => {
  try {
    console.log('➡️ POST /leads payload:', payload);

    const res = await http.post('/leads/', payload);

    console.log('✅ POST /leads success:', res.data);

    return res.data;
  } catch (error: any) {
    console.log('❌ POST /leads error:', error?.response?.data || error);

    throw error; // VERY IMPORTANT so mutation detects error
  }
};

export const updateLead = async (
  id: string,
  payload: Partial<CreateLeadPayload>
) => {
  try {
    console.log(`➡️ PUT /leads/${id}/ payload:`, payload);

    const res = await http.put(`/leads/${id}/`, payload);

    console.log(`✅ PUT /leads/${id}/ success:`, res.data);

    return res.data;
  } catch (error: any) {
    console.log(
      `❌ PUT /leads/${id}/ error:`,
      error?.response?.data || error
    );

    throw error;
  }
};
