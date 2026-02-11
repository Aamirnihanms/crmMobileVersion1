import React from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Modal,
  FlatList,
  TextInput,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';

import AppText from './AppText';
import { colors, spacing } from '../../theme';

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
};

export default function AppSelect({
  label,
  value,
  options,
  onSelect,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const translateY = React.useRef(
    new Animated.Value(height)
  ).current;

  const selected = options.find(o => o.value === value);

  /* ---------------- ENTERPRISE FILTER ---------------- */

  const filteredOptions = React.useMemo(() => {
    if (!search) return options;

    const s = search.toLowerCase();

    return options.filter(o =>
      o.label.toLowerCase().includes(s)
    );
  }, [search, options]);

  /* ---------------- ANIMATION ---------------- */

  const openSheet = () => {
    setOpen(true);

    requestAnimationFrame(() => {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
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

  /* ---------------- RENDER ---------------- */

  return (
    <View style={styles.container}>
      <AppText variant="caption">{label}</AppText>

      <Pressable
        style={styles.selector}
        onPress={openSheet}
      >
        <AppText>
          {selected?.label || 'Select'}
        </AppText>
      </Pressable>

      <Modal visible={open} transparent animationType="none">
        <TouchableWithoutFeedback onPress={closeSheet}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        {/* 🔥 CRM PRO BOTTOM SHEET */}
        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY }] },
          ]}
        >
          {/* HANDLE BAR */}
          <View style={styles.handle} />

          {/* HEADER */}
          <View style={styles.header}>
            <AppText variant="subtitle">
              {label}
            </AppText>

            <Pressable onPress={closeSheet}>
              <AppText color={colors.primary}>
                Close
              </AppText>
            </Pressable>
          </View>

          {/* 🔥 SEARCH BAR */}
          <TextInput
            placeholder={`Search ${label}`}
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
            style={styles.search}
          />

          {/* 🔥 ENTERPRISE LIST */}
          <FlatList
            data={filteredOptions}
            keyExtractor={i => String(i.value)}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={15}
            windowSize={10}
            renderItem={({ item }) => {
              const active = item.value === value;

              return (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onSelect(item.value);
                    closeSheet();
                  }}
                >
                  <AppText
                    color={
                      active
                        ? colors.primary
                        : colors.textPrimary
                    }
                  >
                    {item.label}
                  </AppText>

                  {active && (
                    <AppText
                      color={colors.primary}
                    >
                      ✓
                    </AppText>
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

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },

  selector: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    borderRadius: 10,
    backgroundColor: '#fff',
  },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },

  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.75,
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
  },

  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },

  option: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
