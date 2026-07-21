import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { RouteProp } from '@react-navigation/native';
import React from 'react';

import GalleryOverviewTab from '../screens/more/tabs/GalleryOverviewTab';
import GalleryContentsTab from '../screens/more/tabs/GalleryContentsTab';
import { useAppTheme } from '../theme';
import { MoreStackParamList } from './MoreStack';

const Tab = createMaterialTopTabNavigator();

type GalleryDetailTabsProps = {
    route: RouteProp<MoreStackParamList, 'GalleryDetail'>;
};

export default function GalleryDetailTabs({ route }: GalleryDetailTabsProps) {
    const { uid } = route.params;
    const { colors } = useAppTheme();

    return (
        <Tab.Navigator
            screenOptions={{
                tabBarIndicatorStyle: {
                    backgroundColor: colors.primary,
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '700',
                    textTransform: 'none',
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarStyle: {
                    backgroundColor: colors.surface,
                    elevation: 0,
                    shadowOpacity: 0,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                },
            }}
        >
            <Tab.Screen name="Overview">
                {() => <GalleryOverviewTab uid={uid} />}
            </Tab.Screen>
            <Tab.Screen name="Contents">
                {() => <GalleryContentsTab uid={uid} />}
            </Tab.Screen>
        </Tab.Navigator>
    );
}
