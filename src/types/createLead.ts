export type CreateLeadPayload = {
  name: string;
  phone_number: string;
  whatsapp_number?: string;
  email?: string;

  counselor: number;
  lead_source: string;
  lead_status: number;

  course: number;
  course_mode: number;
  preferred_location: number;

  education_level: number;
  pass_out_year?: string;

  parent_name?: string;              // ✅ you missed this
  parent_phone_number?: string;

  reminder_date?: string;

  city?: string;
  address?: string;
  notes?: string;
};
