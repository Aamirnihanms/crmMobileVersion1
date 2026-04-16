import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withTiming, useSharedValue, interpolate, Extrapolate } from 'react-native-reanimated';

import { colors, spacing } from '@/src/theme';
import AppText from '@/src/components/common/AppText';
import { StudentAttendance, AttendanceRecord, AttendanceMode } from '@/src/api/attendance.api';
import AttendanceEditModal from '../attendance/AttendanceEditModal';

interface AttendanceStudentCardProps {
  student: StudentAttendance;
  batchId: string;
}

const getStatusColor = (status: AttendanceMode | 'absent') => {
  switch (status) {
    case 'offline': return colors.success;
    case 'online': return colors.info;
    case 'recording': return colors.primary;
    case 'absent': return colors.danger;
    default: return colors.textMuted;
  }
};

const getStatusInitial = (status: AttendanceMode | 'absent') => {
  switch (status) {
    case 'offline': return 'P';
    case 'online': return 'O';
    case 'recording': return 'R';
    case 'absent': return 'A';
    default: return '?';
  }
};

const AttendanceBead = ({ record, size = 32, onPress }: { record: AttendanceRecord, size?: number, onPress?: () => void }) => {
  const color = getStatusColor(record.attendance);
  const dateParts = record.date.split('-');
  const displayDate = `${dateParts[2]}/${dateParts[1]}`;

  return (
    <Pressable onPress={onPress} style={styles.beadWrapper}>
      <View style={[styles.bead, { 
        backgroundColor: color + '15', 
        borderColor: color,
        width: size,
        height: size,
        borderRadius: size * 0.3
      }]}>
        <AppText style={[styles.beadText, { color, fontSize: size * 0.4 }]}>{getStatusInitial(record.attendance)}</AppText>
      </View>
      <AppText style={styles.beadDate}>{displayDate}</AppText>
    </Pressable>
  );
};

export default function AttendanceStudentCard({ student, batchId }: AttendanceStudentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  const expandedValue = useSharedValue(0);

  const initials = student.student_name.slice(0, 2).toUpperCase();
  const percentage = student.attendance_summary.attendance_percentage;
  
  const percentageColor = percentage >= 75 ? colors.success : percentage >= 50 ? colors.warning : colors.danger;

  const handleBeadPress = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setEditModalVisible(true);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    expandedValue.value = withTiming(isExpanded ? 0 : 1, { duration: 300 });
  };

  const expandedStyle = useAnimatedStyle(() => {
    return {
      opacity: expandedValue.value,
      maxHeight: interpolate(expandedValue.value, [0, 1], [0, 1000], Extrapolate.CLAMP),
      overflow: 'hidden',
      marginTop: interpolate(expandedValue.value, [0, 1], [0, spacing.sm]),
    };
  });

  const arrowStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${expandedValue.value * 180}deg` }],
    };
  });

  const collapsedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(expandedValue.value, [0, 0.5, 1], [1, 0, 0]),
      height: interpolate(expandedValue.value, [0, 1], [80, 0], Extrapolate.CLAMP),
      overflow: 'hidden',
    };
  });

  // Group records by month for the expanded view
  const groupedAttendance = student.attendance.reduce((acc: any, record) => {
    const date = new Date(record.date);
    const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[month]) acc[month] = [];
    acc[month].push(record);
    return acc;
  }, {});

  const recentAttendance = student.attendance.slice(0, 10);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <AppText style={styles.avatarText}>{initials}</AppText>
        </View>
        <View style={styles.info}>
          <AppText variant="subtitle" style={styles.name}>{student.student_name}</AppText>
          <AppText style={styles.id}>{student.id}</AppText>
        </View>
        <View style={styles.percentageContainer}>
          <AppText style={[styles.percentage, { color: percentageColor }]}>
            {percentage.toFixed(0)}%
          </AppText>
          <AppText style={styles.percentageLabel}>Attendance</AppText>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <AppText style={styles.summaryValue}>{student.attendance_summary.total_classes}</AppText>
          <AppText style={styles.summaryLabel}>Total</AppText>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <AppText style={[styles.summaryValue, { color: colors.success }]}>{student.attendance_summary.offline}</AppText>
          <AppText style={styles.summaryLabel}>Offline</AppText>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <AppText style={[styles.summaryValue, { color: colors.info }]}>{student.attendance_summary.online}</AppText>
          <AppText style={styles.summaryLabel}>Online</AppText>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryItem}>
          <AppText style={[styles.summaryValue, { color: colors.primary }]}>{student.attendance_summary.recording}</AppText>
          <AppText style={styles.summaryLabel}>Rec</AppText>
        </View>
      </View>

      <View style={styles.stripHeader}>
        <AppText style={styles.stripTitle}>{isExpanded ? 'Full Attendance History' : 'Recent History'}</AppText>
        <Pressable onPress={toggleExpand} style={styles.viewAllBtn}>
          <AppText style={styles.viewAllText}>{isExpanded ? 'Collapse' : 'View All'}</AppText>
          <Animated.View style={arrowStyle}>
            <Ionicons name="chevron-down" size={14} color={colors.primary} />
          </Animated.View>
        </Pressable>
      </View>

      <Animated.View style={collapsedStyle}>
        {recentAttendance.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stripContent}
          >
            {recentAttendance.map((record, index) => (
              <AttendanceBead key={index} record={record} onPress={() => handleBeadPress(record)} />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyStrip}>
            <AppText style={styles.emptyStripText}>No attendance records found</AppText>
          </View>
        )}
      </Animated.View>

      <Animated.View style={expandedStyle}>
        {Object.keys(groupedAttendance).map((month) => (
          <View key={month} style={styles.monthSection}>
            <AppText style={styles.monthTitle}>{month}</AppText>
            <View style={styles.grid}>
              {groupedAttendance[month].map((record: any, index: number) => (
                <AttendanceBead key={index} record={record} size={36} onPress={() => handleBeadPress(record)} />
              ))}
            </View>
          </View>
        ))}
      </Animated.View>

      <AttendanceEditModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        studentName={student.student_name}
        studentId={student.id}
        date={selectedRecord?.date || ''}
        currentStatus={selectedRecord?.attendance || ''}
        currentReason={selectedRecord?.reason || null}
        batchId={batchId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: colors.border + '50',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primaryLight + '30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 16,
  },
  info: {
    flex: 1,
  },
  name: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  id: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  percentageContainer: {
    alignItems: 'flex-end',
  },
  percentage: {
    fontSize: 20,
    fontWeight: '800',
  },
  percentageLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSoft,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  summaryLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
    height: '60%',
    alignSelf: 'center',
  },
  stripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stripTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  viewAllText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
  },
  stripContent: {
    paddingRight: spacing.md,
  },
  beadWrapper: {
    alignItems: 'center',
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  bead: {
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  beadText: {
    fontWeight: '800',
  },
  beadDate: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '600',
  },
  monthSection: {
    marginBottom: spacing.md,
  },
  monthTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    backgroundColor: colors.backgroundSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyStrip: {
    backgroundColor: colors.backgroundSoft,
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border + '50',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  emptyStripText: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
