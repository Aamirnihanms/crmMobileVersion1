// components/common/SearchBar.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';

interface SearchBarProps {
  onSearch: (searchText: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = 'Search by name, phone, email...',
  debounceMs = 500,
}) => {
  const [searchText, setSearchText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Debounce the search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchText);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchText, debounceMs, onSearch]);

  const handleClear = () => {
    setSearchText('');
    onSearch('');
    Keyboard.dismiss();
  };

  const handleSubmit = () => {
    onSearch(searchText);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.searchContainer,
        isFocused && styles.searchContainerFocused
      ]}>
        <Ionicons
          name="search-outline"
          size={20}
          color={colors.textMuted}
          style={styles.searchIcon}
        />
        
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSubmit}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="never" // We'll handle clear manually
        />
        
        {searchText.length > 0 && (
          <TouchableOpacity 
            onPress={handleClear} 
            style={styles.clearButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    minHeight: 44,
  },
  searchContainerFocused: {
    borderColor: colors.primary,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
    includeFontPadding: false,
  },
  clearButton: {
    padding: spacing.xs,
  },
});

export default SearchBar;