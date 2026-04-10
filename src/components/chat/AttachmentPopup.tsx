import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    Pressable,
    StyleSheet,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

import { colors, spacing } from '@/src/theme';
import AppText from '../common/AppText';

const { height } = Dimensions.get('window');

export type AttachmentActionType = 'camera' | 'video' | 'video_library' | 'gallery' | 'document';

interface Props {
    visible: boolean;
    onClose: () => void;
    onSelect: (type: AttachmentActionType) => void;
    options?: AttachmentActionType[];
}

const AttachmentAction = ({
    icon,
    label,
    color,
    onPress,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    color: string;
    onPress: () => void;
}) => (
    <Pressable style={styles.actionItem} onPress={onPress}>
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
            <LinearGradient
                colors={[color, color + 'CC']}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Ionicons name={icon} size={28} color={colors.surface} />
            </LinearGradient>
        </View>
        <AppText variant="caption" style={styles.actionLabel}>
            {label}
        </AppText>
    </Pressable>
);

export default function AttachmentPopup({ visible, onClose, onSelect, options = ['camera', 'video', 'gallery', 'document'] }: Props) {
    const translateY = useRef(new Animated.Value(height)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                    damping: 20,
                    mass: 1,
                    stiffness: 100,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: height,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, translateY, opacity]);

    const handleSelect = (type: AttachmentActionType) => {
        onSelect(type);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <Animated.View style={[styles.overlay, { opacity }]} />
            </TouchableWithoutFeedback>

            <Animated.View
                style={[
                    styles.sheet,
                    { transform: [{ translateY }] },
                ]}
            >
                <View style={styles.handle} />

                <AppText variant="subtitle" style={styles.title}>
                    Select Attachment
                </AppText>

                <View style={styles.content}>
                    {options.includes('camera') && (
                        <AttachmentAction
                            icon="camera"
                            label="Camera"
                            color={colors.primary}
                            onPress={() => handleSelect('camera')}
                        />
                    )}
                    {options.includes('video') && (
                        <AttachmentAction
                            icon="videocam"
                            label="Video"
                            color={colors.danger}
                            onPress={() => handleSelect('video')}
                        />
                    )}
                    {options.includes('video_library') && (
                        <AttachmentAction
                            icon="videocam"
                            label="Video"
                            color={colors.danger}
                            onPress={() => handleSelect('video_library')}
                        />
                    )}
                    {options.includes('gallery') && (
                        <AttachmentAction
                            icon="image"
                            label="Gallery"
                            color={colors.success}
                            onPress={() => handleSelect('gallery')}
                        />
                    )}
                    {options.includes('document') && (
                        <AttachmentAction
                            icon="document-text"
                            label="Document"
                            color={colors.info}
                            onPress={() => handleSelect('document')}
                        />
                    )}
                </View>

                <Pressable
                    style={({ pressed }) => [
                        styles.cancelButton,
                        pressed && { backgroundColor: colors.surfaceSubtle }
                    ]}
                    onPress={onClose}
                >
                    <AppText variant="body" color={colors.textSecondary} style={{ fontWeight: '600' }}>
                        Cancel
                    </AppText>
                </Pressable>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.surface,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.md,
        paddingBottom: spacing.xl,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 20,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: spacing.md,
    },
    title: {
        textAlign: 'center',
        marginBottom: spacing.xl,
        color: colors.textPrimary,
        fontWeight: '700',
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: spacing.xl,
    },
    actionItem: {
        alignItems: 'center',
        gap: 8,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        padding: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    actionLabel: {
        fontWeight: '600',
        color: colors.textPrimary,
        fontSize: 13,
    },
    cancelButton: {
        alignItems: 'center',
        paddingVertical: spacing.md,
        backgroundColor: colors.surfaceAlt,
        borderRadius: 16,
        marginTop: spacing.sm,
    },
});
