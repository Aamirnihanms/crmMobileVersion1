import type { LoginResponse } from '../api/auth.api';
import type { ProfileUser } from '../api/profile.api';
import type { StoredAuthUser } from './token';

type AnyRecord = Record<string, unknown>;

const normalizeOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const getNormalizedProfilePicture = (source: AnyRecord): string | null => {
  const profilePicture =
    normalizeOptionalString(source.profile_picture) ??
    normalizeOptionalString(source.profile_pic) ??
    normalizeOptionalString(source.profileImage);

  return profilePicture ?? null;
};

export const mapLoginUserToStoredUser = (
  user: LoginResponse['user'] | null | undefined
): StoredAuthUser | null => {
  if (!user) return null;

  const source = user as LoginResponse['user'] & AnyRecord;

  return {
    uid: normalizeOptionalString(source.uid),
    email: normalizeOptionalString(source.email),
    full_name: normalizeOptionalString(source.full_name),
    phone: normalizeOptionalString(source.phone) ?? null,
    whatsapp_number: normalizeOptionalString(source.whatsapp_number) ?? null,
    profile_picture: getNormalizedProfilePicture(source),
    role: normalizeOptionalString(source.role),
    role_id: normalizeOptionalString(source.role_id),
    is_superuser:
      typeof source.is_superuser === 'boolean' ? source.is_superuser : undefined,
    groups_details: Array.isArray(source.groups_details)
      ? source.groups_details
      : undefined,
    owned_groups: Array.isArray(source.owned_groups) ? source.owned_groups : undefined,
  };
};

export const mapProfileToStoredUser = (profile: ProfileUser): StoredAuthUser => ({
  uid: profile.uid,
  email: profile.email,
  full_name: profile.full_name,
  phone: profile.phone,
  whatsapp_number: profile.whatsapp_number,
  profile_picture: profile.profile_pic,
  role:
    profile.role_details?.value ||
    profile.role_details?.label ||
    String(profile.role || ''),
  role_id:
    typeof profile.role_details?.id === 'number'
      ? String(profile.role_details.id)
      : undefined,
  is_superuser: profile.is_superuser,
  groups_details: profile.groups_details,
  owned_groups: profile.owned_groups,
});
