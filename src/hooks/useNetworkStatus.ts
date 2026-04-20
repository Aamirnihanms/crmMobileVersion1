import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState(false);

  const checkNetwork = useCallback(async () => {
    const state = await NetInfo.fetch();
    const offline = state.isConnected === false || state.isInternetReachable === false;
    setIsOffline(offline);
    return !offline; // Returns true if online
  }, []);

  useEffect(() => {
    const removeNetInfoSubscription = NetInfo.addEventListener((state) => {
      // We consider the user offline if isConnected is false or isInternetReachable is false.
      // Sometimes isConnected is true (connected to wifi) but isInternetReachable is false.
      const offline = state.isConnected === false || state.isInternetReachable === false;
      setIsOffline(offline);
    });

    return () => {
      removeNetInfoSubscription();
    };
  }, []);

  return { isOffline, checkNetwork };
}
