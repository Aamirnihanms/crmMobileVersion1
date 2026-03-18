import { useState } from 'react';
import type { LeadsFilters } from '../api/leads.api';

export const useLeadsFilters = () => {
  const [filters, setFilters] = useState<LeadsFilters>({});

  const updateFilter = (key: keyof LeadsFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const resetFilters = () => {
    setFilters({});
  };

  return {
    filters,
    updateFilter,
    resetFilters,
  };
};