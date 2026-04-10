import React from 'react';
import { View, StyleSheet, Dimensions, Animated, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import NetInfo from '@react-native-community/netinfo';
import { colors } from '@/src/theme';
import AppText from '../common/AppText';
import AppButton from '../common/AppButton';

const { width } = Dimensions.get('window');

export default function NoNetworkScreen() {
  const shakeAnimation = React.useRef(new Animated.Value(0)).current;
  const [isRetrying, setIsRetrying] = React.useState(false);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleReconnect = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    try {
      const state = await NetInfo.fetch();
      const online = state.isConnected !== false && state.isInternetReachable !== false;
      if (!online) {
        // Still offline — shake to indicate failure
        triggerShake();
      }
      // If back online, useNetworkStatus in App.tsx will detect the change
      // automatically via the NetInfo event listener and hide this screen.
    } catch {
      triggerShake();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.background, colors.indigoSoft]}
        style={styles.gradient}
      >
        <Animated.View 
          style={[
            styles.content,
            { transform: [{ translateX: shakeAnimation }] }
          ]}
        >
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[colors.primary, colors.gradientEnd]}
              style={styles.iconBg}
            >
              <Feather name="wifi-off" size={48} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.pulse1} />
            <View style={styles.pulse2} />
          </View>

          <AppText variant="h1" style={styles.title}>
            Whoops! Offline
          </AppText>
          <AppText variant="body" color={colors.textSecondary} style={styles.description}>
            It seems you've lost your connection. Please check your internet settings and try again.
          </AppText>

          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <View style={styles.dot} />
              <AppText variant="small" color={colors.textMuted}>Check your Wi-Fi or Mobile Data</AppText>
            </View>
            <View style={styles.detailItem}>
              <View style={styles.dot} />
              <AppText variant="small" color={colors.textMuted}>Disable Airplane Mode</AppText>
            </View>
          </View>

          <AppButton
            title={isRetrying ? 'Checking...' : 'Try to Reconnect'}
            onPress={() => { void handleReconnect(); }}
            style={styles.button}
            variant="primary"
            disabled={isRetrying}
          />
        </Animated.View>

        <View style={styles.footer}>
          <AppText variant="small" color={colors.textMuted}>
            The app will resume once back online
          </AppText>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  pulse1: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: colors.primaryLight,
    opacity: 0.1,
  },
  pulse2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.primaryLight,
    opacity: 0.05,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 10,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
});
