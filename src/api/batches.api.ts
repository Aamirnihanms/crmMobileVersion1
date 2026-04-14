import { http } from './http';

export type Batch = {
  uid: string;
  batch_name: string;
  course_name: string;
  course_mode_names: string[];
  location_name: string;
  start_date: string;
  end_date: string;
  time: string;
  status: string;
  current_enrollment_count: number;
  total_capacity: number;
  available_spots: number;
  is_active: boolean;
  admission_fees?: number;
  seat_availability?: {
    total: {
      capacity: number;
      enrolled: number;
      available: number;
    }
  };
};

export type BatchesFilters = {
  location_id?: string;
  course_id?: string;
  trainer_id?: string;
  counselor_id?: string;
  start_date_from?: string;
  start_date_to?: string;
  inactive?: boolean;
};

export type BatchesPageResponse = {
  batches: Batch[];
  pagination: {
    total_count: number;
    current_page: number;
    total_pages: number;
    page_size: number;
  };
  summary: any;
};

export const fetchBatches = async (
  courseId?: number
): Promise<Batch[]> => {
  console.log('➡️ GET batches, course:', courseId);

  const res = await http.get('/batch/', {
    params: {
      course_id: courseId || undefined,
    },
  });

  return res.data.batches || res.data.data || [];
};

export const fetchPaginatedBatches = async (
  page: number = 1,
  pageSize: number = 10,
  search: string = '',
  filters: BatchesFilters = {}
): Promise<BatchesPageResponse> => {
  console.log('➡️ GET paginated batches:', { page, search, filters });

  const res = await http.get('/batch/', {
    params: {
      page,
      page_size: pageSize,
      search: search || undefined,
      inactive: filters.inactive ?? true,
      is_active: filters.inactive === false ? 'True' : undefined, // Example showed is_active=True
      location_id: filters.location_id || undefined,
      course_id: filters.course_id || undefined,
      trainer_id: filters.trainer_id || undefined,
      counselor_id: filters.counselor_id || undefined,
      start_date_from: filters.start_date_from || undefined,
      start_date_to: filters.start_date_to || undefined,
    },
  });

  return res.data;
};