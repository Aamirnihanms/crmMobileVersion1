import AppText from '@/src/components/common/AppText';
import { useAppTheme, spacing } from '@/src/theme';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React, { createContext, useContext, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { BatchDetail } from '@/src/api/batches.api';
import BatchOverviewTab from '@/src/screens/more/tabs/BatchOverviewTab';
import BatchStudentsTab from '@/src/screens/more/tabs/BatchStudentsTab';
import BatchAttendanceTab from '@/src/screens/more/tabs/BatchAttendanceTab';
import BatchGalleryTab from '@/src/screens/more/tabs/BatchGalleryTab';
import BatchSessionsTab from '@/src/screens/more/tabs/BatchSessionsTab';

const Tab = createMaterialTopTabNavigator();

// Context to provide batch data to tabs stably
const BatchContext = createContext<{ batch: BatchDetail | null }>({ batch: null });

const OverviewTab = () => {
    const { batch } = useContext(BatchContext);
    return batch ? <BatchOverviewTab batch={batch} /> : null;
};

const StudentsTab = () => {
    const { batch } = useContext(BatchContext);
    return batch ? <BatchStudentsTab batchUid={batch.uid} /> : null;
};

const AttendanceTab = () => {
    const { batch } = useContext(BatchContext);
    return batch ? <BatchAttendanceTab batchUid={batch.uid} /> : null;
};

const SessionsTab = () => {
    const { batch } = useContext(BatchContext);
    return batch ? <BatchSessionsTab batchUid={batch.uid} /> : null;
};

const GalleryTab = () => {
    const { batch } = useContext(BatchContext);
    return batch ? <BatchGalleryTab batchUid={batch.uid} /> : null;
};

export default function BatchDetailsTabs({ batch }: { batch: BatchDetail }) {
    const { colors } = useAppTheme();
    const value = useMemo(() => ({ batch }), [batch]);

    return (
        <BatchContext.Provider value={value}>
            <Tab.Navigator
                screenOptions={{
                    tabBarScrollEnabled: true,
                    tabBarItemStyle: {
                        width: 'auto',
                        paddingHorizontal: spacing.md,
                    },
                    tabBarIndicatorStyle: {
                        backgroundColor: colors.primary,
                        height: 3,
                        borderRadius: 3,
                    },
                    tabBarLabelStyle: {
                        fontSize: 12,
                        fontWeight: '800',
                        textTransform: 'none',
                    },
                    tabBarActiveTintColor: colors.primary,
                    tabBarInactiveTintColor: colors.textMuted,
                    tabBarPressColor: colors.primaryLight + '20',
                    tabBarStyle: {
                        backgroundColor: colors.surface,
                        elevation: 0,
                        shadowOpacity: 0,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border + '50',
                    },
                }}
            >
                <Tab.Screen name="Overview" component={OverviewTab} />
                <Tab.Screen name="Students" component={StudentsTab} />
                <Tab.Screen name="Sessions" component={SessionsTab} />
                <Tab.Screen name="Attendance" component={AttendanceTab} />
                <Tab.Screen name="Gallery" component={GalleryTab} />
            </Tab.Navigator>
        </BatchContext.Provider>
    );
}

const styles = StyleSheet.create({
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
