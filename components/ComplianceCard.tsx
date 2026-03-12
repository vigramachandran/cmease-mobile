import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../lib/theme';
import { StateCompliance } from '../lib/types';
import { Card } from './Card';
import { ProgressBar } from './ProgressBar';
import { TopicBadge } from './TopicBadge';

interface ComplianceCardProps {
  state: StateCompliance;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getProgressColor(percentage: number): string {
  if (percentage >= 80) return theme.colors.success;
  if (percentage >= 50) return theme.colors.plum;
  return theme.colors.error;
}

export function ComplianceCard({ state }: ComplianceCardProps) {
  const progressColor = getProgressColor(state.percentage);
  const progress = state.creditsRequired > 0
    ? state.creditsEarned / state.creditsRequired
    : 0;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.stateName}>{state.state}</Text>
          <Text style={styles.renewalDate}>
            Renews {formatDate(state.renewalDate)}
          </Text>
        </View>
        <View style={styles.percentageContainer}>
          <Text style={[styles.percentage, { color: progressColor }]}>
            {Math.round(state.percentage)}%
          </Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <ProgressBar progress={progress} color={progressColor} />
        <Text style={styles.creditCount}>
          {state.creditsEarned.toFixed(1)} / {state.creditsRequired} credits
        </Text>
      </View>

      {state.mandatoryTopics.length > 0 && (
        <View style={styles.topicsSection}>
          <Text style={styles.topicsLabel}>Mandatory Topics</Text>
          <View style={styles.topicsList}>
            {state.mandatoryTopics.map((topic, idx) => (
              <TopicBadge key={idx} topic={topic} />
            ))}
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: theme.spacing[3],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[3],
  },
  stateName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plumDark,
  },
  renewalDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray500,
    marginTop: 2,
  },
  percentageContainer: {
    alignItems: 'flex-end',
  },
  percentage: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
  },
  progressSection: {
    gap: theme.spacing[1],
    marginBottom: theme.spacing[3],
  },
  creditCount: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray500,
  },
  topicsSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray100,
    paddingTop: theme.spacing[3],
  },
  topicsLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing[2],
  },
  topicsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
