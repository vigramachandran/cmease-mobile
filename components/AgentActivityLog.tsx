import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AgentLogEntry } from '../lib/agent/message-handler';
import { theme } from '../lib/theme';

interface AgentActivityLogProps {
  entries: AgentLogEntry[];
  isActive: boolean;
  isQuizPaused: boolean;
  domain?: string;
}

function entryIcon(entry: AgentLogEntry): string {
  switch (entry.kind) {
    case 'loaded':  return '🤖';
    case 'action':  return '✓';
    case 'quiz':    return '⏸';
    case 'status':  return '·';
    default:        return '·';
  }
}

function entryColor(entry: AgentLogEntry): string {
  switch (entry.kind) {
    case 'loaded':  return theme.colors.plum;
    case 'action':  return theme.colors.success;
    case 'quiz':    return theme.colors.warning;
    case 'status':  return theme.colors.gray500;
    default:        return theme.colors.gray500;
  }
}

export function AgentActivityLog({
  entries,
  isActive,
  isQuizPaused,
  domain,
}: AgentActivityLogProps) {
  const [collapsed, setCollapsed] = useState(true);

  const toggleCollapsed = useCallback(() => setCollapsed((c) => !c), []);

  const statusDotColor = isQuizPaused
    ? theme.colors.warning
    : isActive
    ? theme.colors.success
    : theme.colors.gray300;

  const statusLabel = isQuizPaused
    ? 'Post-test — answer questions above'
    : isActive
    ? domain
      ? `Active on ${domain}`
      : 'Agent active'
    : 'Agent inactive';

  return (
    <View style={styles.container}>
      {/* Header — always visible */}
      <TouchableOpacity
        style={styles.header}
        onPress={toggleCollapsed}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.statusDot, { backgroundColor: statusDotColor }]} />
          <Text style={styles.headerText} numberOfLines={1}>
            🤖 {statusLabel}
          </Text>
        </View>
        <Text style={styles.chevron}>{collapsed ? '▾' : '▴'}</Text>
      </TouchableOpacity>

      {/* Log entries — shown when expanded */}
      {!collapsed && (
        <View style={styles.logList}>
          {entries.length === 0 ? (
            <Text style={styles.emptyText}>No actions yet…</Text>
          ) : (
            entries.slice(-5).map((entry) => (
              <View key={entry.id} style={styles.logRow}>
                <Text style={[styles.logIcon, { color: entryColor(entry) }]}>
                  {entryIcon(entry)}
                </Text>
                <Text
                  style={[styles.logText, { color: entryColor(entry) }]}
                  numberOfLines={1}
                >
                  {entry.text}
                </Text>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.gray100,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray300,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    flexShrink: 0,
  },
  headerText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.gray700,
    flex: 1,
  },
  chevron: {
    fontSize: 11,
    color: theme.colors.gray500,
    marginLeft: theme.spacing[2],
  },
  logList: {
    paddingHorizontal: theme.spacing[4],
    paddingBottom: 8,
    gap: 4,
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  logIcon: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    width: 14,
    flexShrink: 0,
  },
  logText: {
    fontSize: theme.fontSize.xs,
    flex: 1,
    lineHeight: 16,
  },
  emptyText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray500,
    fontStyle: 'italic',
  },
});
