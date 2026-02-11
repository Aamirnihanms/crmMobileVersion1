import { http } from './http';

export type LeadNote = {
  id: string;
  lead: string;
  content: string;
  importance:  'NORMAL' | 'IMPORTANT' | 'URGENT';
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  time_since_created: string;
  time_since_edited?: string;
  created_by_details: {
    full_name: string;
    email: string;
  };
};

export type LeadNotesPageResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    status: string;
    notes: LeadNote[];
  };
};

export const fetchLeadNotes = async (
  leadId: string,
  page: number
): Promise<LeadNotesPageResponse> => {
  const res = await http.get(`/leads/${leadId}/notes`, {
    params: { page },
  });

  return res.data;
};

// create note
export type NoteImportance =
  | 'IMPORTANT'
  | 'NORMAL'
  | 'URGENT';

export type CreateNotePayload = {
  content: string;
  importance: NoteImportance;
};

export const createLeadNote = async (
  leadId: string,
  payload: CreateNotePayload
) => {
  console.log('➡️ POST create note', payload);

  const res = await http.post(
    `/leads/${leadId}/notes/create/`,
    payload
  );

  console.log('✅ Note created', res.data);
  return res.data;
};

export const updateLeadNote = async (
  noteId: string,
  payload: CreateNotePayload
) => {
  console.log('➡️ PUT update note', payload);

  const res = await http.put(
    `/notes/${noteId}/`,
    payload
  );

  console.log('✅ Note updated', res.data);
  return res.data;
};

