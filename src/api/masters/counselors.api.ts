import { http } from '../http';

export type Counselor = {
  id: number;
  uid?: string;
  full_name: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  role_details: {
    id: number;
    label: string;
    value: string;
  };
  is_active: boolean;
};


export const fetchCounselors = async (): Promise<Counselor[]> => {
  const res = await http.get('/users', {
    params: {
      page_size: 200, // fetch enough for dropdown
    },
  });

  // API shape: { status, users, ... }
  const users = res.data.users ?? [];

  // OPTIONAL: filter only active counselors
  return users.filter(
    (u: Counselor) => u.is_active
  );
};
