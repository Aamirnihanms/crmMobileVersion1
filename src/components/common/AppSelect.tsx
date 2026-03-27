import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
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

import { colors, spacing } from '@/src/theme';
import AppText from './AppText';

const { height } = Dimensions.get('window');

type Option = {
  label: string;
  value: string | number;
};

type Props = {
  label: string;
  value?: string | number;
  options: Option[];
  onSelect: (value: any) => void;
  placeholder?: string;
};

export default function AppSelect({
  label,
  value,
  options,
  onSelect,
  placeholder = 'Select',
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const translateY = React.useRef(
    new Animated.Value(height)
  ).current;

  const selected = options.find(o => o.value === value);

  const filteredOptions = React.useMemo(() => {
    if (!search) return options;
    const s = search.toLowerCase();
    return options.filter(o =>
      o.label.toLowerCase().includes(s)
    );
  }, [search, options]);

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
    });
  };

  return (
    <View style={styles.container}>
      <AppText variant="caption" style={styles.label}>{label}</AppText>

      <Pressable
        style={[styles.selector, open && styles.selectorActive]}
        onPress={openSheet}
      >
        <AppText color={selected ? colors.textPrimary : colors.textMuted} style={styles.selectorText}>
          {selected?.label || placeholder}
        </AppText>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>

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
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const active = item.value === value;

              return (
                <Pressable
                  style={[styles.option, active && styles.optionActive]}
                  onPress={() => {
                    onSelect(item.value);
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
  selectorText: {
    fontSize: 14,
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
  }
});
