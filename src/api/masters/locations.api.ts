import { http } from '../http';

export type MasterLocation = {
  id: number;
  name: string;
  value: string;
  is_active: boolean;
  created_at: string;
};

type LocationsResponse = {
  status: string;
  locations: MasterLocation[];
};

export const fetchLocations = async (): Promise<MasterLocation[]> => {
  const res = await http.get<LocationsResponse>('/locations/');
  return res.data.locations ?? [];
};
