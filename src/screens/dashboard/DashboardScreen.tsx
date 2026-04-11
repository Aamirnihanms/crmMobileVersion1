import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  LineChart,
  PieChart,
  StackedBarChart,
} from 'react-native-chart-kit';

import AppCard from '@/src/components/common/AppCard';
import type { DashboardTimeframeParam } from '@/src/api/dashboard.api';
import AppLoader from '@/src/components/common/AppLoader';
import AppText from '@/src/components/common/AppText';
import { useMyDashboard, useSuperadminDashboard } from '@/src/queries/dashboard.query';
import { useAuthStore } from '@/src/store/auth.store';
import { colors, spacing } from '@/src/theme';

type DashboardMode = 'superadmin' | 'my';
type PrimitiveMetricValue = string | number | boolean;

type MetricEntry = {
  key: string;
  label: string;
  value: PrimitiveMetricValue;
};

type ExtractedChart = {
  id: string;
  title: string;
  chartType: string;
  data: unknown[];
};

type LineChartPayload = {
  title: string;
  labels: string[];
  values: number[];
};

type DonutChartPayload = {
  title: string;
  data: {
    name: string;
    population: number;
    color: string;
    legendFontColor: string;
    legendFontSize: number;
  }[];
};

type StackedBarPayload = {
  title: string;
  labels: string[];
  legend: string[];
  data: number[][];
  barColors: string[];
};

const METRIC_EXCLUDED_KEYS = new Set([
  'chart_type',
  'title',
  'display_name',
  'selected',
  'start_date',
  'end_date',
]);

const NUMBER_KEYS = ['value', 'count', 'amount', 'total', 'percentage'];
const LABEL_KEYS = ['name', 'label', 'stage', 'title', 'status', 'date', 'hour'];
const CHART_COLORS = ['#5B8FF9', '#36CFC9', '#F6BD16', '#F759AB', '#9254DE', '#13C2C2'];
const screenWidth = Dimensions.get('window').width;
const heroLogo = require('../../../assets/images/logo.png');
const TIMEFRAME_OPTIONS: { label: string; value: DashboardTimeframeParam }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'This Week', value: 'this_week' },
  { label: 'This Month', value: 'this_month' },
  { label: 'This Year', value: 'this_year' },
];

const formatLabel = (key: string) =>
  key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());

const isObject = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
};

const isPrimitiveMetric = (value: unknown): value is PrimitiveMetricValue => {
  const type = typeof value;
  return type === 'string' || type === 'number' || type === 'boolean';
};

const isCurrencyKey = (key: string) => {
  return /(revenue|amount|collection|payment|discount|fee|pending|transaction)/i.test(key);
};

const isRateKey = (key: string) => {
  return /(rate|percentage|efficiency|utilization|score)/i.test(key);
};

const toShortDateTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatMetricValue = (key: string, value: PrimitiveMetricValue) => {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (typeof value === 'number') {
    if (isCurrencyKey(key)) {
      return `₹${value.toLocaleString('en-IN', {
        minimumFractionDigits: value % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
      })}`;
    }

    if (isRateKey(key)) {
      return `${Number(value.toFixed(2)).toLocaleString('en-IN')}%`;
    }

    const hasFraction = value % 1 !== 0;
    return value.toLocaleString('en-IN', {
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: 2,
    });
  }

  return String(value);
};

const getIconForMetric = (key: string): keyof typeof Ionicons.glyphMap => {
  if (/lead/i.test(key)) return 'people-outline';
  if (/(student|batch|enrollment)/i.test(key)) return 'school-outline';
  if (/(revenue|amount|transaction|payment|collection|discount)/i.test(key)) return 'wallet-outline';
  if (/(conversion|performance|score|rate)/i.test(key)) return 'trending-up-outline';
  if (/(followup|activity|recent)/i.test(key)) return 'pulse-outline';
  return 'stats-chart-outline';
};

const hasMeaningfulPrimitive = (key: string, value: PrimitiveMetricValue) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) && Math.abs(value) > 0;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 && normalized !== '0' && normalized !== '0.0' && normalized !== '--';
};

const hasMeaningfulValue = (value: unknown, key = ''): boolean => {
  if (isPrimitiveMetric(value)) {
    return hasMeaningfulPrimitive(key, value);
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasMeaningfulValue(item, key));
  }

  if (isObject(value)) {
    return Object.entries(value).some(([nestedKey, nestedValue]) => {
      if (METRIC_EXCLUDED_KEYS.has(nestedKey)) {
        return false;
      }
      return hasMeaningfulValue(nestedValue, nestedKey);
    });
  }

  return false;
};

const getMetricEntries = (
  data: Record<string, unknown>,
  options?: { includeZero?: boolean }
): MetricEntry[] => {
  const includeZero = options?.includeZero ?? false;

  return Object.entries(data)
    .filter(([key, value]) => !METRIC_EXCLUDED_KEYS.has(key) && isPrimitiveMetric(value))
    .filter(([key, value]) => {
      if (includeZero) {
        if (typeof value === 'number') {
          return Number.isFinite(value);
        }
        if (typeof value === 'string') {
          return value.trim().length > 0;
        }
        return true;
      }
      return hasMeaningfulPrimitive(key, value as PrimitiveMetricValue);
    })
    .map(([key, value]) => ({
      key,
      label: formatLabel(key),
      value: value as PrimitiveMetricValue,
    }));
};

const getItemDisplayText = (item: unknown, fallbackLabel: string, index: number) => {
  if (isPrimitiveMetric(item)) {
    return String(item);
  }

  if (isObject(item)) {
    for (const key of LABEL_KEYS) {
      const candidate = item[key];
      if (isPrimitiveMetric(candidate) && String(candidate).trim().length > 0) {
        return String(candidate);
      }
    }

    const primitiveEntries = Object.entries(item)
      .filter(([key, value]) => !METRIC_EXCLUDED_KEYS.has(key) && isPrimitiveMetric(value));

    if (primitiveEntries.length > 0) {
      const [firstKey, firstValue] = primitiveEntries[0];
      return `${formatLabel(firstKey)}: ${String(firstValue)}`;
    }
  }

  return `${fallbackLabel} ${index + 1}`;
};

const parseNumberValue = (raw: unknown): number | null => {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw;
  }

  if (typeof raw === 'string') {
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
};

const getReadableLabel = (item: unknown, fallback: string, index: number) => {
  if (typeof item === 'string' && item.trim().length > 0) {
    return item.trim();
  }

  if (isObject(item)) {
    for (const key of LABEL_KEYS) {
      const candidate = item[key];
      if (typeof candidate === 'string' && candidate.trim().length > 0) {
        return candidate.trim();
      }
    }
  }

  return `${fallback} ${index + 1}`;
};

const getPrimaryNumericValue = (item: unknown): number | null => {
  if (typeof item === 'number') {
    return Number.isFinite(item) ? item : null;
  }

  if (!isObject(item)) {
    return null;
  }

  for (const key of NUMBER_KEYS) {
    const parsed = parseNumberValue(item[key]);
    if (parsed !== null) {
      return parsed;
    }
  }

  const firstNumericEntry = Object.entries(item).find(([, value]) => parseNumberValue(value) !== null);
  if (firstNumericEntry) {
    return parseNumberValue(firstNumericEntry[1]);
  }

  return null;
};

const collectExtractedCharts = (root: unknown, rootKey = 'dashboard'): ExtractedChart[] => {
  const charts: ExtractedChart[] = [];

  const walk = (node: unknown, path: string) => {
    if (!isObject(node)) {
      return;
    }

    const chartType = typeof node.chart_type === 'string' ? node.chart_type.toLowerCase() : '';
    const title = typeof node.title === 'string' ? node.title : formatLabel(path.split('-').pop() || path);
    const rawData = node.data;

    if (chartType && Array.isArray(rawData) && hasMeaningfulValue(rawData, path)) {
      charts.push({
        id: `${path}-${chartType}`,
        title,
        chartType,
        data: rawData,
      });
    }

    Object.entries(node).forEach(([key, value]) => {
      if (key === 'data' || key === 'title' || key === 'chart_type') {
        return;
      }
      if (isObject(value)) {
        walk(value, `${path}-${key}`);
      }
    });
  };

  walk(root, rootKey);
  return charts;
};

const toLineChartPayload = (chart: ExtractedChart): LineChartPayload | null => {
  const normalized = chart.data
    .map((item, index) => {
      const value = getPrimaryNumericValue(item);
      if (value === null || Number.isNaN(value)) {
        return null;
      }

      return {
        label: getReadableLabel(item, 'Point', index),
        value,
      };
    })
    .filter((item): item is { label: string; value: number } => Boolean(item));

  if (normalized.length < 2) {
    return null;
  }

  const hasSignal = normalized.some((item) => Math.abs(item.value) > 0);
  if (!hasSignal) {
    return null;
  }

  const sliced = normalized.slice(-6);
  return {
    title: chart.title,
    labels: sliced.map((item) => item.label.slice(0, 8)),
    values: sliced.map((item) => item.value),
  };
};

const toDonutChartPayload = (chart: ExtractedChart): DonutChartPayload | null => {
  const parsed = chart.data
    .map((item, index) => {
      const value = getPrimaryNumericValue(item);
      if (value === null || value <= 0) {
        return null;
      }

      const name = getReadableLabel(item, 'Segment', index);
      const colorFromItem = isObject(item) && typeof item.color === 'string' ? item.color : undefined;

      return {
        name,
        population: value,
        color: colorFromItem || CHART_COLORS[index % CHART_COLORS.length],
        legendFontColor: colors.textSecondary,
        legendFontSize: 11,
      };
    })
    .filter((item): item is DonutChartPayload['data'][number] => Boolean(item));

  if (parsed.length < 1) {
    return null;
  }

  return {
    title: chart.title,
    data: parsed.slice(0, 6),
  };
};

const toStackedBarPayload = (chart: ExtractedChart): StackedBarPayload | null => {
  const objectItems = chart.data.filter((item): item is Record<string, unknown> => isObject(item));
  if (objectItems.length < 1) {
    return null;
  }

  const numericKeySet = new Set<string>();
  objectItems.forEach((item) => {
    Object.entries(item).forEach(([key, value]) => {
      if (LABEL_KEYS.includes(key) || key === 'color') {
        return;
      }
      const parsed = parseNumberValue(value);
      if (parsed !== null) {
        numericKeySet.add(key);
      }
    });
  });

  const numericKeys = Array.from(numericKeySet).slice(0, 3);
  if (numericKeys.length < 1) {
    return null;
  }

  const labels: string[] = [];
  const data: number[][] = [];

  objectItems.slice(0, 5).forEach((item, index) => {
    const values = numericKeys.map((key) => parseNumberValue(item[key]) ?? 0);
    const hasAnyValue = values.some((value) => Math.abs(value) > 0);
    if (!hasAnyValue) {
      return;
    }

    labels.push(getReadableLabel(item, 'Item', index).slice(0, 7));
    data.push(values.map((value) => Math.abs(value)));
  });

  if (labels.length < 1) {
    return null;
  }

  return {
    title: chart.title,
    labels,
    legend: numericKeys.map((key) => formatLabel(key)),
    data,
    barColors: numericKeys.map((_, index) => CHART_COLORS[index % CHART_COLORS.length]),
  };
};

function MetricCard({ metric }: { metric: MetricEntry }) {
  const metricColor = isCurrencyKey(metric.key)
    ? colors.success
    : isRateKey(metric.key)
      ? colors.primary
      : colors.gradientEnd;

  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: `${metricColor}18` }]}>
        <Ionicons name={getIconForMetric(metric.key)} size={16} color={metricColor} />
      </View>
      <AppText variant="caption" color={colors.textMuted} style={styles.metricLabel}>
        {metric.label}
      </AppText>
      <AppText variant="title" style={styles.metricValue} numberOfLines={1}>
        {formatMetricValue(metric.key, metric.value)}
      </AppText>
    </View>
  );
}

function DashboardLineChart({ payload }: { payload: LineChartPayload }) {
  const chartWidth = screenWidth - spacing.lg * 2 - spacing.xl;

  return (
    <View style={styles.proChartBlock}>
      <AppText variant="subtitle" style={styles.proChartTitle}>
        {payload.title}
      </AppText>
      <LineChart
        data={{
          labels: payload.labels,
          datasets: [{ data: payload.values }],
        }}
        width={chartWidth}
        height={220}
        yAxisLabel=""
        yAxisSuffix=""
        withInnerLines
        withOuterLines={false}
        withVerticalLines={false}
        fromZero
        chartConfig={{
          backgroundGradientFrom: colors.surface,
          backgroundGradientTo: colors.surface,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(91, 143, 249, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: '#5B8FF9',
            fill: colors.surface,
          },
          propsForBackgroundLines: {
            stroke: colors.surfaceSubtle,
            strokeDasharray: '',
          },
        }}
        bezier
        style={styles.chartKitStyle}
      />
    </View>
  );
}

function DashboardDonutChart({ payload }: { payload: DonutChartPayload }) {
  const chartWidth = screenWidth - spacing.lg * 2 - spacing.xl;

  return (
    <View style={styles.proChartBlock}>
      <AppText variant="subtitle" style={styles.proChartTitle}>
        {payload.title}
      </AppText>
      <View style={styles.donutWrap}>
        <PieChart
          data={payload.data}
          width={chartWidth}
          height={210}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="16"
          chartConfig={{
            backgroundGradientFrom: colors.surface,
            backgroundGradientTo: colors.surface,
            color: (opacity = 1) => `rgba(91, 143, 249, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
          }}
          absolute={false}
          hasLegend
        />
      </View>
    </View>
  );
}

function DashboardStackedBar({ payload }: { payload: StackedBarPayload }) {
  const chartWidth = screenWidth - spacing.lg * 2 - spacing.xl;

  return (
    <View style={styles.proChartBlock}>
      <AppText variant="subtitle" style={styles.proChartTitle}>
        {payload.title}
      </AppText>
      <StackedBarChart
        data={{
          labels: payload.labels,
          legend: payload.legend,
          data: payload.data,
          barColors: payload.barColors,
        }}
        width={chartWidth}
        height={230}
        hideLegend={false}
        fromZero
        chartConfig={{
          backgroundGradientFrom: colors.surface,
          backgroundGradientTo: colors.surface,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
          propsForBackgroundLines: {
            stroke: colors.surfaceSubtle,
            strokeDasharray: '',
          },
        }}
        style={styles.chartKitStyle}
      />
    </View>
  );
}

function ArrayPreview({ title, items }: { title: string; items: unknown[] }) {
  const meaningfulItems = items.filter((item) => hasMeaningfulValue(item, title));
  if (meaningfulItems.length === 0) {
    return null;
  }

  const visibleItems = meaningfulItems.slice(0, 3);

  return (
    <View style={styles.arrayBlock}>
      <View style={styles.arrayHeaderRow}>
        <AppText variant="subtitle" style={styles.subSectionTitle}>
          {formatLabel(title)}
        </AppText>
        <AppText variant="caption" color={colors.textMuted}>
          {meaningfulItems.length}
        </AppText>
      </View>

      {visibleItems.map((item, index) => (
        <View key={`${title}-${index}`} style={styles.arrayItemRow}>
          <View style={styles.arrayDot} />
          <AppText variant="caption" color={colors.textSecondary} style={styles.arrayItemText}>
            {getItemDisplayText(item, formatLabel(title), index)}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function NestedObjectBlock({
  title,
  data,
  depth = 0,
}: {
  title: string;
  data: Record<string, unknown>;
  depth?: number;
}) {
  const metrics = getMetricEntries(data);
  const nestedObjects = Object.entries(data)
    .filter(([key, value]) => !METRIC_EXCLUDED_KEYS.has(key) && isObject(value) && hasMeaningfulValue(value, key));
  const arrays = Object.entries(data)
    .filter(([key, value]) => !METRIC_EXCLUDED_KEYS.has(key) && Array.isArray(value) && hasMeaningfulValue(value, key));

  const hasRenderableContent = metrics.length > 0 || nestedObjects.length > 0 || arrays.length > 0;

  if (!hasRenderableContent) {
    return null;
  }

  const chartType = typeof data.chart_type === 'string' ? data.chart_type : null;
  const chartTitle = typeof data.title === 'string' ? data.title : null;

  return (
    <View style={[styles.nestedBlock, depth > 0 && styles.nestedBlockDeep]}>
      <View style={styles.nestedHeaderRow}>
        <AppText variant="subtitle" style={styles.subSectionTitle}>
          {chartTitle || formatLabel(title)}
        </AppText>
        {chartType ? (
          <View style={styles.chartTypeBadge}>
            <AppText variant="caption" color={colors.primary} style={styles.chartTypeText}>
              {chartType.toUpperCase()}
            </AppText>
          </View>
        ) : null}
      </View>

      {metrics.length > 0 ? (
        <View style={styles.metricGrid}>
          {metrics.map((metric) => (
            <MetricCard key={`${title}-${metric.key}`} metric={metric} />
          ))}
        </View>
      ) : null}

      {arrays.map(([key, value]) => (
        <ArrayPreview key={`${title}-${key}`} title={key} items={value as unknown[]} />
      ))}

      {depth < 2
        ? nestedObjects.map(([key, value]) => (
            <NestedObjectBlock
              key={`${title}-${key}`}
              title={key}
              data={value as Record<string, unknown>}
              depth={depth + 1}
            />
          ))
        : null}
    </View>
  );
}

function SectionCard({ title, data }: { title: string; data: Record<string, unknown> }) {
  if (!hasMeaningfulValue(data, title)) {
    return null;
  }

  return (
    <AppCard style={styles.sectionCard}>
      <View style={styles.sectionHeaderRow}>
        <AppText variant="h2" style={styles.sectionTitle}>
          {formatLabel(title)}
        </AppText>
        <View style={styles.sectionPill}>
          <Ionicons name="analytics-outline" size={12} color={colors.primary} />
          <AppText variant="caption" color={colors.primary} style={styles.sectionPillText}>
            Live
          </AppText>
        </View>
      </View>

      <NestedObjectBlock title={title} data={data} />
    </AppCard>
  );
}

export default function DashboardScreen() {
  const [mode, setMode] = useState<DashboardMode>('superadmin');
  const [selectedTimeframe, setSelectedTimeframe] = useState<DashboardTimeframeParam>('today');
  const [timeframePickerOpen, setTimeframePickerOpen] = useState(false);
  const authUser = useAuthStore((state) => state.user);

  const normalizedRole = (authUser?.role || '').toLowerCase().replace(/[\s_-]/g, '');
  const isSuperAdmin =
    authUser?.is_superuser === true ||
    normalizedRole === 'superadmin' ||
    normalizedRole.includes('superuser');

  const shouldFetchSuperadminDashboard = isSuperAdmin && mode === 'superadmin';
  const shouldFetchMyDashboard = !isSuperAdmin || mode === 'my';

  const superadminQuery = useSuperadminDashboard(selectedTimeframe, shouldFetchSuperadminDashboard);
  const myDashboardQuery = useMyDashboard(selectedTimeframe, shouldFetchMyDashboard);

  const activeMode: DashboardMode = isSuperAdmin ? mode : 'my';
  const activeQuery = activeMode === 'superadmin' ? superadminQuery : myDashboardQuery;
  const activePayload = activeQuery.data;
  const activeData = activePayload?.data;
  const selectedTimeframeLabel =
    TIMEFRAME_OPTIONS.find((option) => option.value === selectedTimeframe)?.label || 'Today';

  const timeframe = activeData?.timeframe;
  const titleName = activeData?.user_info?.name || authUser?.full_name || 'Team';

  const quickMetrics = useMemo(() => {
    if (!activeData) return [] as MetricEntry[];

    const preferredSources = activeMode === 'superadmin'
      ? [activeData.overview_metrics, activeData.payment_metrics, activeData.student_metrics]
      : [activeData.overview_metrics, activeData.my_leads, activeData.my_students, activeData.my_payments];

    for (const source of preferredSources) {
      if (isObject(source)) {
        const metrics = getMetricEntries(source, { includeZero: true }).slice(0, 4);
        if (metrics.length > 0) {
          return metrics;
        }
      }
    }

    const fallback = Object.entries(activeData).find(
      ([key, value]) => key !== 'timeframe' && key !== 'user_info' && isObject(value)
    );

    if (fallback && isObject(fallback[1])) {
      return getMetricEntries(fallback[1], { includeZero: true }).slice(0, 4);
    }

    return [];
  }, [activeData, activeMode]);

  const sections = useMemo<[string, Record<string, unknown>][]>(() => {
    if (!activeData) return [];

    return Object.entries(activeData)
      .filter(([key, value]) => key !== 'timeframe' && key !== 'user_info' && isObject(value) && hasMeaningfulValue(value, key))
      .map(
        ([key, value]) =>
          [key, value as Record<string, unknown>] as [string, Record<string, unknown>]
      );
  }, [activeData]);

  const extractedCharts = useMemo(() => {
    if (!activeData) return [] as ExtractedChart[];
    return collectExtractedCharts(activeData);
  }, [activeData]);

  const lineChart = useMemo(() => {
    const lineSource = extractedCharts.find((chart) => chart.chartType === 'line');
    if (!lineSource) {
      return null;
    }
    return toLineChartPayload(lineSource);
  }, [extractedCharts]);

  const donutChart = useMemo(() => {
    const donutSource = extractedCharts.find(
      (chart) => chart.chartType === 'pie' || chart.chartType === 'donut'
    );
    if (!donutSource) {
      return null;
    }
    return toDonutChartPayload(donutSource);
  }, [extractedCharts]);

  const stackedChart = useMemo(() => {
    const stackedSource = extractedCharts.find(
      (chart) => chart.chartType === 'bar' || chart.chartType === 'funnel'
    );
    if (!stackedSource) {
      return null;
    }
    return toStackedBarPayload(stackedSource);
  }, [extractedCharts]);

  if (activeQuery.isLoading && !activePayload) {
    return <AppLoader />;
  }

  if (activeQuery.isError && !activePayload) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={46} color={colors.danger} />
        <AppText variant="title" color={colors.danger} style={styles.errorTitle}>
          Failed to load dashboard
        </AppText>
        <Pressable style={styles.retryButton} onPress={() => activeQuery.refetch()}>
          <AppText variant="button" color={colors.primary}>
            Try Again
          </AppText>
        </Pressable>
      </View>
    );
  }

  const hasAnyInsights =
    quickMetrics.length > 0 ||
    Boolean(lineChart) ||
    Boolean(donutChart) ||
    Boolean(stackedChart) ||
    sections.length > 0;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={activeQuery.isRefetching}
          onRefresh={() => activeQuery.refetch()}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.container}>
        <LinearGradient
          colors={[colors.primary, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroHeaderRow}>
            <View>
              <AppText variant="caption" color="rgba(255,255,255,0.82)">
                {activeMode === 'superadmin' ? 'Super Admin Dashboard' : 'My Dashboard'}
              </AppText>
              <AppText variant="h1" color={colors.surface} style={styles.heroTitle}>
                {titleName}
              </AppText>
            </View>
            <View style={styles.heroIconBubble}>
              <Image source={heroLogo} style={styles.heroLogoImage} resizeMode="contain" />
            </View>
          </View>

          <View style={styles.heroMetaRow}>
            <Pressable
              onPress={() => setTimeframePickerOpen(true)}
              style={({ pressed }) => [
                styles.heroMetaPill,
                pressed && styles.heroMetaPillPressed,
              ]}
            >
              <Ionicons name="calendar-outline" size={12} color={colors.surface} />
              <AppText variant="caption" color={colors.surface} style={styles.heroMetaText}>
                {timeframe?.display_name || selectedTimeframeLabel}
              </AppText>
              <Ionicons name="chevron-down" size={12} color={colors.surface} />
            </Pressable>

            {activePayload?.generated_at ? (
              <View style={styles.heroMetaPillMuted}>
                <AppText variant="caption" color={colors.surface} style={styles.heroMetaText}>
                  Updated {toShortDateTime(activePayload.generated_at)}
                </AppText>
              </View>
            ) : null}
          </View>

          {(timeframe?.start_date || timeframe?.end_date) ? (
            <AppText variant="caption" color="rgba(255,255,255,0.78)" style={styles.heroRangeText}>
              {timeframe?.start_date || '--'} to {timeframe?.end_date || '--'}
            </AppText>
          ) : null}
        </LinearGradient>

        {isSuperAdmin ? (
          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggleButton, mode === 'superadmin' && styles.toggleButtonActive]}
              onPress={() => setMode('superadmin')}
            >
              <AppText
                variant="button"
                color={mode === 'superadmin' ? colors.surface : colors.textSecondary}
              >
                Super Admin
              </AppText>
            </Pressable>
            <Pressable
              style={[styles.toggleButton, mode === 'my' && styles.toggleButtonActive]}
              onPress={() => setMode('my')}
            >
              <AppText
                variant="button"
                color={mode === 'my' ? colors.surface : colors.textSecondary}
              >
                My Dashboard
              </AppText>
            </Pressable>
          </View>
        ) : null}

        {quickMetrics.length > 0 ? (
          <View style={styles.quickStatsGrid}>
            {quickMetrics.map((metric) => (
              <MetricCard key={`quick-${metric.key}`} metric={metric} />
            ))}
          </View>
        ) : null}

        {(lineChart || donutChart || stackedChart) ? (
          <AppCard style={styles.visualInsightsCard}>
            <AppText variant="title" style={styles.visualInsightsTitle}>
              Visual Insights
            </AppText>
            {lineChart ? <DashboardLineChart payload={lineChart} /> : null}
            {donutChart ? <DashboardDonutChart payload={donutChart} /> : null}
            {stackedChart ? <DashboardStackedBar payload={stackedChart} /> : null}
          </AppCard>
        ) : null}

        {sections.map(([title, sectionData]) => (
          <SectionCard key={title} title={title} data={sectionData} />
        ))}

        {!hasAnyInsights ? (
          <AppCard style={styles.emptyCard}>
            <Ionicons name="bar-chart-outline" size={26} color={colors.textMuted} />
            <AppText variant="subtitle" color={colors.textSecondary} style={styles.emptyTitle}>
              No meaningful dashboard data
            </AppText>
            <AppText variant="caption" color={colors.textMuted} style={styles.emptySubtitle}>
              Sections appear automatically when they have real values.
            </AppText>
          </AppCard>
        ) : null}
      </View>

      <Modal
        visible={timeframePickerOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setTimeframePickerOpen(false)}
      >
        <View style={styles.timeframeOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setTimeframePickerOpen(false)} />
          <View style={styles.timeframeModalCard}>
            <AppText variant="title" style={styles.timeframeModalTitle}>
              Select Timeframe
            </AppText>
            {TIMEFRAME_OPTIONS.map((option) => {
              const active = option.value === selectedTimeframe;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setSelectedTimeframe(option.value);
                    setTimeframePickerOpen(false);
                  }}
                  style={[styles.timeframeOption, active && styles.timeframeOptionActive]}
                >
                  <AppText
                    variant="subtitle"
                    color={active ? colors.primary : colors.textPrimary}
                    style={styles.timeframeOptionText}
                  >
                    {option.label}
                  </AppText>
                  {active ? (
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  heroCard: {
    borderRadius: 24,
    padding: spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 7,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  heroTitle: {
    marginTop: 4,
    fontWeight: '800',
  },
  heroIconBubble: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  heroLogoImage: {
    width: 28,
    height: 28,
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  heroMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroMetaPillPressed: {
    opacity: 0.8,
  },
  heroMetaPillMuted: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroMetaText: {
    fontWeight: '700',
  },
  heroRangeText: {
    marginTop: 2,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceSubtle,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricCard: {
    width: '48%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceSubtle,
    backgroundColor: colors.surface,
    padding: spacing.md,
    minHeight: 88,
  },
  metricIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 3,
    fontWeight: '700',
  },
  metricValue: {
    fontWeight: '800',
    color: colors.textPrimary,
  },
  visualInsightsCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.surfaceSubtle,
    gap: spacing.md,
  },
  visualInsightsTitle: {
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.surfaceSubtle,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontWeight: '800',
    flex: 1,
  },
  sectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: `${colors.primary}14`,
    borderWidth: 1,
    borderColor: `${colors.primary}26`,
  },
  sectionPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  nestedBlock: {
    borderRadius: 14,
    backgroundColor: colors.backgroundSoft,
    borderWidth: 1,
    borderColor: colors.surfaceSubtle,
    padding: spacing.md,
    gap: spacing.md,
  },
  nestedBlockDeep: {
    backgroundColor: colors.surface,
  },
  nestedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  subSectionTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  chartTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: `${colors.primary}1A`,
    borderWidth: 1,
    borderColor: `${colors.primary}33`,
  },
  chartTypeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  proChartBlock: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceSubtle,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
  },
  proChartTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
    marginHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  chartKitStyle: {
    borderRadius: 12,
    paddingRight: spacing.sm,
  },
  donutWrap: {
    alignItems: 'center',
  },
  arrayBlock: {
    borderWidth: 1,
    borderColor: colors.surfaceSubtle,
    borderRadius: 12,
    padding: spacing.sm,
    gap: 6,
    backgroundColor: colors.surface,
  },
  arrayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrayItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  arrayItemText: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  errorTitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    fontWeight: '700',
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    backgroundColor: `${colors.primary}10`,
  },
  emptyCard: {
    borderRadius: 20,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.surfaceSubtle,
  },
  emptyTitle: {
    fontWeight: '700',
  },
  emptySubtitle: {
    textAlign: 'center',
  },
  timeframeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  timeframeModalCard: {
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceSubtle,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  timeframeModalTitle: {
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  timeframeOption: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeframeOptionActive: {
    borderColor: `${colors.primary}50`,
    backgroundColor: `${colors.primary}12`,
  },
  timeframeOptionText: {
    fontWeight: '700',
  },
});
