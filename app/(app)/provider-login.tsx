import { router, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import { COOKIE_CAPTURE_SCRIPT } from '../../lib/cookie-manager';
import { saveCookies } from '../../lib/credential-vault';
import { PROVIDERS, urlMatchesLoginSuccess } from '../../lib/provider-config';
import { theme } from '../../lib/theme';

interface CookieMessage {
  type: 'cookies';
  url: string;
  cookies: string;
}

export default function ProviderLoginScreen() {
  const { domain } = useLocalSearchParams<{ domain: string }>();
  const config = PROVIDERS[domain ?? ''];

  const [isLoading, setIsLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Track last known cookies so we can save on login success
  const latestCookies = useRef('');
  const savedRef = useRef(false);

  if (!config) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unknown provider: {domain}</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleMessage = async (event: WebViewMessageEvent) => {
    try {
      const msg: CookieMessage = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'cookies' && msg.cookies) {
        latestCookies.current = msg.cookies;
      }
    } catch {
      // ignore non-JSON messages
    }
  };

  const handleNavigationStateChange = async (navState: WebViewNavigation) => {
    const { url, loading } = navState;
    if (!url || savedRef.current) return;

    // Check if this URL indicates a successful login
    if (urlMatchesLoginSuccess(url, domain ?? '')) {
      savedRef.current = true;

      // Give the page a moment to fully set cookies, then save
      setTimeout(async () => {
        const cookies = latestCookies.current;
        await saveCookies(domain ?? '', cookies || ' ');
        setConnected(true);
        setStatusMessage(`Connected to ${config.name}!`);

        // Navigate back after brief success display
        setTimeout(() => {
          router.back();
        }, 1200);
      }, 800);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: config.color + '30' }]}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={[styles.headerDot, { backgroundColor: config.color }]} />
          <Text style={styles.headerTitle}>{config.name}</Text>
        </View>

        <View style={styles.headerRight}>
          {isLoading && (
            <ActivityIndicator size="small" color={config.color} />
          )}
        </View>
      </View>

      {/* Success overlay */}
      {connected && (
        <View style={styles.successOverlay}>
          <Text style={styles.successEmoji}>✓</Text>
          <Text style={styles.successMessage}>{statusMessage}</Text>
        </View>
      )}

      {/* Sign-in hint */}
      {!connected && !isLoading && (
        <View style={[styles.hint, { backgroundColor: config.color + '12' }]}>
          <Text style={styles.hintText}>
            Sign in to {config.name} — your session will be saved securely.
          </Text>
        </View>
      )}

      {/* WebView */}
      <WebView
        source={{ uri: config.loginUrl }}
        style={styles.webview}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleMessage}
        injectedJavaScript={COOKIE_CAPTURE_SCRIPT}
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        cacheEnabled
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[3],
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
  },
  cancelBtn: {
    width: 72,
  },
  cancelText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.plum,
    fontWeight: theme.fontWeight.medium,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  headerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  headerTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.plumDark,
  },
  headerRight: {
    width: 72,
    alignItems: 'flex-end',
  },
  hint: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
  },
  hintText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray700,
    textAlign: 'center',
  },
  webview: {
    flex: 1,
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    gap: theme.spacing[3],
  },
  successEmoji: {
    fontSize: 64,
    color: theme.colors.success,
  },
  successMessage: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plumDark,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[4],
  },
  errorText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.error,
  },
  backLink: {
    fontSize: theme.fontSize.md,
    color: theme.colors.plum,
  },
});
