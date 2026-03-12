import { router, useLocalSearchParams } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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
import { api } from '../../../lib/api';
import { theme } from '../../../lib/theme';

interface LicenseEntry {
  key: string;
  state: string;
  expirationDate: string; // MM/YYYY user input
  licenseNumber: string;
}

function makeKey() {
  return String(Date.now()) + String(Math.random());
}

function convertExpDate(mmYYYY: string): string {
  // "MM/YYYY" → "YYYY-MM-01"
  const [mm, yyyy] = mmYYYY.split('/');
  return `${yyyy}-${mm.padStart(2, '0')}-01`;
}

function isValidExpDate(value: string): boolean {
  return /^\d{2}\/\d{4}$/.test(value);
}

export default function LicenseDetailsScreen() {
  const params = useLocalSearchParams<{
    states?: string;
    firstName?: string;
    lastName?: string;
    npi?: string;
    credential?: string;
    specialty?: string;
  }>();

  const initialStates = (params.states ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const [entries, setEntries] = useState<LicenseEntry[]>(() => {
    if (initialStates.length > 0) {
      return initialStates.map((s) => ({
        key: makeKey(),
        state: s,
        expirationDate: '',
        licenseNumber: '',
      }));
    }
    return [{ key: makeKey(), state: '', expirationDate: '', licenseNumber: '' }];
  });

  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState('');

  const updateEntry = (key: string, field: keyof Omit<LicenseEntry, 'key'>, value: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.key === key ? { ...e, [field]: value } : e))
    );
  };

  const removeEntry = (key: string) => {
    setEntries((prev) => prev.filter((e) => e.key !== key));
  };

  const addEntry = () => {
    setEntries((prev) => [
      ...prev,
      { key: makeKey(), state: '', expirationDate: '', licenseNumber: '' },
    ]);
  };

  const handleContinue = async () => {
    setValidationError('');

    const filledEntries = entries.filter((e) => e.state.trim() && e.expirationDate.trim());

    if (filledEntries.length === 0) {
      setValidationError('Please add at least one license with an expiration date.');
      return;
    }

    const invalidDate = filledEntries.find((e) => !isValidExpDate(e.expirationDate));
    if (invalidDate) {
      setValidationError(`Invalid date format for ${invalidDate.state || 'a license'}. Use MM/YYYY.`);
      return;
    }

    setSaving(true);

    await Promise.allSettled(
      filledEntries.map((e) =>
        api.licenses.create({
          state: e.state.trim().toUpperCase(),
          expirationDate: convertExpDate(e.expirationDate),
          licenseNumber: e.licenseNumber.trim() || undefined,
        })
      )
    );

    setSaving(false);

    router.push('/(app)/onboarding/complete' as any);
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
          <View style={styles.header}>
            <View style={styles.stepIndicator}>
              <Text style={styles.stepText}>Step 3 of 4</Text>
            </View>
            <Text style={styles.title}>Your Medical Licenses</Text>
            <Text style={styles.subtitle}>
              Add your license details for each state
            </Text>
          </View>

          {entries.map((entry) => (
            <View key={entry.key} style={styles.licenseRow}>
              <View style={styles.rowHeader}>
                <View style={styles.stateContainer}>
                  {entry.state && !initialStates.includes(entry.state) ? null : null}
                  {initialStates.includes(entry.state) ? (
                    <View style={styles.stateBadge}>
                      <Text style={styles.stateBadgeText}>{entry.state}</Text>
                    </View>
                  ) : (
                    <TextInput
                      style={styles.stateInput}
                      placeholder="ST"
                      value={entry.state}
                      onChangeText={(v) =>
                        updateEntry(entry.key, 'state', v.toUpperCase().slice(0, 2))
                      }
                      autoCapitalize="characters"
                      maxLength={2}
                    />
                  )}
                </View>
                <TouchableOpacity
                  style={styles.trashButton}
                  onPress={() => removeEntry(entry.key)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={16} color={theme.colors.error} />
                </TouchableOpacity>
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Expiration Date</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="MM/YYYY"
                  value={entry.expirationDate}
                  onChangeText={(v) => updateEntry(entry.key, 'expirationDate', v)}
                  keyboardType="numbers-and-punctuation"
                  maxLength={7}
                />
              </View>

              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabelSecondary}>License Number</Text>
                <TextInput
                  style={styles.fieldInputSecondary}
                  placeholder="Optional"
                  value={entry.licenseNumber}
                  onChangeText={(v) => updateEntry(entry.key, 'licenseNumber', v)}
                  autoCapitalize="none"
                />
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addEntry}>
            <Text style={styles.addButtonText}>+ Add Another State</Text>
          </TouchableOpacity>

          {validationError ? (
            <Text style={styles.errorText}>{validationError}</Text>
          ) : null}

          <View style={styles.buttonContainer}>
            <Button
              title={saving ? 'Saving...' : 'Continue'}
              onPress={handleContinue}
              loading={saving}
              disabled={saving}
              fullWidth
            />
          </View>
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
    flexGrow: 1,
    paddingHorizontal: theme.spacing[6],
    paddingBottom: theme.spacing[8],
    paddingTop: theme.spacing[6],
  },
  header: {
    marginBottom: theme.spacing[6],
  },
  stepIndicator: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.gray100,
    paddingVertical: 4,
    paddingHorizontal: theme.spacing[3],
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing[3],
  },
  stepText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray500,
    fontWeight: theme.fontWeight.medium,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plumDark,
    marginBottom: theme.spacing[1],
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray500,
    lineHeight: 22,
  },
  licenseRow: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[3],
    borderWidth: 1,
    borderColor: theme.colors.gray300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[3],
  },
  stateContainer: {},
  stateBadge: {
    backgroundColor: theme.colors.plum,
    paddingVertical: 4,
    paddingHorizontal: theme.spacing[3],
    borderRadius: theme.borderRadius.full,
  },
  stateBadgeText: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.sm,
  },
  stateInput: {
    width: 56,
    height: 36,
    borderWidth: 1.5,
    borderColor: theme.colors.gray300,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing[2],
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plumDark,
    textAlign: 'center',
    backgroundColor: theme.colors.background,
  },
  trashButton: {
    padding: theme.spacing[1],
  },
  fieldRow: {
    marginBottom: theme.spacing[2],
  },
  fieldLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.gray700,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: {
    height: 44,
    borderWidth: 1.5,
    borderColor: theme.colors.gray300,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing[3],
    fontSize: theme.fontSize.md,
    color: theme.colors.plumDark,
    backgroundColor: theme.colors.background,
  },
  fieldLabelSecondary: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.gray500,
    marginBottom: 4,
  },
  fieldInputSecondary: {
    height: 38,
    borderWidth: 1,
    borderColor: theme.colors.gray300,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing[3],
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray700,
    backgroundColor: theme.colors.background,
  },
  addButton: {
    borderWidth: 1.5,
    borderColor: theme.colors.plum,
    borderStyle: 'dashed',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing[3],
    alignItems: 'center',
    marginBottom: theme.spacing[5],
    backgroundColor: 'transparent',
  },
  addButtonText: {
    color: theme.colors.plum,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.sm,
    marginBottom: theme.spacing[3],
    padding: theme.spacing[3],
    backgroundColor: '#FDECEA',
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.error,
  },
  buttonContainer: {
    marginTop: theme.spacing[2],
  },
});
