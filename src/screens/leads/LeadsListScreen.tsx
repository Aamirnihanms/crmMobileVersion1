import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useState, useEffect } from 'react';
import type { InfiniteData } from '@tanstack/react-query';
import type { LeadsPageResponse } from '../../api/leads.api';

import AppText from '../../components/common/AppText';
import AppLoader from '../../components/common/AppLoader';
import AppInput from '../../components/common/AppInput';
import LeadCard from '../../components/cards/LeadCard';
import { spacing } from '../../theme';

import { useInfiniteLeads } from '../../queries/leads.query';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { LeadsStackParamList } from '../../navigation/LeadsStack';

/* 🔥 ENTERPRISE FILTERS */
import { useLeadsFilters } from '../../hooks/useLeadsFilters';
import LeadsFilterBar from '../../components/leads/LeadsFilterBar';
import LeadsFilterModal from '../../components/leads/LeadsFilterModal';

/* 🔥 MASTER DATA */
import { useCourses } from '../../queries/masters/courses.query';
import { useCounselors } from '../../queries/masters/counselors.query';
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
        <AppText color="red">
          {(error as Error)?.message ||
            'Failed to load leads'}
        </AppText>
      </View>
    );
  }

  const leads =
    data?.pages.flatMap((page) => page.results) ?? [];

  /* ---------------- UI ---------------- */

  return (
    <View style={styles.container}>
      {/* 🔍 SEARCH BAR */}
      <View style={styles.searchContainer}>
        <AppInput
          placeholder="Search leads by name, phone, email..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* 🧠 FILTER BAR (ENTERPRISE) */}
      <LeadsFilterBar
        filters={filters}
        onPress={() => setOpenFilter(true)}
      />

      {/* 📋 EMPTY STATE */}
      {!leads.length ? (
        <View style={styles.center}>
          <AppText>No leads found</AppText>
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
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
            />
          }
        />
      )}

      {/* 🧠 FILTER MODAL */}
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

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  list: {
    padding: spacing.md,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
});