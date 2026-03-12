import { router } from 'expo-router';
import { Shield } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { ComplianceCard } from '../../../components/ComplianceCard';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth-store';
import { theme } from '../../../lib/theme';
import { ComplianceStatus, UserLicense } from '../../../lib/types';

function CircularProgress({
  percentage,
  size = 110,
}: {
  percentage: number;
  size?: number;
}) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(percentage, 0), 100);
  const strokeDashoffset = circumference * (1 - progress / 100);
  const color =
    progress >= 80
      ? theme.colors.success
      : progress >= 50
      ? theme.colors.plum
      : theme.colors.error;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.colors.gray100}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color }}>{Math.round(progress)}%</Text>
        <Text style={{ fontSize: 11, color: theme.colors.gray500 }}>overall</Text>
      </View>
    </View>
  );
}

function SkeletonCard() {
  return (
    <Card style={styles.skeletonCard}>
      <View style={[styles.skeletonLine, { backgroundColor: theme.colors.gray100, width: '80%' }]} />
      <View style={[styles.skeletonLine, { backgroundColor: '#E8E2EA', width: '60%', marginTop: 8 }]} />
      <View style={[styles.skeletonLine, { backgroundColor: theme.colors.gray100, height: 8, marginTop: 16, width: '95%' }]} />
    </Card>
  );
}

function getLicenseColor(months: number): string {
  if (months < 3) return theme.colors.error;
  if (months < 6) return '#F59E0B';
  return theme.colors.success;
}

export default function DashboardScreen() {
  const { profile } = useAuthStore();
  const [compliance, setCompliance] = useState<ComplianceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [licenses, setLicenses] = useState<UserLicense[]>([]);
  const [licensesLoading, setLicensesLoading] = useState(true);

  const fetchCompliance = useCallback(async () => {
    const { data, error: apiError } = await api.compliance.status();
    if (apiError || !data) {
      setError(apiError ?? 'Failed to load compliance data.');
    } else {
      setCompliance(data);
      setError('');
    }
  }, []);

  const fetchLicenses = useCallback(async () => {
    const { data } = await api.licenses.list();
    setLicenses(data ?? []);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchCompliance().finally(() => setLoading(false));
  }, [fetchCompliance]);

  useEffect(() => {
    setLicensesLoading(true);
    fetchLicenses().finally(() => setLicensesLoading(false));
  }, [fetchLicenses]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchCompliance(), fetchLicenses()]);
    setRefreshing(false);
  }, [fetchCompliance, fetchLicenses]);

  const lastName = profile?.lastName ?? '';

  const today = new Date();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.plum}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerInner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>
                Welcome back{lastName ? `, Dr. ${lastName}` : ''}
              </Text>
              <Text style={styles.subgreeting}>Your CME compliance overview</Text>
            </View>
            {lastName ? (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>{lastName.charAt(0)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Overall compliance card */}
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchCompliance} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </Card>
        ) : compliance ? (
          <>
            <Card style={styles.overallCard}>
              <View style={styles.overallAccentBar} />
              <View style={styles.overallContent}>
                <CircularProgress percentage={compliance?.overallPercentage ?? 0} />
                <View style={styles.overallDetails}>
                  <Text style={styles.overallTitle}>Overall Compliance</Text>
                  <Text style={styles.overallCredits}>
                    {(compliance?.totalCreditsEarned ?? 0).toFixed(1)} of{' '}
                    {compliance?.totalCreditsRequired ?? 0} credits
                  </Text>
                  <Text style={styles.overallHint}>
                    across all license states
                  </Text>
                </View>
              </View>
            </Card>

            {/* Quick actions */}
            <View style={styles.quickActions}>
              <Button
                title="Generate Playlist"
                variant="primary"
                style={[styles.quickBtn, styles.quickBtnPrimary]}
                onPress={() => router.push('/(app)/(tabs)/playlist')}
              />
              <Button
                title="Log Credit"
                variant="outline"
                style={styles.quickBtn}
                onPress={() => router.push('/(app)/(tabs)/log-credit')}
              />
            </View>

            {/* License Renewals card */}
            <Card style={styles.licenseCard}>
              <View style={styles.licenseSectionHeader}>
                <Text style={styles.sectionTitle}>License Renewals</Text>
                <TouchableOpacity onPress={() => router.push('/(app)/manage-licenses' as any)}>
                  <Text style={styles.manageLinkText}>Manage →</Text>
                </TouchableOpacity>
              </View>
              {licensesLoading ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.plum}
                  style={{ marginTop: theme.spacing[2] }}
                />
              ) : licenses.length === 0 ? (
                <View style={styles.noLicensesRow}>
                  <Text style={styles.noLicensesText}>No licenses added</Text>
                  <TouchableOpacity
                    onPress={() => router.push('/(app)/manage-licenses' as any)}
                  >
                    <Text style={styles.addLicensesLink}>Add Licenses →</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {licenses.map((lic) => {
                    const expDate = new Date(lic.expirationDate);
                    const months =
                      (expDate.getFullYear() - today.getFullYear()) * 12 +
                      (expDate.getMonth() - today.getMonth());
                    const color = getLicenseColor(months);
                    const isExpired = months < 0;
                    const expLabel = isExpired
                      ? 'EXPIRED'
                      : `Expires ${String(expDate.getMonth() + 1).padStart(2, '0')}/${expDate.getFullYear()}`;
                    return (
                      <View key={lic.id} style={styles.licenseRow}>
                        <View style={styles.stateChip}>
                          <Text style={styles.stateChipText}>{lic.state}</Text>
                        </View>
                        <View style={styles.licenseExpContainer}>
                          {isExpired ? (
                            <View style={styles.expiredBadge}>
                              <Text style={styles.expiredBadgeText}>EXPIRED</Text>
                            </View>
                          ) : (
                            <Text style={[styles.licenseExpText, { color }]}>
                              {expLabel}
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </>
              )}
            </Card>

            {/* Per-state cards */}
            {(compliance?.states?.length ?? 0) > 0 ? (
              <View style={styles.statesSection}>
                <Text style={styles.sectionTitle}>State Compliance</Text>
                {compliance?.states?.map((state) => (
                  <ComplianceCard key={state.state} state={state} />
                ))}
              </View>
            ) : (
              <Card style={styles.emptyCard}>
                <Shield size={32} color={theme.colors.gray300} strokeWidth={1.5} style={{ marginBottom: 12 }} />
                <Text style={styles.emptyTitle}>No states configured yet</Text>
                <Text style={styles.emptyText}>
                  Complete onboarding to see state compliance details.
                </Text>
              </Card>
            )}
          </>
        ) : null}
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
    paddingBottom: theme.spacing[8],
  },
  header: {
    paddingTop: theme.spacing[5],
    paddingBottom: theme.spacing[5],
  },
  headerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 26,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plumDark,
  },
  subgreeting: {
    fontSize: 13,
    color: theme.colors.gray500,
    marginTop: 4,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.plum,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing[3],
    flexShrink: 0,
  },
  avatarInitial: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.bold,
    fontSize: 16,
  },
  overallCard: {
    marginBottom: theme.spacing[4],
    backgroundColor: '#F9F4FA',
    borderWidth: 1,
    borderColor: '#E8DDE9',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.plum,
    overflow: 'hidden',
  },
  overallAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 0,
  },
  overallContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[5],
  },
  overallDetails: {
    flex: 1,
  },
  overallTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plumDark,
    marginBottom: theme.spacing[1],
  },
  overallCredits: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray700,
    marginBottom: 2,
  },
  overallHint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray500,
  },
  quickActions: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    marginBottom: theme.spacing[5],
  },
  quickBtn: {
    flex: 1,
    height: 48,
  },
  quickBtnPrimary: {
    shadowColor: theme.colors.plum,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  licenseCard: {
    marginBottom: theme.spacing[5],
  },
  licenseSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  manageLinkText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.plum,
    fontWeight: theme.fontWeight.semibold,
  },
  noLicensesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing[2],
  },
  noLicensesText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray500,
  },
  addLicensesLink: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.plum,
    fontWeight: theme.fontWeight.semibold,
  },
  licenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray100,
  },
  stateChip: {
    backgroundColor: '#F3EEF4',
    paddingVertical: 4,
    paddingHorizontal: theme.spacing[3],
    borderRadius: theme.borderRadius.full,
  },
  stateChipText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plum,
  },
  licenseExpContainer: {},
  licenseExpText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  expiredBadge: {
    backgroundColor: '#FDECEA',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: theme.borderRadius.full,
  },
  expiredBadgeText: {
    fontSize: 11,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.error,
    letterSpacing: 0.4,
  },
  statesSection: {
    marginBottom: theme.spacing[2],
  },
  sectionTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plumDark,
    marginBottom: theme.spacing[3],
  },
  errorCard: {
    alignItems: 'center',
    padding: theme.spacing[6],
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.md,
    textAlign: 'center',
    marginBottom: theme.spacing[4],
  },
  retryBtn: {
    backgroundColor: theme.colors.plum,
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[5],
    borderRadius: theme.borderRadius.md,
  },
  retryText: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.semibold,
  },
  emptyCard: {
    padding: theme.spacing[6],
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.gray700,
    marginBottom: 6,
  },
  emptyText: {
    color: theme.colors.gray500,
    fontSize: theme.fontSize.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  skeletonCard: {
    marginBottom: theme.spacing[3],
    padding: theme.spacing[4],
  },
  skeletonLine: {
    height: 16,
    borderRadius: theme.borderRadius.sm,
  },
});
