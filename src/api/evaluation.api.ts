import { http } from './http';

export type EvaluationTemplate = {
    uid: string;
    name: string;
    course_id: number;
    course_name: string;
    version: number;
    is_active: boolean;
    is_locked: boolean;
    effective_from: string;
    effective_to: string | null;
    created_at: string;
};

export type CreateEvaluationTemplatePayload = {
    course: number;
    effective_from: string;
    is_active: boolean;
    name: string;
    version: number;
};

export const fetchEvaluationTemplates = async (): Promise<EvaluationTemplate[]> => {
    const res = await http.get('/evaluation/templates/');
    return res.data.data || [];
};

export const fetchEvaluationTemplateDetail = async (uid: string): Promise<any> => {
    const res = await http.get(`/evaluation/templates/${uid}/`);
    return res.data.data;
};

export const fetchGradeBands = async (templateUid: string): Promise<any[]> => {
    const res = await http.get('/evaluation/grade-bands/', { params: { template_uid: templateUid } });
    return res.data.data || [];
};

export const fetchPlacementRules = async (templateUid: string): Promise<any[]> => {
    const res = await http.get('/evaluation/placement-rules/', { params: { template_uid: templateUid } });
    return res.data.data || [];
};

export const createEvaluationTemplate = async (payload: CreateEvaluationTemplatePayload): Promise<any> => {
    const res = await http.post('/evaluation/templates/create/', payload);
    return res.data;
};

export const updateEvaluationTemplate = async (uid: string, payload: any): Promise<any> => {
    const res = await http.patch(`/evaluation/templates/${uid}/`, payload);
    return res.data;
};

export const deleteEvaluationTemplate = async (uid: string): Promise<any> => {
    const res = await http.delete(`/evaluation/templates/${uid}/`);
    return res.data;
};

export const createGradeBand = async (payload: any): Promise<any> => {
    const res = await http.post('/evaluation/grade-bands/', payload);
    return res.data;
};

export const updateGradeBand = async (uid: string, payload: any): Promise<any> => {
    const res = await http.patch(`/evaluation/grade-bands/${uid}/`, payload);
    return res.data;
};

export const deleteGradeBand = async (uid: string): Promise<any> => {
    const res = await http.delete(`/evaluation/grade-bands/${uid}/`);
    return res.data;
};

export const createEvaluationModule = async (payload: any): Promise<any> => {
    const res = await http.post('/evaluation/modules/', payload);
    return res.data;
};

export const createEvaluationCriteria = async (payload: any): Promise<any> => {
    const res = await http.post('/evaluation/criteria/', payload);
    return res.data;
};

export const createPlacementRule = async (payload: any): Promise<any> => {
    const res = await http.post('/evaluation/placement-rules/', payload);
    return res.data;
};

export const updatePlacementRule = async (uid: string, payload: any): Promise<any> => {
    const res = await http.patch(`/evaluation/placement-rules/${uid}/`, payload);
    return res.data;
};

export const deletePlacementRule = async (uid: string): Promise<any> => {
    const res = await http.delete(`/evaluation/placement-rules/${uid}/`);
    return res.data;
};

export const updateEvaluationModule = async (uid: string, payload: any): Promise<any> => {
    const res = await http.patch(`/evaluation/modules/${uid}/`, payload);
    return res.data;
};

export const deleteEvaluationModule = async (uid: string): Promise<any> => {
    const res = await http.delete(`/evaluation/modules/${uid}/`);
    return res.data;
};

export const updateEvaluationCriteria = async (uid: string, payload: any): Promise<any> => {
    const res = await http.patch(`/evaluation/criteria/${uid}/`, payload);
    return res.data;
};

export const deleteEvaluationCriteria = async (uid: string): Promise<any> => {
    const res = await http.delete(`/evaluation/criteria/${uid}/`);
    return res.data;
};

export const fetchExamSessions = async (params: { batch_uid: string, page: number, page_size: number }): Promise<any> => {
    const res = await http.get('/evaluation/exam-sessions/', { params });
    console.log("=== EXAM SESSIONS API RESPONSE ===");
    console.log(JSON.stringify(res.data, null, 2));
    return res.data;
};

export const fetchExamAttempts = async (params: { exam_session_uid: string, page: number, page_size: number }): Promise<any> => {
    const res = await http.get('/evaluation/attempts/', { params });
    return res.data;
};

export const fetchMarkSheet = async (attemptUid: string): Promise<any> => {
    const res = await http.get(`/evaluation/attempts/${attemptUid}/mark-sheet/`);
    return res.data;
};

export const saveEvaluationDraft = async (attemptUid: string, payload: any): Promise<any> => {
    const res = await http.patch(`/evaluation/attempts/${attemptUid}/scores/`, payload);
    return res.data;
};

export const submitEvaluation = async (attemptUid: string): Promise<any> => {
    const res = await http.post(`/evaluation/attempts/${attemptUid}/submit/`);
    return res.data;
};

export const publishEvaluation = async (attemptUid: string): Promise<any> => {
    const res = await http.post(`/evaluation/attempts/${attemptUid}/publish/`);
    return res.data;
};

/* ---------- EXAM SESSION CREATE ---------- */

export const fetchTemplatesByCourse = async (courseId: number): Promise<any[]> => {
    const res = await http.get('/evaluation/templates/', { params: { is_active: true, course_id: courseId } });
    return res.data.data || [];
};

export const fetchTemplateWithModules = async (templateUid: string): Promise<any> => {
    const res = await http.get(`/evaluation/templates/${templateUid}/`);
    return res.data.data;
};

export const fetchExamTypes = async (): Promise<any[]> => {
    const res = await http.get('/evaluation/exam-types/');
    return res.data.data || [];
};

export type CreateExamSessionPayload = {
    batch_uid: string;
    exam_name: string;
    exam_type_id: number;
    generate_attempts: boolean;
    module_uid?: string;
    scheduled_date: string;
    template_uid: string;
    exam_notes?: string;
    exam_link?: string;
    student_uids?: string[];
};

export const createExamSession = async (payload: CreateExamSessionPayload): Promise<any> => {
    const res = await http.post('/evaluation/exam-sessions/create/', payload);
    return res.data;
};

export const updateExamSession = async (uid: string, payload: Partial<CreateExamSessionPayload>): Promise<any> => {
    const res = await http.patch(`/evaluation/exam-sessions/${uid}/`, payload);
    return res.data;
};

export const fetchBatchStudents = async (batchUid: string): Promise<any[]> => {
    const res = await http.get('/students/', { params: { batch: batchUid, page_size: 200 } });
    return res.data?.data?.students || [];
};
