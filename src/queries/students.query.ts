import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import {
  addNewEnrollment,
  convertLeadToStudent,
  enableDisableStudent,
  fetchStudentProfile,
  fetchStudents,
  fetchDroppedStudents,
  updateStudent,
  type NewEnrollmentPayload,
  type StudentFilters,
  type StudentsPageResponse,
  type DroppedStudentsPageResponse,
} from '../api/students.api';

export const useInfiniteStudents = (
  search: string,
  filters: StudentFilters,
  enabled: boolean = true
) => {
  return useInfiniteQuery<
    StudentsPageResponse,
    Error,
    InfiniteData<StudentsPageResponse>,
    ['students', string, StudentFilters],
    number
  >({
    queryKey: ['students', search, filters],
    initialPageParam: 1,
    enabled,
    queryFn: ({ pageParam }) =>
      fetchStudents(pageParam, 50, search, filters),

    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination.has_next) return undefined;
      return lastPage.pagination.current_page + 1;
    },
  });
};

export const useInfiniteDroppedStudents = (
  search: string,
  filters: any = {},
  enabled: boolean = true
) => {
  return useInfiniteQuery<
    DroppedStudentsPageResponse,
    Error,
    InfiniteData<DroppedStudentsPageResponse>,
    ['dropped-students', string, any],
    number
  >({
    queryKey: ['dropped-students', search, filters],
    initialPageParam: 1,
    enabled,
    queryFn: ({ pageParam }) =>
      fetchDroppedStudents(pageParam, 25, search, filters),

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
    enabled: !!id,
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
      /* LEAD DETAILS NO LONGER EXISTS */
      /* -------------------------------- */

      if (variables?.lead_id) {
        queryClient.removeQueries({
          queryKey: ['lead', variables.lead_id],
          exact: true,
        });
      }
    },
  });
};


/* -------------------------------------------------- */
/* 🔄 ENABLE / DISABLE STUDENT MUTATION */
/* -------------------------------------------------- */

export const useEnableDisableStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { student_id: string; status: 'enable' | 'disable' }) =>
      enableDisableStudent(payload),

    onSuccess: (_data, variables) => {
      console.log('🎉 Student status changed:', variables.student_id, variables.status);

      queryClient.invalidateQueries({
        queryKey: ['students'],
      });

      queryClient.invalidateQueries({
        queryKey: ['student'],
      });
    },

    onError: (error: any) => {
      console.log('🚨 Enable/Disable student failed:', error?.response?.data || error);
    },
  });
};


/* -------------------------------------------------- */
/* 🎓 ADD NEW ENROLLMENT MUTATION */
/* -------------------------------------------------- */

export const useAddNewEnrollment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: NewEnrollmentPayload) =>
      addNewEnrollment(payload),

    onSuccess: (_data, variables) => {
      console.log('🎉 New enrollment created for:', variables.student_id);

      queryClient.invalidateQueries({
        queryKey: ['students'],
      });

      queryClient.invalidateQueries({
        queryKey: ['student'],
      });
    },

    onError: (error: any) => {
      console.log('🚨 New enrollment failed:', error?.response?.data || error);
    },
  });
};
