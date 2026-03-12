import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../../../components/Card';
import { api } from '../../../lib/api';
import { theme } from '../../../lib/theme';
import { Course } from '../../../lib/types';

export default function FindCMEScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.courses.list().then(({ data, error: apiError }) => {
      if (data) setCourses(data);
      if (apiError) setError(apiError);
      setLoading(false);
    });
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Find CME</Text>
        <Text style={styles.subtitle}>Course discovery coming soon</Text>

        {!loading && !error && courses.length > 0 && (
          <Card style={styles.catalogCard}>
            <Text style={styles.catalogCount}>
              {courses.length.toLocaleString()} courses in catalog
            </Text>
            <Text style={styles.catalogHint}>
              Advanced filtering and search launching soon
            </Text>
          </Card>
        )}

        {error ? (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : null}

        <Card style={styles.comingSoonCard}>
          <Text style={styles.comingSoonTitle}>What's coming</Text>
          {[
            'Search by specialty, topic, and format',
            'Filter by cost and credit hours',
            'One-tap enrollment',
            'Save courses to your playlist',
          ].map((item, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureDot}>•</Text>
              <Text style={styles.featureText}>{item}</Text>
            </View>
          ))}
        </Card>
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
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plumDark,
    paddingTop: theme.spacing[5],
    marginBottom: theme.spacing[1],
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray500,
    marginBottom: theme.spacing[5],
  },
  catalogCard: {
    marginBottom: theme.spacing[4],
    padding: theme.spacing[5],
    alignItems: 'center',
  },
  catalogCount: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plum,
  },
  catalogHint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray500,
    marginTop: 4,
  },
  errorCard: {
    marginBottom: theme.spacing[4],
    padding: theme.spacing[4],
  },
  errorText: {
    color: theme.colors.gray500,
    fontSize: theme.fontSize.sm,
  },
  comingSoonCard: {
    padding: theme.spacing[5],
  },
  comingSoonTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plumDark,
    marginBottom: theme.spacing[3],
  },
  featureRow: {
    flexDirection: 'row',
    gap: theme.spacing[2],
    marginBottom: theme.spacing[2],
  },
  featureDot: {
    color: theme.colors.plum,
    fontSize: theme.fontSize.md,
  },
  featureText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray700,
    flex: 1,
  },
});
