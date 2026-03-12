import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Pencil, Trash2 } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
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
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { api } from '../../lib/api';
import { theme } from '../../lib/theme';
import { UserLicense } from '../../lib/types';

const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas',
  CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
  DC: 'D.C.', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii',
  ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine',
  MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska',
  NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico',
  NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island',
  SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas',
  UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

function getLicenseColor(months: number): string {
  if (months < 3) return theme.colors.error;
  if (months < 6) return '#F59E0B';
  return theme.colors.success;
}

interface EditState {
  licenseId: string;
  state: string;
  expirationDate: string; // MM/YYYY
  licenseNumber: string;
}

function toDisplayDate(isoDate: string): string {
  // "YYYY-MM-DD" → "MM/YYYY"
  const d = new Date(isoDate);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function fromDisplayDate(mmYYYY: string): string {
  // "MM/YYYY" → "YYYY-MM-01"
  const [mm, yyyy] = mmYYYY.split('/');
  return `${yyyy}-${mm.padStart(2, '0')}-01`;
}

export default function ManageLicensesScreen() {
  const [licenses, setLicenses] = useState<UserLicense[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editState, setEditState] = useState<EditState | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  // Add form state
  const [showAdd, setShowAdd] = useState(false);
  const [addState, setAddState] = useState('');
  const [addExpDate, setAddExpDate] = useState('');
  const [addLicenseNum, setAddLicenseNum] = useState('');
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState('');

  const fetchLicenses = useCallback(async () => {
    setLoading(true);
    const { data } = await api.licenses.list();
    setLicenses(data ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchLicenses();
    }, [fetchLicenses])
  );

  const handleDelete = (lic: UserLicense) => {
    Alert.alert(
      'Delete License',
      `Remove ${lic.state} license?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await api.licenses.remove(lic.id);
            fetchLicenses();
          },
        },
      ]
    );
  };

  const startEdit = (lic: UserLicense) => {
    setEditState({
      licenseId: lic.id,
      state: lic.state,
      expirationDate: toDisplayDate(lic.expirationDate),
      licenseNumber: lic.licenseNumber ?? '',
    });
  };

  const cancelEdit = () => setEditState(null);

  const saveEdit = async () => {
    if (!editState) return;
    if (!/^\d{2}\/\d{4}$/.test(editState.expirationDate)) {
      Alert.alert('Invalid Date', 'Please use MM/YYYY format.');
      return;
    }
    setEditSaving(true);
    await api.licenses.update(editState.licenseId, {
      state: editState.state.toUpperCase(),
      expirationDate: fromDisplayDate(editState.expirationDate),
      licenseNumber: editState.licenseNumber || undefined,
    });
    setEditSaving(false);
    setEditState(null);
    fetchLicenses();
  };

  const handleAdd = async () => {
    setAddError('');
    if (!addState.trim() || !addExpDate.trim()) {
      setAddError('State and expiration date are required.');
      return;
    }
    if (!/^\d{2}\/\d{4}$/.test(addExpDate)) {
      setAddError('Use MM/YYYY format for expiration date.');
      return;
    }
    setAddSaving(true);
    const { error } = await api.licenses.create({
      state: addState.trim().toUpperCase(),
      expirationDate: fromDisplayDate(addExpDate),
      licenseNumber: addLicenseNum.trim() || undefined,
    });
    setAddSaving(false);
    if (error) {
      setAddError(error);
      return;
    }
    setShowAdd(false);
    setAddState('');
    setAddExpDate('');
    setAddLicenseNum('');
    fetchLicenses();
  };

  const today = new Date();

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Licenses</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <Card style={styles.loadingCard}>
              <Text style={styles.loadingText}>Loading licenses...</Text>
            </Card>
          ) : licenses.length === 0 && !showAdd ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No licenses added yet.</Text>
              <Text style={styles.emptySubtext}>
                Tap "Add License" below to get started.
              </Text>
            </Card>
          ) : (
            licenses.map((lic) => {
              const expDate = new Date(lic.expirationDate);
              const months =
                (expDate.getFullYear() - today.getFullYear()) * 12 +
                (expDate.getMonth() - today.getMonth());
              const color = getLicenseColor(months);
              const isExpired = months < 0;
              const expLabel = isExpired
                ? 'EXPIRED'
                : `Expires ${String(expDate.getMonth() + 1).padStart(2, '0')}/${expDate.getFullYear()}`;

              const isEditing = editState?.licenseId === lic.id;

              return (
                <Card key={lic.id} style={styles.licenseCard}>
                  {isEditing && editState ? (
                    // Edit mode
                    <View>
                      <View style={styles.editHeader}>
                        <View style={styles.stateBadge}>
                          <Text style={styles.stateBadgeText}>{editState.state}</Text>
                        </View>
                        <Text style={styles.editingLabel}>Editing</Text>
                      </View>

                      <Text style={styles.inputLabel}>Expiration Date (MM/YYYY)</Text>
                      <TextInput
                        style={styles.textInput}
                        value={editState.expirationDate}
                        onChangeText={(v) =>
                          setEditState({ ...editState, expirationDate: v })
                        }
                        placeholder="MM/YYYY"
                        keyboardType="numbers-and-punctuation"
                        maxLength={7}
                      />

                      <Text style={styles.inputLabel}>License Number (Optional)</Text>
                      <TextInput
                        style={styles.textInput}
                        value={editState.licenseNumber}
                        onChangeText={(v) =>
                          setEditState({ ...editState, licenseNumber: v })
                        }
                        placeholder="Optional"
                        autoCapitalize="none"
                      />

                      <View style={styles.editActions}>
                        <TouchableOpacity
                          style={styles.cancelBtn}
                          onPress={cancelEdit}
                        >
                          <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.saveBtn, editSaving && styles.saveBtnDisabled]}
                          onPress={saveEdit}
                          disabled={editSaving}
                        >
                          <Text style={styles.saveBtnText}>
                            {editSaving ? 'Saving...' : 'Save'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    // View mode
                    <View style={styles.licenseViewRow}>
                      <View style={styles.licenseInfo}>
                        <View style={styles.licenseTopRow}>
                          <Text style={styles.stateAbbr}>{lic.state}</Text>
                          <Text style={styles.stateName}>
                            {STATE_NAMES[lic.state] ?? lic.state}
                          </Text>
                        </View>
                        <View style={styles.expRow}>
                          {isExpired ? (
                            <View style={styles.expiredBadge}>
                              <Text style={styles.expiredBadgeText}>EXPIRED</Text>
                            </View>
                          ) : (
                            <Text style={[styles.expText, { color }]}>{expLabel}</Text>
                          )}
                        </View>
                        {lic.licenseNumber ? (
                          <Text style={styles.licenseNumText}>
                            #{lic.licenseNumber}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.licenseActions}>
                        <TouchableOpacity
                          style={styles.iconBtn}
                          onPress={() => startEdit(lic)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Pencil size={16} color={theme.colors.plum} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.iconBtn}
                          onPress={() => handleDelete(lic)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Trash2 size={16} color={theme.colors.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </Card>
              );
            })
          )}

          {/* Add form */}
          {showAdd && (
            <Card style={styles.addCard}>
              <Text style={styles.addCardTitle}>Add License</Text>

              <Text style={styles.inputLabel}>State (2-letter)</Text>
              <TextInput
                style={styles.textInput}
                value={addState}
                onChangeText={(v) => setAddState(v.toUpperCase().slice(0, 2))}
                placeholder="e.g. CA"
                autoCapitalize="characters"
                maxLength={2}
              />

              <Text style={styles.inputLabel}>Expiration Date (MM/YYYY)</Text>
              <TextInput
                style={styles.textInput}
                value={addExpDate}
                onChangeText={setAddExpDate}
                placeholder="MM/YYYY"
                keyboardType="numbers-and-punctuation"
                maxLength={7}
              />

              <Text style={styles.inputLabel}>License Number (Optional)</Text>
              <TextInput
                style={styles.textInput}
                value={addLicenseNum}
                onChangeText={setAddLicenseNum}
                placeholder="Optional"
                autoCapitalize="none"
              />

              {addError ? (
                <Text style={styles.addErrorText}>{addError}</Text>
              ) : null}

              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setShowAdd(false);
                    setAddError('');
                    setAddState('');
                    setAddExpDate('');
                    setAddLicenseNum('');
                  }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, addSaving && styles.saveBtnDisabled]}
                  onPress={handleAdd}
                  disabled={addSaving}
                >
                  <Text style={styles.saveBtnText}>
                    {addSaving ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}

          {/* Add License button */}
          {!showAdd && (
            <Button
              title="Add License"
              onPress={() => setShowAdd(true)}
              fullWidth
              style={styles.addLicenseBtn}
            />
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[3],
    paddingBottom: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray100,
    backgroundColor: theme.colors.background,
  },
  backBtn: {
    paddingVertical: theme.spacing[1],
    paddingRight: theme.spacing[3],
  },
  backBtnText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.plum,
    fontWeight: theme.fontWeight.medium,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plumDark,
  },
  headerSpacer: {
    width: 60,
  },
  scroll: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[10],
  },
  loadingCard: {
    alignItems: 'center',
    padding: theme.spacing[6],
  },
  loadingText: {
    color: theme.colors.gray500,
    fontSize: theme.fontSize.md,
  },
  emptyCard: {
    alignItems: 'center',
    padding: theme.spacing[6],
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.plumDark,
    marginBottom: theme.spacing[1],
  },
  emptySubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray500,
    textAlign: 'center',
  },
  licenseCard: {
    marginBottom: theme.spacing[3],
  },
  licenseViewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  licenseInfo: {
    flex: 1,
  },
  licenseTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
    marginBottom: 4,
  },
  stateAbbr: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plum,
  },
  stateName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray500,
  },
  expRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  expText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
  },
  expiredBadge: {
    backgroundColor: theme.colors.error,
    paddingVertical: 2,
    paddingHorizontal: theme.spacing[2],
    borderRadius: theme.borderRadius.sm,
  },
  expiredBadgeText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  licenseNumText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray500,
    marginTop: 2,
  },
  licenseActions: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    paddingLeft: theme.spacing[3],
    paddingTop: 2,
  },
  iconBtn: {
    padding: theme.spacing[1],
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
    marginBottom: theme.spacing[3],
  },
  stateBadge: {
    backgroundColor: theme.colors.plum,
    paddingVertical: 3,
    paddingHorizontal: theme.spacing[3],
    borderRadius: theme.borderRadius.full,
  },
  stateBadgeText: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.sm,
  },
  editingLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray500,
    fontStyle: 'italic',
  },
  inputLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.gray700,
    marginBottom: 4,
    marginTop: theme.spacing[2],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    height: 44,
    borderWidth: 1.5,
    borderColor: theme.colors.gray300,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing[3],
    fontSize: theme.fontSize.md,
    color: theme.colors.plumDark,
    backgroundColor: theme.colors.background,
  },
  editActions: {
    flexDirection: 'row',
    gap: theme.spacing[3],
    marginTop: theme.spacing[4],
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderWidth: 1.5,
    borderColor: theme.colors.gray300,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.gray700,
  },
  saveBtn: {
    flex: 1,
    height: 44,
    backgroundColor: theme.colors.plum,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
  addCard: {
    marginBottom: theme.spacing[4],
  },
  addCardTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plumDark,
    marginBottom: theme.spacing[2],
  },
  addErrorText: {
    color: theme.colors.error,
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing[2],
  },
  addLicenseBtn: {
    marginTop: theme.spacing[2],
  },
});
