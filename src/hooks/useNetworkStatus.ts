import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

// How long (ms) the offline state must be stable before we show the
// NoNetworkScreen. This prevents a false-positive flash on iOS when the
// app resumes from the background — NetInfo briefly emits
// isInternetReachable=false while it re-checks connectivity.
const OFFLINE_DEBOUNCE_MS = 3000;

export function useNetworkStatus() {
  const [isOffline, setIsOffline] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAppState = useRef<AppStateStatus>(AppState.currentState);

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
    const handleNetInfoChange = (state: any) => {
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
    };

    const removeNetInfoSubscription = NetInfo.addEventListener(handleNetInfoChange);

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (
        lastAppState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App is resuming from background — briefly give it a "clean slate"
        // to re-verify connectivity before we allow an offline screen to show.
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }

        const state = await NetInfo.fetch();
        const offline =
          state.isConnected === false ||
          (state.isInternetReachable !== null && state.isInternetReachable === false);

        if (!offline) {
          setIsOffline(false);
        }
      }
      lastAppState.current = nextAppState;
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      removeNetInfoSubscription();
      appStateSubscription.remove();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return { isOffline, checkNetwork };
}
