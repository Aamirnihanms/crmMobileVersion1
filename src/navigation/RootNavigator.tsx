import React, { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { fetchProfile, type ProfileUser } from '../api/profile.api';
import { useAuthStore } from '../store/auth.store';
import {
  deleteAuthUser,
  getAuthUser,
  getToken,
  saveAuthUser,
  type StoredAuthUser,
} from '../utils/token';
import AuthStack from './AuthStack';
import AppTabs from './BottomTabs';

// Keep the native splash visible until auth bootstrap is complete.
void SplashScreen.preventAutoHideAsync();

const mapProfileToStoredUser = (profile: ProfileUser): StoredAuthUser => ({
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

export default function RootNavigator() {
  const { isLoggedIn, setLoggedIn, setUser } = useAuthStore();
  const [isAuthBootstrapping, setIsAuthBootstrapping] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const syncProfileFromApi = async () => {
      try {
        const profile = await fetchProfile();
        const mappedUser = mapProfileToStoredUser(profile);
        if (!isMounted) return;
        setUser(mappedUser);
        await saveAuthUser(mappedUser);
      } catch {
        // Keep persisted user fallback when profile refresh fails.
      }
    };

    const bootstrapAuth = async () => {
      try {
        const token = await getToken();

        if (!token) {
          await deleteAuthUser();
          if (!isMounted) return;
          setLoggedIn(false);
          setUser(null);
          return;
        }

        if (!isMounted) return;
        setLoggedIn(true);

        const persistedUser = await getAuthUser();
        if (persistedUser) {
          if (!isMounted) return;
          setUser(persistedUser);
          void syncProfileFromApi();
          return;
        }

        await syncProfileFromApi();
      } finally {
        if (isMounted) {
          setIsAuthBootstrapping(false);
        }
      }
    };

    void bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, [setLoggedIn, setUser]);

  useEffect(() => {
    if (isAuthBootstrapping) return;
    void SplashScreen.hideAsync();
  }, [isAuthBootstrapping]);

  if (isAuthBootstrapping) {
    return null;
  }

  return isLoggedIn ? <AppTabs /> : <AuthStack />;
}
