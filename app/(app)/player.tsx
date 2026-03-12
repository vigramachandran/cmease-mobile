import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle, ChevronLeft, ChevronRight, Clock, X, Zap, ZapOff } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import { AgentActivityLog } from '../../components/AgentActivityLog';
import { api } from '../../lib/api';
import { CMEASE_AGENT } from '../../lib/agent/navigation-agent';
import {
  AgentLogEntry,
  handleAgentMessage,
  makeLogEntry,
} from '../../lib/agent/message-handler';
import { getActionMaps } from '../../lib/agent/action-map-store';
import {
  buildCookieInjectionScript,
  COOKIE_CAPTURE_SCRIPT,
} from '../../lib/cookie-manager';
import { getCookies } from '../../lib/credential-vault';
import {
  getDomainFromUrl,
  PROVIDERS,
  urlMatchesLoginSuccess,
} from '../../lib/provider-config';
import { theme } from '../../lib/theme';
import { Playlist, PlaylistItem } from '../../lib/types';

const AGENT_ENABLED_KEY = 'cmease_agent_enabled';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function creditsEarned(playlist: Playlist, upToIndex: number): number {
  return playlist.playlist
    .slice(0, upToIndex)
    .filter((item) => item.status === 'completed')
    .reduce((sum, item) => sum + item.credits, 0);
}

function firstIncompleteIndex(items: PlaylistItem[]): number {
  const i = items.findIndex((item) => item.status !== 'completed');
  return i >= 0 ? i : 0;
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ progress }: { progress: number }) {
  const animWidth = useRef(new Animated.Value(progress)).current;
  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: Math.min(Math.max(progress, 0), 1),
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progress, animWidth]);
  return (
    <View style={progressStyles.track}>
      <Animated.View
        style={[
          progressStyles.fill,
          {
            width: animWidth.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}
const progressStyles = StyleSheet.create({
  track: { height: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: theme.colors.plum, borderRadius: 2 },
});

// ─── Quiz Pause Toast ─────────────────────────────────────────────────────────

function QuizToast({ visible }: { visible: boolean }) {
  const translateY = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : -60,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [visible, translateY]);

  return (
    <View style={toastStyles.container} pointerEvents="none">
      <Animated.View style={[toastStyles.pill, { transform: [{ translateY }] }]}>
        <Text style={toastStyles.icon}>⏸</Text>
        <Text style={toastStyles.text}>Post-test — please answer the questions</Text>
      </Animated.View>
    </View>
  );
}
const toastStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
    paddingTop: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.warning,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: { fontSize: 16 },
  text: { color: '#1a1a1a', fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold },
});

// ─── Completion Celebration ───────────────────────────────────────────────────

function CompletionCelebration({
  playlist,
  totalTime,
  onDone,
}: {
  playlist: Playlist;
  totalTime: number;
  onDone: () => void;
}) {
  const completed = playlist.playlist.filter((i) => i.status === 'completed');
  const totalCredits = completed.reduce((s, i) => s + i.credits, 0);
  const hours = (totalTime / 3600).toFixed(1);
  return (
    <View style={celebStyles.overlay}>
      <Text style={celebStyles.emoji}>🎉</Text>
      <Text style={celebStyles.title}>Playlist Complete!</Text>
      <View style={celebStyles.stats}>
        <View style={celebStyles.stat}>
          <Text style={celebStyles.statValue}>{completed.length}</Text>
          <Text style={celebStyles.statLabel}>Courses</Text>
        </View>
        <View style={celebStyles.divider} />
        <View style={celebStyles.stat}>
          <Text style={celebStyles.statValue}>{totalCredits.toFixed(1)}</Text>
          <Text style={celebStyles.statLabel}>Credits</Text>
        </View>
        <View style={celebStyles.divider} />
        <View style={celebStyles.stat}>
          <Text style={celebStyles.statValue}>{hours}h</Text>
          <Text style={celebStyles.statLabel}>Spent</Text>
        </View>
      </View>
      <TouchableOpacity style={celebStyles.btn} onPress={onDone}>
        <Text style={celebStyles.btnText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}
const celebStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: theme.spacing[6],
  },
  emoji: { fontSize: 72, marginBottom: theme.spacing[4] },
  title: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.plumDark, marginBottom: theme.spacing[6] },
  stats: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing[5],
    paddingHorizontal: theme.spacing[6],
    gap: theme.spacing[5],
    marginBottom: theme.spacing[8],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.plum },
  statLabel: { fontSize: theme.fontSize.xs, color: theme.colors.gray500, marginTop: 2 },
  divider: { width: 1, backgroundColor: theme.colors.gray100 },
  btn: { backgroundColor: theme.colors.plum, paddingVertical: theme.spacing[4], paddingHorizontal: theme.spacing[8], borderRadius: theme.borderRadius.lg },
  btnText: { color: theme.colors.white, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold },
});

// ─── Reconnect Modal ──────────────────────────────────────────────────────────

function ReconnectModal({
  visible,
  providerName,
  onReconnect,
  onDismiss,
}: {
  visible: boolean;
  providerName: string;
  onReconnect: () => void;
  onDismiss: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={reconnectStyles.backdrop}>
        <View style={reconnectStyles.card}>
          <Text style={reconnectStyles.title}>Session Expired</Text>
          <Text style={reconnectStyles.body}>
            Your {providerName} session has expired. Reconnect to continue without interruption.
          </Text>
          <TouchableOpacity style={reconnectStyles.primaryBtn} onPress={onReconnect}>
            <Text style={reconnectStyles.primaryBtnText}>Reconnect {providerName}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={reconnectStyles.secondaryBtn} onPress={onDismiss}>
            <Text style={reconnectStyles.secondaryBtnText}>Continue Anyway</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
const reconnectStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: theme.spacing[6] },
  card: { backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.xl, padding: theme.spacing[6], width: '100%' },
  title: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.plumDark, marginBottom: theme.spacing[2] },
  body: { fontSize: theme.fontSize.sm, color: theme.colors.gray500, lineHeight: 22, marginBottom: theme.spacing[5] },
  primaryBtn: { backgroundColor: theme.colors.plum, borderRadius: theme.borderRadius.md, padding: theme.spacing[4], alignItems: 'center', marginBottom: theme.spacing[2] },
  primaryBtnText: { color: theme.colors.white, fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.md },
  secondaryBtn: { padding: theme.spacing[3], alignItems: 'center' },
  secondaryBtnText: { color: theme.colors.gray500, fontSize: theme.fontSize.sm },
});

// ─── Main Player ──────────────────────────────────────────────────────────────

export default function PlayerScreen() {
  const insets = useSafeAreaInsets();
  const { playlistId, startIndex } = useLocalSearchParams<{
    playlistId: string;
    startIndex: string;
  }>();

  // ── Core state ──
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [currentIndex, setCurrentIndex] = useState(
    parseInt(startIndex ?? '0', 10) || 0
  );
  const [isLoading, setIsLoading] = useState(true);
  const [timeOnCourse, setTimeOnCourse] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [cookieScript, setCookieScript] = useState('true;');

  // ── Agent state ──
  const [agentEnabled, setAgentEnabled] = useState(true);
  const [agentActive, setAgentActive] = useState(false);
  const [agentDomain, setAgentDomain] = useState<string | undefined>();
  const [agentLog, setAgentLog] = useState<AgentLogEntry[]>([]);
  const [isQuizPaused, setIsQuizPaused] = useState(false);
  const [showQuizToast, setShowQuizToast] = useState(false);
  const quizToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── UI state ──
  const [showCelebration, setShowCelebration] = useState(false);
  const [showReconnect, setShowReconnect] = useState(false);
  const [reconnectDomain, setReconnectDomain] = useState('');

  const webViewRef = useRef<WebView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const completingRef = useRef(false);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load agent preference ──
  useEffect(() => {
    AsyncStorage.getItem(AGENT_ENABLED_KEY).then((val) => {
      if (val !== null) setAgentEnabled(val === 'true');
    });
    // Warm action-map cache in background
    getActionMaps().catch(() => {});
  }, []);

  // ── Load playlist ──
  useEffect(() => {
    api.playlist.active().then(({ data }) => {
      if (data) {
        setPlaylist(data);
        const target = parseInt(startIndex ?? '0', 10) || 0;
        setCurrentIndex(target !== 0 ? target : firstIncompleteIndex(data.playlist));
      }
      setIsLoading(false);
    });
  }, []);

  // ── Load cookies for current course ──
  useEffect(() => {
    if (!playlist) return;
    const course = playlist.playlist[currentIndex];
    if (!course?.url) return;

    setTimeOnCourse(0);
    setIsQuizPaused(false);
    setAgentActive(false);
    setAgentLog([]);

    const domain = getDomainFromUrl(course.url);
    setAgentDomain(domain ?? undefined);
    if (domain) {
      getCookies(domain).then((cookies) => {
        setCookieScript(buildCookieInjectionScript(cookies));
      });
    } else {
      setCookieScript('true;');
    }
  }, [currentIndex, playlist]);

  // ── Timer — pauses when quiz is active ──
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!isQuizPaused) {
        setTimeOnCourse((t) => t + 1);
        setTotalTime((t) => t + 1);
      }
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isQuizPaused]);

  // ── Agent toggle persistence ──
  const toggleAgent = useCallback(() => {
    setAgentEnabled((prev) => {
      const next = !prev;
      AsyncStorage.setItem(AGENT_ENABLED_KEY, String(next));
      return next;
    });
  }, []);

  // ── Agent log helper ──
  const pushLog = useCallback((entry: AgentLogEntry) => {
    setAgentLog((prev) => [...prev.slice(-49), entry]);
  }, []);

  // ── Quiz toast ──
  const showQuizNotification = useCallback(() => {
    setShowQuizToast(true);
    if (quizToastTimer.current) clearTimeout(quizToastTimer.current);
    quizToastTimer.current = setTimeout(() => setShowQuizToast(false), 4000);
  }, []);

  // ── WebView message handler ──
  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      handleAgentMessage(event.nativeEvent.data, {
        onAgentLoaded: (domain) => {
          setAgentActive(true);
          setAgentDomain(domain || agentDomain);
          pushLog(makeLogEntry('loaded', `Agent loaded on ${domain || 'page'}`));
        },
        onAction: (action, text) => {
          const label = text || action;
          pushLog(makeLogEntry('action', label));
        },
        onQuizDetected: (url) => {
          setIsQuizPaused(true);
          pushLog(makeLogEntry('quiz', 'Post-test detected — waiting'));
          showQuizNotification();
        },
        onCourseComplete: (_url) => {
          pushLog(makeLogEntry('action', 'Credit claimed — advancing…'));
          // Auto-advance after 2s
          if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
          autoAdvanceTimer.current = setTimeout(() => {
            if (!playlist) return;
            const next = currentIndex + 1;
            if (next < playlist.playlist.length) {
              setCurrentIndex(next);
              completingRef.current = false;
            } else {
              setShowCelebration(true);
            }
          }, 2000);
        },
        onStatusUpdate: (text, scrollDepth) => {
          pushLog(makeLogEntry('status', text));
        },
        onCookies: () => {
          // Cookie messages handled by parent — ignored here
        },
      });
    },
    [playlist, currentIndex, agentDomain, pushLog, showQuizNotification]
  );

  // ── Navigation state change — detect session expiry ──
  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      if (!playlist) return;
      const course = playlist.playlist[currentIndex];
      const courseDomain = course?.url ? getDomainFromUrl(course.url) : null;
      if (!courseDomain || !navState.url) return;

      const providerLoginHost = PROVIDERS[courseDomain]?.loginUrl
        ? (() => { try { return new URL(PROVIDERS[courseDomain].loginUrl).hostname; } catch { return ''; } })()
        : '';
      if (providerLoginHost && navState.url.includes(providerLoginHost) && !navState.loading) {
        setReconnectDomain(courseDomain);
        setShowReconnect(true);
      }

      // If we're back from quiz (URL no longer quiz page), resume timer
      if (isQuizPaused) {
        const url = navState.url.toLowerCase();
        const isStillQuiz = ['/quiz', '/posttest', '/assessment', '/exam'].some(
          (p) => url.includes(p)
        );
        if (!isStillQuiz) setIsQuizPaused(false);
      }
    },
    [playlist, currentIndex, isQuizPaused]
  );

  // ── Mark Complete ──
  const handleMarkComplete = useCallback(() => {
    if (!playlist || completingRef.current) return;
    const course = playlist.playlist[currentIndex];
    const minSeconds = course.durationMinutes * 0.5 * 60;

    const doComplete = async () => {
      completingRef.current = true;
      setPlaylist((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          playlist: prev.playlist.map((item, idx) =>
            idx === currentIndex ? { ...item, status: 'completed' as const } : item
          ),
        };
      });

      const id = playlistId || playlist.id;
      if (id) {
        api.playlist.complete(id, currentIndex).catch(() => {});
      }

      const next = currentIndex + 1;
      if (next < playlist.playlist.length) {
        setCurrentIndex(next);
        completingRef.current = false;
      } else {
        setShowCelebration(true);
      }
    };

    if (timeOnCourse < minSeconds) {
      const minutesSpent = Math.round(timeOnCourse / 60);
      Alert.alert(
        'Confirm Completion',
        `This course requires approximately ${course.durationMinutes} minutes. You've spent ${minutesSpent} minute${minutesSpent !== 1 ? 's' : ''}. Have you completed all components including the post-test?`,
        [
          { text: 'Not yet', style: 'cancel' },
          { text: "Yes, I completed it", onPress: doComplete },
        ]
      );
    } else {
      doComplete();
    }
  }, [playlist, currentIndex, timeOnCourse, playlistId]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (playlist && currentIndex < playlist.playlist.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }, [playlist, currentIndex]);

  const handleReconnect = useCallback(() => {
    setShowReconnect(false);
    router.push({
      pathname: '/(app)/provider-login' as any,
      params: { domain: reconnectDomain },
    });
  }, [reconnectDomain]);

  // ── Compose injectedJavaScript ──
  // Agent script + cookie capture script, combined
  const injectedJS = agentEnabled
    ? CMEASE_AGENT + '\n' + COOKIE_CAPTURE_SCRIPT
    : COOKIE_CAPTURE_SCRIPT;

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading || !playlist) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading playlist…</Text>
      </View>
    );
  }

  const course: PlaylistItem = playlist.playlist[currentIndex];
  const total = playlist.playlist.length;
  const completedCount = playlist.playlist.filter((i) => i.status === 'completed').length;
  const earned = creditsEarned(playlist, currentIndex);
  const needed = playlist.summary.totalCredits;
  const progress = total > 0 ? completedCount / total : 0;
  const remainingMinutes = playlist.playlist
    .slice(currentIndex)
    .filter((i) => i.status !== 'completed')
    .reduce((s, i) => s + i.durationMinutes, 0);
  const remainingHours = (remainingMinutes / 60).toFixed(1);

  // Agent indicator dot color
  const agentDotColor = !agentEnabled
    ? 'rgba(255,255,255,0.3)'
    : isQuizPaused
    ? theme.colors.warning
    : agentActive
    ? theme.colors.success
    : 'rgba(255,255,255,0.3)';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── Top Bar ── */}
      <View style={styles.topBar}>
        <View style={styles.topBarRow}>
          {/* Back/close */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={22} color={theme.colors.white} />
          </TouchableOpacity>

          {/* Center: course title */}
          <Text style={styles.courseTitle} numberOfLines={1}>
            {course.title}
          </Text>

          {/* Right: agent toggle */}
          <TouchableOpacity
            onPress={toggleAgent}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[
              styles.agentToggle,
              agentEnabled && agentActive && styles.agentToggleActive,
            ]}
          >
            <View style={[styles.agentDot, { backgroundColor: agentDotColor }]} />
            {agentEnabled ? (
              <Zap size={14} color={agentActive ? theme.colors.plum : theme.colors.white} />
            ) : (
              <ZapOff size={14} color="rgba(255,255,255,0.5)" />
            )}
          </TouchableOpacity>
        </View>

        {/* Progress row */}
        <View style={styles.progressRow}>
          <View style={styles.progressBarWrapper}>
            <ProgressBar progress={progress} />
          </View>
          <View style={styles.progressMeta}>
            <Text style={styles.courseCounter}>
              {currentIndex + 1}/{total}
            </Text>
            <Text style={styles.progressDetail}>
              {earned.toFixed(1)}/{needed.toFixed(0)} cr · {remainingHours}h left
            </Text>
          </View>
        </View>
      </View>

      {/* ── WebView ── */}
      <View style={styles.webviewContainer}>
        <WebView
          ref={webViewRef}
          key={`${currentIndex}-${course.url}`}
          source={{ uri: course.url }}
          style={styles.webview}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onNavigationStateChange={handleNavigationStateChange}
          onMessage={handleMessage}
          injectedJavaScriptBeforeContentLoaded={cookieScript}
          injectedJavaScript={injectedJS}
          javaScriptEnabled
          domStorageEnabled
          thirdPartyCookiesEnabled
          sharedCookiesEnabled
          cacheEnabled
          allowsBackForwardNavigationGestures
          userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
        />

        {/* Quiz toast — floats over the WebView */}
        <QuizToast visible={showQuizToast} />
      </View>

      {/* ── Agent Activity Log ── */}
      <AgentActivityLog
        entries={agentLog}
        isActive={agentEnabled && agentActive}
        isQuizPaused={isQuizPaused}
        domain={agentDomain}
      />

      {/* ── Bottom Control Bar ── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8 }]}>
        {/* Timer chip */}
        <View style={styles.timerChip}>
          <Clock size={12} color={isQuizPaused ? theme.colors.warning : theme.colors.plum} />
          <Text style={[styles.timerText, isQuizPaused && styles.timerTextPaused]}>
            {formatTime(timeOnCourse)}
          </Text>
        </View>

        {/* Prev nav */}
        <TouchableOpacity
          style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
          onPress={handlePrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft
            size={20}
            color={currentIndex === 0 ? theme.colors.gray300 : theme.colors.gray700}
          />
          <Text style={[styles.navBtnText, currentIndex === 0 && styles.navBtnTextDisabled]}>
            Prev
          </Text>
        </TouchableOpacity>

        {/* Mark complete */}
        <TouchableOpacity
          style={[
            styles.completeBtn,
            course.status === 'completed' && styles.completeBtnDone,
          ]}
          onPress={handleMarkComplete}
          disabled={course.status === 'completed'}
        >
          <CheckCircle
            size={18}
            color={course.status === 'completed' ? theme.colors.success : theme.colors.white}
          />
          <Text style={[
            styles.completeBtnText,
            course.status === 'completed' && styles.completeBtnTextDone,
          ]}>
            {course.status === 'completed' ? 'Completed' : 'Mark Complete'}
          </Text>
        </TouchableOpacity>

        {/* Next nav */}
        <TouchableOpacity
          style={[styles.navBtn, currentIndex === total - 1 && styles.navBtnDisabled]}
          onPress={handleNext}
          disabled={currentIndex === total - 1}
        >
          <Text style={[styles.navBtnText, currentIndex === total - 1 && styles.navBtnTextDisabled]}>
            Next
          </Text>
          <ChevronRight
            size={20}
            color={currentIndex === total - 1 ? theme.colors.gray300 : theme.colors.gray700}
          />
        </TouchableOpacity>
      </View>

      {/* ── Celebration Overlay ── */}
      {showCelebration && (
        <CompletionCelebration
          playlist={playlist}
          totalTime={totalTime}
          onDone={() => router.replace('/(app)/(tabs)')}
        />
      )}

      {/* ── Reconnect Modal ── */}
      <ReconnectModal
        visible={showReconnect}
        providerName={reconnectDomain ? PROVIDERS[reconnectDomain]?.name ?? reconnectDomain : ''}
        onReconnect={handleReconnect}
        onDismiss={() => setShowReconnect(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.white },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
  loadingText: { color: theme.colors.gray500, fontSize: theme.fontSize.md },

  // Top bar — dark plumDark background
  topBar: {
    backgroundColor: theme.colors.plumDark,
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[2],
    paddingBottom: theme.spacing[3],
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
    marginBottom: theme.spacing[2],
  },
  backBtn: {
    flexShrink: 0,
    padding: 2,
  },
  courseTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  agentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    flexShrink: 0,
  },
  agentToggleActive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  agentDot: { width: 6, height: 6, borderRadius: 3 },

  // Progress row
  progressRow: {
    gap: 6,
  },
  progressBarWrapper: {},
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseCounter: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressDetail: {
    fontSize: theme.fontSize.xs,
    color: 'rgba(255,255,255,0.6)',
  },

  // WebView
  webviewContainer: { flex: 1, position: 'relative' },
  webview: { flex: 1 },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray100,
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[3],
    gap: theme.spacing[2],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },

  // Timer chip (now in bottom bar)
  timerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.colors.gray100,
    paddingHorizontal: theme.spacing[2],
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
    flexShrink: 0,
  },
  timerText: {
    fontSize: 13,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plum,
    fontVariant: ['tabular-nums'] as any,
  },
  timerTextPaused: { color: theme.colors.warning },

  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[2],
    gap: 2,
    flexShrink: 0,
  },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, color: theme.colors.gray700 },
  navBtnTextDisabled: { color: theme.colors.gray300 },

  completeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
    backgroundColor: theme.colors.plum,
    borderRadius: theme.borderRadius.md,
    height: 52,
  },
  completeBtnDone: { backgroundColor: '#E8F5EE' },
  completeBtnText: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.sm,
  },
  completeBtnTextDone: { color: theme.colors.success },
});
