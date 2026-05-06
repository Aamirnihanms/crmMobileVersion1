import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
    fetchEvaluationTemplates, 
    createEvaluationTemplate, 
    updateEvaluationTemplate,
    deleteEvaluationTemplate,
    CreateEvaluationTemplatePayload, 
    fetchEvaluationTemplateDetail,
    fetchGradeBands,
    fetchPlacementRules,
    createGradeBand,
    updateGradeBand,
    deleteGradeBand,
    createEvaluationModule,
    createEvaluationCriteria,
    createPlacementRule,
    updatePlacementRule,
    deletePlacementRule,
    updateEvaluationModule,
    deleteEvaluationModule,
    updateEvaluationCriteria,
    deleteEvaluationCriteria,
    fetchExamSessions,
    fetchExamAttempts,
    fetchMarkSheet,
    saveEvaluationDraft,
    submitEvaluation,
    publishEvaluation,
    fetchTemplatesByCourse,
    fetchTemplateWithModules,
    fetchExamTypes,
    createExamSession,
    fetchBatchStudents,
    CreateExamSessionPayload,
} from '../api/evaluation.api';

export const useEvaluationTemplates = () => {
    return useQuery({
        queryKey: ['evaluation-templates'],
        queryFn: fetchEvaluationTemplates,
    });
};

export const useEvaluationTemplateDetail = (uid: string) => {
    return useQuery({
        queryKey: ['evaluation-template', uid],
        queryFn: () => fetchEvaluationTemplateDetail(uid),
        enabled: !!uid,
    });
};

export const useGradeBands = (templateUid: string) => {
    return useQuery({
        queryKey: ['grade-bands', templateUid],
        queryFn: () => fetchGradeBands(templateUid),
        enabled: !!templateUid,
    });
};

export const usePlacementRules = (templateUid: string) => {
    return useQuery({
        queryKey: ['placement-rules', templateUid],
        queryFn: () => fetchPlacementRules(templateUid),
        enabled: !!templateUid,
    });
};

export const useCreateEvaluationTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateEvaluationTemplatePayload) => createEvaluationTemplate(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['evaluation-templates'] });
        },
    });
};

export const useUpdateEvaluationTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ uid, payload }: { uid: string; payload: any }) => updateEvaluationTemplate(uid, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['evaluation-templates'] });
        },
    });
};

export const useDeleteEvaluationTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (uid: string) => deleteEvaluationTemplate(uid),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['evaluation-templates'] });
        },
    });
};

export const useCreateGradeBand = (templateUid: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: any) => createGradeBand(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['grade-bands', templateUid] });
        },
    });
};

export const useUpdateGradeBand = (templateUid: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ uid, payload }: { uid: string, payload: any }) => updateGradeBand(uid, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['grade-bands', templateUid] });
        },
    });
};

export const useDeleteGradeBand = (templateUid: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (uid: string) => deleteGradeBand(uid),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['grade-bands', templateUid] });
        },
    });
};

export const useCreateEvaluationModule = (templateUid: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: any) => createEvaluationModule(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['evaluation-template', templateUid] });
        },
    });
};

export const useCreateEvaluationCriteria = (templateUid: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: any) => createEvaluationCriteria(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['evaluation-template', templateUid] });
        },
    });
};

export const useCreatePlacementRule = (templateUid: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: any) => createPlacementRule(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['placement-rules', templateUid] });
        },
    });
};

export const useUpdatePlacementRule = (templateUid: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ uid, payload }: { uid: string, payload: any }) => updatePlacementRule(uid, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['placement-rules', templateUid] });
        },
    });
};

export const useDeletePlacementRule = (templateUid: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (uid: string) => deletePlacementRule(uid),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['placement-rules', templateUid] });
        },
    });
};

export const useUpdateEvaluationModule = (templateUid: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ uid, payload }: { uid: string; payload: any }) => updateEvaluationModule(uid, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['evaluation-template', templateUid] });
        },
    });
};

export const useDeleteEvaluationModule = (templateUid: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (uid: string) => deleteEvaluationModule(uid),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['evaluation-template', templateUid] });
        },
    });
};

export const useUpdateEvaluationCriteria = (templateUid: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ uid, payload }: { uid: string; payload: any }) => updateEvaluationCriteria(uid, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['evaluation-template', templateUid] });
        },
    });
};

export const useDeleteEvaluationCriteria = (templateUid: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (uid: string) => deleteEvaluationCriteria(uid),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['evaluation-template', templateUid] });
        },
    });
};

export const useInfiniteExamSessions = (batchUid: string) => {
    return useInfiniteQuery({
        queryKey: ['exam-sessions', batchUid],
        queryFn: ({ pageParam = 1 }) => fetchExamSessions({ 
            batch_uid: batchUid, 
            page: pageParam as number, 
            page_size: 20 
        }),
        getNextPageParam: (lastPage) => {
            const pagination = lastPage.pagination;
            return pagination.has_next ? pagination.page + 1 : undefined;
        },
        enabled: !!batchUid,
        initialPageParam: 1,
    });
};

export const useInfiniteExamAttempts = (sessionUid: string) => {
    return useInfiniteQuery({
        queryKey: ['exam-attempts', sessionUid],
        queryFn: ({ pageParam = 1 }) => fetchExamAttempts({ 
            exam_session_uid: sessionUid, 
            page: pageParam as number, 
            page_size: 20 
        }),
        getNextPageParam: (lastPage) => {
            const pagination = lastPage.pagination;
            return pagination.has_next ? pagination.page + 1 : undefined;
        },
        enabled: !!sessionUid,
        initialPageParam: 1,
    });
};

export const useMarkSheet = (attemptUid: string) => {
    return useQuery({
        queryKey: ['mark-sheet', attemptUid],
        queryFn: () => fetchMarkSheet(attemptUid),
        enabled: !!attemptUid,
    });
};

export const useSaveEvaluationDraft = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ attemptUid, payload }: { attemptUid: string; payload: any }) => 
            saveEvaluationDraft(attemptUid, payload),
        onSuccess: (_, { attemptUid }) => {
            queryClient.invalidateQueries({ queryKey: ['mark-sheet', attemptUid] });
        },
    });
};

export const useSubmitEvaluation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (attemptUid: string) => submitEvaluation(attemptUid),
        onSuccess: (_, attemptUid) => {
            queryClient.invalidateQueries({ queryKey: ['mark-sheet', attemptUid] });
            queryClient.invalidateQueries({ queryKey: ['exam-attempts'] });
        },
    });
};

export const usePublishEvaluation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (attemptUid: string) => publishEvaluation(attemptUid),
        onSuccess: (_, attemptUid) => {
            queryClient.invalidateQueries({ queryKey: ['mark-sheet', attemptUid] });
            queryClient.invalidateQueries({ queryKey: ['exam-attempts'] });
        },
    });
};

/* ---------- EXAM SESSION CREATE HOOKS ---------- */

export const useTemplatesByCourse = (courseId: number) => {
    return useQuery({
        queryKey: ['templates-by-course', courseId],
        queryFn: () => fetchTemplatesByCourse(courseId),
        enabled: !!courseId,
    });
};

export const useTemplateWithModules = (templateUid: string) => {
    return useQuery({
        queryKey: ['template-modules', templateUid],
        queryFn: () => fetchTemplateWithModules(templateUid),
        enabled: !!templateUid,
    });
};

export const useExamTypes = () => {
    return useQuery({
        queryKey: ['exam-types'],
        queryFn: fetchExamTypes,
    });
};

export const useBatchStudents = (batchUid: string) => {
    return useQuery({
        queryKey: ['batch-students', batchUid],
        queryFn: () => fetchBatchStudents(batchUid),
        enabled: !!batchUid,
    });
};

export const useCreateExamSession = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: CreateExamSessionPayload) => createExamSession(payload),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ['exam-sessions', vars.batch_uid] });
        },
    });
};
