import * as SecureStore from 'expo-secure-store';

const STORAGE_CUSTOM_FILTERS_KEY = 'custom_lead_filters';

export interface CustomLeadFilter {
  id: string;
  name: string;
  options: {
    lead_status?: string;
  };
}

export const getCustomLeadFilters = async (): Promise<CustomLeadFilter[]> => {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_CUSTOM_FILTERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Error fetching custom lead filters:', error);
    return [];
  }
};

export const saveCustomLeadFilter = async (name: string, leadStatusId: string): Promise<CustomLeadFilter[]> => {
  try {
    const currentFilters = await getCustomLeadFilters();
    const newFilter: CustomLeadFilter = {
      id: Date.now().toString(),
      name,
      options: {
        lead_status: leadStatusId,
      },
    };
    const updated = [...currentFilters, newFilter];
    await SecureStore.setItemAsync(STORAGE_CUSTOM_FILTERS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error saving custom lead filter:', error);
    return [];
  }
};

export const deleteCustomLeadFilter = async (id: string): Promise<CustomLeadFilter[]> => {
  try {
    const currentFilters = await getCustomLeadFilters();
    const updated = currentFilters.filter(item => item.id !== id);
    await SecureStore.setItemAsync(STORAGE_CUSTOM_FILTERS_KEY, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Error deleting custom lead filter:', error);
    return [];
  }
};
