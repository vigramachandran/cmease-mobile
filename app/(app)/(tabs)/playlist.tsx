import { router } from 'expo-router';
import { CheckCircle, Play, Sparkles } from 'lucide-react-native';
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
import { api } from '../../../lib/api';
import { theme } from '../../../lib/theme';
import { ComplianceGap, Playlist, PlaylistItem } from '../../../lib/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(status?: PlaylistItem['status']): string {
  if (status === 'completed') return theme.colors.success;
  if (status === 'in_progress') return theme.colors.plum;
  return theme.colors.gray300;
}

function firstIncompleteIndex(playlist: Playlist): number {
  const idx = playlist.playlist.findIndex((i) => i.status !== 'completed');
  return idx >= 0 ? idx : 0;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PlaylistItemRow({
  item,
  index,
  playlistId,
  onPress,
}: {
  item: PlaylistItem;
  index: number;
  playlistId: string | undefined;
  onPress: () => void;
}) {
  const isCompleted = item.status === 'completed';
  const isMandatory = item.mandatory;
  const badgeBg = isMandatory ? theme.colors.plum : theme.colors.blush;

  return (
    <TouchableOpacity
      style={[styles.playlistItemRow, { borderLeftWidth: 3, borderLeftColor: theme.colors.blush }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Numbered index badge */}
      <View style={[styles.indexBadge, { backgroundColor: isMandatory ? theme.colors.plum : theme.colors.blush }]}>
        <Text style={styles.indexBadgeText}>{index + 1}</Text>
      </View>

      {/* Content */}
      <View style={styles.playlistItemContent}>
        <View style={styles.playlistItemTitleRow}>
          <Text
            style={[
              styles.playlistItemTitle,
              isCompleted && styles.playlistItemTitleDone,
            ]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          {isMandatory && (
            <View style={styles.requiredBadge}>
              <Text style={styles.requiredBadgeText}>REQUIRED</Text>
            </View>
          )}
        </View>
        <Text style={styles.playlistItemProvider} numberOfLines={1}>
          {item.provider}
        </Text>
        <View style={styles.playlistItemMetaRow}>
          <Text style={styles.playlistItemMeta}>
            {item.credits} cr · {Math.round((item.durationMinutes / 60) * 10) / 10}h
          </Text>
          {item.efficiencyScore != null && (
            <Text style={styles.efficiencyBadge}>
              ⚡ {item.efficiencyScore.toFixed(1)} cr/hr
            </Text>
          )}
        </View>
        {item.fillsRequirements.length > 0 && (
          <Text style={styles.playlistItemReqs} numberOfLines={1}>
            Fills: {item.fillsRequirements.join(', ')}
          </Text>
        )}
      </View>

      {/* Right side: cost + status */}
      <View style={styles.playlistItemRight}>
        <Text style={styles.playlistItemCost}>{item.cost}</Text>
        <View style={styles.statusIndicator}>
          {isCompleted ? (
            <CheckCircle size={18} color={theme.colors.success} />
          ) : (
            <View style={styles.statusCircleOutline} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function GapsSummary({ gaps }: { gaps: ComplianceGap[] }) {
  if (gaps.length === 0) return null;
  return (
    <Card style={styles.gapsCard}>
      <Text style={styles.gapsTitle}>Compliance Gaps</Text>
      {gaps.map((gap) => (
        <View key={gap.state} style={[styles.gapRow, { borderLeftWidth: 3, borderLeftColor: theme.colors.blush, paddingLeft: theme.spacing[3] }]}>
          <Text style={styles.gapState}>{gap.state}</Text>
          <View style={styles.gapDetails}>
            {gap.generalCreditsRemaining > 0 && (
              <Text style={styles.gapDetail}>
                {gap.generalCreditsRemaining.toFixed(1)} credits needed
              </Text>
            )}
            {gap.mandatoryTopics.map((t, i) => (
              <Text key={i} style={styles.gapDetail}>
                {t.topic}: {t.hoursNeeded}h needed
              </Text>
            ))}
          </View>
        </View>
      ))}
    </Card>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PlaylistScreen() {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [savedPlaylistId, setSavedPlaylistId] = useState<string | undefined>();
  const [gaps, setGaps] = useState<ComplianceGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const [playlistResult, gapsResult] = await Promise.all([
      api.playlist.active(),
      api.playlist.gaps(),
    ]);
    if (playlistResult.data) {
      setPlaylist(playlistResult.data);
      // Use id from response if the backend includes it
      if ((playlistResult.data as any).id) {
        setSavedPlaylistId((playlistResult.data as any).id);
      }
    }
    if (gapsResult.data) setGaps(gapsResult.data);
    const err = playlistResult.error ?? gapsResult.error;
    if (err) setError(err);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');

    const { data: generated, error: genError } = await api.playlist.generate();
    if (genError || !generated) {
      setError(genError ?? 'Failed to generate playlist.');
      setGenerating(false);
      return;
    }

    // Save to get a persistent ID for the player
    const { data: saved } = await api.playlist.save(generated);
    if (saved?.id) setSavedPlaylistId(saved.id);

    setPlaylist(generated);
    setGenerating(false);
  };

  const handlePlayAll = () => {
    if (!playlist) return;
    const startIndex = firstIncompleteIndex(playlist);
    router.push({
      pathname: '/(app)/player' as any,
      params: {
        playlistId: savedPlaylistId ?? '',
        startIndex: String(startIndex),
      },
    });
  };

  const handlePlayCourse = (index: number) => {
    router.push({
      pathname: '/(app)/player' as any,
      params: {
        playlistId: savedPlaylistId ?? '',
        startIndex: String(index),
      },
    });
  };

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
        <Text style={styles.title}>Learning Playlist</Text>

        {loading ? (
          <ActivityIndicator color={theme.colors.plum} style={styles.loader} />
        ) : (
          <>
            {error ? (
              <Card style={styles.errorCard}>
                <Text style={styles.errorText}>{error}</Text>
              </Card>
            ) : null}

            {!playlist ? (
              <>
                <GapsSummary gaps={gaps} />
                {/* Hero generate card */}
                <View style={styles.heroGenerateCard}>
                  <Sparkles size={40} color={theme.colors.plum} strokeWidth={1.5} />
                  <Text style={styles.heroTitle}>Your CME Playlist</Text>
                  <Text style={styles.heroSubtitle}>
                    Generate a personalized CME playlist based on your compliance gaps and specialty.
                  </Text>
                  <Button
                    title="Generate My Playlist"
                    onPress={handleGenerate}
                    loading={generating}
                    fullWidth
                  />
                </View>
              </>
            ) : (
              <>
                {/* Play Playlist button */}
                <TouchableOpacity
                  style={styles.playAllBtn}
                  onPress={handlePlayAll}
                  activeOpacity={0.85}
                >
                  <Play size={20} color={theme.colors.white} fill={theme.colors.white} />
                  <Text style={styles.playAllText}>Play Playlist</Text>
                </TouchableOpacity>

                {/* Summary — horizontal 4-item grid */}
                <Card style={styles.summaryCard}>
                  <View style={styles.summaryGrid}>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>
                        {playlist.summary.totalCourses}
                      </Text>
                      <Text style={styles.summaryLabel}>Courses</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>
                        {playlist.summary.totalCredits.toFixed(1)}
                      </Text>
                      <Text style={styles.summaryLabel}>Credits</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>
                        {playlist.summary.totalDurationHours.toFixed(1)}h
                      </Text>
                      <Text style={styles.summaryLabel}>Duration</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryValue}>
                        {playlist.summary.estimatedCost}
                      </Text>
                      <Text style={styles.summaryLabel}>Est. Cost</Text>
                    </View>
                  </View>
                </Card>

                {/* Course list */}
                <Card style={styles.coursesCard}>
                  <Text style={styles.coursesTitle}>Courses</Text>
                  {playlist.playlist.map((item, index) => (
                    <PlaylistItemRow
                      key={item.order}
                      item={item}
                      index={index}
                      playlistId={savedPlaylistId}
                      onPress={() => handlePlayCourse(index)}
                    />
                  ))}
                </Card>

                <TouchableOpacity
                  onPress={handleGenerate}
                  style={styles.regenerateLink}
                  disabled={generating}
                >
                  <Text style={styles.regenerateLinkText}>
                    {generating ? 'Regenerating…' : 'Regenerate playlist'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
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
  loader: { marginTop: theme.spacing[10] },
  errorCard: { padding: theme.spacing[4], marginBottom: theme.spacing[4] },
  errorText: { color: theme.colors.error, fontSize: theme.fontSize.sm },
  gapsCard: { marginBottom: theme.spacing[4], padding: theme.spacing[4] },
  gapsTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plumDark,
    marginBottom: theme.spacing[3],
  },
  gapRow: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    marginBottom: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    backgroundColor: theme.colors.gray100,
    borderRadius: theme.borderRadius.sm,
  },
  gapState: { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold, color: theme.colors.gray700, width: 32 },
  gapDetails: { flex: 1 },
  gapDetail: { fontSize: theme.fontSize.sm, color: theme.colors.gray500 },
  // Hero generate card
  heroGenerateCard: {
    backgroundColor: '#F9F4FA',
    borderWidth: 1,
    borderColor: '#E8DDE9',
    borderRadius: theme.borderRadius.xl,
    padding: 32,
    alignItems: 'center',
    marginBottom: theme.spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plumDark,
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray500,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing[5],
  },
  // Play all button
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
    backgroundColor: theme.colors.plum,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing[4],
    marginBottom: theme.spacing[4],
    shadowColor: theme.colors.plum,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  playAllText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
  },
  // Summary card
  summaryCard: {
    marginBottom: theme.spacing[4],
    padding: theme.spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  summaryGrid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryItem: { alignItems: 'center', flex: 1 },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: theme.colors.gray100,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plum,
  },
  summaryLabel: { fontSize: 11, color: theme.colors.gray500, marginTop: 2 },
  coursesCard: { padding: theme.spacing[4], marginBottom: theme.spacing[3] },
  coursesTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plumDark,
    marginBottom: theme.spacing[3],
  },
  // Course row
  playlistItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing[3],
    paddingVertical: theme.spacing[3],
    paddingLeft: theme.spacing[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.gray300,
    marginLeft: -theme.spacing[2],
  },
  indexBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  indexBadgeText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: theme.fontWeight.bold,
  },
  playlistItemContent: { flex: 1 },
  playlistItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  playlistItemTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.plumDark,
    flexShrink: 1,
  },
  playlistItemTitleDone: { color: theme.colors.gray500 },
  requiredBadge: {
    backgroundColor: '#F3EEF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  requiredBadgeText: {
    color: theme.colors.plum,
    fontSize: 10,
    fontWeight: theme.fontWeight.bold,
    letterSpacing: 0.3,
  },
  playlistItemProvider: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray500,
    marginBottom: 3,
  },
  playlistItemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
    flexWrap: 'wrap',
  },
  playlistItemMeta: { fontSize: theme.fontSize.xs, color: theme.colors.gray500 },
  efficiencyBadge: {
    fontSize: 11,
    color: '#E6A817',
    fontWeight: theme.fontWeight.medium,
  },
  playlistItemReqs: { fontSize: theme.fontSize.xs, color: theme.colors.plum, marginTop: 2 },
  playlistItemRight: {
    alignItems: 'flex-end',
    gap: theme.spacing[2],
    flexShrink: 0,
  },
  playlistItemCost: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.gray700,
  },
  statusIndicator: {
    width: 20,
    alignItems: 'center',
  },
  statusCircleOutline: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: theme.colors.gray300,
  },
  regenerateLink: { alignItems: 'center', paddingVertical: theme.spacing[3] },
  regenerateLinkText: {
    color: theme.colors.plum,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
});
