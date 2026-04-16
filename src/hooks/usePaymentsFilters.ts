import { useState } from 'react';
import type { PaymentFilters } from '../api/payments.api';

export const usePaymentsFilters = () => {
  const [filters, setFilters] = useState<PaymentFilters>({});

  const updateFilter = (key: keyof PaymentFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const resetFilters = () => {
    setFilters({});
  };

  const setAllFilters = (newFilters: PaymentFilters) => {
    setFilters(newFilters);
  };

  return {
    filters,
    updateFilter,
    resetFilters,
    setAllFilters,
  };
};
