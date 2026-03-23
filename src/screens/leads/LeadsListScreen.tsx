import type { InfiniteData } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import type { LeadsPageResponse } from '../../api/leads.api';

import LeadCard from '../../components/cards/LeadCard';
import AppInput from '../../components/common/AppInput';
import AppLoader from '../../components/common/AppLoader';
import AppText from '../../components/common/AppText';
import { colors, spacing } from '../../theme';

import { useInfiniteLeads } from '../../queries/leads.query';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { LeadsStackParamList } from '../../navigation/LeadsStack';

/* 🔥 ENTERPRISE FILTERS */
import LeadsFilterModal from '../../components/leads/LeadsFilterModal';
import { useLeadsFilters } from '../../hooks/useLeadsFilters';

/* 🔥 MASTER DATA */
import { Ionicons } from '@expo/vector-icons';
import { useCounselors } from '../../queries/masters/counselors.query';
import { useCourses } from '../../queries/masters/courses.query';
import { useLeadSources } from '../../queries/masters/leadSources.query';
import { useLeadStatuses } from '../../queries/masters/leadStatuses.query';
import { useQualifications } from '../../queries/masters/qualifications.query';

export default function LeadsListScreen() {
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
  const { filters, updateFilter } = useLeadsFilters();
  const [openFilter, setOpenFilter] = useState(false);
  const activeCount = Object.values(filters).filter(Boolean).length;

  /* ---------------- NAVIGATION ---------------- */
  const navigation =
    useNavigation<
      NativeStackNavigationProp<LeadsStackParamList>
    >();

  /* ---------------- MASTER DATA ---------------- */
  const { data: courses = [] } = useCourses();
  const { data: counselors = [] } = useCounselors();
  const { data: sources = [] } = useLeadSources();
  const { data: statuses = [] } = useLeadStatuses();
  const { data: qualifications = [] } =
    useQualifications();

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

  if (isLoading) {
    return <AppLoader />;
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <AppText color={colors.danger} style={styles.errorText}>
          {(error as Error)?.message || 'Failed to load leads'}
        </AppText>
        <Pressable onPress={refetch} style={styles.retryBtn}>
          <AppText color={colors.primary}>Try Again</AppText>
        </Pressable>
      </View>
    );
  }

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
                <AppText color="#fff" style={styles.filterBadgeText}>{activeCount}</AppText>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {!leads.length && !isLoading ? (
        <View style={styles.center}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="people-outline" size={40} color={colors.primary} />
          </View>
          <AppText variant="h3" style={styles.emptyText}>
            No Leads Found
          </AppText>
          <AppText color={colors.textMuted} style={styles.emptySubtext}>
            Try adjusting your filters or search query to find what you're looking for.
          </AppText>
        </View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LeadCard
              lead={item}
              onPress={() =>
                navigation.navigate('LeadDetails', {
                  id: item.id,
                })
              }
            />
          )}
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
              refreshing={isRefetching}
              onRefresh={refetch}
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
        updateFilter={updateFilter}
        masters={{
          courses,
          counselors,
          qualifications,
          statuses,
          sources,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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