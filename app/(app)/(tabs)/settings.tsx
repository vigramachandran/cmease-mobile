import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { ChevronRight, LogOut } from 'lucide-react-native';
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

  const firstName = profile?.firstName ?? '';
  const lastName = profile?.lastName ?? '';
  const initials =
    (firstName[0] ?? '') + (lastName[0] ?? '') || (profile?.email?.[0]?.toUpperCase() ?? '?');

  const fullName = [profile?.credential, profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settings</Text>

        {/* ── Profile ── */}
        <Text style={styles.sectionLabel}>Profile</Text>
        <Card style={styles.profileCard}>
          {/* Plum accent strip */}
          <View style={styles.profileAccentStrip} />

          {/* Avatar + info row */}
          <View style={styles.profileBody}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{initials.toUpperCase()}</Text>
            </View>
            <View style={styles.profileInfo}>
              {fullName ? (
                <Text style={styles.profileName}>{fullName}</Text>
              ) : null}
              {profile?.npi ? (
                <Text style={styles.profileMeta}>NPI: {profile.npi}</Text>
              ) : null}
              {profile?.specialty ? (
                <Text style={styles.profileMeta}>{profile.specialty}</Text>
              ) : null}
              {profile?.email ? (
                <Text style={styles.profileEmail}>{profile.email}</Text>
              ) : null}
              {!profile?.npi && (
                <Text style={styles.emptyHint}>
                  Complete onboarding to add profile details.
                </Text>
              )}
            </View>
          </View>

          {/* License state chips inside profile card */}
          {profile?.licenseStates && profile.licenseStates.length > 0 && (
            <View style={styles.statesRow}>
              {profile.licenseStates.map((state) => (
                <View key={state} style={styles.statePill}>
                  <Text style={styles.statePillText}>{state}</Text>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* ── Connected CME Accounts ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionLabel}>CME Providers</Text>
          <Text style={styles.sectionCount}>
            {connectedCount}/{totalProviders} connected
          </Text>
        </View>
        <Card style={styles.card}>
          {/* Provider icon circles row */}
          <View style={styles.providerIconsRow}>
            {PROVIDER_DOMAINS.map((domain) => {
              const prov = PROVIDERS[domain];
              const isConnected = connectedDomains.includes(domain);
              const nameInitials = (prov?.name ?? domain)
                .split(' ')
                .map((w: string) => w[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();
              return (
                <View key={domain} style={styles.providerIconWrapper}>
                  <View
                    style={[
                      styles.providerIconCircle,
                      { backgroundColor: prov?.color ?? theme.colors.gray300 },
                      !isConnected && styles.providerIconCircleDisconnected,
                    ]}
                  >
                    <Text style={styles.providerIconInitials}>{nameInitials}</Text>
                    {/* Connection dot badge */}
                    <View
                      style={[
                        styles.providerDotBadge,
                        {
                          backgroundColor: isConnected
                            ? theme.colors.success
                            : theme.colors.gray300,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.providerIconLabel} numberOfLines={1}>
                    {prov?.name ?? domain}
                  </Text>
                </View>
              );
            })}
          </View>

          {connectedDomains.length === 0 && (
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
            <Text style={styles.manageBtnText}>Manage Connections</Text>
            <ChevronRight size={16} color={theme.colors.plum} />
          </TouchableOpacity>
        </Card>

        {/* ── App ── */}
        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>App</Text>
        <Card style={styles.card}>
          <Row label="Version" value={appVersion} muted />
        </Card>

        {/* ── Sign Out ── */}
        <TouchableOpacity
          style={[styles.signOutBtn, signingOut && styles.signOutBtnDisabled]}
          onPress={handleSignOut}
          disabled={signingOut}
          activeOpacity={0.7}
        >
          <LogOut size={18} color={theme.colors.error} style={styles.signOutIcon} />
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

  // Section labels
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing[6],
    marginBottom: theme.spacing[2],
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing[2],
  },
  sectionLabelSpaced: {
    marginTop: theme.spacing[6],
  },
  sectionCount: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plum,
  },

  // Profile card
  profileCard: {
    padding: 0,
    overflow: 'hidden',
  },
  profileAccentStrip: {
    height: 6,
    backgroundColor: theme.colors.plum,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing[4],
  },
  profileBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing[4],
    paddingBottom: theme.spacing[3],
    gap: theme.spacing[3],
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.plum,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarInitials: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: theme.fontWeight.bold,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 17,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plumDark,
    marginBottom: 2,
  },
  profileMeta: {
    fontSize: 13,
    color: theme.colors.gray500,
    lineHeight: 18,
  },
  profileEmail: {
    fontSize: 12,
    color: theme.colors.gray500,
    marginTop: 1,
  },
  emptyHint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray500,
    paddingVertical: theme.spacing[2],
  },
  statesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
    paddingHorizontal: theme.spacing[4],
    paddingBottom: theme.spacing[4],
    paddingTop: theme.spacing[1],
  },
  statePill: {
    backgroundColor: theme.colors.gray100,
    paddingVertical: 4,
    paddingHorizontal: theme.spacing[3],
    borderRadius: theme.borderRadius.full,
  },
  statePillText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.plum,
  },

  // Generic card
  card: { padding: theme.spacing[4] },

  // Rows (used by App section)
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray100,
  },
  rowLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray500,
    fontWeight: theme.fontWeight.medium,
  },
  rowValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.plumDark,
    fontWeight: theme.fontWeight.semibold,
    flex: 1,
    textAlign: 'right',
  },
  rowValueMuted: {
    color: theme.colors.gray500,
    fontWeight: theme.fontWeight.regular,
  },

  // Provider circles
  providerIconsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[4],
    marginBottom: theme.spacing[3],
  },
  providerIconWrapper: {
    alignItems: 'center',
    width: 56,
  },
  providerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  providerIconCircleDisconnected: {
    opacity: 0.45,
  },
  providerIconInitials: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: theme.fontWeight.bold,
  },
  providerDotBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  providerIconLabel: {
    fontSize: 10,
    color: theme.colors.gray500,
    textAlign: 'center',
  },

  // Manage connections row
  placeholderText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray500,
    lineHeight: 22,
    marginBottom: theme.spacing[3],
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing[3],
    paddingVertical: theme.spacing[3],
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray100,
    gap: 4,
  },
  manageBtnText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.plum,
  },

  // Sign out
  signOutBtn: {
    marginTop: theme.spacing[8],
    height: 52,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
  },
  signOutBtnDisabled: { opacity: 0.6 },
  signOutIcon: {},
  signOutText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
  },
  version: {
    textAlign: 'center',
    marginTop: theme.spacing[5],
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray300,
  },
});
