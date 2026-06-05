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

