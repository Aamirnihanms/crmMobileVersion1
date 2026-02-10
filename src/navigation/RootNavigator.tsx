import { useAuthStore } from '../store/auth.store';
import AuthStack from './AuthStack';
import AppTabs from './BottomTabs';

export default function RootNavigator() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  return isLoggedIn ? <AppTabs /> : <AuthStack />;
}
