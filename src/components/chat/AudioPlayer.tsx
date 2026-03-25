import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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

export default function AudioPlayer({ uri, mine, progress }: AudioPlayerProps) {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [position, setPosition] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);

    const isScrubbingRef = useRef(false);

    const mainColor = mine ? '#FFFFFF' : colors.primary;
    const mutedColor = mine ? '#FFFFFFCC' : colors.textMuted;
    const trackBgColor = mine ? '#FFFFFF40' : '#E2E8F0';
    const trackFillColor = mainColor;

    const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
        if (!status.isLoaded) {
            if (status.error) {
                console.warn(`Error playing audio: ${status.error}`);
                setError(true);
            }
            return;
        }

        const successStatus = status as AVPlaybackStatusSuccess;
        setIsLoaded(true);
        setIsPlaying(successStatus.isPlaying);

        if (successStatus.durationMillis) {
            setDuration(successStatus.durationMillis);
        }

        if (!isScrubbingRef.current) {
            setPosition(successStatus.positionMillis || 0);
        }

        if (successStatus.didJustFinish) {
            setIsPlaying(false);
            setPosition(0);
            sound?.setPositionAsync(0);
        }
    }, [sound]);

    const loadAudio = async () => {
        if (sound) return; // already loaded or loading
        if (!uri) return;

        try {
            setIsLoading(true);
            setError(false);

            let playUri = uri;
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

            const { sound: newSound, status } = await Audio.Sound.createAsync(
                { uri: playUri },
                { shouldPlay: false, progressUpdateIntervalMillis: 50 },
                onPlaybackStatusUpdate
            );
            setSound(newSound);

            if (status.isLoaded && status.durationMillis) {
                setDuration(status.durationMillis);
            }
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
            if (sound) {
                sound.unloadAsync();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uri]);

    const togglePlayPause = async () => {
        if (error) {
            loadAudio();
            return;
        }

        if (!sound) {
            // Not loaded yet? Try loading and playing
            await loadAudio();
            return;
        }
        if (isPlaying) {
            await sound.pauseAsync();
        } else {
            if (position >= duration - 500 && duration > 0) {
                await sound.playFromPositionAsync(0);
            } else {
                await sound.playFromPositionAsync(position);
            }
        }
    };

    // Decide what text to show on the right side
    let timeText = '0:00';
    if (progress !== undefined) {
        timeText = progress > 0 ? `${Math.round(progress * 100)}%` : '0%';
    } else if (isPlaying || position > 0) {
        timeText = formatMMSS(position);
    } else if (duration > 0) {
        timeText = formatMMSS(duration);
    } else if (error) {
        timeText = '!';
    }

    return (
        <View style={[styles.container, mine && styles.containerMine]}>
            <Pressable onPress={togglePlayPause} style={styles.playButton} hitSlop={10} disabled={progress !== undefined}>
                {progress !== undefined ? (
                    <ActivityIndicator size="small" color={mainColor} />
                ) : isLoading && !isLoaded ? (
                    <ActivityIndicator size="small" color={mainColor} />
                ) : (
                    <Ionicons
                        name={isPlaying ? 'pause' : 'play'}
                        size={24}
                        color={mainColor}
                        style={{ marginLeft: isPlaying ? 0 : 2 }} // center the play triangle
                    />
                )}
            </Pressable>

            <View style={styles.trackContainer}>
                <Slider
                    style={styles.slider}
                    disabled={!isLoaded || duration === 0}
                    minimumValue={0}
                    maximumValue={duration > 0 ? duration : 1}
                    value={position}
                    minimumTrackTintColor={trackFillColor}
                    maximumTrackTintColor={trackBgColor}
                    thumbTintColor={mainColor}
                    onSlidingStart={() => {
                        isScrubbingRef.current = true;
                    }}
                    onSlidingComplete={async (value) => {
                        if (sound && isLoaded && duration > 0) {
                            setPosition(value);
                            try {
                                await sound.setPositionAsync(value);
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
                            setPosition(value);
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
