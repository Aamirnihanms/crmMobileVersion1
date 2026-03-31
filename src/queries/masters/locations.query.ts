import { useQuery } from '@tanstack/react-query';
import {
  fetchLocations,
  type MasterLocation,
} from '@/src/api/masters/locations.api';

export const useLocations = () =>
  useQuery<MasterLocation[]>({
    queryKey: ['masters', 'locations'],
    queryFn: fetchLocations,
    staleTime: Infinity,
    gcTime: Infinity,
  });
