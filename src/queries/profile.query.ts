import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchProfile, updateProfile } from '../api/profile.api';
import { useAuthStore } from '../store/auth.store';
import { mapProfileToStoredUser } from '../utils/authUser';
import { saveAuthUser } from '../utils/token';

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: async (updatedProfile) => {
      const mappedUser = mapProfileToStoredUser(updatedProfile);

      setUser(mappedUser);
      try {
        await saveAuthUser(mappedUser);
      } catch {
        // Keep in-memory user updated even if secure persistence fails.
      }
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};
