import { FlashList } from '@shopify/flash-list';
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import type { InfiniteData } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { StudentsStackParamList } from '../../navigation/StudentsStack';

import StudentCard from '@/src/components/cards/StudentCard';
import AppInput from '@/src/components/common/AppInput';
import AppLoader from '@/src/components/common/AppLoader';
import AppText from '@/src/components/common/AppText';
import StudentsFilterModal from '@/src/components/students/StudentsFilterModal';
import { useStudentsFilters } from '@/src/hooks/useStudentsFilters';

import { colors, spacing } from '@/src/theme';

import type { StudentsPageResponse } from '@/src/api/students.api';
import ShareLinkModal from '@/src/components/students/ShareLinkModal';
import { useInfiniteStudents } from '@/src/queries/students.query';
import { getUserIdFromToken } from '@/src/utils/token';

import { Ionicons } from '@expo/vector-icons';
import { useIsFocused, useNavigation } from '@react-navigation/native';

export default function StudentsListScreen() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [openFilter, setOpenFilter] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const fetchUserId = async () => {
      const id = await getUserIdFromToken();
      setCurrentUserId(id);
    };
    void fetchUserId();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);


  const { filters, setAllFilters } = useStudentsFilters();
  const activeCount = Object.values(filters).filter(Boolean).length;

  const navigation =
    useNavigation<
      NativeStackNavigationProp<StudentsStackParamList>
    >();
  const isFocused = useIsFocused();
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => setShowShareModal(true)}
          style={{ padding: 4 }}
        >
          <Ionicons name="add-circle-outline" size={26} color={colors.primary} />
        </Pressable>
      ),
    });
  }, [navigation]);

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
  } = useInfiniteStudents(debouncedSearch, filters) as {
    data: InfiniteData<StudentsPageResponse> | undefined;
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    fetchNextPage: () => void;
    hasNextPage?: boolean;
    isFetchingNextPage: boolean;
    refetch: () => void;
    isRefetching: boolean;
  };

  useEffect(() => {
    if (isFocused) {
      void refetch();
    }
  }, [isFocused, refetch]);

  const onRefresh = useCallback(async () => {
    try {
      setIsManualRefreshing(true);
      await refetch();
    } finally {
      setIsManualRefreshing(false);
    }
  }, [refetch]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <StudentCard
      student={item}
      onPress={() =>
        navigation.navigate('StudentDetails', {
          id: item.uid,
          is_active: item.is_active,
        })
      }
    />
  ), [navigation]);



  const students =
    data?.pages.flatMap((page) => page.students) ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <View style={styles.searchWrapper}>
            <Ionicons name="search-outline" size={20} color={colors.textMuted} style={styles.searchIcon} />
            <AppInput
              placeholder="Search by name or student ID..."
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
              name={activeCount > 0 ? 'options' : 'options-outline'}
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

      {isLoading ? (
        <View style={styles.center}>
          <AppLoader />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
          <AppText color={colors.danger} style={styles.errorText}>
            {((error as any)?.response?.data?.detail) || ((error as any)?.response?.data?.error) || ((error as Error)?.message || 'Failed to load students')}
          </AppText>
          <Pressable onPress={refetch} style={styles.retryBtn}>
            <AppText color={colors.primary}>Try Again</AppText>
          </Pressable>
        </View>
      ) : !students.length ? (
        <View style={styles.center}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="school-outline" size={40} color={colors.primary} />
          </View>
          <AppText variant="h3" style={styles.emptyText}>
            No Students Found
          </AppText>
          <AppText color={colors.textMuted} style={styles.emptySubtext}>
            We could not find any students matching your search.
          </AppText>
        </View>
      ) : (
        <FlashList
          data={students}
          keyExtractor={(item) => item.uid}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? <AppLoader /> : <View style={{ height: spacing.xl }} />
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

      <StudentsFilterModal
        visible={openFilter}
        onClose={() => setOpenFilter(false)}
        filters={filters}
        setAllFilters={setAllFilters}
      />

      {currentUserId !== null && (
        <ShareLinkModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          userId={currentUserId}
        />
      )}
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
    borderColor: colors.primaryLight + '40',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
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
    paddingTop: 0,
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
