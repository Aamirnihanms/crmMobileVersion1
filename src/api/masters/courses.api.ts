import { http } from '../http';
import type { Course } from '../../types/course';

type CoursesResponse = {
  status: string;
  courses: Course[];
};

export const fetchCourses = async (): Promise<Course[]> => {
  const res = await http.get<CoursesResponse>('/courses/');
  return res.data.courses;
};
