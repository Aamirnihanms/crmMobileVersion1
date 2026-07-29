import { FlashList } from '@shopify/flash-list';
import type { InfiniteData } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import type { LeadsPageResponse } from '../../api/leads.api';

import { useAppTheme, spacing } from '@/src/theme';
import LeadCard from '../../components/cards/LeadCard';
import AppInput from '../../components/common/AppInput';
import AppLoader from '../../components/common/AppLoader';
import AppText from '../../components/common/AppText';

import { useInfiniteLeads } from '../../queries/leads.query';

import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { LeadsStackParamList } from '../../navigation/LeadsStack';

/* 🔥 ENTERPRISE FILTERS */
import LeadsFilterModal from '../../components/leads/LeadsFilterModal';
import { useLeadsFilters } from '../../hooks/useLeadsFilters';
import { getCustomLeadFilters, type CustomLeadFilter } from '../../utils/customFiltersStorage';

import { Ionicons } from '@expo/vector-icons';

export function SavedFiltersRow({ 
  onFilterToggle, 
  activeFilterId 
}: { 
  onFilterToggle: (filter: CustomLeadFilter | null) => void;
  activeFilterId: string | null;
}) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const [customFilters, setCustomFilters] = useState<CustomLeadFilter[]>([]);

  useFocusEffect(
    useCallback(() => {
      const fetchSaved = async () => {
        const list = await getCustomLeadFilters();
        setCustomFilters(list);
      };
      fetchSaved();
    }, [])
  );

  if (customFilters.length === 0) return null;

  return (
    <View style={styles.savedFiltersWrapper}>
      <AppText variant="caption" style={styles.savedFiltersTitle}>Saved Filters:</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedFiltersScroll}>
        {customFilters.map(filter => {
          const isActive = activeFilterId === filter.id;
          return (
            <TouchableOpacity
              key={filter.id}
              style={[styles.savedFilterChip, isActive && styles.savedFilterChipActive]}
              onPress={() => {
                onFilterToggle(isActive ? null : filter);
              }}
            >
              <AppText style={[styles.savedFilterChipText, isActive && styles.savedFilterChipTextActive]}>
                {filter.name}
              </AppText>
              {isActive && (
                <Ionicons name="close-circle" size={14} color="#fff" style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function LeadsListScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  /* ---------------- SEARCH STATE ---------------- */
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  /* ---------------- FILTERS ---------------- */
  const { filters, setAllFilters } = useLeadsFilters();
  const [openFilter, setOpenFilter] = useState(false);
  const activeCount = Object.values(filters).filter(Boolean).length;

  const [activeCustomFilterId, setActiveCustomFilterId] = useState<string | null>(null);

  const handleCustomFilterToggle = (customFilter: CustomLeadFilter | null) => {
    if (!customFilter) {
      setAllFilters({
        ...filters,
        lead_status: undefined,
      });
      setActiveCustomFilterId(null);
    } else {
      setAllFilters({
        ...filters,
        lead_status: customFilter.options.lead_status,
      });
      setActiveCustomFilterId(customFilter.id);
    }
  };

  useEffect(() => {
    if (activeCustomFilterId) {
      const checkActive = async () => {
        const list = await getCustomLeadFilters();
        const activeFilter = list.find(f => f.id === activeCustomFilterId);
        if (!activeFilter || activeFilter.options.lead_status !== filters.lead_status) {
          setActiveCustomFilterId(null);
        }
      };
      checkActive();
    }
  }, [filters.lead_status, activeCustomFilterId]);

  /* ---------------- NAVIGATION ---------------- */
  const navigation =
    useNavigation<
      NativeStackNavigationProp<LeadsStackParamList>
    >();

  /* ---------------- QUERY ---------------- */
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfiniteLeads(
    debouncedSearch,
    filters
  ) as {
    data: InfiniteData<LeadsPageResponse> | undefined;
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    fetchNextPage: () => void;
    hasNextPage?: boolean;
    isFetchingNextPage: boolean;
    refetch: () => void;
    isRefetching: boolean;
  };

  /* ---------------- STATES ---------------- */
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    try {
      setIsManualRefreshing(true);
      await refetch();
    } finally {
      setIsManualRefreshing(false);
    }
  }, [refetch]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <LeadCard
      lead={item}
      onPress={() =>
        navigation.navigate('LeadDetails', {
          id: item.id,
        })
      }
    />
  ), [navigation]);



  const leads =
    data?.pages.flatMap((page) => page.results) ?? [];

  /* ---------------- UI ---------------- */

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <View style={styles.searchWrapper}>
            <Ionicons name="search-outline" size={20} color={colors.textMuted} style={styles.searchIcon} />
            <AppInput
              placeholder="Search by name or phone..."
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
              containerStyle={styles.searchContainer}
            />
          </View>
          <Pressable
            style={[styles.filterButton, activeCount > 0 && styles.filterButtonActive]}
            onPress={() => setOpenFilter(true)}
          >
            <Ionicons
              name={activeCount > 0 ? "options" : "options-outline"}
              size={22}
              color={activeCount > 0 ? colors.primary : colors.textPrimary}
            />
            {activeCount > 0 && (
              <View style={styles.filterBadge}>
                <AppText color={colors.surface} style={styles.filterBadgeText}>{activeCount}</AppText>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <SavedFiltersRow 
        onFilterToggle={handleCustomFilterToggle} 
        activeFilterId={activeCustomFilterId} 
      />

      {isLoading ? (
        <View style={styles.center}>
          <AppLoader />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
          <AppText color={colors.danger} style={styles.errorText}>
            {((error as any)?.response?.data?.detail) || ((error as any)?.response?.data?.error) || ((error as Error)?.message || 'Failed to load leads')}
          </AppText>
          <Pressable onPress={refetch} style={styles.retryBtn}>
            <AppText color={colors.primary}>Try Again</AppText>
          </Pressable>
        </View>
      ) : !leads.length ? (
        <View style={styles.center}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="people-outline" size={40} color={colors.primary} />
          </View>
          <AppText variant="h3" style={styles.emptyText}>
            No Leads Found
          </AppText>
          <AppText color={colors.textMuted} style={styles.emptySubtext}>
            Try adjusting your filters or search query to find what you&apos;re looking for.
          </AppText>
        </View>
      ) : (
        <FlashList
          data={leads}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onEndReached={() => {
            if (
              hasNextPage &&
              !isFetchingNextPage
            ) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? (
              <AppLoader />
            ) : <View style={{ height: spacing.xl }} />
          }
          refreshControl={
            <RefreshControl
              refreshing={isManualRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}

      <LeadsFilterModal
        visible={openFilter}
        onClose={() => setOpenFilter(false)}
        filters={filters}
        setAllFilters={setAllFilters}
      />
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '10',
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryLight + '20',
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primaryLight + '10',
    borderWidth: 1,
    borderColor: colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primaryLight + '20',
    borderColor: colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  searchContainer: {
    flex: 1,
    marginBottom: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  searchInput: {
    height: 48,
    fontSize: 15,
  },
  savedFiltersWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.xs,
  },
  savedFiltersTitle: {
    marginRight: spacing.sm,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  savedFiltersScroll: {
    gap: spacing.xs,
  },
  savedFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primaryLight + '30',
    backgroundColor: colors.primaryLight + '10',
  },
  savedFilterChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  savedFilterChipText: {
    fontSize: 13,
    color: colors.primary,
  },
  savedFilterChipTextActive: {
    color: colors.surface,
    fontWeight: 'bold',
  },
  list: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySubtext: {
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  errorText: {
    marginTop: spacing.md,
    textAlign: 'center',
    fontWeight: '600',
  },
  retryBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primaryLight + '15',
  },
});
