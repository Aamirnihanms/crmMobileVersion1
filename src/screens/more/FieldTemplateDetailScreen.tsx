import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useLayoutEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import AppCard from '@/src/components/common/AppCard';
import AppText from '@/src/components/common/AppText';
import type { MoreStackParamList } from '@/src/navigation/MoreStack';
import { useDeleteFieldTemplate, useFieldTemplateDetail } from '@/src/queries/jobs.query';
import { useAppTheme, spacing } from '@/src/theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type DetailRouteProp = RouteProp<MoreStackParamList, 'FieldTemplateDetail'>;
type NavProp = NativeStackNavigationProp<MoreStackParamList>;

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function FieldTemplateDetailScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const route = useRoute<DetailRouteProp>();
  const navigation = useNavigation<NavProp>();
  const { companyUid, templateUid } = route.params;

  const { data, isLoading, isError, error, refetch } = useFieldTemplateDetail(companyUid, templateUid);
  const deleteMutation = useDeleteFieldTemplate(companyUid);

  const handleDelete = () => {
    if (!data?.template) return;
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${data.template.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(templateUid, {
              onSuccess: () => {
                navigation.goBack();
              },
              onError: (error: any) => {
                Alert.alert('Error', error?.response?.data?.message || 'Failed to delete template');
              },
            });
          },
        },
      ]
    );
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Pressable
            onPress={() => navigation.navigate('CreateEditFieldTemplate', { companyUid, templateUid })}
            style={({ pressed }) => ({
              opacity: pressed ? 0.7 : 1,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.primaryLight + '15',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 8,
            })}
          >
            <Ionicons name="pencil" size={20} color={colors.primary} />
          </Pressable>
          <Pressable
            onPress={handleDelete}
            disabled={deleteMutation.isPending}
            style={({ pressed }) => ({
              opacity: pressed || deleteMutation.isPending ? 0.7 : 1,
              marginRight: 8,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.danger + '15',
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <Ionicons
              name={deleteMutation.isPending ? 'hourglass-outline' : 'trash'}
              size={20}
              color={colors.danger}
            />
          </Pressable>
        </View>
      ),
    });
  }, [navigation, companyUid, templateUid, deleteMutation, handleDelete]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
        <AppText color={colors.danger} style={styles.errorText}>
          {(() => {
            const err = error as any;
            return err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Failed to load template';
          })()}
        </AppText>
        <Pressable onPress={() => refetch()} style={styles.retryBtn}>
          <AppText color={colors.primary}>Try Again</AppText>
        </Pressable>
      </View>
    );
  }

  const { template } = data;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>

        {/* Metadata Card */}
        <AppCard style={styles.card}>
          <View style={styles.headerRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.warning + '15' }]}>
              <Ionicons name="document-text-outline" size={24} color={colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="h2" style={{ fontWeight: '800' }}>{template.name}</AppText>
              <View style={[styles.statusBadge, template.is_active ? styles.activeBadge : styles.inactiveBadge]}>
                <View style={[styles.statusDot, template.is_active ? styles.activeDot : styles.inactiveDot]} />
                <AppText variant="caption" color={template.is_active ? colors.success : colors.textMuted} style={{ fontWeight: '700' }}>
                  {template.is_active ? 'Active' : 'Inactive'}
                </AppText>
              </View>
            </View>
          </View>

          {template.description ? (
            <View style={styles.descSection}>
              <AppText variant="caption" color={colors.textMuted}>Description</AppText>
              <AppText variant="body" color={colors.textPrimary} style={{ marginTop: 4 }}>
                {template.description}
              </AppText>
            </View>
          ) : null}

          <View style={styles.metaRow}>
            <View>
              <AppText variant="caption" color={colors.textMuted}>Created</AppText>
              <AppText variant="body" style={{ fontWeight: '600' }}>{formatDate(template.created_at)}</AppText>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <AppText variant="caption" color={colors.textMuted}>Updated</AppText>
              <AppText variant="body" style={{ fontWeight: '600' }}>{formatDate(template.updated_at)}</AppText>
            </View>
          </View>
        </AppCard>

        <AppText variant="h3" style={styles.sectionTitle}>
          Fields ({template.items.length})
        </AppText>

        {/* Fields List */}
        {template.items.map((item, index) => (
          <AppCard key={item.uid} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <View style={styles.itemTypeBadge}>
                <AppText style={styles.itemTypeText}>{item.field_type.toUpperCase().replace('_', ' ')}</AppText>
              </View>
              {item.is_required && (
                <AppText variant="caption" color={colors.danger} style={{ fontWeight: '700' }}>
                  * Required
                </AppText>
              )}
            </View>

            <View style={styles.itemRow}>
              <AppText variant="caption" color={colors.textMuted} style={styles.itemLabel}>Label</AppText>
              <AppText variant="body" style={{ fontWeight: '700' }}>{item.label}</AppText>
            </View>

            <View style={styles.itemRow}>
              <AppText variant="caption" color={colors.textMuted} style={styles.itemLabel}>Key</AppText>
              <AppText variant="body" color={colors.textSecondary} style={styles.codeText}>{item.key}</AppText>
            </View>

            {Array.isArray(item.options) && item.options.length > 0 && (
              <View style={styles.itemRow}>
                <AppText variant="caption" color={colors.textMuted} style={styles.itemLabel}>Options</AppText>
                <View style={styles.optionsWrap}>
                  {item.options.map((opt, idx) => (
                    <View key={idx} style={styles.optionChip}>
                      <AppText variant="caption" style={{ fontWeight: '600' }}>{opt}</AppText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {!item.is_active && (
              <View style={styles.itemRow}>
                <AppText variant="caption" color={colors.textMuted} style={styles.itemLabel}>Status</AppText>
                <AppText variant="body" color={colors.textMuted} style={{ fontStyle: 'italic' }}>Inactive</AppText>
              </View>
            )}
          </AppCard>
        ))}

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
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
  content: {
    padding: spacing.lg,
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
  card: {
    borderRadius: 20,
    marginBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  activeBadge: { backgroundColor: colors.success + '15' },
  inactiveBadge: { backgroundColor: colors.surfaceSubtle },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: { backgroundColor: colors.success },
  inactiveDot: { backgroundColor: colors.textMuted },
  descSection: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.surfaceSubtle,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.surfaceSubtle,
  },
  sectionTitle: {
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    marginLeft: 4,
  },
  itemCard: {
    borderRadius: 16,
    marginBottom: spacing.md,
    padding: spacing.md,
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
  itemTypeBadge: {
    backgroundColor: colors.primaryLight + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  itemTypeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  itemLabel: {
    width: 70,
  },
  codeText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  optionsWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  optionChip: {
    backgroundColor: colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
