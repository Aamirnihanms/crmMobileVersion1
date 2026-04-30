import { AxiosError } from 'axios';

/**
 * Extracts a human-readable error message from an Axios error.
 * Handles various common Django Rest Framework and standard error formats.
 */
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;

  const responseData = error?.response?.data;

  // 1. Check for 'error' field
  if (responseData?.error) {
    return typeof responseData.error === 'string'
      ? responseData.error
      : JSON.stringify(responseData.error);
  }

  // 2. Check for 'message' field
  if (responseData?.message) {
    return responseData.message;
  }

  // 3. Check for 'detail' field (common in DRF)
  if (responseData?.detail) {
    return responseData.detail;
  }

  // 4. Check for 'non_field_errors'
  if (Array.isArray(responseData?.non_field_errors)) {
    return responseData.non_field_errors.join(', ');
  }

  // 5. Handle field-specific validation errors (e.g., { "phone": ["Already exists"] })
  if (responseData && typeof responseData === 'object') {
    const firstKey = Object.keys(responseData)[0];
    const firstError = responseData[firstKey];
    
    if (Array.isArray(firstError)) {
      return `${firstKey}: ${firstError[0]}`;
    }
    if (typeof firstError === 'string') {
      return `${firstKey}: ${firstError}`;
    }
  }

  // 6. Fallback to generic axios error message
  if (error instanceof AxiosError) {
    if (error.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
    if (error.message === 'Network Error') return 'Network error. Please check your internet connection.';
    return error.message;
  }

  return 'An unexpected error occurred';
};
