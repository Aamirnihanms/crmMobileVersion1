import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDiscountToStudent, deleteDiscount, fetchDiscountPolicies, fetchEnrollmentDiscounts } from '../api/discount.api';

export const useEnrollmentDiscounts = (studentId: string, enrollmentId: string) => {
  return useQuery({
    queryKey: ['enrollment-discounts', studentId, enrollmentId],
    queryFn: () => fetchEnrollmentDiscounts(studentId, enrollmentId),
    enabled: !!studentId && !!enrollmentId,
  });
};

export const useDiscountPolicies = () => {
  return useQuery({
    queryKey: ['discount-policies'],
    queryFn: fetchDiscountPolicies,
  });
};

export const useAddDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addDiscountToStudent,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enrollment-discounts'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment', variables.enrollment_id] });
      queryClient.invalidateQueries({ queryKey: ['student'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};

export const useDeleteDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment-discounts'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment'] });
      queryClient.invalidateQueries({ queryKey: ['student'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
};
