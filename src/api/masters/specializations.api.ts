import { http } from '../http';

export type Specialization = {
    name: string;
    value: string;
};

type SpecializationsResponse = {
    status: string;
    specializations: Specialization[];
    total_count: number;
};

export const fetchSpecializations = async (): Promise<Specialization[]> => {
    const res = await http.get<SpecializationsResponse>('/specializations/list/');
    return res.data.specializations;
};
