import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EditEnrollmentPayload, completeFullPayment, confirmEmi, dropEnrollment, editEnrollment, fetchEmiPlans, fetchEmiPreview, fetchEnrollmentById, markInstallmentPaid, markInstallmentUnpaid, rejoinStudent, revertEmi, toggleEnrollmentAccess, updateInstallment } from '../api/enrollment.api';

export const useEnrollmentDetails = (id: string) => {
  return useQuery({
    queryKey: ['enrollment', id],
    queryFn: () => fetchEnrollmentById(id),
    enabled: !!id,
  });
};

export const useEmiPlans = () => {
  return useQuery({
    queryKey: ['emi-plans'],
    queryFn: fetchEmiPlans,
  });
};

export const useEmiPreview = () => {
  return useMutation({
    mutationFn: (payload: { enrollment_id: string; emi_plan_id: string }) =>
      fetchEmiPreview(payload),
  });
};

export const useConfirmEmi = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => confirmEmi(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enrollment', variables.enrollment_id] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student'] });
    },
  });
};

export const useCompleteFullPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => completeFullPayment(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enrollment', variables.enrollment_id] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student'] });
    },
  });
};

export const useRevertEmi = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { enrollment_id: string; confirmation: boolean }) => revertEmi(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enrollment', variables.enrollment_id] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student'] });
    },
  });
};

export const useMarkInstallmentPaid = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => markInstallmentPaid(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student'] });
    },
  });
};

export const useUpdateInstallment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateInstallment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment'] });
    },
  });
};

export const useMarkInstallmentUnpaid = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => markInstallmentUnpaid(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollment'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student'] });
    },
  });
};
export const useDropEnrollment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => dropEnrollment(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enrollment', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student'] });
    },
  });
};

export const useRejoinStudent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, payload }: { studentId: string; payload: any }) => rejoinStudent(studentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dropped-students'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment'] });
    },
  });
};

export const useToggleEnrollmentAccess = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      toggleEnrollmentAccess(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment'] });
    },
  });
};

export const useEditEnrollment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, payload }: { uid: string; payload: EditEnrollmentPayload }) =>
      editEnrollment(uid, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['enrollment', variables.uid] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['student'] });
    },
  });
};
