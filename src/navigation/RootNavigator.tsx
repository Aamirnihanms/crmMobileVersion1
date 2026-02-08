import AuthStack from './AuthStack';
import AppTabs from './BottomTabs';

export default function RootNavigator() {
  const isLoggedIn = true; // later from auth store

  return isLoggedIn ? <AppTabs /> : <AuthStack />;
}
