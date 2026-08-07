import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { getErrorMessage } from '../utils/error';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error: any, query) => {
      // Only show error for queries that have no local data (initial fetch) 
      // and only after retries are exhausted
      if (query.state.data === undefined && query.state.status === 'error') {
        // Debounce or prevent multiple alerts if many queries fail at once
        Alert.alert('Data Load Error', getErrorMessage(error));
      }
    }
  }),
  mutationCache: new MutationCache({
    onError: (error: any, _variables, _context, mutation) => {
      // If the mutation has a local onError, it's handling the error itself!
      // This prevents double error alerts.
      if (mutation.options.onError) return;
      
      Alert.alert('Action Failed', getErrorMessage(error));
    },
  }),
});
