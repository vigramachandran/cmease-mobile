import { Calendar, CheckCircle, FileText } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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
      <View style={styles.categoryGrid}>
        {CATEGORIES.map((cat) => {
          const isSelected = selected === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryPill,
                isSelected ? styles.categoryPillSelected : styles.categoryPillUnselected,
              ]}
              onPress={() => onSelect(cat)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.categoryPillText,
                  isSelected ? styles.categoryPillTextSelected : styles.categoryPillTextUnselected,
                ]}
                numberOfLines={1}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
          {/* Header */}
          <View style={styles.headerBlock}>
            <Text style={styles.title}>Log Credit</Text>
            <Text style={styles.subtitle}>Manually add a CME activity</Text>
          </View>

          {/* Success state */}
          {success && (
            <Card style={styles.successCard}>
              <View style={styles.successCheckCircle}>
                <CheckCircle size={28} color={theme.colors.success} />
              </View>
              <Text style={styles.successTitle}>Credit Saved!</Text>
              <Text style={styles.successMessage}>
                Your CME credit has been recorded successfully.
              </Text>
              <TouchableOpacity
                style={styles.successDismissBtn}
                onPress={() => setSuccess(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.successDismissText}>Log Another</Text>
              </TouchableOpacity>
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

            {/* Credit Hours with inline "hrs" suffix */}
            <View>
              <Text style={styles.label}>Credit Hours</Text>
              <View style={styles.hoursInputWrapper}>
                <Input
                  ref={hoursRef}
                  label=""
                  placeholder="e.g. 1.5"
                  value={hours}
                  onChangeText={setHours}
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                  onSubmitEditing={() => dateRef.current?.focus()}
                  style={styles.hoursInputField}
                />
                <View style={styles.hoursUnit}>
                  <Text style={styles.hoursUnitText}>hrs</Text>
                </View>
              </View>
            </View>

            <View style={styles.gap} />

            {/* Completion Date with calendar icon */}
            <View>
              <Text style={styles.label}>Completion Date</Text>
              <View style={styles.dateInputWrapper}>
                <Input
                  ref={dateRef}
                  label=""
                  placeholder="YYYY-MM-DD"
                  value={completionDate}
                  onChangeText={setCompletionDate}
                  keyboardType="numbers-and-punctuation"
                  returnKeyType="done"
                  style={styles.dateInputField}
                />
                <View style={styles.dateIconOverlay} pointerEvents="none">
                  <Calendar size={16} color={theme.colors.gray500} />
                </View>
              </View>
            </View>

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
            <View style={styles.uploadIconRow}>
              <FileText size={24} color={theme.colors.gray500} />
            </View>
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
  headerBlock: {
    paddingTop: theme.spacing[5],
    marginBottom: theme.spacing[5],
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plumDark,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray500,
    marginTop: 4,
  },
  // Success state
  successCard: {
    backgroundColor: '#E8F5EE',
    padding: theme.spacing[6],
    marginBottom: theme.spacing[4],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C2E6D0',
  },
  successCheckCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D1F0DF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing[3],
  },
  successTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.success,
    marginBottom: 6,
  },
  successMessage: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.success,
    textAlign: 'center',
    marginBottom: theme.spacing[4],
    opacity: 0.85,
  },
  successDismissBtn: {
    backgroundColor: theme.colors.success,
    paddingVertical: theme.spacing[2],
    paddingHorizontal: theme.spacing[6],
    borderRadius: theme.borderRadius.full,
  },
  successDismissText: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.semibold,
    fontSize: theme.fontSize.sm,
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
    padding: theme.spacing[5],
    marginBottom: theme.spacing[4],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
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
  // Hours input
  hoursInputWrapper: {
    position: 'relative',
  },
  hoursInputField: {
    paddingRight: 48,
  },
  hoursUnit: {
    position: 'absolute',
    right: 16,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  hoursUnitText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray500,
    fontWeight: theme.fontWeight.medium,
  },
  // Date input
  dateInputWrapper: {
    position: 'relative',
  },
  dateInputField: {
    paddingRight: 48,
  },
  dateIconOverlay: {
    position: 'absolute',
    right: 16,
    top: 46,
    bottom: 0,
    justifyContent: 'center',
  },
  // Category grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing[2],
  },
  categoryPill: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPillSelected: {
    backgroundColor: theme.colors.plum,
  },
  categoryPillUnselected: {
    backgroundColor: theme.colors.gray100,
  },
  categoryPillText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  categoryPillTextSelected: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.semibold,
  },
  categoryPillTextUnselected: {
    color: theme.colors.gray700,
  },
  // Upload card
  uploadCard: {
    padding: theme.spacing[4],
    borderWidth: 1.5,
    borderColor: theme.colors.gray300,
    borderStyle: 'dashed',
    backgroundColor: theme.colors.gray100,
    alignItems: 'center',
  },
  uploadIconRow: {
    marginBottom: theme.spacing[2],
  },
  uploadTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.gray700,
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },
  uploadText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray500,
    lineHeight: 20,
    textAlign: 'center',
  },
});
