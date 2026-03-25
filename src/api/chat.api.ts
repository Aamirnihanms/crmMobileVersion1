import axios, { type AxiosProgressEvent } from 'axios';
import { http } from './http';

export type ChatType = 'individual' | 'group' | 'batch';

export type ChatParticipant = {
  id?: number;
  uid?: string;
  full_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  profile_pic?: string | null;
  is_active?: boolean;
  [key: string]: unknown;
};

export type ApiMessage = {
  id?: number;
  uid: string;
  chat_uid?: string;
  content?: string | null;
  message_type?: 'text' | 'file' | 'image' | 'audio' | string;
  created_at?: string;
  sender?: ChatParticipant;
  read_by?: (number | string)[];
  file_url?: string | null;
  file_name?: string | null;
  file?: string | null;
  filename?: string | null;
  url?: string | null;
  attachment_url?: string | null;
  reply_to?: string | Record<string, unknown> | null;
  reply_to_content?: Record<string, unknown> | null;
  chat?: string;
  deleted_at?: string | null;
  is_deleted?: boolean;
  is_edited?: boolean;
  [key: string]: unknown;
};

export type ApiChat = {
  uid: string;
  chat_type: ChatType;
  unread_count?: number;
  last_message_at?: string | null;
  last_message_preview?: ApiMessage | null;
  other_participant?: ChatParticipant | null;
  group_name?: string | null;
  group_description?: string | null;
  group_icon?: string | null;
  batch_name?: string | null;
  participants?: ChatParticipant[];
  [key: string]: unknown;
};

export type ChatListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: ApiChat[];
};

export type ChatListParams = {
  page?: number;
  page_size?: number;
  search?: string;
  archived_only?: boolean;
  unread_only?: boolean;
  chat_type?: ChatType;
};

export type ChatMessagesResponse = {
  status: 'success' | 'error' | string;
  messages: ApiMessage[];
  page?: number;
  page_size?: number;
  total?: number;
  has_next?: boolean;
  has_previous?: boolean;
};

export type ChatMessagesParams = {
  page?: number;
  page_size?: number;
};

export type SendMessagePayload = {
  content: string;
  message_type?: 'text' | 'file' | 'image' | 'audio' | string;
  reply_to?: string | null;
  file_url?: string;
  file_name?: string;
  [key: string]: unknown;
};

export type ActiveUser = {
  id: number;
  uid?: string;
  user_id?: number;
  full_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  profile_pic?: string | null;
  is_active?: boolean;
  [key: string]: unknown;
};

export type ActiveUsersResponse = {
  status?: string;
  users?: ActiveUser[];
  page?: number;
  total_pages?: number;
  [key: string]: unknown;
};

export type ChatStudent = {
  id?: number;
  uid?: string;
  user_id?: number;
  student_id?: string;
  full_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  profile_pic?: string | null;
  [key: string]: unknown;
};

export type ChatStudentsResponse = {
  status?: string;
  data?: {
    students?: ChatStudent[];
    pagination?: {
      current_page?: number;
      total_pages?: number;
      has_next?: boolean;
      has_previous?: boolean;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type ChatBatch = {
  uid: string;
  batch_name?: string;
  name?: string;
  [key: string]: unknown;
};

export type ChatBatchesResponse = {
  status?: string;
  batches?: ChatBatch[];
  pagination?: {
    current_page?: number;
    total_pages?: number;
    has_next?: boolean;
    has_previous?: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type PresignedUploadResponse = {
  success?: boolean;
  url?: string;
  fields?: Record<string, string>;
  final_url?: string;
  location?: string;
  s3_key?: string;
  content_type?: string;
  [key: string]: unknown;
};

export type PresignedUploadFile = {
  uri: string;
  name: string;
  type?: string;
};

export const createChat = async (data: Record<string, unknown>) => {
  const res = await http.post('/chats/individual/create/', data);
  return res.data;
};

export const createGroupChat = async (data: Record<string, unknown>) => {
  const res = await http.post('/chats/group/create/', data);
  return res.data;
};

export const addMembersToGroup = async (
  chatUid: string,
  data: Record<string, unknown>
) => {
  const res = await http.post(`/chats/${chatUid}/group/add-members/`, data);
  return res.data;
};

export const removeMembersFromGroup = async (
  chatUid: string,
  data: Record<string, unknown>
) => {
  const res = await http.post(`/chats/${chatUid}/group/remove-members/`, data);
  return res.data;
};

export const updateGroupInfo = async (
  chatUid: string,
  data: Record<string, unknown>
) => {
  const res = await http.put(`/chats/${chatUid}/group/update/`, data);
  return res.data;
};

export const leaveGroup = async (chatUid: string) => {
  const res = await http.post(`/chats/${chatUid}/group/leave/`, {});
  return res.data;
};

export const getGroupDetails = async (chatUid: string) => {
  const res = await http.get(`/chats/${chatUid}/group/`);
  return res.data;
};

export const promoteMemberToAdmin = async (
  chatUid: string,
  data: Record<string, unknown>
) => {
  const res = await http.post(`/chats/${chatUid}/group/promote-admin/`, data);
  return res.data;
};

export const demoteAdminToMember = async (
  chatUid: string,
  data: Record<string, unknown>
) => {
  const res = await http.post(`/chats/${chatUid}/group/demote-admin/`, data);
  return res.data;
};

export const getChatList = async (
  options: ChatListParams = {}
): Promise<ChatListResponse> => {
  const res = await http.get('/chats/', { params: options });
  return res.data;
};

export type ActiveUsersParams = {
  page?: number;
  page_size?: number;
  search?: string;
};

export const getAllActiveUsers = async (
  params: ActiveUsersParams = {}
): Promise<ActiveUsersResponse> => {
  const res = await http.get('/users/all-active/', { params });
  return res.data;
};

export type ChatStudentsParams = {
  page?: number;
  page_size?: number;
  search?: string;
};

export const getChatStudents = async (
  params: ChatStudentsParams = {}
): Promise<ChatStudentsResponse> => {
  const res = await http.get('/students/', { params });
  return res.data;
};

export type ChatBatchesParams = {
  page?: number;
  page_size?: number;
  search?: string;
};

export const getChatBatches = async (
  params: ChatBatchesParams = {}
): Promise<ChatBatchesResponse> => {
  const res = await http.get('/batch/?inactive=true', { params });
  return res.data;
};

export const createMessage = async (
  chatUid: string,
  data: SendMessagePayload | Record<string, unknown>
) => {
  const res = await http.post(`/chats/${chatUid}/messages/send/`, data);
  return res.data;
};

export const createMessageMultipart = async (
  chatUid: string,
  formData: FormData
) => {
  const res = await http.post(`/chats/${chatUid}/messages/send/`, formData);
  return res.data;
};

export const getMessage = async (
  chatUid: string,
  params: ChatMessagesParams = {}
): Promise<ChatMessagesResponse> => {
  const res = await http.get(`/chats/${chatUid}/messages/`, { params });
  return res.data;
};

export const createBatchChat = async (batchId: string | number) => {
  const res = await http.get(`/chats/batch/${batchId}/`);
  return res.data;
};

export const generatePresignedUploadUrl = async (
  data: Record<string, unknown>
): Promise<PresignedUploadResponse> => {
  const res = await http.post('/generate-presigned-url/', data);
  return res.data;
};

export const uploadFileToPresignedPost = async (
  presignedData: PresignedUploadResponse,
  file: PresignedUploadFile,
  onUploadProgress?: (event: AxiosProgressEvent) => void
) => {
  const formData = new FormData();
  const fields = presignedData?.fields || {};

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });

  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.type || 'application/octet-stream',
  } as unknown as Blob);

  const response = await axios.post(String(presignedData?.url || ''), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
    validateStatus: (status) => status >= 200 && status < 400,
  });

  return response;
};

export const getUploadedFileUrl = (
  uploadData: PresignedUploadResponse
): string | null => {
  const direct =
    (typeof uploadData?.final_url === 'string' && uploadData.final_url) ||
    (typeof uploadData?.location === 'string' && uploadData.location) ||
    null;
  if (direct) return direct;

  const baseUrl =
    typeof uploadData?.url === 'string' ? uploadData.url : null;
  const key =
    uploadData?.fields && typeof uploadData.fields.key === 'string'
      ? uploadData.fields.key
      : null;

  if (baseUrl && key) {
    return `${baseUrl}${baseUrl.endsWith('/') ? '' : '/'}${key}`;
  }

  return null;
};

export const markMessagesRead = async (
  chatUid: string,
  messageUids: string[]
) => {
  const res = await http.post(`/chats/${chatUid}/messages/mark-read/`, {
    message_uids: messageUids || [],
  });
  return res.data;
};

export const getChatUnreadCount = async () => {
  const res = await http.get('/chats/unread-count/');
  return res.data;
};

export const getMessageReadInfo = async (
  chatUid: string,
  messageUid: string
) => {
  const res = await http.get(`/chats/${chatUid}/messages/${messageUid}/read-info/`);
  return res.data;
};

export const editMessage = async (
  chatUid: string,
  messageUid: string,
  content: string
) => {
  const res = await http.patch(`/chats/${chatUid}/messages/${messageUid}/edit/`, {
    content,
  });
  return res.data;
};

export const deleteChatMessage = async (
  chatUid: string,
  messageUid: string
) => {
  const res = await http.delete(`/chats/${chatUid}/messages/${messageUid}/delete/`);
  return res.data;
};

export const archiveChat = async (chatUid: string) => {
  const res = await http.post(`/chats/${chatUid}/archive/`, {});
  return res.data;
};

export const unarchiveChat = async (chatUid: string) => {
  const res = await http.delete(`/chats/${chatUid}/archive/`);
  return res.data;
};

export const deleteChat = async (chatUid: string) => {
  const res = await http.delete(`/chats/${chatUid}/delete/`);
  return res.data;
};

export type BulkSendMessagePayload = {
  batch_uids: string[];
  chat_uids: string[];
  content: string;
  message_type: string;
  user_ids: number[];
};

export const bulkSendMessage = async (payload: BulkSendMessagePayload) => {
  const res = await http.post('/chats/messages/bulk/', payload);
  return res.data;
};
