import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

import AppText from '@/src/components/common/AppText';
import EmiPaymentFlow from '@/src/components/students/EmiPaymentFlow';
import FullPaymentFlow from '@/src/components/students/FullPaymentFlow';
import { useCompleteFullPayment, useConfirmEmi } from '@/src/queries/enrollment.query';
import { useAppTheme, spacing } from '@/src/theme';
import type { StudentsStackParamList } from '../../navigation/StudentsStack';

type RootParamList = {
    SetPaymentMode: { enrollmentId: string };
};

export default function SetPaymentModeScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
    const { params } = useRoute<RouteProp<RootParamList, 'SetPaymentMode'>>();
    const navigation = useNavigation<NativeStackNavigationProp<StudentsStackParamList>>();

    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Mode Selection, 2: EMI Flow, 3: Full Payment Flow

    const confirmEmiMutation = useConfirmEmi();
    const completeFullPaymentMutation = useCompleteFullPayment();

    const handleFullPayment = () => {
        setStep(3);
    };

    const handleEmiPayment = () => {
        setStep(2);
    };

    const handleConfirmEmi = (payload: any) => {
        confirmEmiMutation.mutate(payload, {
            onSuccess: () => {
                Alert.alert('Success', 'Payment mode set successfully');
                navigation.goBack();
            },
            onError: (error: any) => {
                Alert.alert('Error', error?.response?.data?.message || 'Failed to set payment mode');
            }
        });
    };

    const handleConfirmFullManual = (payload: any) => {
        completeFullPaymentMutation.mutate(payload, {
            onSuccess: () => {
                Alert.alert('Success', 'Full payment completed successfully');
                navigation.goBack();
            },
            onError: (error: any) => {
                Alert.alert('Error', error?.response?.data?.message || 'Failed to complete full payment');
            }
        });
    };

    return (
        <View style={styles.root}>
            <View style={styles.container}>
                {step === 1 ? (
                    <View style={styles.selectionContainer}>
                        <AppText variant="h2" style={styles.title}>Choose Payment Mode</AppText>
                        <AppText variant="body" color={colors.textMuted} style={styles.subtitle}>
                            Select how this enrollment should be paid for
                        </AppText>

                        <TouchableOpacity style={styles.modeOption} onPress={handleFullPayment}>
                            <View style={[styles.modeIcon, { backgroundColor: colors.successBg }]}>
                                <Ionicons name="card-outline" size={28} color={colors.success} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <AppText variant="subtitle" style={styles.optionTitle}>Full Payment</AppText>
                                <AppText variant="caption" color={colors.textMuted}>One-time payment for the entire course</AppText>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.modeOption} onPress={handleEmiPayment}>
                            <View style={[styles.modeIcon, { backgroundColor: colors.primaryLight + '20' }]}>
                                <Ionicons name="calendar-outline" size={28} color={colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <AppText variant="subtitle" style={styles.optionTitle}>EMI Payment</AppText>
                                <AppText variant="caption" color={colors.textMuted}>Break down the fees into monthly installments</AppText>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>
                ) : step === 2 ? (
                    <View style={styles.flowContainer}>
                        <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                            <Ionicons name="arrow-back" size={20} color={colors.primary} />
                            <AppText variant="body" color={colors.primary} style={{ fontWeight: '600', marginLeft: 4 }}>
                                Back to Mode Selection
                            </AppText>
                        </TouchableOpacity>

                        <EmiPaymentFlow
                            enrollmentId={params.enrollmentId}
                            onConfirm={handleConfirmEmi}
                            confirmLoading={confirmEmiMutation.isPending}
                        />
                    </View>
                ) : (
                    <View style={styles.flowContainer}>
                        <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                            <Ionicons name="arrow-back" size={20} color={colors.primary} />
                            <AppText variant="body" color={colors.primary} style={{ fontWeight: '600', marginLeft: 4 }}>
                                Back to Mode Selection
                            </AppText>
                        </TouchableOpacity>

                        <FullPaymentFlow
                            enrollmentId={params.enrollmentId}
                            onConfirmManual={handleConfirmFullManual}
                            confirmLoading={completeFullPaymentMutation.isPending}
                        />
                    </View>
                )}
            </View>
        </View>
    );
}

const getStyles = (colors: any) => StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container: {
        flex: 1,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
    },
    selectionContainer: {
        marginTop: spacing.xl,
    },
    title: {
        fontWeight: '800',
        marginBottom: 4,
    },
    subtitle: {
        marginBottom: spacing.xxl,
    },
    modeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.xl,
        backgroundColor: colors.surface,
        borderRadius: 24,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.surfaceSubtle,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    modeIcon: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.xl,
    },
    optionTitle: {
        fontWeight: '800',
        fontSize: 18,
        marginBottom: 2,
    },
    flowContainer: {
        flex: 1,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
});
