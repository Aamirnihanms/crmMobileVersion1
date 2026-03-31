import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  convertLeadToStudent,
  fetchStudentProfile,
  fetchStudents,
  type StudentFilters,
  updateStudent,
  type StudentsPageResponse,
} from '../api/students.api';

export const useInfiniteStudents = (
  search: string,
  filters: StudentFilters
) => {
  return useInfiniteQuery<
    StudentsPageResponse,
    Error,
    StudentsPageResponse,
    ['students', string, StudentFilters],
    number
  >({
    queryKey: ['students', search, filters],
    initialPageParam: 1,

    queryFn: ({ pageParam }) =>
      fetchStudents(pageParam, 50, search, filters),

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
/* ✏️ UPDATE STUDENT MUTATION */
/* -------------------------------------------------- */

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      updateStudent(id, payload),

    onSuccess: (_data, variables) => {
      console.log('🎉 Student updated:', variables.id);

      queryClient.invalidateQueries({
        queryKey: ['students'],
      });

      queryClient.invalidateQueries({
        queryKey: ['student', variables.id],
      });
    },

    onError: (error: any) => {
      console.log('🚨 Update student failed:', error?.response?.data || error);
    },
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
