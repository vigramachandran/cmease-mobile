import { router } from 'expo-router';
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
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { ComplianceCard } from '../../../components/ComplianceCard';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../lib/auth-store';
import { theme } from '../../../lib/theme';
import { ComplianceStatus, UserLicense } from '../../../lib/types';

function CircularProgress({
  percentage,
  size = 120,
}: {
  percentage: number;
  size?: number;
}) {
  const color =
    percentage >= 80
      ? theme.colors.success
      : percentage >= 50
      ? theme.colors.plum
      : theme.colors.error;

  return (
    <View
      style={[
        styles.circleContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
        },
      ]}
    >
      <Text style={[styles.circlePercent, { color }]}>
        {Math.round(percentage)}%
      </Text>
      <Text style={styles.circleLabel}>overall</Text>
    </View>
  );
}

function SkeletonCard() {
  return (
    <Card style={styles.skeletonCard}>
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, { width: '60%', marginTop: 8 }]} />
      <View style={[styles.skeletonLine, { height: 8, marginTop: 16 }]} />
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
          <Text style={styles.greeting}>
            Welcome back{lastName ? `, Dr. ${lastName}` : ''}
          </Text>
          <Text style={styles.subgreeting}>Your CME compliance overview</Text>
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
                style={styles.quickBtn}
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
              <Text style={styles.sectionTitle}>License Renewals</Text>
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
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push('/(app)/manage-licenses' as any)}
                >
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
                          <Text style={[styles.licenseExpText, { color }]}>
                            {expLabel}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </TouchableOpacity>
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
                <Text style={styles.emptyText}>
                  No license states configured yet. Complete onboarding to see
                  state compliance details.
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
  greeting: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plumDark,
  },
  subgreeting: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray500,
    marginTop: 2,
  },
  overallCard: {
    marginBottom: theme.spacing[4],
  },
  overallContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[5],
  },
  circleContainer: {
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  circlePercent: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
  },
  circleLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray500,
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
    height: 44,
  },
  licenseCard: {
    marginBottom: theme.spacing[5],
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
    backgroundColor: theme.colors.gray100,
    paddingVertical: 3,
    paddingHorizontal: theme.spacing[3],
    borderRadius: theme.borderRadius.full,
  },
  stateChipText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.plumDark,
  },
  licenseExpContainer: {},
  licenseExpText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  statesSection: {},
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
    padding: theme.spacing[5],
    alignItems: 'center',
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
    backgroundColor: theme.colors.gray100,
    borderRadius: theme.borderRadius.sm,
    width: '80%',
  },
});
