import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

import { colors, spacing } from '../../theme';
import AppText from '../common/AppText';

const { width } = Dimensions.get('window');
const PLAYER_HEIGHT = (width - spacing.md * 2) * (9 / 16);

interface VideoPlayerModalProps {
    isVisible: boolean;
    videoId: string | null;
    onClose: () => void;
    title?: string;
}

export default function VideoPlayerModal({ isVisible, videoId, onClose, title }: VideoPlayerModalProps) {
    const [playing, setPlaying] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    const onStateChange = useCallback((state: string) => {
        if (state === 'ended') {
            setPlaying(false);
        }
    }, []);

    const handleReady = useCallback(() => {
        setIsLoading(false);
    }, []);

    if (!videoId && isVisible) return null;

    return (
        <Modal
            visible={isVisible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <Pressable style={styles.dismissArea} onPress={onClose} />
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <View style={{ flex: 1, marginRight: spacing.md }}>
                            <AppText variant="h3" numberOfLines={1}>{title || 'Video Player'}</AppText>
                        </View>
                        <Pressable onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={colors.textPrimary} />
                        </Pressable>
                    </View>

                    <View style={styles.playerContainer}>
                        {isLoading && (
                            <View style={styles.loaderContainer}>
                                <ActivityIndicator size="large" color={colors.primary} />
                            </View>
                        )}
                        {videoId && (
                            <YoutubePlayer
                                height={PLAYER_HEIGHT}
                                play={playing}
                                videoId={videoId}
                                onChangeState={onStateChange}
                                onReady={handleReady}
                            />
                        )}
                    </View>
                    
                    <View style={styles.footer}>
                         <AppText variant="caption" color={colors.textMuted} style={{ textAlign: 'center' }}>
                            Tap outside or click close to dismiss
                        </AppText>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
    },
    dismissArea: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContent: {
        backgroundColor: colors.background,
        marginHorizontal: spacing.md,
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.border + '50',
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.border + '30',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playerContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#000',
        justifyContent: 'center',
    },
    loaderContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        backgroundColor: '#000',
    },
    footer: {
        padding: spacing.md,
        alignItems: 'center',
    }
});
