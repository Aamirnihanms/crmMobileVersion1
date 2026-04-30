import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';
import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/src/theme';
import AppText from './AppText';

const { height } = Dimensions.get('window');

type Option = {
  label: string;
  value: string | number;
};

export type SelectPageParams = {
  page: number;
  pageSize: number;
  search?: string;
};

export type SelectPageResponse = {
  options: Option[];
  hasNextPage: boolean;
};

type Props = {
  label: string;
  value?: string | number;
  options?: Option[];
  onSelect: (value: any, item?: any) => void;
  placeholder?: string;
  fetchOptions?: (
    params: SelectPageParams
  ) => Promise<SelectPageResponse>;
  queryKey?: (string | number)[];
  pageSize?: number;
  error?: string;
};

export default function AppSelect({
  label,
  value,
  options = [],
  onSelect,
  placeholder = 'Select',
  fetchOptions,
  queryKey,
  pageSize = 30,
  error: externalError,
}: Props) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] =
    React.useState('');

  const translateY = React.useRef(
    new Animated.Value(height)
  ).current;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const remoteMode = Boolean(fetchOptions);

  const {
    data: remoteData,
    isLoading: isRemoteLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: [
      'app-select',
      ...(queryKey || [label]),
      debouncedSearch,
      pageSize,
    ],
    initialPageParam: 1,
    enabled: open && remoteMode,
    queryFn: ({ pageParam }) =>
      fetchOptions!({
        page: Number(pageParam),
        pageSize,
        search: debouncedSearch || undefined,
      }),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasNextPage
        ? allPages.length + 1
        : undefined,
  });

  const remoteOptions = React.useMemo(() => {
    const list =
      remoteData?.pages.flatMap((page) => page.options) ?? [];

    const seen = new Set<string>();
    return list.filter((item) => {
      const key = String(item.value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [remoteData]);

  const displayOptions = remoteMode ? remoteOptions : options;

  const selected =
    displayOptions.find(
      o => String(o.value) === String(value)
    ) ||
    options?.find(o => String(o.value) === String(value));


  const filteredOptions = React.useMemo(() => {
    if (remoteMode) return displayOptions;
    if (!search) return options;

    const s = search.toLowerCase();
    return options.filter(o =>
      o.label.toLowerCase().includes(s)
    );
  }, [displayOptions, options, remoteMode, search]);

  const openSheet = () => {
    setOpen(true);
    requestAnimationFrame(() => {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        mass: 1,
        stiffness: 100,
      }).start();
    });
  };

  const closeSheet = () => {
    Animated.timing(translateY, {
      toValue: height,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setOpen(false);
      setSearch('');
      setDebouncedSearch('');
    });
  };

  return (
    <View style={styles.container}>
      <AppText variant="caption" style={styles.label}>{label}</AppText>

      <Pressable
        style={[
          styles.selector, 
          open && styles.selectorActive,
          externalError && styles.selectorError
        ]}
        onPress={openSheet}
      >
        <AppText color={selected ? colors.textPrimary : colors.textMuted} style={styles.selectorText}>
          {selected?.label || placeholder}
        </AppText>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>

      {externalError ? (
        <AppText variant="caption" color={colors.danger} style={styles.errorText}>
          {externalError}
        </AppText>
      ) : null}

      <Modal visible={open} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={closeSheet}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY }] },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <AppText variant="h2">
              {label}
            </AppText>
            <Pressable onPress={closeSheet} style={styles.closeCircle}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} style={styles.searchIcon} />
            <TextInput
              placeholder={`Search ${label}...`}
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              style={styles.search}
            />
          </View>

          <FlatList
            data={filteredOptions}
            keyExtractor={i => String(i.value)}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: Math.max(insets.bottom, spacing.xl) },
            ]}
            onEndReached={() => {
              if (
                remoteMode &&
                hasNextPage &&
                !isFetchingNextPage
              ) {
                void fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.4}
            renderItem={({ item }) => {
              const active = String(item.value) === String(value);

              return (
                <Pressable
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => {
                    onSelect(item.value, item);
                    closeSheet();
                  }}
                >
                  <AppText
                    variant="body"
                    style={active ? { fontWeight: '700', color: colors.primary } : { color: colors.textPrimary }}
                  >
                    {item.label}
                  </AppText>

                  {active && (
                    <View style={styles.checkCircle}>
                      <Ionicons name="checkmark" size={14} color="white" />
                    </View>
                  )}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                {remoteMode && isRemoteLoading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (remoteMode && isError) || externalError ? (
                  <View style={styles.errorWrap}>
                    <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
                    <AppText style={styles.errorText}>
                      {externalError ||
                        (error as any)?.response?.data?.detail ||
                        (error as any)?.response?.data?.error ||
                        error?.message ||
                        'Failed to load options'}
                    </AppText>
                  </View>
                ) : (
                  <AppText color={colors.textMuted}>
                    No results found
                  </AppText>
                )}
              </View>
            }
            ListFooterComponent={
              remoteMode && isFetchingNextPage ? (
                <View style={styles.loadingMoreWrap}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : null
            }
          />
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
    marginLeft: 4,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primaryLight + '10',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectorActive: {
    borderColor: colors.primary,
    backgroundColor: 'white',
  },
  selectorError: {
    borderColor: colors.danger,
    borderWidth: 1.5,
  },
  selectorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.7,
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.divider,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  closeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutralSoft,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  search: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: colors.textPrimary,
  },
  listContent: {
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  option: {
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    marginBottom: 4,
  },
  optionActive: {
    backgroundColor: colors.primaryLight + '10',
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrap: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMoreWrap: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorWrap: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    color: colors.danger,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontWeight: '500',
  },
});
