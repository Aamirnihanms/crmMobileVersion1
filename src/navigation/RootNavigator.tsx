import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef, useState } from 'react';
import { fetchProfile } from '../api/profile.api';
import { useAuthStore } from '../store/auth.store';
import { mapProfileToStoredUser } from '../utils/authUser';
import {
  deleteAuthUser,
  getAuthUser,
  getToken,
  saveAuthUser,
} from '../utils/token';
import AuthStack from './AuthStack';
import AppTabs from './BottomTabs';

/**
 * Wraps a promise with a timeout. Rejects with a timeout error if the promise
 * doesn't resolve within `ms` milliseconds.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export default function RootNavigator() {
  const { isLoggedIn, setLoggedIn, setUser } = useAuthStore();
  const [isAuthBootstrapping, setIsAuthBootstrapping] = useState(true);
  const splashHiddenRef = useRef(false);

  const hideSplash = () => {
    if (splashHiddenRef.current) return;
    splashHiddenRef.current = true;
    void SplashScreen.hideAsync();
  };

  useEffect(() => {
    // Keep the native splash visible until auth bootstrap is complete.
    // Must be called inside an effect so it runs exactly once after mount.
    void SplashScreen.preventAutoHideAsync();

    // ─── Failsafe: always hide splash after 8 seconds ───────────────────────
    // Guards against SecureStore / network hangs on a fresh iOS install that
    // would otherwise leave the splash screen up forever.
    const failsafeTimer = setTimeout(() => {
      console.warn('⚠️ Splash screen failsafe triggered — forcing hide after 8s');
      setIsAuthBootstrapping(false);
      hideSplash();
    }, 8000);

    return () => clearTimeout(failsafeTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        // ── Timeout wrapper prevents SecureStore from hanging on iOS ──────────
        // expo-secure-store can stall on a fresh install on a real device.
        let token: string | null = null;
        try {
          token = await withTimeout(getToken(), 4000);
        } catch {
          console.warn('⚠️ getToken() timed out or failed — treating as logged out');
        }

        if (!token) {
          await deleteAuthUser().catch(() => null);
          if (!isMounted) return;
          setLoggedIn(false);
          setUser(null);
          return;
        }

        if (!isMounted) return;
        setLoggedIn(true);

        const persistedUser = await getAuthUser().catch(() => null);
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
    hideSplash();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthBootstrapping]);

  if (isAuthBootstrapping) {
    return null;
  }

  return isLoggedIn ? <AppTabs /> : <AuthStack />;
}
