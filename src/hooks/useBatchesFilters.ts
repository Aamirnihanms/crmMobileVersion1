import { useState } from 'react';
import type { BatchesFilters } from '../api/batches.api';

export const useBatchesFilters = () => {
  const [filters, setFilters] = useState<BatchesFilters>({
    inactive: true,
  });

  const updateFilter = (key: keyof BatchesFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const resetFilters = () => {
    setFilters({ inactive: true });
  };

  const setAllFilters = (newFilters: BatchesFilters) => {
    setFilters(newFilters);
  };

  return {
    filters,
    updateFilter,
    resetFilters,
    setAllFilters,
  };
};
