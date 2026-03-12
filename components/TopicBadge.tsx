import { CheckCircle } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../lib/theme';
import { TopicStatus } from '../lib/types';

interface TopicBadgeProps {
  topic: TopicStatus;
}

export function TopicBadge({ topic }: TopicBadgeProps) {
  const { completed, topic: name, hoursRequired, hoursCompleted } = topic;

  return (
    <View style={[styles.badge, completed ? styles.completed : styles.pending]}>
      {completed ? (
        <CheckCircle size={12} color={theme.colors.success} strokeWidth={2.5} />
      ) : null}
      <Text
        style={[styles.text, completed ? styles.completedText : styles.pendingText]}
        numberOfLines={1}
      >
        {name}
        {!completed
          ? ` (${hoursCompleted.toFixed(1)}/${hoursRequired}h)`
          : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: theme.spacing[2],
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
    marginRight: 6,
    marginBottom: 6,
  },
  completed: {
    backgroundColor: '#E8F5EE',
  },
  pending: {
    backgroundColor: '#FDF3E7',
  },
  text: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
  },
  completedText: {
    color: theme.colors.success,
  },
  pendingText: {
    color: theme.colors.warning,
  },
});
