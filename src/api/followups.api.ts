import { http } from './http';

/* ---------- TYPES ---------- */

export type FollowUpLeadInfo = {
  id: string;
  name: string;
  phone_number: string;
  email: string | null;
  lead_status: number;
  lead_status_name: string;
  reminder_date: string | null;
};

export type FollowUpUser = {
  id: number;
  full_name: string;
  email: string;
  uid: string;
};

export type FollowUpImportance =
  | 'LOW'
  | 'NORMAL'
  | 'HIGH'
  | 'URGENT'
  | 'IMPORTANT';

export type FollowUp = {
  id: number;
  lead: FollowUpLeadInfo;
  date: string;
  notes: string;
  next_follow_up_date: string;
  status: 'pending' | 'completed';
  importance: FollowUpImportance;
  created_by: FollowUpUser;
  modified_by: FollowUpUser | null;
};

export type FollowUpsPageResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: FollowUp[];
  counts: {
    total: number;
    today: number;
    upcoming: number;
    overdue: number;
  };
};

/* ---------- API ---------- */

export const fetchLeadFollowUps = async (
  leadId: string,
  page: number
): Promise<FollowUpsPageResponse> => {
  const res = await http.get<FollowUpsPageResponse>(
    `/followups/`,
    {
      params: {
        lead: leadId,
        page
      },
    }
  );

  return res.data;
};

export const fetchMyFollowUps = async (
  userUid: string,
  page: number,
  pageSize: number = 10,
  filters: {
    today_followups?: boolean;
    overdue_followups?: boolean;
    upcoming_followups?: boolean;
  }
): Promise<FollowUpsPageResponse> => {
  const res = await http.get<FollowUpsPageResponse>(
    `/followups/`,
    {
      params: {
        user_uid: userUid,
        page,
        page_size: pageSize,
        ...filters,
      },
    }
  );

  return res.data;
};


// create
export type CreateFollowUpPayload = {
  lead: string; // lead id
  notes: string;
  next_follow_up_date: string; // ISO
  importance: FollowUpImportance;
  status: 'pending' | 'completed';
};

export const createLeadFollowUp = async (
  payload: CreateFollowUpPayload
) => {
  try {
    // 🔍 LOG REQUEST PAYLOAD
    console.log('➡️ POST /followups payload:', payload);

    const res = await http.post('/followups/', payload);

    // ✅ LOG SUCCESS RESPONSE
    console.log('✅ POST /followups success:', res.data);

    return res.data;
  } catch (error: any) {
    const status = error?.response?.status;
    const rawErrorText = JSON.stringify(error?.response?.data || '').toLowerCase();
    const shouldRetryWithLegacyHigh =
      status === 400 &&
      payload.importance === 'HIGH' &&
      rawErrorText.includes('importance');

    if (shouldRetryWithLegacyHigh) {
      const retryPayload = {
        ...payload,
        importance: 'IMPORTANT',
      };

      const retryRes = await http.post('/followups/', retryPayload);
      return retryRes.data;
    }

    // ❌ LOG ERROR RESPONSE (VERY IMPORTANT)
    console.error('❌ POST /followups failed');

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }

    // 🚨 IMPORTANT: rethrow so TanStack Query can handle rollback
    throw error;
  }
};

// update
export type UpdateFollowUpPayload = {
  status: 'completed' | 'postponed' | 'canceled';
  lead: string;
  notes: string;
  importance: FollowUpImportance;
  next_follow_up_date: string;

  // completed-only fields
  follow_up_methods?: ('phone' | 'whatsapp')[];
  call_duration?: string;
  whatsapp_message?: string;
  remark?: string;
};

export const updateFollowUpStatus = async (
  followupId: number,
  payload: UpdateFollowUpPayload
) => {
  console.log('➡️ PUT /followups/', followupId, payload);

  const res = await http.put(
    `/followups/${followupId}/`,
    payload
  );

  console.log('✅ Follow-up updated:', res.data);
  return res.data;
};
