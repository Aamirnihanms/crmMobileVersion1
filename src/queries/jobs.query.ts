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
  updateCompany,
  deleteCompany,
  createPortalUser,
  createFieldTemplate,
  fetchFieldTemplateById,
  updateFieldTemplate,
  deleteFieldTemplate,
  createCompanyJob,
  updateJob,
  deleteJob,
  fetchJobStages,
  fetchJobApplications,
  changeApplicationStage,
  fetchJobInterviews,
  updateInterview,
  fetchJobApplicationDetail,
  createInterview,
  deleteInterview,
  fetchInterviewDetail,
  broadcastJob,
  type UpdateJobPayload,
  type FetchApplicationsParams,
  type ChangeStagePayload,
  type FetchInterviewsParams,
  type UpdateInterviewPayload,
  type CreateInterviewPayload,
  type BroadcastJobPayload,
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

export const useUpdateCompany = (uid: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof updateCompany>[1]) => updateCompany(uid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', uid] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uid: string) => deleteCompany(uid),
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

export const useCreateCompanyJob = (companyUid: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createCompanyJob>[1]) =>
      createCompanyJob(companyUid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-jobs', companyUid] });
    },
  });
};

export const useUpdateJob = (companyUid: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobUid, data }: { jobUid: string; data: UpdateJobPayload }) =>
      updateJob(companyUid, jobUid, data),
    onSuccess: (_, { jobUid }) => {
      queryClient.invalidateQueries({ queryKey: ['job', jobUid] });
      queryClient.invalidateQueries({ queryKey: ['company-jobs', companyUid] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

export const useDeleteJob = (companyUid: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobUid: string) => deleteJob(companyUid, jobUid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-jobs', companyUid] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

export const useJobStages = (companyUid: string, jobUid: string) => {
  return useQuery({
    queryKey: ['job-stages', companyUid, jobUid],
    queryFn: () => fetchJobStages(companyUid, jobUid),
    enabled: !!companyUid && !!jobUid,
  });
};

export const useInfiniteJobApplications = (
  companyUid: string,
  jobUid: string,
  stageUid: string,
  search: string,
  pageSize = 10
) => {
  return useInfiniteQuery({
    queryKey: ['job-applications', companyUid, jobUid, stageUid, search],
    initialPageParam: 1,
    enabled: !!companyUid && !!jobUid && !!stageUid,
    queryFn: ({ pageParam }) =>
      fetchJobApplications(companyUid, jobUid, {
        page: Number(pageParam),
        page_size: pageSize,
        current_stage_uid: stageUid,
        search: search || undefined,
      }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.has_next) return undefined;
      return lastPage.page + 1;
    },
  });
};

export const useChangeApplicationStage = (companyUid: string, jobUid: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationUid,
      payload,
    }: {
      applicationUid: string;
      payload: ChangeStagePayload;
    }) => changeApplicationStage(companyUid, jobUid, applicationUid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['job-applications', companyUid, jobUid],
      });
      queryClient.invalidateQueries({
        queryKey: ['job', jobUid],
      });
    },
  });
};

export const useJobApplicationDetail = (
  companyUid: string,
  jobUid: string,
  applicationUid: string
) => {
  return useQuery({
    queryKey: ['job-application-detail', companyUid, jobUid, applicationUid],
    queryFn: () => fetchJobApplicationDetail(companyUid, jobUid, applicationUid),
    enabled: !!companyUid && !!jobUid && !!applicationUid,
  });
};

export const useInfiniteJobInterviews = (
  companyUid: string,
  jobUid: string,
  search: string,
  pageSize = 30
) => {
  return useInfiniteQuery({
    queryKey: ['job-interviews', companyUid, jobUid, search],
    initialPageParam: 1,
    enabled: !!companyUid && !!jobUid,
    queryFn: ({ pageParam }) =>
      fetchJobInterviews(companyUid, jobUid, {
        page: Number(pageParam),
        page_size: pageSize,
        search: search || undefined,
      }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.has_next) return undefined;
      return lastPage.page + 1;
    },
  });
};

export const useUpdateInterview = (companyUid: string, jobUid: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationUid,
      interviewUid,
      payload,
    }: {
      applicationUid: string;
      interviewUid: string;
      payload: UpdateInterviewPayload;
    }) => updateInterview(companyUid, jobUid, applicationUid, interviewUid, payload),
    onSuccess: (_data, { applicationUid }) => {
      queryClient.invalidateQueries({
        queryKey: ['job-interviews', companyUid, jobUid],
      });
      queryClient.invalidateQueries({
        queryKey: ['job-application-detail', companyUid, jobUid, applicationUid],
      });
      queryClient.invalidateQueries({
        queryKey: ['job-interview-detail', companyUid, jobUid],
      });
    },
  });
};

export const useDeleteInterview = (companyUid: string, jobUid: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationUid,
      interviewUid,
    }: {
      applicationUid: string;
      interviewUid: string;
    }) => deleteInterview(companyUid, jobUid, applicationUid, interviewUid),
    onSuccess: (_data, { applicationUid }) => {
      queryClient.invalidateQueries({
        queryKey: ['job-interviews', companyUid, jobUid],
      });
      queryClient.invalidateQueries({
        queryKey: ['job-application-detail', companyUid, jobUid, applicationUid],
      });
    },
  });
};

export const useCreateInterview = (companyUid: string, jobUid: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationUid,
      payload,
    }: {
      applicationUid: string;
      payload: CreateInterviewPayload;
    }) => createInterview(companyUid, jobUid, applicationUid, payload),
    onSuccess: (_data, { applicationUid }) => {
      queryClient.invalidateQueries({
        queryKey: ['job-interviews', companyUid, jobUid],
      });
      queryClient.invalidateQueries({
        queryKey: ['job-application-detail', companyUid, jobUid, applicationUid],
      });
    },
  });
};

export const useInterviewDetail = (
  companyUid: string,
  jobUid: string,
  applicationUid: string,
  interviewUid: string
) => {
  return useQuery({
    queryKey: ['job-interview-detail', companyUid, jobUid, applicationUid, interviewUid],
    queryFn: () => fetchInterviewDetail(companyUid, jobUid, applicationUid, interviewUid),
    enabled: !!companyUid && !!jobUid && !!applicationUid && !!interviewUid,
  });
};

export const useBroadcastJob = (companyUid: string, jobUid: string) => {
  return useMutation({
    mutationFn: (payload: BroadcastJobPayload) =>
      broadcastJob(companyUid, jobUid, payload),
  });
};
