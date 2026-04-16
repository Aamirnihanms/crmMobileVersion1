import AppText from '@/src/components/common/AppText';
import { colors } from '@/src/theme';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React, { createContext, useContext, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { BatchDetail } from '@/src/api/batches.api';
import BatchOverviewTab from '@/src/screens/more/tabs/BatchOverviewTab';
import BatchStudentsTab from '@/src/screens/more/tabs/BatchStudentsTab';
import BatchAttendanceTab from '@/src/screens/more/tabs/BatchAttendanceTab';

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

const PlaceholderTab = ({ title }: { title: string }) => (
    <View style={styles.placeholder}>
        <AppText variant="subtitle" color={colors.textMuted}>{title} Coming Soon!</AppText>
    </View>
);

const GalleryTab = () => <PlaceholderTab title="Gallery" />;

export default function BatchDetailsTabs({ batch }: { batch: BatchDetail }) {
    const value = useMemo(() => ({ batch }), [batch]);

    return (
        <BatchContext.Provider value={value}>
            <Tab.Navigator
                screenOptions={{
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
                        backgroundColor: colors.background,
                        elevation: 0,
                        shadowOpacity: 0,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border + '50',
                    },
                }}
            >
                <Tab.Screen name="Overview" component={OverviewTab} />
                <Tab.Screen name="Students" component={StudentsTab} />
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
        backgroundColor: colors.background,
    },
});
