import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchProfile, updateProfile } from '../api/profile.api';

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};
