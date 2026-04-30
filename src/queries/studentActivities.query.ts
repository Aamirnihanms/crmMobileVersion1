import { useInfiniteQuery } from '@tanstack/react-query';
import {
  fetchStudentActivities,
  type StudentActivitiesPageResponse,
} from '../api/studentActivities.api';

export const useInfiniteStudentActivities = (studentId: string) => {
  return useInfiniteQuery<StudentActivitiesPageResponse>({
    queryKey: ['student', studentId, 'activities'],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchStudentActivities(studentId, pageParam as number),

    getNextPageParam: (lastPage) => {
      if (!lastPage.next) return undefined;
      const url = new URL(lastPage.next);
      return Number(url.searchParams.get('page'));
    },
  });
};
