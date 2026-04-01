import type { Batch } from '@/src/api/batches.api';
import { http } from '@/src/api/http';
import type { LeadSource } from '@/src/types/leadSource';
import type { LeadStatus } from '@/src/types/leadStatus';
import type { Qualification } from '@/src/types/qualification';
import type { Course } from '@/src/types/course';
import type { Specialization } from './specializations.api';

import type { MasterLocation } from './locations.api';
import type { Counselor } from './counselors.api';

export type MasterPageParams = {
  page: number;
  pageSize: number;
  search?: string;
};

export type PaginatedMasterResult<T> = {
  items: T[];
  hasNextPage: boolean;
};

const toNumber = (value: unknown): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const extractItems = <T>(data: any, keys: string[]): T[] => {
  for (const key of keys) {
    const items = data?.[key];
    if (Array.isArray(items)) {
      return items as T[];
    }
  }

  if (Array.isArray(data?.results)) return data.results as T[];
  if (Array.isArray(data?.data?.results)) return data.data.results as T[];
  if (Array.isArray(data?.data)) return data.data as T[];

  return [];
};

const extractHasNextPage = (
  data: any,
  page: number,
  pageSize: number,
  itemCount: number
): boolean => {
  if (typeof data?.next === 'string') return data.next.length > 0;
  if (data?.next === null) return false;
  if (typeof data?.next === 'boolean') return data.next;

  const boolCandidates = [
    data?.has_next,
    data?.pagination?.has_next,
    data?.data?.pagination?.has_next,
  ];

  for (const candidate of boolCandidates) {
    if (typeof candidate === 'boolean') return candidate;
  }

  const pageCandidates = [
    {
      current: toNumber(data?.page),
      total: toNumber(data?.total_pages),
    },
    {
      current: toNumber(data?.pagination?.current_page),
      total: toNumber(data?.pagination?.total_pages),
    },
    {
      current: toNumber(data?.data?.pagination?.current_page),
      total: toNumber(data?.data?.pagination?.total_pages),
    },
  ];

  for (const candidate of pageCandidates) {
    if (
      candidate.current !== undefined &&
      candidate.total !== undefined
    ) {
      return candidate.current < candidate.total;
    }
  }

  const totalCount =
    toNumber(data?.count) ??
    toNumber(data?.total_count) ??
    toNumber(data?.pagination?.total_count) ??
    toNumber(data?.data?.pagination?.total_count);

  if (totalCount !== undefined) {
    return page * pageSize < totalCount;
  }

  return itemCount >= pageSize;
};

const fetchMasterPage = async <T>(
  url: string,
  itemKeys: string[],
  { page, pageSize, search }: MasterPageParams,
  extraParams?: Record<string, unknown>
): Promise<PaginatedMasterResult<T>> => {
  const res = await http.get(url, {
    params: {
      page,
      page_size: pageSize,
      search: search?.trim() || undefined,
      ...extraParams,
    },
  });

  const items = extractItems<T>(res.data, itemKeys);

  return {
    items,
    hasNextPage: extractHasNextPage(
      res.data,
      page,
      pageSize,
      items.length
    ),
  };
};

export const fetchCoursesPage = (
  params: MasterPageParams
) => fetchMasterPage<Course>('/courses/', ['courses'], params);

export const fetchCounselorsPage = async (
  params: MasterPageParams
) => {
  const result = await fetchMasterPage<Counselor>(
    '/users',
    ['users'],
    params
  );

  return {
    ...result,
    items: result.items.filter((user) => user.is_active),
  };
};

export const fetchQualificationsPage = async (
  params: MasterPageParams
) => {
  const result = await fetchMasterPage<Qualification>(
    '/lead/qualifications/',
    ['qualifications'],
    params
  );

  return {
    ...result,
    items: result.items
      .filter((item) => item.is_active)
      .sort((a, b) => a.index - b.index),
  };
};

export const fetchLeadStatusesPage = async (
  params: MasterPageParams
) => {
  const result = await fetchMasterPage<LeadStatus>(
    '/lead/statuses/',
    ['statuses'],
    params
  );

  return {
    ...result,
    items: result.items.filter((item) => item.is_active),
  };
};

export const fetchLeadSourcesPage = async (
  params: MasterPageParams
) => {
  const result = await fetchMasterPage<LeadSource>(
    '/lead/sources/',
    ['sources'],
    params
  );

  return {
    ...result,
    items: result.items.filter((item) => item.is_active),
  };
};

export const fetchBatchesPage = (
  params: MasterPageParams & { courseId?: number }
) =>
  fetchMasterPage<Batch>(
    '/batch/',
    ['batches'],
    params,
    { course_id: params.courseId || undefined }
  );

export const fetchLocationsPage = (
  params: MasterPageParams
) =>
  fetchMasterPage<MasterLocation>(
    '/locations/',
    ['locations'],
    params
  );

export const fetchSpecializationsPage = (
  params: MasterPageParams
) =>
  fetchMasterPage<Specialization>(
    '/specializations/list/',
    ['specializations'],
    params
  );
