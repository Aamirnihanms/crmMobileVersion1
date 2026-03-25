import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { AudioSource, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';

import AppText from '@/src/components/common/AppText';
import { colors, spacing } from '@/src/theme';

interface AudioPlayerProps {
    uri: string;
    mine: boolean;
    progress?: number;
}

const formatMMSS = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const toProgressPercent = (progress: number) => {
    if (!Number.isFinite(progress)) return 0;
    const normalized = progress > 1 && progress <= 100 ? progress / 100 : progress;
    return Math.round(Math.min(1, Math.max(0, normalized)) * 100);
};

export default function AudioPlayer({ uri, mine, progress }: AudioPlayerProps) {
    const [audioSource, setAudioSource] = useState<AudioSource>(null);
    const player = useAudioPlayer(audioSource, { updateInterval: 50 });
    const status = useAudioPlayerStatus(player);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);

    const isScrubbingRef = useRef(false);

    const mainColor = mine ? '#FFFFFF' : colors.primary;
    const mutedColor = mine ? '#FFFFFFCC' : colors.textMuted;
    const trackBgColor = mine ? '#FFFFFF40' : '#E2E8F0';
    const trackFillColor = mainColor;

    // Status handling is now handled by useAudioPlayerStatus(player)
    // which returns { playing, currentTime, duration, isLoaded, ... }
    // These are in seconds, so we convert them to milliseconds for internal UI logic if needed,
    // or just update the UI logic to use seconds.
    // Let's use seconds for formatMMSS.

    const loadAudio = async () => {
        if (!uri) return;
        if (audioSource) return; // already loaded or loading

        try {
            setIsLoading(true);
            setError(false);

            let playUri: AudioSource = uri;
            if (uri.startsWith('http')) {
                try {
                    // Extract a unique identifier from the end of the URL
                    const safeName = uri.replace(/[^a-z0-9]/gi, '_').slice(-60);
                    const localPath = `${FileSystem.cacheDirectory}${safeName}.m4a`;

                    const fileInfo = await FileSystem.getInfoAsync(localPath);
                    if (fileInfo.exists) {
                        playUri = localPath;
                    } else {
                        const downloadRes = await FileSystem.downloadAsync(uri, localPath);
                        if (downloadRes.status === 200) {
                            playUri = downloadRes.uri;
                        }
                    }
                } catch (dlErr) {
                    // Fallback to remote streaming if download fails
                    console.warn(`Could not cache audio locally:`, dlErr);
                }
            }

            setAudioSource(playUri);

        } catch (e) {
            console.warn("Could not load audio", e);
            setError(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Attempt pre-load briefly but maybe it's better to just load it right away since it's chat.
        loadAudio();

        return () => {
            // Player is managed by useAudioPlayer hook
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uri]);

    const togglePlayPause = async () => {
        if (error) {
            loadAudio();
            return;
        }

        if (!player) {
            // Not loaded yet? Try loading and playing
            await loadAudio();
            return;
        }

        if (status.playing) {
            player.pause();
        } else {
            // If finished, restart
            if (status.currentTime >= status.duration - 0.5 && status.duration > 0) {
                await player.seekTo(0);
            }
            player.play();
        }
    };

    // Decide what text to show on the right side
    let timeText = '0:00';
    if (progress !== undefined) {
        timeText = `${toProgressPercent(progress)}%`;
    } else if (status.playing || status.currentTime > 0) {
        timeText = formatMMSS(status.currentTime * 1000);
    } else if (status.duration > 0) {
        timeText = formatMMSS(status.duration * 1000);
    } else if (error) {
        timeText = '!';
    }

    return (
        <View style={[styles.container, mine && styles.containerMine]}>
            <Pressable onPress={togglePlayPause} style={styles.playButton} hitSlop={10} disabled={progress !== undefined}>
                {progress !== undefined ? (
                    <ActivityIndicator size="small" color={mainColor} />
                ) : isLoading && !status.isLoaded ? (
                    <ActivityIndicator size="small" color={mainColor} />
                ) : (
                    <Ionicons
                        name={status.playing ? 'pause' : 'play'}
                        size={24}
                        color={mainColor}
                        style={{ marginLeft: status.playing ? 0 : 2 }} // center the play triangle
                    />
                )}
            </Pressable>

            <View style={styles.trackContainer}>
                <Slider
                    style={styles.slider}
                    disabled={!status.isLoaded || status.duration === 0}
                    minimumValue={0}
                    maximumValue={status.duration > 0 ? status.duration : 1}
                    value={status.currentTime}
                    minimumTrackTintColor={trackFillColor}
                    maximumTrackTintColor={trackBgColor}
                    thumbTintColor={mainColor}
                    onSlidingStart={() => {
                        isScrubbingRef.current = true;
                    }}
                    onSlidingComplete={async (value) => {
                        if (player && status.isLoaded && status.duration > 0) {
                            try {
                                await player.seekTo(value);
                            } catch (e) {
                                console.warn(e);
                            }
                        }

                        // Wait for the native audio player to actually perform the network seek 
                        // before we allow background timestamp updates to overwrite the slider.
                        setTimeout(() => {
                            isScrubbingRef.current = false;
                        }, 500);
                    }}
                    onValueChange={(value) => {
                        if (isScrubbingRef.current) {
                            // We can't easily update status.currentTime manually here since it's from the hook,
                            // but we could have a local position state if needed.
                            // Let's see if status.currentTime updates fast enough or if we need a local override.
                        }
                    }}
                />
            </View>

            <View style={styles.timeContainer}>
                <AppText variant="caption" style={{ color: mutedColor, fontSize: 11, minWidth: 28, textAlign: 'right' }}>
                    {timeText}
                </AppText>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        width: 220,
        paddingVertical: 4,
    },
    containerMine: {
        // specific to mine
    },
    playButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    trackContainer: {
        flex: 1,
        height: 30,
        justifyContent: 'center',
    },
    slider: {
        width: '100%',
        height: 30,
    },
    timeContainer: {
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
});
