import { useQuery } from '@tanstack/react-query';
import { fetchCourses } from '../../api/masters/courses.api';
import type { Course } from '../../types/course';

export const useCourses = () =>
  useQuery<Course[]>({
    queryKey: ['masters', 'courses'],
    queryFn: fetchCourses,
    staleTime: Infinity,
    gcTime: Infinity, // v5
  });
