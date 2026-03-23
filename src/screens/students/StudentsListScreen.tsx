import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import type { InfiniteData } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { StudentsStackParamList } from '../../navigation/StudentsStack';

import StudentCard from '@/src/components/cards/StudentCard';
import AppInput from '@/src/components/common/AppInput';
import AppLoader from '@/src/components/common/AppLoader';
import AppText from '@/src/components/common/AppText';

import { colors, spacing } from '@/src/theme';

import type { StudentsPageResponse } from '@/src/api/students.api';
import { useInfiniteStudents } from '@/src/queries/students.query';

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function StudentsListScreen() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const navigation =
    useNavigation<
      NativeStackNavigationProp<StudentsStackParamList>
    >();

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
  } = useInfiniteStudents(debouncedSearch) as {
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

  if (isLoading) return <AppLoader />;

  if (isError) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <AppText color={colors.danger} style={styles.errorText}>
          {(error as Error)?.message || 'Failed to load students'}
        </AppText>
        <Pressable onPress={refetch} style={styles.retryBtn}>
          <AppText color={colors.primary}>Try Again</AppText>
        </Pressable>
      </View>
    );
  }

  const students =
    data?.pages.flatMap((page) => page.students) ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
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
      </View>

      {!students.length && !isLoading ? (
        <View style={styles.center}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="school-outline" size={40} color={colors.primary} />
          </View>
          <AppText variant="h3" style={styles.emptyText}>
            No Students Found
          </AppText>
          <AppText color={colors.textMuted} style={styles.emptySubtext}>
            We couldn't find any students matching your search.
          </AppText>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => (
            <StudentCard
              student={item}
              onPress={() =>
                navigation.navigate('StudentDetails', {
                  id: item.uid,
                })
              }
            />
          )}
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
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
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
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '10',
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryLight + '20',
    marginBottom: spacing.md,
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