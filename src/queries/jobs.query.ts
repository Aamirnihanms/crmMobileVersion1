import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchJobs,
  fetchJobById,
  fetchCompanies,
  fetchCompanyById,
  fetchCompanyPortalUsers,
  fetchCompanyFieldTemplates,
  fetchCompanyJobs,
  createCompany,
  createPortalUser,
  createFieldTemplate,
  fetchFieldTemplateById,
  updateFieldTemplate,
  deleteFieldTemplate,
} from '../api/jobs.api';

export const useInfiniteJobs = (search: string) => {
  return useInfiniteQuery({
    queryKey: ['jobs', search],
    initialPageParam: 1,

    queryFn: ({ pageParam }) => fetchJobs(pageParam, 20, search),

    getNextPageParam: (lastPage) => {
      if (!lastPage.has_next) return undefined;
      return lastPage.page + 1;
    },
  });
};

export const useJobDetail = (uid: string) => {
  return useQuery({
    queryKey: ['job', uid],
    queryFn: () => fetchJobById(uid),
    enabled: !!uid,
  });
};

export const useInfiniteCompanies = (search: string) => {
  return useInfiniteQuery({
    queryKey: ['companies', search],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchCompanies(pageParam as number, 20, search),
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.flatMap((p) => p.results).length;
      if (loaded >= lastPage.count) return undefined;
      return allPages.length + 1;
    },
  });
};

export const useCompanyDetail = (uid: string) => {
  return useQuery({
    queryKey: ['company', uid],
    queryFn: () => fetchCompanyById(uid),
    enabled: !!uid,
  });
};

export const useCompanyPortalUsers = (uid: string) => {
  return useQuery({
    queryKey: ['company-portal-users', uid],
    queryFn: () => fetchCompanyPortalUsers(uid),
    enabled: !!uid,
  });
};

export const useCompanyFieldTemplates = (uid: string) => {
  return useQuery({
    queryKey: ['company-field-templates', uid],
    queryFn: () => fetchCompanyFieldTemplates(uid),
    enabled: !!uid,
  });
};

export const useCompanyJobs = (uid: string) => {
  return useQuery({
    queryKey: ['company-jobs', uid],
    queryFn: () => fetchCompanyJobs(uid),
    enabled: !!uid,
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
};

export const useCreatePortalUser = (companyUid: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPortalUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-portal-users', companyUid] });
    },
  });
};

export const useCreateFieldTemplate = (companyUid: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createFieldTemplate>[1]) => 
      createFieldTemplate(companyUid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-field-templates', companyUid] });
    },
  });
};

export const useFieldTemplateDetail = (companyUid: string, templateUid: string) => {
  return useQuery({
    queryKey: ['company-field-template', companyUid, templateUid],
    queryFn: () => fetchFieldTemplateById(companyUid, templateUid),
    enabled: !!companyUid && !!templateUid,
  });
};

export const useUpdateFieldTemplate = (companyUid: string, templateUid: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof updateFieldTemplate>[2]) =>
      updateFieldTemplate(companyUid, templateUid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-field-template', companyUid, templateUid] });
      queryClient.invalidateQueries({ queryKey: ['company-field-templates', companyUid] });
    },
  });
};

export const useDeleteFieldTemplate = (companyUid: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateUid: string) => deleteFieldTemplate(companyUid, templateUid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-field-templates', companyUid] });
    },
  });
};
