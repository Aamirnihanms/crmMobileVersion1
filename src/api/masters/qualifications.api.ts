import { http } from '../http';
import type { Qualification } from '../../types/qualification';

type QualificationsResponse = {
  status: string;
  qualifications: Qualification[];
};

export const fetchQualifications = async (): Promise<Qualification[]> => {
  const res = await http.get<QualificationsResponse>(
    '/lead/qualifications/'
  );

  return res.data.qualifications;
};
