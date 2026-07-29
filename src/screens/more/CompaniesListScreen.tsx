import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import type { InfiniteData } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import { useAppTheme, spacing } from '@/src/theme';
import CompanyCard from '../../components/cards/CompanyCard';
import AppInput from '../../components/common/AppInput';
import AppLoader from '../../components/common/AppLoader';
import AppText from '../../components/common/AppText';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompaniesPageResponse } from '../../api/jobs.api';
import type { MoreStackParamList } from '../../navigation/MoreStack';
import { useInfiniteCompanies } from '../../queries/jobs.query';

export default function CompaniesListScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  /* ---------------- SEARCH STATE ---------------- */
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

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
  } = useInfiniteCompanies(debouncedSearch) as {
    data: InfiniteData<CompaniesPageResponse> | undefined;
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    fetchNextPage: () => void;
    hasNextPage?: boolean;
    isFetchingNextPage: boolean;
    refetch: () => void;
  };

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    try {
      setIsManualRefreshing(true);
      await refetch();
    } finally {
      setIsManualRefreshing(false);
    }
  }, [refetch]);

  const companies = data?.pages.flatMap((page) => page.results) ?? [];

  const renderItem = useCallback(({ item }: { item: any }) => (
    <CompanyCard
      company={item}
      onPress={() => navigation.navigate('CompanyDetail', { uid: item.uid })}
    />
  ), [navigation]);

  /* ---------------- UI ---------------- */
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={20} color={colors.textMuted} style={styles.searchIcon} />
          <AppInput
            placeholder="Search companies..."
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            containerStyle={styles.searchContainer}
          />
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
            {(() => {
              const err = error as any;
              return err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Failed to load companies';
            })()}
          </AppText>
          <Pressable onPress={refetch} style={styles.retryBtn}>
            <AppText color={colors.primary}>Try Again</AppText>
          </Pressable>
        </View>
      ) : !companies.length ? (
        <View style={styles.center}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="business-outline" size={40} color={colors.primary} />
          </View>
          <AppText variant="h3" style={styles.emptyText}>
            No Companies Found
          </AppText>
          <AppText color={colors.textMuted} style={styles.emptySubtext}>
            Try adjusting your search query.
          </AppText>
        </View>
      ) : (
        <FlashList
          data={companies}
          keyExtractor={(item) => item.uid}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={
            <AppText variant="caption" color={colors.textMuted} style={styles.countText}>
              {data?.pages[0]?.count ?? 0} companies
            </AppText>
          }
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
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  searchWrapper: {
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
    paddingTop: spacing.sm,
  },
  countText: {
    marginBottom: spacing.sm,
    marginLeft: 2,
    fontWeight: '600',
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
