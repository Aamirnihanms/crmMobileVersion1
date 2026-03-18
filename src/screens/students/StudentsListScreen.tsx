import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';

import { useState, useEffect } from 'react';
import type { InfiniteData } from '@tanstack/react-query';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { StudentsStackParamList } from '../../navigation/StudentsStack';

import AppText from '@/src/components/common/AppText';
import AppLoader from '@/src/components/common/AppLoader';
import AppInput from '@/src/components/common/AppInput';
import StudentCard from '@/src/components/cards/StudentCard';

import { spacing } from '@/src/theme';

import { useInfiniteStudents } from '@/src/queries/students.query';
import type { StudentsPageResponse } from '@/src/api/students.api';

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
        <AppText color="red">
          {(error as Error)?.message || 'Failed to load students'}
        </AppText>
      </View>
    );
  }

const students =
  data?.pages.flatMap((page) => page.students) ?? [];

  return (
    <View style={styles.container}>
      {/* SEARCH */}
      <View style={styles.searchContainer}>
        <AppInput
          placeholder="Search students..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {!students.length ? (
        <View style={styles.center}>
          <AppText>No students found</AppText>
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
            isFetchingNextPage ? <AppLoader /> : null
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  },
});