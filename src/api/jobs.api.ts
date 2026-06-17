import { http } from './http';

export type JobCompanyResponse = {
  uid: string;
  name: string;
  logo: string | null;
  website: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_active: boolean;
  portal_slug: string;
  representatives: any[];
};

export type JobResponse = {
  uid: string;
  title: string;
  description: string;
  location: string;
  is_published: boolean;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  custom_fields_count: number;
  custom_field_template_uid: string | null;
  creator: {
    source: string;
    uid: string;
    full_name: string;
    email: string;
  };
  company: JobCompanyResponse;
  applications_count: number;
  active_applications_count: number;
  is_expired: boolean;
};

export type JobsPageResponse = {
  status: string;
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  results: JobResponse[];
};

export const fetchJobs = async (
  page: number,
  pageSize = 20,
  search = ''
): Promise<JobsPageResponse> => {
  const res = await http.get('/jobs/posts/', {
    params: {
      page,
      page_size: pageSize,
      search: search || undefined,
    },
  });

  return res.data;
};

export type JobCustomField = {
  uid: string;
  job: number;
  label: string;
  key: string;
  field_type: string;
  is_required: boolean;
  options: string[] | null;
  sort_order: number;
  is_active: boolean;
};

export type JobStage = {
  uid: string;
  name: string;
  code: string;
  sort_order: number;
  is_terminal: boolean;
  is_active: boolean;
  created_at: string;
};

export type JobDetailResponse = {
  status: string;
  job: JobResponse;
  custom_fields: JobCustomField[];
  stages: JobStage[];
  company_uid: string;
};

export const fetchJobById = async (uid: string): Promise<JobDetailResponse> => {
  const res = await http.get(`/jobs/posts/${uid}/`);
  return res.data;
};

/* ─────────────────────────────────────────────
   COMPANIES
───────────────────────────────────────────── */

export type CompanyRepresentative = {
  id: number;
  uid: string;
  email: string;
  full_name: string;
  phone: string;
};

export type CompanyResponse = {
  id: number;
  uid: string;
  name: string;
  logo: string | null;
  website: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  is_active: boolean;
  representatives: CompanyRepresentative[];
  portal_slug: string;
  portal_link: string;
  created_at: string;
  updated_at: string;
};

export type CompaniesPageResponse = {
  status: string;
  count: number;
  results: CompanyResponse[];
};

export const fetchCompanies = async (
  page: number,
  pageSize = 20,
  search = ''
): Promise<CompaniesPageResponse> => {
  const res = await http.get('/jobs/companies/', {
    params: {
      page,
      page_size: pageSize,
      search: search || undefined,
    },
  });
  return res.data;
};

export type CompanyDetailResponse = {
  status: string;
  company: CompanyResponse;
};

export const fetchCompanyById = async (uid: string): Promise<CompanyDetailResponse> => {
  const res = await http.get(`/jobs/companies/${uid}/`);
  return res.data;
};

export type CompanyPortalUser = {
  id: number;
  uid: string;
  company_uid: string;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CompanyPortalUsersResponse = {
  status: string;
  company_uid: string;
  count: number;
  results: CompanyPortalUser[];
};

export const fetchCompanyPortalUsers = async (uid: string): Promise<CompanyPortalUsersResponse> => {
  const res = await http.get(`/jobs/companies/${uid}/portal-users/`);
  return res.data;
};

export type CompanyFieldTemplate = {
  uid: string;
  name: string;
  description: string;
  is_active: boolean;
  items_count: number;
  created_at: string;
  updated_at: string;
};

export type CompanyFieldTemplatesResponse = {
  status: string;
  company_uid: string;
  count: number;
  results: CompanyFieldTemplate[];
};

export const fetchCompanyFieldTemplates = async (uid: string): Promise<CompanyFieldTemplatesResponse> => {
  const res = await http.get(`/jobs/companies/${uid}/field-templates/`);
  return res.data;
};

export type TemplateItemResponse = {
  uid: string;
  label: string;
  key: string;
  field_type: string;
  is_required: boolean;
  options: string[] | null;
  sort_order: number;
  is_active: boolean;
};

export type FieldTemplateDetailResponse = {
  status: string;
  template: CompanyFieldTemplate & {
    items: TemplateItemResponse[];
  };
};

export const fetchFieldTemplateById = async (
  companyUid: string,
  templateUid: string
): Promise<FieldTemplateDetailResponse> => {
  const res = await http.get(`/jobs/companies/${companyUid}/field-templates/${templateUid}/`);
  return res.data;
};

export type CompanyJob = {
  uid: string;
  title: string;
  description: string;
  location: string;
  is_published: boolean;
  published_at: string | null;
  expires_at: string | null;
  created_at: string;
  custom_fields_count: number;
  custom_field_template_uid: string | null;
  creator: {
    source: string;
    uid: string;
    full_name: string;
    email: string;
  };
};

export type CompanyJobsResponse = {
  status: string;
  company_uid: string;
  count: number;
  results: CompanyJob[];
};

export const fetchCompanyJobs = async (uid: string): Promise<CompanyJobsResponse> => {
  const res = await http.get(`/jobs/companies/${uid}/jobs/`);
  return res.data;
};

export type CreateCompanyPayload = {
  name: string;
  portal_slug: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  logo?: { uri: string; name: string; type: string };
  representative_ids?: number[];
  is_active?: boolean;
};

export const createCompany = async (data: CreateCompanyPayload): Promise<CompanyDetailResponse> => {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('portal_slug', data.portal_slug);
  if (data.website) formData.append('website', data.website);
  if (data.contact_email) formData.append('contact_email', data.contact_email);
  if (data.contact_phone) formData.append('contact_phone', data.contact_phone);
  if (data.address) formData.append('address', data.address);
  if (data.is_active !== undefined) formData.append('is_active', String(data.is_active));
  if (data.logo) {
    formData.append('logo', { uri: data.logo.uri, name: data.logo.name, type: data.logo.type } as any);
  }
  if (data.representative_ids?.length) {
    data.representative_ids.forEach((id) => formData.append('representative_ids', String(id)));
  }
  const res = await http.post('/jobs/companies/create/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const updateCompany = async (
  uid: string,
  data: CreateCompanyPayload
): Promise<CompanyDetailResponse> => {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('portal_slug', data.portal_slug);
  if (data.website) formData.append('website', data.website);
  if (data.contact_email) formData.append('contact_email', data.contact_email);
  if (data.contact_phone) formData.append('contact_phone', data.contact_phone);
  if (data.address) formData.append('address', data.address);
  if (data.is_active !== undefined) formData.append('is_active', String(data.is_active));
  if (data.logo) {
    formData.append('logo', { uri: data.logo.uri, name: data.logo.name, type: data.logo.type } as any);
  }
  if (data.representative_ids?.length) {
    data.representative_ids.forEach((id) => formData.append('representative_ids', String(id)));
  }
  const res = await http.put(`/jobs/companies/${uid}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const deleteCompany = async (uid: string): Promise<{ status: string; message?: string }> => {
  const res = await http.delete(`/jobs/companies/${uid}/`);
  return res.data;
};

export type CreatePortalUserPayload = {
  company: number;   // company integer ID
  full_name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  is_active: boolean;
};

export type CreatePortalUserResponse = {
  status: string;
  portal_user: CompanyPortalUser;
};

export const createPortalUser = async (
  data: CreatePortalUserPayload
): Promise<CreatePortalUserResponse> => {
  const res = await http.post('/jobs/companies/portal-users/create/', data);
  return res.data;
};

export type TemplateItemPayload = {
  label: string;
  key: string;
  field_type: string;
  is_required: boolean;
  is_active: boolean;
  sort_order: number;
  options?: string[] | null;
};

export type CreateFieldTemplatePayload = {
  name: string;
  description?: string;
  is_active: boolean;
  items: TemplateItemPayload[];
};

export type CreateFieldTemplateResponse = {
  status: string;
  template: CompanyFieldTemplate;
};

export const createFieldTemplate = async (
  companyUid: string,
  data: CreateFieldTemplatePayload
): Promise<CreateFieldTemplateResponse> => {
  const res = await http.post(`/jobs/companies/${companyUid}/field-templates/`, data);
  return res.data;
};

export type UpdateTemplateItemPayload = TemplateItemPayload & {
  uid?: string;
};

export type UpdateFieldTemplatePayload = {
  name?: string;
  description?: string;
  is_active?: boolean;
  items?: UpdateTemplateItemPayload[];
};

export const updateFieldTemplate = async (
  companyUid: string,
  templateUid: string,
  data: UpdateFieldTemplatePayload
): Promise<FieldTemplateDetailResponse> => {
  const res = await http.patch(`/jobs/companies/${companyUid}/field-templates/${templateUid}/`, data);
  return res.data;
};

export const deleteFieldTemplate = async (
  companyUid: string,
  templateUid: string
): Promise<any> => {
  const res = await http.delete(`/jobs/companies/${companyUid}/field-templates/${templateUid}/`);
  return res.data;
};

export type CreateCompanyJobPayload = {
  title: string;
  description: string;
  location: string;
  expires_at: string;
  is_published: boolean;
  custom_field_template_uid: string | null;
};

export type CreateCompanyJobResponse = {
  status: string;
  job: JobResponse;
};

export const createCompanyJob = async (
  companyUid: string,
  data: CreateCompanyJobPayload
): Promise<CreateCompanyJobResponse> => {
  const res = await http.post(`/jobs/companies/${companyUid}/jobs/`, data);
  return res.data;
};

export type UpdateJobPayload = {
  title?: string;
  description?: string;
  location?: string;
  expires_at?: string;
  is_published?: boolean;
  custom_field_template_uid?: string | null;
};

export const updateJob = async (
  companyUid: string,
  jobUid: string,
  data: UpdateJobPayload
): Promise<CreateCompanyJobResponse> => {
  const res = await http.patch(`/jobs/companies/${companyUid}/jobs/${jobUid}/`, data);
  return res.data;
};

export const deleteJob = async (
  companyUid: string,
  jobUid: string
): Promise<{ status: string; message?: string }> => {
  const res = await http.delete(`/jobs/companies/${companyUid}/jobs/${jobUid}/`);
  return res.data;
};

/* ─────────────────────────────────────────────
   JOB APPLICATIONS / STAGES
───────────────────────────────────────────── */

export type JobApplication = {
  uid: string;
  job_uid: string;
  job_title: string;
  applicant_type: string;
  student_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  status: string;
  applied_at: string;
  current_stage: {
    uid: string;
    name: string;
    code: string;
  };
  resume_url: string | null;
  resume_file: string | null;
};

export type JobApplicationsResponse = {
  status: string;
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  results: JobApplication[];
  company_uid: string;
  job_uid: string;
};

export type JobStagesResponse = {
  status: string;
  job_uid: string;
  count: number;
  results: JobStage[];
};

export type FetchApplicationsParams = {
  page: number;
  page_size: number;
  current_stage_uid?: string;
  search?: string;
};

export const fetchJobStages = async (
  companyUid: string,
  jobUid: string
): Promise<JobStagesResponse> => {
  const res = await http.get(`/jobs/companies/${companyUid}/jobs/${jobUid}/stages/`);
  return res.data;
};

export const fetchJobApplications = async (
  companyUid: string,
  jobUid: string,
  params: FetchApplicationsParams
): Promise<JobApplicationsResponse> => {
  const res = await http.get(`/jobs/companies/${companyUid}/jobs/${jobUid}/applications/`, {
    params: {
      page: params.page,
      page_size: params.page_size,
      current_stage_uid: params.current_stage_uid,
      search: params.search || undefined,
    },
  });
  return res.data;
};

export type ChangeStagePayload = {
  stage_uid: string;
  note?: string;
};

export const changeApplicationStage = async (
  companyUid: string,
  jobUid: string,
  applicationUid: string,
  payload: ChangeStagePayload
): Promise<{ status: string; message?: string }> => {
  const res = await http.post(
    `/jobs/companies/${companyUid}/jobs/${jobUid}/applications/${applicationUid}/change-stage/`,
    payload
  );
  return res.data;
};

export type JobApplicationAnswer = {
  uid: string;
  field_uid: string;
  label: string;
  key: string;
  field_type: string;
  value_text: string | null;
  value_json: any[] | null;
  value_file: string | null;
};

export type StageHistoryEntry = {
  uid: string;
  from_stage: {
    uid: string;
    name: string;
    code: string;
  };
  to_stage: {
    uid: string;
    name: string;
    code: string;
  };
  note: string | null;
  changed_by: string | null;
  changed_at: string;
};

export type JobApplicationDetailResponse = {
  status: string;
  company_uid: string;
  application: {
    uid: string;
    job_uid: string;
    job_title: string;
    applicant_type: string;
    student_id: string | null;
    applicant_name: string;
    applicant_email: string;
    applicant_phone: string;
    status: string;
    applied_at: string;
    current_stage: {
      uid: string;
      name: string;
      code: string;
    };
    resume_url: string | null;
    resume_file: string | null;
    answers: JobApplicationAnswer[];
    stage_history: StageHistoryEntry[];
    interviews: any[];
    created_at: string;
    updated_at: string;
  };
};

export const fetchJobApplicationDetail = async (
  companyUid: string,
  jobUid: string,
  applicationUid: string
): Promise<JobApplicationDetailResponse> => {
  const res = await http.get(
    `/jobs/companies/${companyUid}/jobs/${jobUid}/applications/${applicationUid}/`
  );
  return res.data;
};

/* ─────────────────────────────────────────────
   JOB INTERVIEWS
───────────────────────────────────────────── */

export type JobInterview = {
  uid: string;
  stage_uid: string;
  stage_name: string;
  scheduled_at: string;
  mode: string;
  meeting_link: string | null;
  location: string | null;
  attendance: string;
  feedback: string | null;
  score: number | null;
  created_at: string;
  updated_at: string;
  application_uid: string;
  applicant_type: string;
  student_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  current_stage_name: string;
};

export type JobInterviewsResponse = {
  status: string;
  company_uid: string;
  job_uid: string;
  job_title: string;
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  results: JobInterview[];
};

export type FetchInterviewsParams = {
  page: number;
  page_size: number;
  search?: string;
};

export const fetchJobInterviews = async (
  companyUid: string,
  jobUid: string,
  params: FetchInterviewsParams
): Promise<JobInterviewsResponse> => {
  const res = await http.get(`/jobs/companies/${companyUid}/jobs/${jobUid}/interviews/`, {
    params: {
      page: params.page,
      page_size: params.page_size,
      search: params.search || undefined,
    },
  });
  return res.data;
};

export type UpdateInterviewPayload = {
  stage_uid?: string;
  scheduled_at?: string;
  mode?: 'online' | 'offline';
  meeting_link?: string | null;
  location?: string | null;
  attendance?: 'scheduled' | 'present' | 'absent' | 'rescheduled';
  feedback?: string | null;
  score?: string | null;
};

export const updateInterview = async (
  companyUid: string,
  jobUid: string,
  applicationUid: string,
  interviewUid: string,
  payload: UpdateInterviewPayload
): Promise<{ status: string; message?: string }> => {
  const res = await http.patch(
    `/jobs/companies/${companyUid}/jobs/${jobUid}/applications/${applicationUid}/interviews/${interviewUid}/`,
    payload
  );
  return res.data;
};

export type CreateInterviewPayload = {
  stage_uid: string;
  scheduled_at: string;
  mode: 'online' | 'offline';
  meeting_link?: string;
  location?: string;
  attendance: 'scheduled';
};

export const createInterview = async (
  companyUid: string,
  jobUid: string,
  applicationUid: string,
  payload: CreateInterviewPayload
): Promise<{ status: string; message?: string }> => {
  const res = await http.post(
    `/jobs/companies/${companyUid}/jobs/${jobUid}/applications/${applicationUid}/interviews/`,
    payload
  );
  return res.data;
};

export const deleteInterview = async (
  companyUid: string,
  jobUid: string,
  applicationUid: string,
  interviewUid: string
): Promise<{ status: string; message?: string }> => {
  const res = await http.delete(
    `/jobs/companies/${companyUid}/jobs/${jobUid}/applications/${applicationUid}/interviews/${interviewUid}/`
  );
  return res.data;
};

export type JobInterviewDetailResponse = {
  status: string;
  interview: JobInterview;
};

export const fetchInterviewDetail = async (
  companyUid: string,
  jobUid: string,
  applicationUid: string,
  interviewUid: string
): Promise<JobInterviewDetailResponse> => {
  const res = await http.get(
    `/jobs/companies/${companyUid}/jobs/${jobUid}/applications/${applicationUid}/interviews/${interviewUid}/`
  );
  return res.data;
};

export type BroadcastJobPayload = {
  batch_uids?: string[];
  student_ids?: string[];
  dry_run?: boolean;
  send_push?: boolean;
  title: string;
  message: string;
};

export const broadcastJob = async (
  companyUid: string,
  jobUid: string,
  payload: BroadcastJobPayload
): Promise<{ status: string; message?: string }> => {
  const res = await http.post(
    `/jobs/companies/${companyUid}/jobs/${jobUid}/broadcast/`,
    payload
  );
  return res.data;
};

