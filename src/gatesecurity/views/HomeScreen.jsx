import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, TextInput,
  KeyboardAvoidingView, Platform, RefreshControl, ActivityIndicator, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { COLORS, FONTS } from '../../common/config/theme';
import { Car, Phone, FileText, Clock, AlertTriangle, X } from 'lucide-react-native';
import { retrieveEncryptedData, getInitials } from '../../common/config/storage';
import { showToast } from '../../common/utils/toast';
import axios from 'axios';
import { check_vehicle, base_url, submit_entry, exit } from '../../common/config/constant';

function formatApiDate(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    return '';
  }
}

function formatApiTime(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch (e) {
    return '';
  }
}

export default function HomeScreen({ navigation }) {
  const [now, setNow] = useState(new Date());
  const isFocused = useIsFocused();

  const [currentName, setCurrentName] = useState('');
  const initials = getInitials(currentName);

  const [searchVehicle, setSearchVehicle] = useState('');
  const [verifiedVehicle, setVerifiedVehicle] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [isNewUser, setIsNewUser] = useState(true);
  const [nextAction, setNextAction] = useState('CREATE_ENTRY');

  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [entryType, setEntryType] = useState('Service');
  const [remarks, setRemarks] = useState('');
  const [activeGateEntry, setActiveGateEntry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exitModalVisible, setExitModalVisible] = useState(false);
  const [exitDateTimeStr, setExitDateTimeStr] = useState('');
  const [searchVehicleError, setSearchVehicleError] = useState('');
  const [whatsappNumberError, setWhatsappNumberError] = useState('');

  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const userStr = await retrieveEncryptedData('user');
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          if (userObj?.fullName) {
            setCurrentName(userObj.fullName);
            return;
          }
        } catch (e) {
          console.error('Failed to parse user object:', e);
        }
      }
      const name = await retrieveEncryptedData('fullName');
      setCurrentName(name);
    } catch (error) {
      console.error('Failed to load home data:', error);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const handleSearchVehicle = async () => {
    setSearchVehicleError('');
    const cleanVehicle = searchVehicle.replace(/\s+/g, '').toUpperCase();
    if (!cleanVehicle) {
      setSearchVehicleError('Vehicle registration number is required');
      return;
    }

    const vehicleRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{0,3}[0-9]{1,4}$/;

    if (!vehicleRegex.test(cleanVehicle)) {
      setSearchVehicleError('Invalid vehicle number format. E.g. TN58AB1234');
      return;
    }

    setVerifiedVehicle(cleanVehicle);
    setLoading(true);
    try {
      const token = await retrieveEncryptedData('token');
      const response = await axios.get(`${base_url}${check_vehicle}?registrationNumber=${cleanVehicle}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = response.data;

      if (result.success && result.data) {
        const vehicleData = result.data;
        const apiNextAction = vehicleData.nextAction || 'CREATE_ENTRY';
        setNextAction(apiNextAction);

        const isExist = !!vehicleData.isExistingVehicle;
        setIsNewUser(!isExist);

        const mobile = vehicleData.customer?.mobileNo || vehicleData.whatsappNumber || '';
        setWhatsappNumber(mobile);

        const activeEntry = vehicleData.activeGateEntry || null;
        setActiveGateEntry(activeEntry);

        if (apiNextAction === 'EXIT') {
          const type = activeEntry?.entryType || vehicleData.entryType || 'Service';
          const capitalizedType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
          setEntryType(capitalizedType);
          setRemarks(activeEntry?.remarks || vehicleData.remarks || '');
          setFormVisible(true);
          showToast('Active entry found. Ready for exit.');
        } else {
          setEntryType('Service');
          setRemarks('');
          setFormVisible(true);
          if (isExist) {
            showToast('Existing vehicle. Please fill in entry details.');
          } else {
            showToast('New vehicle. Please fill in entry details.');
          }
        }
      } else {
        setIsNewUser(true);
        setNextAction('CREATE_ENTRY');
        setWhatsappNumber('');
        setEntryType('Service');
        setRemarks('');
        setActiveGateEntry(null);
        setFormVisible(true);
        showToast('New vehicle. Please fill in entry details.');
      }
    } catch (error) {
      console.error('Check vehicle API error:', error);
      setIsNewUser(true);
      setNextAction('CREATE_ENTRY');
      setWhatsappNumber('');
      setEntryType('Service');
      setRemarks('');
      setActiveGateEntry(null);
      setFormVisible(true);
      showToast('Check vehicle failed or not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEntry = async () => {
    setWhatsappNumberError('');
    const trimmedPhone = whatsappNumber.trim();
    if (!trimmedPhone) {
      setWhatsappNumberError('WhatsApp number is required');
      return;
    }

    if (/^[0-5]/.test(trimmedPhone)) {
      setWhatsappNumberError('Invalid phone number');
      return;
    }

    setLoading(true);
    try {
      const token = await retrieveEncryptedData('token');
      const response = await axios.post(`${base_url}${submit_entry}`, {
        registrationNumber: verifiedVehicle,
        whatsappNumber: whatsappNumber.trim(),
        entryType: entryType.toLowerCase(),
        remarks: remarks.trim(),
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 200 || response.status === 201 || response.data?.success) {
        showToast(`Entry registered successfully for vehicle ${verifiedVehicle}`);
      } else {
        showToast(response.data?.message || 'Failed to submit entry.');
      }
    } catch (error) {
      showToast('Failed to submit entry.');
      console.error('Submit Entry API error:', error);
    } finally {
      setLoading(false);
    }

    setSearchVehicle('');
    setVerifiedVehicle('');
    setWhatsappNumber('');
    setFormVisible(false);
    setNextAction('CREATE_ENTRY');
  };

  const executeExitApi = async () => {
    setLoading(true);
    try {
      const token = await retrieveEncryptedData('token');
      let gateEntryId = activeGateEntry?.id;

      if (!gateEntryId) {
        showToast('No active gate entry found to exit.');
        return;
      }

      const response = await axios.put(`${base_url}${exit}/${gateEntryId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 200 || response.status === 201 || response.data?.success) {
        showToast(`Exit registered successfully for vehicle ${verifiedVehicle}`);
      } else {
        showToast(response.data?.message || 'Failed to submit exit.');
      }
    } catch (error) {
      showToast('Failed to submit exit.');
      console.error('Submit Exit API error:', error);
    } finally {
      setLoading(false);
      setExitModalVisible(false);
    }

    setSearchVehicle('');
    setVerifiedVehicle('');
    setWhatsappNumber('');
    setFormVisible(false);
    setActiveGateEntry(null);
    setNextAction('CREATE_ENTRY');
  };

  const handleSubmitExit = () => {
    const exitDateObj = new Date();
    const dateOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    const dateString = exitDateObj.toLocaleDateString('en-GB', dateOptions);
    const timeString = exitDateObj.toLocaleTimeString('en-GB', timeOptions);
    setExitDateTimeStr(`${dateString} • ${timeString}`);
    setExitModalVisible(true);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      {isFocused && <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
            />
          }
        >

          <View style={s.header}>
            <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.welcome}>On Duty,</Text>
              <Text style={s.staffName}>
                {currentName ? currentName.charAt(0).toUpperCase() + currentName.slice(1) : ''}
              </Text>
            </View>
          </View>
          <View style={s.sectionHeader}>
            <Car size={16} color={COLORS.secondary} strokeWidth={2.5} />
            <Text style={s.sectionTitle}>Get Vehicle Number</Text>
          </View>

          <View style={s.searchCard}>
            <Text style={s.searchCardLabel}>VEHICLE REGISTRATION NUMBER</Text>
            <View style={s.phoneInputRow}>
              <View style={s.phoneInputWrapper}>
                <Car size={18} color={COLORS.muted} style={s.phoneIcon} />
                <TextInput
                  style={s.phoneInput}
                  placeholder="e.g. TN58AB1234"
                  placeholderTextColor={COLORS.muted}
                  autoCapitalize="characters"
                  maxLength={10}
                  value={searchVehicle}
                  onChangeText={(text) => {
                    setSearchVehicle(text);
                    setSearchVehicleError('');
                    if (formVisible && text.toUpperCase() !== verifiedVehicle) {
                      setFormVisible(false);
                      setNextAction('CREATE_ENTRY');
                    }
                  }}
                />
                {searchVehicle.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchVehicle('');
                      setSearchVehicleError('');
                      if (formVisible) {
                        setFormVisible(false);
                        setNextAction('CREATE_ENTRY');
                      }
                    }}
                    style={s.clearInputBtn}
                    activeOpacity={0.7}
                  >
                    <X size={12} color="#64748B" />
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity style={s.verifyBtn} onPress={handleSearchVehicle} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={s.verifyBtnText}>SUBMIT</Text>
                )}
              </TouchableOpacity>
            </View>
            {searchVehicleError ? (
              <Text style={s.errorText}>{searchVehicleError}</Text>
            ) : null}
          </View>

          {formVisible && (
            <View style={s.formCard}>
              <View style={s.formHeader}>
                <Text style={s.formTitle}>
                  {nextAction === 'CREATE_ENTRY'
                    ? (isNewUser ? `NEW REGISTRATION\n(${verifiedVehicle})` : `CREATE ENTRY\n(${verifiedVehicle})`)
                    : `VEHICLE PROFILE\n(${verifiedVehicle})`}
                </Text>
                <View style={[s.badge, {
                  backgroundColor: nextAction === 'CREATE_ENTRY'
                    ? (isNewUser ? '#DCFCE7' : '#EFF6FF')
                    : '#FEF3C7'
                }]}>
                  <Text style={[s.badgeText, {
                    color: nextAction === 'CREATE_ENTRY'
                      ? (isNewUser ? '#15803D' : '#2563EB')
                      : '#D97706'
                  }]}>
                    {nextAction === 'CREATE_ENTRY'
                      ? (isNewUser ? 'NEW USER' : 'ACTIVE USER')
                      : 'ACTIVE VISITOR'}
                  </Text>
                </View>
              </View>

              {nextAction === 'CREATE_ENTRY' ? (
                <View style={s.formFields}>
                  <View style={s.dtRow}>
                    <View style={s.dtItem}>
                      <Text style={s.dtLabel}>Today Date</Text>
                      <Text style={s.dtValue}>
                        {now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    <View style={s.dtDivider} />
                    <View style={s.dtItem}>
                      <Text style={s.dtLabel}>Today Time</Text>
                      <Text style={[s.dtValue, { color: COLORS.primary }]}>
                        {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </Text>
                    </View>
                  </View>

                  <Text style={s.fieldLabel}>WhatsApp Number <Text style={{ color: '#EF4444' }}>*</Text></Text>
                  <View style={[s.inputContainer, whatsappNumberError ? s.inputContainerError : s.inputContainerMargin]}>
                    <Phone size={16} color={COLORS.primary} style={s.inputIcon} />
                    <TextInput
                      style={s.textInputStyle}
                      value={whatsappNumber}
                      onChangeText={(text) => {
                        setWhatsappNumber(text);
                        setWhatsappNumberError('');
                      }}
                      placeholder="Enter WhatsApp number"
                      placeholderTextColor={COLORS.muted}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>
                  {whatsappNumberError ? (
                    <Text style={s.errorTextBelow}>{whatsappNumberError}</Text>
                  ) : null}

                  <Text style={s.fieldLabel}>Entry Type</Text>
                  <View style={s.typeSelectorRow}>
                    {['Service', 'Enquiry'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[s.typeChip, entryType === type && s.typeChipActive]}
                        onPress={() => setEntryType(type)}
                      >
                        <Text style={[s.typeChipText, entryType === type && s.typeChipTextActive]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={s.fieldLabel}>Remarks (Optional)</Text>
                  <View style={[s.inputContainer, { marginBottom: 18 }]}>
                    <FileText size={16} color={COLORS.primary} style={s.inputIcon} />
                    <TextInput
                      style={s.textInputStyle}
                      value={remarks}
                      onChangeText={setRemarks}
                      placeholder="Any specific comments"
                      placeholderTextColor={COLORS.muted}
                    />
                  </View>

                  <TouchableOpacity style={[s.submitBtn, loading && { opacity: 0.8 }]} onPress={handleSubmitEntry} disabled={loading}>
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={s.submitBtnText}>SUBMIT ENTRY</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={s.formFields}>
                  <Text style={s.fieldLabel}>WhatsApp Number</Text>
                  <View style={s.nonEditableContainer}>
                    <Phone size={16} color={COLORS.muted} style={s.inputIcon} />
                    <Text style={s.nonEditableText}>{whatsappNumber}</Text>
                  </View>

                  <Text style={s.fieldLabel}>Entry Type</Text>
                  <View style={s.nonEditableContainer}>
                    <Text style={s.nonEditableText}>{entryType}</Text>
                  </View>

                  <Text style={s.fieldLabel}>Remarks</Text>
                  <View style={s.nonEditableContainer}>
                    <FileText size={16} color={COLORS.muted} style={s.inputIcon} />
                    <Text style={s.nonEditableText}>{remarks || 'No remarks provided'}</Text>
                  </View>

                  <View style={s.dtRow}>
                    <View style={s.dtItem}>
                      <Text style={s.dtLabel}>Entry Date</Text>
                      <Text style={s.dtValue}>
                        {activeGateEntry?.entryTime ? formatApiDate(activeGateEntry.entryTime) : 'N/A'}
                      </Text>
                    </View>
                    <View style={s.dtDivider} />
                    <View style={s.dtItem}>
                      <Text style={s.dtLabel}>Entry Time</Text>
                      <Text style={[s.dtValue, { color: COLORS.primary }]}>
                        {activeGateEntry?.entryTime ? formatApiTime(activeGateEntry.entryTime) : 'N/A'}
                      </Text>
                    </View>
                  </View>

                  <View style={[s.dtRow, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
                    <View style={s.dtItem}>
                      <Text style={[s.dtLabel, { color: '#B91C1C' }]}>Exit Date</Text>
                      <Text style={s.dtValue}>
                        {now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    <View style={[s.dtDivider, { backgroundColor: '#FCA5A5' }]} />
                    <View style={s.dtItem}>
                      <Text style={[s.dtLabel, { color: '#B91C1C' }]}>Exit Time</Text>
                      <Text style={[s.dtValue, { color: '#EF4444' }]}>
                        {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity style={[s.submitBtn, { backgroundColor: '#EF4444' }, loading && { opacity: 0.8 }]} onPress={handleSubmitExit} disabled={loading}>
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={s.submitBtnText}>SUBMIT EXIT</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={exitModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!loading) {
            setExitModalVisible(false);
          }
        }}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <AlertTriangle size={20} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={s.modalTitle}>Confirm Vehicle Exit</Text>
            </View>

            <Text style={s.modalSubtitle}>Are you sure you want to register exit for this vehicle?</Text>

            <View style={s.modalVehiclePlate}>
              <Car size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={s.modalVehiclePlateText}>{verifiedVehicle || activeGateEntry?.vehicleNo || 'Unknown'}</Text>
            </View>

            <View style={s.modalTimeRow}>
              <Clock size={16} color={COLORS.muted} style={{ marginRight: 8 }} />
              <Text style={s.modalTimeText}>{exitDateTimeStr}</Text>
            </View>

            <View style={s.modalButtons}>
              <TouchableOpacity
                style={[s.modalButton, s.cancelButton]}
                onPress={() => setExitModalVisible(false)}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={s.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalButton, s.confirmButton, loading && { opacity: 0.8 }]}
                onPress={executeExitApi}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={s.confirmButtonText}>Exit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 120 },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 16 },
  welcome: { color: COLORS.muted, fontSize: 12, fontFamily: FONTS.inter },
  staffName: { color: COLORS.secondary, fontSize: 18, fontFamily: FONTS.inter },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { color: COLORS.secondary, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: FONTS.inter },

  searchCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  searchCardLabel: { color: COLORS.muted, fontSize: 11, fontFamily: FONTS.inter, letterSpacing: 0.5, marginBottom: 8 },
  phoneInputRow: { flexDirection: 'row', gap: 10 },
  phoneInputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, backgroundColor: COLORS.background, paddingHorizontal: 12 },
  phoneIcon: { marginRight: 8 },
  phoneInput: { flex: 1, fontSize: 15, color: COLORS.secondary, fontFamily: FONTS.inter, paddingVertical: 8 },
  verifyBtn: { backgroundColor: COLORS.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  verifyBtnText: { color: '#fff', fontSize: 13, fontFamily: FONTS.inter, letterSpacing: 0.5 },

  formCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: COLORS.border, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 6, marginBottom: 20 },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 12, marginBottom: 16 },
  formTitle: { color: COLORS.secondary, fontSize: 13, fontFamily: FONTS.inter, letterSpacing: 0.5 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 10, fontFamily: FONTS.inter },
  formFields: { gap: 12 },

  fieldLabel: { color: COLORS.muted, fontSize: 11, fontFamily: FONTS.inter, marginBottom: 2 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, backgroundColor: COLORS.background, paddingHorizontal: 12 },
  inputIcon: { marginRight: 10 },
  textInputStyle: { flex: 1, color: COLORS.secondary, fontSize: 14, fontFamily: FONTS.inter, paddingVertical: 9 },

  typeSelectorRow: { flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 12 },
  typeChip: { flex: 1, paddingVertical: 9, borderRadius: 10, backgroundColor: COLORS.background, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center' },
  typeChipActive: { backgroundColor: '#EFF6FF', borderColor: COLORS.primary },
  typeChipText: { fontSize: 12, color: COLORS.muted, fontFamily: FONTS.inter },
  typeChipTextActive: { color: COLORS.primary, fontFamily: FONTS.inter },

  dtRow: { flexDirection: 'row', backgroundColor: '#F0F9FF', borderRadius: 12, padding: 12, borderHeight: 1, borderColor: '#BAE6FD', borderWidth: 1, marginBottom: 12 },
  dtItem: { flex: 1, alignItems: 'center' },
  dtDivider: { width: 1, backgroundColor: '#BAE6FD' },
  dtLabel: { color: '#0369A1', fontSize: 10, fontFamily: FONTS.inter, marginBottom: 2 },
  dtValue: { color: COLORS.secondary, fontSize: 13, fontFamily: FONTS.inter },

  nonEditableContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  nonEditableText: { fontSize: 14, color: COLORS.muted, fontFamily: FONTS.inter },

  submitBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { color: '#fff', fontSize: 14, fontFamily: FONTS.inter, letterSpacing: 0.5 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONTS.inter,
    color: COLORS.secondary,
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.inter,
    color: COLORS.muted,
    marginBottom: 16,
    lineHeight: 18,
  },
  modalVehiclePlate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  modalVehiclePlateText: {
    color: COLORS.primary,
    fontSize: 16,
    fontFamily: FONTS.inter,
  },
  modalTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  modalTimeText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontFamily: FONTS.inter,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  confirmButton: {
    backgroundColor: '#EF4444',
  },
  cancelButtonText: {
    color: COLORS.muted,
    fontFamily: FONTS.inter,
    fontSize: 14,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontFamily: FONTS.inter,
    fontSize: 14,
  },
  clearInputBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: FONTS.inter,
    marginTop: 6,
    marginLeft: 4,
  },
  errorTextBelow: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: FONTS.inter,
    marginTop: -10,
    marginBottom: 14,
    marginLeft: 4,
  },
  inputContainerError: {
    marginBottom: 14,
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  inputContainerMargin: {
    marginBottom: 14,
  },
});
