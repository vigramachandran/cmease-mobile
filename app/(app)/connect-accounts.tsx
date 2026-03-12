import { router, useFocusEffect } from 'expo-router';
import {
  Award,
  BookOpen,
  CheckCircle,
  GraduationCap,
  Stethoscope,
  XCircle,
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../components/Card';
import {
  getConnectedProviders,
  getSession,
  removeCookies,
} from '../../lib/credential-vault';
import { PROVIDER_DOMAINS, PROVIDERS } from '../../lib/provider-config';
import { theme } from '../../lib/theme';
import { ProviderSession } from '../../lib/types';

const ICON_MAP: Record<string, React.FC<{ size: number; color: string }>> = {
  GraduationCap: ({ size, color }) => <GraduationCap size={size} color={color} />,
  BookOpen: ({ size, color }) => <BookOpen size={size} color={color} />,
  Stethoscope: ({ size, color }) => <Stethoscope size={size} color={color} />,
  Award: ({ size, color }) => <Award size={size} color={color} />,
};

function daysAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function ProviderCard({
  session,
  onConnect,
  onDisconnect,
}: {
  session: ProviderSession;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const config = PROVIDERS[session.domain];
  const IconComponent = ICON_MAP[config.icon] ?? ICON_MAP['Award'];

  return (
    <Card style={styles.providerCard}>
      <View style={styles.providerRow}>
        {/* Icon */}
        <View style={[styles.providerIcon, { backgroundColor: config.color + '18' }]}>
          <IconComponent size={22} color={config.color} />
        </View>

        {/* Info */}
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{config.name}</Text>
          {session.connected && session.connectedAt ? (
            <View style={styles.connectedBadge}>
              <CheckCircle size={11} color={theme.colors.success} />
              <Text style={styles.connectedText}>
                Connected · {daysAgo(session.connectedAt)}
              </Text>
            </View>
          ) : (
            <Text style={styles.notConnectedText}>Not connected</Text>
          )}
        </View>

        {/* Action */}
        {session.connected ? (
          <TouchableOpacity
            style={styles.disconnectBtn}
            onPress={onDisconnect}
            activeOpacity={0.7}
          >
            <XCircle size={16} color={theme.colors.error} />
            <Text style={styles.disconnectText}>Disconnect</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.connectBtn, { backgroundColor: config.color }]}
            onPress={onConnect}
            activeOpacity={0.8}
          >
            <Text style={styles.connectBtnText}>Connect</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
}

export default function ConnectAccountsScreen() {
  const [sessions, setSessions] = useState<ProviderSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    const results = await Promise.all(
      PROVIDER_DOMAINS.map(async (domain) => {
        const session = await getSession(domain);
        return {
          domain,
          name: PROVIDERS[domain].name,
          connected: session !== null,
          connectedAt: session?.connectedAt ?? null,
          lastVerifiedAt: session?.lastVerifiedAt ?? null,
        } satisfies ProviderSession;
      })
    );
    setSessions(results);
    setLoading(false);
  }, []);

  // Refresh every time this screen gains focus (e.g. returning from provider-login)
  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions])
  );

  const handleConnect = (domain: string) => {
    router.push({
      pathname: '/(app)/provider-login' as any,
      params: { domain },
    });
  };

  const handleDisconnect = (domain: string, name: string) => {
    Alert.alert(
      `Disconnect ${name}`,
      'This will remove the saved session. You will need to log in again to play courses from this provider.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await removeCookies(domain);
            loadSessions();
          },
        },
      ]
    );
  };

  const connectedCount = sessions.filter((s) => s.connected).length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Connect Your CME Accounts</Text>
        <Text style={styles.subtitle}>
          Log in once to each provider. Courses will load instantly without
          re-authenticating.
        </Text>

        {/* Privacy note */}
        <View style={styles.privacyNote}>
          <Text style={styles.privacyText}>
            🔒 We never store your passwords — only session cookies, encrypted
            on your device.
          </Text>
        </View>

        {/* Status summary */}
        {!loading && (
          <View style={styles.statusRow}>
            <Text style={styles.statusText}>
              <Text style={styles.statusCount}>{connectedCount}</Text>
              {' of '}
              <Text style={styles.statusCount}>{sessions.length}</Text>
              {' providers connected'}
            </Text>
          </View>
        )}

        {/* Provider list */}
        {loading ? (
          <ActivityIndicator
            color={theme.colors.plum}
            style={styles.loader}
            size="large"
          />
        ) : (
          <View style={styles.list}>
            {sessions.map((session) => (
              <ProviderCard
                key={session.domain}
                session={session}
                onConnect={() => handleConnect(session.domain)}
                onDisconnect={() =>
                  handleDisconnect(session.domain, session.name)
                }
              />
            ))}
          </View>
        )}

        {/* Footer note */}
        <Text style={styles.footerNote}>
          Sessions expire after inactivity. If a course asks you to log in,
          reconnect the provider here.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    paddingHorizontal: theme.spacing[4],
    paddingBottom: theme.spacing[10],
  },
  backBtn: {
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[2],
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.plum,
    fontWeight: theme.fontWeight.medium,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plumDark,
    marginBottom: theme.spacing[2],
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray500,
    lineHeight: 22,
    marginBottom: theme.spacing[4],
  },
  privacyNote: {
    backgroundColor: theme.colors.gray100,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing[3],
    marginBottom: theme.spacing[5],
  },
  privacyText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray700,
    lineHeight: 20,
  },
  statusRow: {
    marginBottom: theme.spacing[4],
  },
  statusText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray500,
  },
  statusCount: {
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plum,
  },
  loader: {
    marginTop: theme.spacing[10],
  },
  list: {
    gap: theme.spacing[3],
  },
  providerCard: {
    padding: theme.spacing[4],
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[3],
  },
  providerIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.plumDark,
    marginBottom: 3,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  connectedText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.success,
    fontWeight: theme.fontWeight.medium,
  },
  notConnectedText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray500,
  },
  connectBtn: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.md,
    flexShrink: 0,
  },
  connectBtnText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  disconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[2],
    flexShrink: 0,
  },
  disconnectText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.error,
    fontWeight: theme.fontWeight.medium,
  },
  footerNote: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray500,
    textAlign: 'center',
    marginTop: theme.spacing[6],
    lineHeight: 18,
  },
});
