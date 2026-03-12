import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../../../components/Button';
import { Card } from '../../../components/Card';
import { Input } from '../../../components/Input';
import { api } from '../../../lib/api';
import { theme } from '../../../lib/theme';

const CATEGORIES = [
  'AMA PRA Category 1',
  'AMA PRA Category 2',
  'AAFP Prescribed',
  'AOA Category 1A',
  'AOA Category 1B',
  'AOA Category 2A',
  'AOA Category 2B',
  'ANCC Contact Hours',
  'Other',
];

function CategorySelector({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (cat: string) => void;
}) {
  return (
    <View>
      <Text style={styles.label}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.categoryRow}>
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              title={cat}
              variant={selected === cat ? 'primary' : 'outline'}
              onPress={() => onSelect(cat)}
              style={styles.categoryBtn}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export default function LogCreditScreen() {
  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState('');
  const [category, setCategory] = useState('AMA PRA Category 1');
  const [hours, setHours] = useState('');
  const [completionDate, setCompletionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const providerRef = useRef<TextInput>(null);
  const hoursRef = useRef<TextInput>(null);
  const dateRef = useRef<TextInput>(null);

  const handleSave = async () => {
    setError('');
    setSuccess(false);

    if (!title.trim()) {
      setError('Please enter the course title.');
      return;
    }
    if (!provider.trim()) {
      setError('Please enter the provider.');
      return;
    }
    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      setError('Please enter a valid number of credit hours.');
      return;
    }
    if (!completionDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setError('Please enter date as YYYY-MM-DD.');
      return;
    }

    setSaving(true);
    const { data, error: apiError } = await api.credits.create({
      title: title.trim(),
      provider: provider.trim(),
      category,
      hours: hoursNum,
      completionDate,
    });
    setSaving(false);

    if (apiError || !data) {
      setError(apiError ?? 'Failed to save credit.');
      return;
    }

    // Reset form
    setTitle('');
    setProvider('');
    setHours('');
    setCategory('AMA PRA Category 1');
    setCompletionDate(new Date().toISOString().split('T')[0]);
    setSuccess(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Log Credit</Text>

          {success && (
            <Card style={styles.successCard}>
              <Text style={styles.successText}>
                ✓ Credit saved successfully!
              </Text>
            </Card>
          )}

          {error ? (
            <Text style={styles.errorBanner}>{error}</Text>
          ) : null}

          <Card style={styles.formCard}>
            <Input
              label="Course Title"
              placeholder="Enter course name"
              value={title}
              onChangeText={setTitle}
              returnKeyType="next"
              onSubmitEditing={() => providerRef.current?.focus()}
            />

            <View style={styles.gap} />

            <Input
              ref={providerRef}
              label="Provider / Accreditor"
              placeholder="e.g. Mayo Clinic, AAFP"
              value={provider}
              onChangeText={setProvider}
              returnKeyType="next"
              onSubmitEditing={() => hoursRef.current?.focus()}
            />

            <View style={styles.gap} />

            <Input
              ref={hoursRef}
              label="Credit Hours"
              placeholder="e.g. 1.5"
              value={hours}
              onChangeText={setHours}
              keyboardType="decimal-pad"
              returnKeyType="next"
              onSubmitEditing={() => dateRef.current?.focus()}
            />

            <View style={styles.gap} />

            <Input
              ref={dateRef}
              label="Completion Date"
              placeholder="YYYY-MM-DD"
              value={completionDate}
              onChangeText={setCompletionDate}
              keyboardType="numbers-and-punctuation"
              returnKeyType="done"
            />

            <View style={styles.gap} />

            <CategorySelector selected={category} onSelect={setCategory} />

            <View style={styles.gap} />

            <Button
              title="Save Credit"
              onPress={handleSave}
              loading={saving}
              fullWidth
            />
          </Card>

          {/* Certificate upload placeholder */}
          <Card style={styles.uploadCard}>
            <Text style={styles.uploadTitle}>Upload Certificate</Text>
            <Text style={styles.uploadText}>
              Certificate upload with auto-parsing coming soon. We'll extract
              credit hours and completion date automatically.
            </Text>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
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
    marginBottom: theme.spacing[5],
  },
  successCard: {
    backgroundColor: '#E8F5EE',
    padding: theme.spacing[4],
    marginBottom: theme.spacing[4],
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.success,
  },
  successText: {
    color: theme.colors.success,
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.medium,
  },
  errorBanner: {
    backgroundColor: '#FDECEA',
    color: theme.colors.error,
    fontSize: theme.fontSize.sm,
    padding: theme.spacing[3],
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing[4],
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.error,
  },
  formCard: {
    padding: theme.spacing[4],
    marginBottom: theme.spacing[4],
  },
  gap: {
    height: theme.spacing[4],
  },
  label: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.gray700,
    marginBottom: theme.spacing[2],
  },
  categoryRow: {
    flexDirection: 'row',
    gap: theme.spacing[2],
    paddingBottom: 4,
  },
  categoryBtn: {
    height: 36,
    paddingHorizontal: theme.spacing[3],
  },
  uploadCard: {
    padding: theme.spacing[4],
    borderWidth: 1.5,
    borderColor: theme.colors.gray300,
    borderStyle: 'dashed',
    backgroundColor: theme.colors.gray100,
  },
  uploadTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.gray700,
    marginBottom: theme.spacing[2],
  },
  uploadText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray500,
    lineHeight: 20,
  },
});
