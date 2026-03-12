import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { ChevronLeft, Pencil, ShieldCheck, Trash2 } from 'lucide-react-native';
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

function getLicenseBgColor(months: number): string {
  if (months < 3) return '#FEF2F2';
  if (months < 6) return '#FFFBEB';
  return '#F0FDF4';
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
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={20} color={theme.colors.plumDark} />
            <Text style={styles.backBtnText}>My Licenses</Text>
          </TouchableOpacity>
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
            /* ── Empty state ── */
            <Card style={styles.emptyCard}>
              <ShieldCheck size={48} color={theme.colors.gray300} />
              <Text style={styles.emptyText}>No licenses yet</Text>
              <Text style={styles.emptySubtext}>
                Add your medical licenses to track renewal deadlines
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => setShowAdd(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.emptyAddBtnText}>Add License</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            licenses.map((lic) => {
              const expDate = new Date(lic.expirationDate);
              const months =
                (expDate.getFullYear() - today.getFullYear()) * 12 +
                (expDate.getMonth() - today.getMonth());
              const color = getLicenseColor(months);
              const bgColor = getLicenseBgColor(months);
              const isExpired = months < 0;
              const expLabel = isExpired
                ? 'EXPIRED'
                : `Expires ${String(expDate.getMonth() + 1).padStart(2, '0')}/${expDate.getFullYear()}`;

              const isEditing = editState?.licenseId === lic.id;

              return (
                <View
                  key={lic.id}
                  style={[
                    styles.licenseCardOuter,
                    {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.07,
                      shadowRadius: 6,
                      elevation: 2,
                    },
                  ]}
                >
                  {isEditing && editState ? (
                    /* ── Edit mode ── */
                    <View style={styles.licenseCardInner}>
                      {/* Left accent bar */}
                      <View style={[styles.accentBar, { backgroundColor: color }]} />
                      <View style={styles.licenseCardContent}>
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
                    </View>
                  ) : (
                    /* ── View mode ── */
                    <View style={styles.licenseCardInner}>
                      {/* Left accent bar */}
                      <View style={[styles.accentBar, { backgroundColor: color }]} />
                      <View style={styles.licenseCardContent}>
                        <View style={styles.licenseViewRow}>
                          {/* Left: state */}
                          <View style={styles.licenseLeft}>
                            <Text style={styles.stateAbbr}>{lic.state}</Text>
                            <Text style={styles.stateName}>
                              {STATE_NAMES[lic.state] ?? lic.state}
                            </Text>
                          </View>
                          {/* Right: expiry badge + license number */}
                          <View style={styles.licenseRight}>
                            {isExpired ? (
                              <View style={[styles.expBadge, { backgroundColor: '#FEF2F2', borderColor: theme.colors.error }]}>
                                <Text style={[styles.expBadgeText, { color: theme.colors.error }]}>
                                  EXPIRED
                                </Text>
                              </View>
                            ) : (
                              <View style={[styles.expBadge, { backgroundColor: bgColor, borderColor: color }]}>
                                <Text style={[styles.expBadgeText, { color }]}>
                                  {expLabel}
                                </Text>
                              </View>
                            )}
                            {lic.licenseNumber ? (
                              <Text style={styles.licenseNumText}>
                                #{lic.licenseNumber}
                              </Text>
                            ) : null}
                          </View>
                        </View>

                        {/* Bottom action row */}
                        <View style={styles.licenseActionsRow}>
                          <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => startEdit(lic)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Pencil size={14} color={theme.colors.plum} />
                            <Text style={styles.actionBtnTextEdit}>Edit</Text>
                          </TouchableOpacity>
                          <View style={styles.actionDivider} />
                          <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => handleDelete(lic)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Trash2 size={14} color={theme.colors.error} />
                            <Text style={styles.actionBtnTextDelete}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}

          {/* ── Add form card ── */}
          {showAdd && (
            <View
              style={[
                styles.addCardOuter,
                {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 3,
                },
              ]}
            >
              <View style={styles.addCardHeader}>
                <Text style={styles.addCardTitle}>Add New License</Text>
              </View>
              <View style={styles.addCardBody}>
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
              </View>
            </View>
          )}

          {/* ── Add License button ── */}
          {!showAdd && licenses.length > 0 && (
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[3],
    paddingBottom: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray100,
    backgroundColor: theme.colors.background,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: theme.spacing[1],
  },
  backBtnText: {
    fontSize: 18,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plumDark,
  },
  headerSpacer: {
    flex: 1,
  },

  scroll: {
    paddingHorizontal: theme.spacing[6],
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[10],
    gap: theme.spacing[3],
  },

  // Loading
  loadingCard: {
    alignItems: 'center',
    padding: theme.spacing[6],
  },
  loadingText: {
    color: theme.colors.gray500,
    fontSize: theme.fontSize.md,
  },

  // Empty state
  emptyCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing[10],
    paddingHorizontal: theme.spacing[6],
    gap: theme.spacing[3],
  },
  emptyText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.plumDark,
    marginTop: theme.spacing[1],
  },
  emptySubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray500,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyAddBtn: {
    marginTop: theme.spacing[2],
    backgroundColor: theme.colors.plum,
    paddingHorizontal: theme.spacing[6],
    paddingVertical: theme.spacing[3],
    borderRadius: theme.borderRadius.md,
  },
  emptyAddBtnText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
  },

  // License card
  licenseCardOuter: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing[3],
  },
  licenseCardInner: {
    flexDirection: 'row',
  },
  accentBar: {
    width: 4,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderBottomLeftRadius: theme.borderRadius.lg,
  },
  licenseCardContent: {
    flex: 1,
    padding: theme.spacing[4],
  },
  licenseViewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[3],
  },
  licenseLeft: {
    flex: 1,
  },
  stateAbbr: {
    fontSize: 22,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plum,
    lineHeight: 26,
  },
  stateName: {
    fontSize: 12,
    color: theme.colors.gray500,
    marginTop: 2,
  },
  licenseRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  expBadge: {
    paddingVertical: 4,
    paddingHorizontal: theme.spacing[3],
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
  },
  expBadgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
  },
  licenseNumText: {
    fontSize: 11,
    color: theme.colors.gray500,
    fontWeight: theme.fontWeight.regular,
  },

  // License action row
  licenseActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray100,
    paddingTop: theme.spacing[2],
    gap: theme.spacing[3],
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: theme.spacing[1],
  },
  actionBtnTextEdit: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.plum,
  },
  actionBtnTextDelete: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.error,
  },
  actionDivider: {
    width: 1,
    height: 16,
    backgroundColor: theme.colors.gray100,
  },

  // Edit mode inside card
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

  // Add form card
  addCardOuter: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing[4],
  },
  addCardHeader: {
    paddingHorizontal: theme.spacing[4],
    paddingTop: theme.spacing[4],
    paddingBottom: theme.spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray100,
  },
  addCardTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.plumDark,
  },
  addCardBody: {
    padding: theme.spacing[4],
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
