import { useState } from 'react';
import type { StudentFilters } from '../api/students.api';

export const useStudentsFilters = () => {
  const [filters, setFilters] = useState<StudentFilters>({});

  const setAllFilters = (newFilters: StudentFilters) => {
    setFilters(newFilters);
  };

  const resetFilters = () => {
    setFilters({});
  };

  return {
    filters,
    setAllFilters,
    resetFilters,
  };
};
