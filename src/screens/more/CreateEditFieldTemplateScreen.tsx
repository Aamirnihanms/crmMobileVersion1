import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import AppButton from '@/src/components/common/AppButton';
import AppInput from '@/src/components/common/AppInput';
import AppSelect from '@/src/components/common/AppSelect';
import AppText from '@/src/components/common/AppText';
import { 
  useCreateFieldTemplate,
  useFieldTemplateDetail, 
  useUpdateFieldTemplate 
} from '@/src/queries/jobs.query';
import { useAppTheme, spacing } from '@/src/theme';
import type { MoreStackParamList } from '@/src/navigation/MoreStack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { UpdateTemplateItemPayload } from '@/src/api/jobs.api';

type RouteType = RouteProp<MoreStackParamList, 'CreateEditFieldTemplate'>;
type NavProp = NativeStackNavigationProp<MoreStackParamList>;

const FIELD_TYPES = [
  { label: 'Text', value: 'text' },
  { label: 'Number', value: 'number' },
  { label: 'Date', value: 'date' },
  { label: 'Select', value: 'select' },
  { label: 'Multi-Select', value: 'multi_select' },
  { label: 'File', value: 'file' },
  { label: 'URL', value: 'url' },
];

type ItemState = Omit<UpdateTemplateItemPayload, 'options' | 'is_active' | 'sort_order'> & { 
  id: string; // purely for local key mapping in UI
  options: string;
};

const generateKey = (label: string) => {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

export default function CreateEditFieldTemplateScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NavProp>();
  const { companyUid, templateUid } = route.params;

  const isEditMode = !!templateUid;

  const { data, isLoading, isError, error, refetch } = useFieldTemplateDetail(companyUid, templateUid || '');
  const updateMutation = useUpdateFieldTemplate(companyUid, templateUid || '');
  const createMutation = useCreateFieldTemplate(companyUid);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [items, setItems] = useState<ItemState[]>([
    { id: Math.random().toString(), label: '', key: '', field_type: 'text', is_required: false, options: '' }
  ]);

  useEffect(() => {
    if (isEditMode && data?.template) {
      setName(data.template.name);
      setDescription(data.template.description || '');
      setIsActive(data.template.is_active);
      
      setItems(data.template.items.map(item => ({
        id: Math.random().toString(),
        uid: item.uid,
        label: item.label,
        key: item.key,
        field_type: item.field_type,
        is_required: item.is_required,
        options: Array.isArray(item.options) ? item.options.join(', ') : '',
      })));
    }
  }, [data, isEditMode]);

  if (isEditMode && isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isEditMode && (isError || !data)) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <AppText color={colors.danger} style={{ marginTop: spacing.md }}>
          Failed to load template for editing.
        </AppText>
        <Pressable onPress={() => refetch()} style={styles.retryBtn}>
          <AppText color={colors.primary}>Try Again</AppText>
        </Pressable>
      </View>
    );
  }

  const addItem = () => {
    setItems(prev => [
      ...prev,
      { id: Math.random().toString(), label: '', key: '', field_type: 'text', is_required: false, options: '' }
    ]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof ItemState, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'label' && (!item.key || item.key === generateKey(item.label))) {
          updated.key = generateKey(value);
        }
        return updated;
      }
      return item;
    }));
  };

  const validate = (): string | null => {
    if (!name.trim()) return 'Template name is required.';
    if (items.length === 0) return 'At least one field item is required.';
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.label.trim()) return `Item ${i + 1} is missing a label.`;
      if (!item.key.trim()) return `Item ${i + 1} is missing a key.`;
      if (!/^[a-z0-9_]+$/.test(item.key.trim())) return `Item ${i + 1} key can only contain lowercase letters, numbers, and underscores.`;
      
      if (['select', 'multi_select'].includes(item.field_type)) {
        if (!item.options?.trim()) {
          return `Item ${i + 1} (${item.label}) requires options (comma-separated).`;
        }
      }
    }
    
    const keys = items.map(i => i.key.trim());
    if (new Set(keys).size !== keys.length) {
      return 'All item keys must be unique.';
    }

    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      Alert.alert('Validation Error', err);
      return;
    }

    try {
      const payloadItems = items.map((item, index) => ({
        ...(isEditMode ? { uid: item.uid } : {}),
        label: item.label.trim(),
        key: item.key.trim(),
        field_type: item.field_type,
        is_required: item.is_required,
        is_active: true,
        sort_order: index + 1,
        options: ['select', 'multi_select'].includes(item.field_type) && item.options
          ? item.options.split(',').map(s => s.trim()).filter(Boolean)
          : null,
      }));

      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        is_active: isActive,
        items: payloadItems as any,
      };

      if (isEditMode) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
      }

      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (e: any) {
      const respData = e?.response?.data;
      const msg =
        respData?.detail ||
        respData?.error ||
        respData?.message ||
        (respData && typeof respData === 'object' ? Object.values(respData).flat().join('\n') : null) ||
        `Failed to ${isEditMode ? 'update' : 'create'} field template.`;
      Alert.alert('Error', String(msg));
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        bottomOffset={80}
      >
          <AppInput
            label="Template Name *"
            placeholder="e.g. Applicant Additional Info"
            value={name}
            onChangeText={setName}
          />

          <AppInput
            label="Description"
            placeholder="Optional description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={2}
          />

          <View style={styles.switchRow}>
            <AppText style={styles.switchLabel}>Active Template</AppText>
            <Switch
              value={isActive}
              onValueChange={setIsActive}
              trackColor={{ false: colors.border, true: colors.success + '80' }}
              thumbColor={isActive ? colors.success : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.itemsHeader}>
            <AppText variant="subtitle" style={{ fontWeight: '700' }}>Fields ({items.length})</AppText>
            <Pressable onPress={addItem} style={styles.addItemBtn}>
              <Ionicons name="add" size={16} color={colors.primary} />
              <AppText color={colors.primary} style={{ fontWeight: '600', marginLeft: 4 }}>Add Item</AppText>
            </Pressable>
          </View>

          {items.map((item, index) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <AppText style={styles.itemCount}>Field #{index + 1}</AppText>
                {items.length > 1 && (
                  <Pressable onPress={() => removeItem(item.id)} style={styles.removeItemBtn}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </Pressable>
                )}
              </View>

              <AppInput
                label="Label *"
                placeholder="e.g. Graduation Year"
                value={item.label}
                onChangeText={(val) => updateItem(item.id, 'label', val)}
              />
              
              <AppInput
                label="Key *"
                placeholder="e.g. graduation_year"
                value={item.key}
                onChangeText={(val) => updateItem(item.id, 'key', val.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                autoCapitalize="none"
              />
              
              <AppSelect
                label="Field Type *"
                options={FIELD_TYPES}
                value={item.field_type}
                onSelect={(val) => updateItem(item.id, 'field_type', val)}
              />

              {['select', 'multi_select'].includes(item.field_type) && (
                <AppInput
                  label="Options (comma separated) *"
                  placeholder="e.g. Yes, No, Maybe"
                  value={item.options || ''}
                  onChangeText={(val) => updateItem(item.id, 'options', val)}
                />
              )}
              
              <View style={styles.itemSwitchRow}>
                <AppText style={styles.itemSwitchLabel}>Required Field</AppText>
                <Switch
                  value={item.is_required}
                  onValueChange={(val) => updateItem(item.id, 'is_required', val)}
                  trackColor={{ false: colors.border, true: colors.primary + '80' }}
                  thumbColor={item.is_required ? colors.primary : '#f4f3f4'}
                />
              </View>
            </View>
          ))}

      </KeyboardAwareScrollView>

      <View style={styles.footer}>
        <AppButton
          title={isEditMode ? "Save Changes" : "Create Template"}
          onPress={handleSubmit}
          loading={isEditMode ? updateMutation.isPending : createMutation.isPending}
          style={styles.submitBtn}
        />
      </View>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  retryBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primaryLight + '15',
  },
  body: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.surfaceSubtle,
  },
  switchLabel: {
    fontWeight: '600',
    color: colors.textPrimary,
    fontSize: 15,
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.surfaceSubtle,
  },
  itemCount: {
    fontWeight: '700',
    color: colors.textMuted,
    fontSize: 13,
  },
  removeItemBtn: {
    padding: 4,
  },
  itemSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  itemSwitchLabel: {
    fontWeight: '500',
    color: colors.textPrimary,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  submitBtn: {
    height: 54,
    borderRadius: 16,
  },
});
