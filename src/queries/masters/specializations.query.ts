import { useQuery } from '@tanstack/react-query';
import {
    fetchSpecializations,
    type Specialization,
} from '../../api/masters/specializations.api';

export const useSpecializations = () =>
    useQuery<Specialization[]>({
        queryKey: ['masters', 'specializations'],
        queryFn: fetchSpecializations,
        staleTime: Infinity,
        gcTime: Infinity,
    });
