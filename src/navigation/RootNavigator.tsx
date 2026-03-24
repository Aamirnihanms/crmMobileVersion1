import React, { useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { getToken } from '../utils/token';
import AuthStack from './AuthStack';
import AppTabs from './BottomTabs';

export default function RootNavigator() {
  const { isLoggedIn, setLoggedIn } = useAuthStore();

  useEffect(() => {
    const checkToken = async () => {
      const token = await getToken();
      if (token) {
        setLoggedIn(true);
      }
    };
    checkToken();
  }, []);

  return isLoggedIn ? <AppTabs /> : <AuthStack />;
}
