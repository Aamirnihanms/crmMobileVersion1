import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchStudents, StudentsPageResponse } from '../api/students.api';
import { useQuery } from '@tanstack/react-query';
import { fetchStudentProfile } from '../api/students.api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { convertLeadToStudent } from '../api/students.api';

export const useInfiniteStudents = (search: string) => {
  return useInfiniteQuery<
    StudentsPageResponse,
    Error,
    StudentsPageResponse,
    ['students', string],
    number
  >({
    queryKey: ['students', search],
    initialPageParam: 1,

    queryFn: ({ pageParam }) =>
      fetchStudents(pageParam, 5, search),

    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.has_next) return undefined;
      return lastPage.pagination.current_page + 1;
    },
  });
};




export const useStudentProfile = (id: string) => {
  return useQuery({
    queryKey: ['student', id],
    queryFn: () => fetchStudentProfile(id),
  });
};





/* -------------------------------------------------- */
/* 🔥 CONVERT LEAD → STUDENT MUTATION */
/* -------------------------------------------------- */

export const useConvertLeadToStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: convertLeadToStudent,

    onSuccess: (data, variables) => {
      console.log('🎉 Conversion success');

      /* -------------------------------- */
      /* REFRESH STUDENTS LIST */
      /* -------------------------------- */

      queryClient.invalidateQueries({
        queryKey: ['students'],
      });

      /* -------------------------------- */
      /* REFRESH LEADS LIST */
      /* -------------------------------- */

      queryClient.invalidateQueries({
        queryKey: ['leads'],
      });

      /* -------------------------------- */
      /* REFRESH LEAD DETAILS */
      /* -------------------------------- */

      if (variables?.lead_id) {
        queryClient.invalidateQueries({
          queryKey: ['lead', variables.lead_id],
        });
      }
    },
  });
};