import { useEffect, useState, useCallback, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';

// How long (ms) the offline state must be stable before we show the
// NoNetworkScreen. This prevents a false-positive flash on iOS when the
// app resumes from the background — NetInfo briefly emits
// isInternetReachable=false while it re-checks connectivity.
const OFFLINE_DEBOUNCE_MS = 1500;

export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkNetwork = useCallback(async () => {
    const state = await NetInfo.fetch();
    // Treat isInternetReachable=null as "still checking" (not offline).
    const offline =
      state.isConnected === false ||
      (state.isInternetReachable !== null && state.isInternetReachable === false);
    setIsOffline(offline);
    return !offline; // Returns true if online
  }, []);

  useEffect(() => {
    const removeNetInfoSubscription = NetInfo.addEventListener((state) => {
      // isInternetReachable=null means NetInfo hasn't finished its reachability
      // check yet (common right after the app resumes from the background on iOS).
      // Treat null as "online" so we never flash the NoNetworkScreen prematurely.
      const offline =
        state.isConnected === false ||
        (state.isInternetReachable !== null && state.isInternetReachable === false);

      if (!offline) {
        // Back online — clear any pending debounce and immediately show the app.
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
        setIsOffline(false);
      } else {
        // Potentially offline — wait before showing the error screen so that
        // a transient state (app wake-up, network handoff) doesn't cause a flash.
        if (debounceTimerRef.current) return; // already waiting
        debounceTimerRef.current = setTimeout(() => {
          debounceTimerRef.current = null;
          setIsOffline(true);
        }, OFFLINE_DEBOUNCE_MS);
      }
    });

    return () => {
      removeNetInfoSubscription();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return { isOffline, checkNetwork };
}
