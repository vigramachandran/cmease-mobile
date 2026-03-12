import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../../components/Card';
import { useAuthStore } from '../../../lib/auth-store';
import { getConnectedProviders } from '../../../lib/credential-vault';
import { PROVIDER_DOMAINS, PROVIDERS } from '../../../lib/provider-config';
import { theme } from '../../../lib/theme';

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value?: string;
  muted?: boolean;
}) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, muted && styles.rowValueMuted]}>
        {value}
      </Text>
    </View>
  );
}

export default function SettingsScreen() {
  const { profile, signOut } = useAuthStore();
  const [signingOut, setSigningOut] = useState(false);
  const [connectedDomains, setConnectedDomains] = useState<string[]>([]);

  // Refresh connection status whenever this tab is focused
  useFocusEffect(
    useCallback(() => {
      getConnectedProviders().then(setConnectedDomains);
    }, [])
  );

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          await signOut();
          setSigningOut(false);
        },
      },
    ]);
  };

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const connectedCount = connectedDomains.length;
  const totalProviders = PROVIDER_DOMAINS.length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settings</Text>

        {/* Profile */}
        <Text style={styles.sectionLabel}>Profile</Text>
        <Card style={styles.card}>
          <Row
            label="Name"
            value={
              [profile?.credential, profile?.firstName, profile?.lastName]
                .filter(Boolean)
                .join(' ') || undefined
            }
          />
          <Row label="Email" value={profile?.email} />
          <Row label="NPI" value={profile?.npi} />
          <Row label="Specialty" value={profile?.specialty} />
          {!profile?.npi && (
            <Text style={styles.emptyHint}>
              Complete onboarding to add profile details.
            </Text>
          )}
        </Card>

        {/* License states */}
        {profile?.licenseStates && profile.licenseStates.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>License States</Text>
            <Card style={styles.card}>
              <View style={styles.statesRow}>
                {profile.licenseStates.map((state) => (
                  <View key={state} style={styles.statePill}>
                    <Text style={styles.statePillText}>{state}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </>
        )}

        {/* Connected CME Accounts */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>Connected CME Accounts</Text>
          <Text style={styles.sectionCount}>
            {connectedCount}/{totalProviders}
          </Text>
        </View>
        <Card style={styles.card}>
          {connectedDomains.length > 0 ? (
            <>
              {connectedDomains.map((domain) => (
                <View key={domain} style={styles.connectedRow}>
                  <View
                    style={[
                      styles.connectedDot,
                      { backgroundColor: PROVIDERS[domain]?.color ?? theme.colors.success },
                    ]}
                  />
                  <Text style={styles.connectedName}>
                    {PROVIDERS[domain]?.name ?? domain}
                  </Text>
                  <Text style={styles.connectedStatus}>Connected</Text>
                </View>
              ))}

              {/* Show disconnected ones too */}
              {PROVIDER_DOMAINS.filter((d) => !connectedDomains.includes(d)).map(
                (domain) => (
                  <View key={domain} style={styles.connectedRow}>
                    <View style={[styles.connectedDot, { backgroundColor: theme.colors.gray300 }]} />
                    <Text style={[styles.connectedName, { color: theme.colors.gray500 }]}>
                      {PROVIDERS[domain]?.name ?? domain}
                    </Text>
                    <Text style={styles.notConnectedStatus}>Not connected</Text>
                  </View>
                )
              )}
            </>
          ) : (
            <Text style={styles.placeholderText}>
              No providers connected. Connect your accounts to enable seamless
              course access.
            </Text>
          )}

          <TouchableOpacity
            style={styles.manageBtn}
            onPress={() => router.push('/(app)/connect-accounts' as any)}
            activeOpacity={0.7}
          >
            <Text style={styles.manageBtnText}>Manage Connections →</Text>
          </TouchableOpacity>
        </Card>

        {/* Sign out */}
        <TouchableOpacity
          style={[styles.signOutBtn, signingOut && styles.signOutBtnDisabled]}
          onPress={handleSignOut}
          disabled={signingOut}
          activeOpacity={0.7}
        >
          <Text style={styles.signOutText}>
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.version}>CMEase v{appVersion}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { paddingHorizontal: theme.spacing[4], paddingBottom: theme.spacing[8] },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plumDark,
    paddingTop: theme.spacing[5],
    marginBottom: theme.spacing[5],
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[2],
  },
  sectionLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionCount: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plum,
  },
  card: { padding: theme.spacing[4] },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray100,
  },
  rowLabel: { fontSize: theme.fontSize.sm, color: theme.colors.gray500, fontWeight: theme.fontWeight.medium },
  rowValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.plumDark,
    fontWeight: theme.fontWeight.semibold,
    flex: 1,
    textAlign: 'right',
  },
  rowValueMuted: { color: theme.colors.gray500, fontWeight: theme.fontWeight.regular },
  emptyHint: { fontSize: theme.fontSize.sm, color: theme.colors.gray500, paddingVertical: theme.spacing[2] },
  statesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[2] },
  statePill: {
    backgroundColor: theme.colors.gray100,
    paddingVertical: 4,
    paddingHorizontal: theme.spacing[3],
    borderRadius: theme.borderRadius.full,
  },
  statePillText: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.plum },
  // Connected accounts
  connectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray100,
    gap: theme.spacing[2],
  },
  connectedDot: { width: 8, height: 8, borderRadius: 4 },
  connectedName: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.plumDark,
  },
  connectedStatus: { fontSize: theme.fontSize.xs, color: theme.colors.success, fontWeight: theme.fontWeight.semibold },
  notConnectedStatus: { fontSize: theme.fontSize.xs, color: theme.colors.gray500 },
  placeholderText: { fontSize: theme.fontSize.sm, color: theme.colors.gray500, lineHeight: 22, marginBottom: theme.spacing[3] },
  manageBtn: {
    marginTop: theme.spacing[3],
    paddingVertical: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray100,
    alignItems: 'center',
  },
  manageBtnText: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.plum },
  // Sign out
  signOutBtn: {
    marginTop: theme.spacing[8],
    height: 52,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#FDECEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutBtnDisabled: { opacity: 0.6 },
  signOutText: { color: theme.colors.error, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold },
  version: { textAlign: 'center', marginTop: theme.spacing[5], fontSize: theme.fontSize.xs, color: theme.colors.gray300 },
});
