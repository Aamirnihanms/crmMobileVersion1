import { http } from './http';

export type UserRoleDetails = {
  id: number;
  label: string;
  value: string;
};

export type ProfileUser = {
  id: number;
  uid: string;
  full_name: string;
  email: string;
  phone: string | null;
  whatsapp_number: string | null;
  is_active: boolean;
  phone_verified: boolean;
  created_at: string;
  updated_at: string;
  role: number;
  role_details: UserRoleDetails | null;
  is_staff: boolean;
  is_superuser: boolean;
  groups_details: unknown[];
  last_login: string | null;
  fcm_token: string | null;
  profile_pic: string | null;
  phone_country_code: string | null;
  whatsapp_number_country_code: string | null;
  owned_groups: unknown[];
  branch: { id?: number; name?: string } | string | null;
};

type ProfileResponse = {
  status: string;
  user: ProfileUser;
};

export type UpdateProfilePayload = {
  full_name?: string;
  email?: string;
  phone?: string;
  whatsapp_number?: string;
  phone_country_code?: string;
  whatsapp_number_country_code?: string;
  profile_pic?: {
    uri: string;
    name: string;
    type: string;
  } | null;
};

export const fetchProfile = async (): Promise<ProfileUser> => {
  const res = await http.get<ProfileResponse>('/profile/');
  return res.data.user;
};

export const updateProfile = async (payload: UpdateProfilePayload): Promise<ProfileUser> => {
  const formData = new FormData();

  if (payload.full_name) formData.append('full_name', payload.full_name);
  if (payload.email) formData.append('email', payload.email);
  if (payload.phone) formData.append('phone', payload.phone);
  if (payload.whatsapp_number) formData.append('whatsapp_number', payload.whatsapp_number);
  if (payload.phone_country_code) formData.append('phone_country_code', payload.phone_country_code);
  if (payload.whatsapp_number_country_code) {
    formData.append('whatsapp_number_country_code', payload.whatsapp_number_country_code);
  }

  if (payload.profile_pic) {
    // @ts-ignore
    formData.append('profile_pic', {
      uri: payload.profile_pic.uri,
      name: payload.profile_pic.name,
      type: payload.profile_pic.type,
    });
  }

  const res = await http.patch<ProfileResponse>('/profile/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data.user;
};
