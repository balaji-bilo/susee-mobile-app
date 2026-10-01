import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import {
  ArrowLeft,
  Wrench,
  Calendar,
  CheckSquare,
  Square,
  Send,
  Info,
  MessageSquare,
  Car,
  Mic,
  Trash2,
} from 'lucide-react-native';
import Toast from 'react-native-simple-toast';
import { colors, fonts } from '../../common/config/theme';
import Fonts from '../../common/assets/fonts/FontStyle';
import { RupeeFormatText } from '../../common/components/RupeeFormatText';
import { retrieveEncryptedData } from '../../common/config/storage';
import { base_url } from '../../common/config/constant';

/** Safely parse numeric price values from numbers or formatted strings like "₹4,500" */
function parsePriceNumber(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const clean = String(val).replace(/[^0-9.]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

/** Format currency value for clean display */
function formatCurrency(val) {
  const num = parsePriceNumber(val);
  return `₹${num.toLocaleString('en-IN')}`;
}

function formatDateDisplay(d) {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${day} ${month} ${year}, ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
}

function matchesDepartment(service, dept) {
  if (!dept || dept === 'all') return true;
  const target = dept.toLowerCase().replace(/[-_]/g, ' ');
  const cat = (
    service.category ||
    service.categorySlug ||
    service.serviceItem?.category?.name ||
    service.serviceItem?.category?.slug ||
    ''
  ).toLowerCase().replace(/[-_]/g, ' ');
  const name = (service.name || service.serviceName || '').toLowerCase().replace(/[-_]/g, ' ');

  const isBodyShop =
    cat.includes('body') ||
    cat.includes('paint') ||
    cat.includes('dent') ||
    cat.includes('tinkering') ||
    cat.includes('polish') ||
    name.includes('body') ||
    name.includes('paint') ||
    name.includes('dent') ||
    name.includes('tinkering') ||
    name.includes('polish');

  if (target.includes('body')) {
    return isBodyShop;
  }
  if (target.includes('mech')) {
    return !isBodyShop;
  }
  return true;
}

export function AddAdditionalWorkScreen({ route, navigation }) {
  const { card: navCard, onSaveAdditionalWork, department: navDepartment, activeTab } = route?.params || {};

  const card = navCard || {};
  const jobCardId = card.jobCardId || card.id;

  const initialDepartment =
    navDepartment ||
    (activeTab === 'BODY_SHOP'
      ? 'body-shop'
      : activeTab === 'MECHANICAL'
      ? 'mechanical'
      : (String(card?.workType || '').toLowerCase().includes('body') ? 'body-shop' : 'mechanical'));

  // Department / Category Selection State
  const [selectedDepartment, setSelectedDepartment] = useState(initialDepartment);
  const [allAvailableServices, setAllAvailableServices] = useState([]);

  // Context & API Data State
  const [loadingContext, setLoadingContext] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cardDetails, setCardDetails] = useState(null);
  const [currentServices, setCurrentServices] = useState([]);
  const [eligibleParentServices, setEligibleParentServices] = useState([]);
  const [availableServicesList, setAvailableServicesList] = useState([]);
  const [taxRate, setTaxRate] = useState(18);
  const [pendingApproval, setPendingApproval] = useState(null);

  // Form State
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [mechanicExplanation, setMechanicExplanation] = useState('');

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVoice, setRecordedVoice] = useState(false);
  const [audioBase64, setAudioBase64] = useState(null);
  const [audioRecorderPlayer] = useState(() => new AudioRecorderPlayer());
  const [recordTime, setRecordTime] = useState('00:00');

  // Selected available services IDs
  const [selectedServiceIds, setSelectedServiceIds] = useState([]);

  const handleSelectDepartment = (dept) => {
    setSelectedDepartment(dept);
    setSelectedServiceIds([]);
    const deptFiltered = allAvailableServices.filter((item) =>
      matchesDepartment(item, dept)
    );
    setAvailableServicesList(deptFiltered);
  };

  // Fetch API Context on Screen Load
  useEffect(() => {
    let isMounted = true;

    const fetchContext = async () => {
      if (!jobCardId) {
        setLoadingContext(false);
        return;
      }

      try {
        setLoadingContext(true);
        const token = await retrieveEncryptedData('token');
        const deptParam = selectedDepartment ? `?department=${selectedDepartment}` : '';
        const res = await axios.get(`${base_url}/job-cards/${jobCardId}/additional-work/context${deptParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (isMounted && res.data?.success && res.data?.data) {
          const {
            jobCard,
            currentServices: curServ,
            eligibleParentServices: elServ,
            availableServices: availServ,
            pendingApproval: pendApp,
          } = res.data.data;

          setCardDetails(jobCard);
          const cur = curServ || [];
          setCurrentServices(cur);
          setEligibleParentServices(elServ || []);
          setPendingApproval(pendApp || null);
          setTaxRate(Number(jobCard?.taxRate) || 18);

          // Comprehensive filter to remove any services already existing on the Job Card
          const existingIds = new Set();
          const existingNames = new Set();

          const registerExisting = (s) => {
            if (!s) return;
            if (s.id) existingIds.add(String(s.id));
            if (s.serviceItemId) existingIds.add(String(s.serviceItemId));
            if (s.serviceItem?.id) existingIds.add(String(s.serviceItem.id));
            const n = (s.serviceName || s.name || s.serviceItem?.name || '').toLowerCase().trim();
            if (n) existingNames.add(n);
          };

          (cur || []).forEach(registerExisting);
          (card.selectedServices || []).forEach(registerExisting);
          (card.additionalWork || []).forEach(registerExisting);
          (card.services || []).forEach(registerExisting);
          (card.currentServices || []).forEach(registerExisting);

          const deduplicatedAvail = (availServ || []).filter((item) => {
            const itemId = String(item.id || item.serviceItemId || '');
            const itemName = (item.name || item.serviceName || '').toLowerCase().trim();
            return !existingIds.has(itemId) && !existingNames.has(itemName);
          });

          setAllAvailableServices(deduplicatedAvail);

          const deptFiltered = deduplicatedAvail.filter((item) =>
            matchesDepartment(item, selectedDepartment)
          );

          setAvailableServicesList(deptFiltered);
        }
      } catch (err) {
        console.error('Failed to load additional work context:', err);
        if (isMounted) {
          Toast.show('Could not load online services list', Toast.SHORT);
        }
      } finally {
        if (isMounted) setLoadingContext(false);
      }
    };

    fetchContext();

    return () => {
      isMounted = false;
      try {
        audioRecorderPlayer.stopRecorder().catch(() => {});
        audioRecorderPlayer.removeRecordBackListener();
      } catch (_) {}
    };
  }, [jobCardId]);

  const onStartRecord = async () => {
    if (Platform.OS === 'android') {
      try {
        const permissions = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
        if (Platform.Version < 33) {
          permissions.push(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
          );
        }

        const grants = await PermissionsAndroid.requestMultiple(permissions);
        const isMicGranted =
          grants[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
          PermissionsAndroid.RESULTS.GRANTED;
        const isStorageGranted =
          Platform.Version >= 33 ||
          grants[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] ===
            PermissionsAndroid.RESULTS.GRANTED;

        if (!isMicGranted || !isStorageGranted) {
          Toast.show('Audio recording permission not granted', Toast.SHORT);
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    setIsRecording(true);
    setRecordedVoice(false);
    setAudioBase64(null);

    try {
      await audioRecorderPlayer.startRecorder();
      audioRecorderPlayer.addRecordBackListener((e) => {
        setRecordTime(
          audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)).substring(0, 5)
        );
      });
    } catch (err) {
      console.log('Record error:', err);
      setIsRecording(false);
      Toast.show('Failed to start recording', Toast.SHORT);
    }
  };

  const onStopRecord = async () => {
    try {
      const resultPath = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();

      setIsRecording(false);
      setRecordedVoice(true);

      if (resultPath) {
        const cleanPath = resultPath.replace(/^file:\/\//, '');
        const base64Data = await RNFS.readFile(cleanPath, 'base64');
        if (base64Data) {
          setAudioBase64(`data:audio/mp4;base64,${base64Data}`);
          Toast.show('Voice note recorded successfully', Toast.SHORT);
        }
      }
    } catch (err) {
      console.log('Stop record error:', err);
      setIsRecording(false);
      Toast.show('Failed to save voice note', Toast.SHORT);
    }
  };

  const clearVoiceNote = () => {
    setRecordedVoice(false);
    setAudioBase64(null);
    setRecordTime('00:00');
  };

  const toggleService = (id) => {
    if (selectedServiceIds.includes(id)) {
      setSelectedServiceIds(selectedServiceIds.filter((sId) => sId !== id));
    } else {
      setSelectedServiceIds([...selectedServiceIds, id]);
    }
  };

  // Calculations
  const previousServices = currentServices.length > 0 ? currentServices : (card.selectedServices || card.currentServices || []);
  const previousSubtotal = previousServices.reduce(
    (sum, item) => sum + parsePriceNumber(item.price || item.rate || item.cost),
    0
  );

  const selectedServicesObjects = availableServicesList.filter((item) =>
    selectedServiceIds.includes(item.id)
  );

  const additionalWorkSubtotal = selectedServicesObjects.reduce(
    (sum, item) => sum + parsePriceNumber(item.price),
    0
  );

  const subtotal = previousSubtotal + additionalWorkSubtotal;
  const tax = Math.round((subtotal * taxRate) / 100);
  const grandTotal = subtotal + tax;

  const insets = useSafeAreaInsets();
  const safeTop = insets.top > 0 ? insets.top : Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  const topPadding = safeTop + 6;

  // Submit Handler
  const handleSendApproval = async () => {
    if (!expectedDeliveryDate) {
      Toast.show('Please select an expected delivery date', Toast.SHORT);
      return;
    }

    if (selectedServiceIds.length === 0) {
      Toast.show('Please select at least one additional service', Toast.SHORT);
      return;
    }

    if (!mechanicExplanation || mechanicExplanation.trim().length < 5) {
      Toast.show('Please provide a mechanic explanation (min 5 chars)', Toast.SHORT);
      return;
    }

    const parentServiceId = eligibleParentServices[0]?.id || currentServices[0]?.id;
    if (!parentServiceId) {
      Alert.alert(
        'Missing Parent Service',
        'This job card does not have any active parent service to attach additional work to.'
      );
      return;
    }

    try {
      setSubmitting(true);
      const token = await retrieveEncryptedData('token');
      const targetId = cardDetails?.id || jobCardId;

      const payload = {
        department: selectedDepartment,
        parentJobCardServiceId: parentServiceId,
        mechanicExplanation: mechanicExplanation.trim(),
        expectedDeliveryAt: expectedDeliveryDate.toISOString(),
        voiceNoteUrl: audioBase64 || null,
        services: selectedServiceIds.map((id) => ({
          serviceItemId: Number(id),
          quantity: 1,
        })),
      };

      const res = await axios.post(
        `${base_url}/job-cards/${targetId}/additional-work/request`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data?.success) {
        Toast.show('Approval request & WhatsApp message sent to customer!', Toast.LONG);
        if (onSaveAdditionalWork) {
          const createdServices = res.data.data?.services || selectedServicesObjects.map((s) => ({
            id: s.id,
            name: s.name,
            status: 'Pending',
            rate: formatCurrency(s.price),
          }));
          onSaveAdditionalWork(createdServices);
        }
        navigation?.goBack();
      } else {
        Alert.alert('Error', res.data?.message || 'Failed to submit additional work request');
      }
    } catch (error) {
      console.error('Submit additional work failed:', error);
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to submit additional work';
      Alert.alert('Submission Failed', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Header display details
  const displayOwner = cardDetails?.customer?.name || card.owner || card.customerName || 'Customer';
  const displayMobile = cardDetails?.customer?.mobileNo || cardDetails?.customer?.mobile || card.mobile || card.customerPhone || '';
  const displayVehicleNo = cardDetails?.registrationNumber || card.vehicleNo || card.registrationNumber || 'N/A';
  const displayJobCardNo = cardDetails?.jobCardNumber || card.jobCardNumber || card.id || 'N/A';
  const displayBrandModel =
    (cardDetails?.brand?.name && cardDetails?.model?.name
      ? `${cardDetails.brand.name} ${cardDetails.model.name}`
      : card.brandModel || card.brand || 'Vehicle Details');

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Navigation Header */}
      <View style={[styles.headerBar, { paddingTop: topPadding }]}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation?.goBack()}
        >
          <ArrowLeft size={18} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Additional Work</Text>
        </View>
      </View>

      {loadingContext ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading additional work details...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 130 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Vehicle and Customer Details Card */}
          <View style={styles.cardContainer}>
            <View style={styles.cardHeaderRow}>
              <Car size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.cardTitle}>Vehicle and Customer Details</Text>
            </View>
            <View style={styles.divider} />

            {/* Top Row: Customer Avatar & License Plate */}
            <View style={styles.customerRow}>
              <View style={styles.customerGroup}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {displayOwner.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.customerName}>{displayOwner}</Text>
                  {!!displayMobile && <Text style={styles.customerPhone}>{displayMobile}</Text>}
                </View>
              </View>

              <View style={styles.plateContainer}>
                <View style={styles.indBlueBox}>
                  <View style={styles.indDot} />
                  <Text style={styles.indText}>IND</Text>
                </View>
                <View style={styles.plateNumberBox}>
                  <Text style={styles.plateNumberText}>{displayVehicleNo}</Text>
                </View>
              </View>
            </View>

            {/* Meta Grid Layout */}
            <View style={styles.metaBox}>
              <View style={styles.metaRowTop}>
                <View style={styles.metaColSmall}>
                  <Text style={styles.metaLabel}>JOB CARD</Text>
                  <Text style={styles.metaValBold}>{displayJobCardNo}</Text>
                </View>

                <View style={styles.metaColLarge}>
                  <Text style={styles.metaLabel}>BRAND / MODEL</Text>
                  <Text style={styles.metaVal}>{displayBrandModel}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 2. Additional Work Form Card */}
          <View style={styles.cardContainer}>
            <View style={styles.cardHeaderRow}>
              <Wrench size={16} color="#0D9488" style={{ marginRight: 6 }} />
              <Text style={styles.cardTitle}>Additional Work</Text>
            </View>
            <View style={styles.divider} />

            {/* Expected Delivery */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Expected Delivery <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.inputIconBox}
                activeOpacity={0.8}
                onPress={() => setShowDatePicker(true)}
              >
                <Text
                  style={[
                    styles.datePickerText,
                    !expectedDeliveryDate && styles.placeholderText,
                  ]}
                >
                  {expectedDeliveryDate
                    ? formatDateDisplay(expectedDeliveryDate)
                    : 'dd-mm-yyyy --:--'}
                </Text>
                <Calendar size={18} color="#64748B" />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={expectedDeliveryDate || new Date()}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setExpectedDeliveryDate(selectedDate);
                    }
                  }}
                />
              )}
            </View>

            {/* Mechanic Explanation */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                Mechanic Explanation <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.inputText, styles.textArea]}
                value={mechanicExplanation}
                onChangeText={setMechanicExplanation}
                multiline
                numberOfLines={3}
                placeholder="Explain why this extra work is needed (minimum 5 characters)..."
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Live Voice Note Recorder */}
            <View style={styles.voiceNoteContainer}>
              <View style={styles.voiceNoteHeader}>
                <Mic size={16} color="#0D9488" style={{ marginRight: 6 }} />
                <Text style={styles.voiceNoteTitle}>Live Voice Note Recorder</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.recordButton,
                  isRecording && styles.recordingButtonActive,
                  recordedVoice && !isRecording && styles.recordedButton,
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  if (isRecording) {
                    onStopRecord();
                  } else {
                    onStartRecord();
                  }
                }}
              >
                <View style={styles.recordDot} />
                <Text style={styles.recordButtonText}>
                  {isRecording
                    ? `Recording... ${recordTime} (Tap to Stop)`
                    : recordedVoice
                    ? 'Voice Note Recorded ✓ (Tap to Re-record)'
                    : 'Click to Record Voice Note'}
                </Text>
              </TouchableOpacity>

              {recordedVoice && (
                <View style={styles.voiceNoteActionRow}>
                  <Text style={styles.voiceRecordedInfo}>Audio ready for WhatsApp upload</Text>
                  <TouchableOpacity
                    style={styles.clearVoiceBtn}
                    onPress={clearVoiceNote}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={14} color="#EF4444" style={{ marginRight: 4 }} />
                    <Text style={styles.clearVoiceText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* AVAILABLE SERVICES List (Filtered by Category) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.subSectionTitle}>AVAILABLE SERVICES</Text>

              {availableServicesList.length === 0 ? (
                <Text style={styles.emptyBillText}>No additional services available to add.</Text>
              ) : (
                <View style={styles.servicesGrid}>
                  {availableServicesList.map((service) => {
                    const isSelected = selectedServiceIds.includes(service.id);
                    return (
                      <TouchableOpacity
                        key={service.id}
                        style={[
                          styles.serviceSelectCard,
                          isSelected && styles.serviceSelectCardActive,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => toggleService(service.id)}
                      >
                        <View style={styles.serviceSelectLeft}>
                          {isSelected ? (
                            <CheckSquare size={18} color={colors.primary} />
                          ) : (
                            <Square size={18} color="#94A3B8" />
                          )}
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.serviceSelectName}>{service.name}</Text>
                            {!!service.category && (
                              <View style={styles.catBadgeSmall}>
                                <Text style={styles.catBadgeTextSmall}>
                                  {service.category}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>

                        <RupeeFormatText style={styles.serviceSelectPrice}>
                          {formatCurrency(service.price)}
                        </RupeeFormatText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </View>

          {/* 3. Approval Preview Card */}
          <View style={styles.cardContainer}>
            <View style={styles.cardHeaderRow}>
              <MessageSquare size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.cardTitle}>Approval Preview</Text>
            </View>
            <View style={styles.divider} />

            <Text style={styles.billPreviewTitle}>Bill Preview</Text>

            {/* PREVIOUS JOB CARD BILL */}
            <Text style={styles.billSectionHeading}>PREVIOUS JOB CARD BILL</Text>
            <View style={styles.billList}>
              {previousServices.length === 0 ? (
                <Text style={styles.emptyBillText}>No previous services found.</Text>
              ) : (
                previousServices.map((item, idx) => (
                  <View key={item.id || idx} style={styles.billRow}>
                    <Text style={styles.billItemName}>
                      {item.serviceName || item.name} x{item.quantity || 1}
                    </Text>
                    <RupeeFormatText style={styles.billItemPrice}>
                      {formatCurrency(item.price || item.rate || item.cost)}
                    </RupeeFormatText>
                  </View>
                ))
              )}
            </View>

            <View style={styles.dashedDivider} />

            {/* ADDITIONAL WORK */}
            <Text style={styles.billSectionHeading}>ADDITIONAL WORK</Text>
            <View style={styles.billList}>
              {selectedServicesObjects.length === 0 ? (
                <Text style={styles.emptyBillText}>Select additional services above.</Text>
              ) : (
                selectedServicesObjects.map((item) => (
                  <View key={item.id} style={styles.billRow}>
                    <Text style={styles.billItemName}>{item.name} x1</Text>
                    <RupeeFormatText style={styles.billItemPrice}>
                      {formatCurrency(item.price)}
                    </RupeeFormatText>
                  </View>
                ))
              )}
            </View>

            <View style={styles.divider} />

            {/* Calculations Breakdown Box */}
            <View style={styles.calcContainer}>
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Previous Subtotal</Text>
                <RupeeFormatText style={styles.calcVal}>
                  {formatCurrency(previousSubtotal)}
                </RupeeFormatText>
              </View>

              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Additional Work</Text>
                <RupeeFormatText style={styles.calcVal}>
                  {formatCurrency(additionalWorkSubtotal)}
                </RupeeFormatText>
              </View>

              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Subtotal</Text>
                <RupeeFormatText style={styles.calcVal}>
                  {formatCurrency(subtotal)}
                </RupeeFormatText>
              </View>

              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Tax ({taxRate}%)</Text>
                <RupeeFormatText style={styles.calcVal}>
                  {formatCurrency(tax)}
                </RupeeFormatText>
              </View>

              <View style={styles.approvalTotalRow}>
                <Text style={styles.approvalTotalLabel}>Approval Total</Text>
                <RupeeFormatText style={styles.approvalTotalVal}>
                  {formatCurrency(grandTotal)}
                </RupeeFormatText>
              </View>
            </View>

            {/* Pending Notice Box if active pending approval */}
            {pendingApproval && (
              <View style={styles.noticeBox}>
                <Info size={16} color="#1E40AF" style={{ marginRight: 8, marginTop: 1 }} />
                <Text style={styles.noticeText}>
                  Pending approval ({pendingApproval.approvalCode || 'AW'}) is already waiting for customer response.
                </Text>
              </View>
            )}

            {/* Submit Action Button */}
            <TouchableOpacity
              style={[styles.approveBtn, submitting && styles.btnDisabled]}
              activeOpacity={0.85}
              onPress={handleSendApproval}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Send size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.approveBtnText}>Approve & Send via WhatsApp</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

export default AddAdditionalWorkScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: Fonts.inter,
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    padding: 14,
    gap: 14,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: fonts.interMedium,
    color: '#64748B',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  dashedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginVertical: 10,
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: fonts.interBold,
    color: '#FFFFFF',
  },
  customerName: {
    fontSize: 14,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  customerPhone: {
    fontSize: 12,
    fontFamily: fonts.inter,
    color: '#64748B',
    marginTop: 1,
  },
  plateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    borderRadius: 6,
    borderWidth: 1.2,
    borderColor: '#94A3B8',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  indBlueBox: {
    width: 22,
    height: '100%',
    backgroundColor: '#000F7E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFCC00',
    marginBottom: 1,
  },
  indText: {
    fontSize: 6.5,
    fontFamily: fonts.interBold,
    color: '#FFFFFF',
  },
  plateNumberBox: {
    paddingHorizontal: 8,
  },
  plateNumberText: {
    fontSize: 12,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  metaBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  metaRowTop: {
    flexDirection: 'row',
    gap: 12,
  },
  metaColSmall: {
    width: 90,
  },
  metaColLarge: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    fontFamily: fonts.interBold,
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
  metaValBold: {
    fontSize: 12.5,
    fontFamily: fonts.interBold,
    color: '#0F172A',
    marginTop: 2,
  },
  metaVal: {
    fontSize: 12,
    fontFamily: fonts.interSemiBold,
    color: '#0F172A',
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontFamily: fonts.interBold,
    color: '#334155',
    marginBottom: 6,
  },
  required: {
    color: '#EF4444',
  },
  inputIconBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
  },
  datePickerText: {
    fontSize: 13,
    fontFamily: fonts.interMedium,
    color: '#0F172A',
  },
  placeholderText: {
    color: '#94A3B8',
  },
  inputText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.inter,
    color: '#0F172A',
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  subSectionTitle: {
    fontSize: 11,
    fontFamily: fonts.interBold,
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  servicesGrid: {
    gap: 8,
  },
  serviceSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
  },
  serviceSelectCardActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#818CF8',
  },
  serviceSelectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceSelectName: {
    fontSize: 13,
    fontFamily: fonts.interSemiBold,
    color: '#0F172A',
  },
  catBadgeSmall: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  catBadgeTextSmall: {
    fontSize: 9.5,
    fontFamily: fonts.interMedium,
    color: '#2563EB',
  },
  serviceSelectPrice: {
    fontSize: 13,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  billPreviewTitle: {
    fontSize: 14,
    fontFamily: fonts.interBold,
    color: '#0F172A',
    marginBottom: 8,
  },
  billSectionHeading: {
    fontSize: 10,
    fontFamily: fonts.interBold,
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginVertical: 4,
  },
  billList: {
    gap: 6,
    marginVertical: 4,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billItemName: {
    fontSize: 12.5,
    fontFamily: fonts.interMedium,
    color: '#334155',
  },
  billItemPrice: {
    fontSize: 12.5,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  emptyBillText: {
    fontSize: 12,
    fontFamily: fonts.inter,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  calcContainer: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLabel: {
    fontSize: 12.5,
    fontFamily: fonts.interMedium,
    color: '#64748B',
  },
  calcVal: {
    fontSize: 12.5,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  approvalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
  },
  approvalTotalLabel: {
    fontSize: 14,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  approvalTotalVal: {
    fontSize: 16,
    fontFamily: fonts.interBold,
    color: '#0D9488',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    marginBottom: 14,
  },
  noticeText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: fonts.interMedium,
    color: '#1E40AF',
    lineHeight: 16,
  },
  approveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.65,
  },
  approveBtnText: {
    fontSize: 13.5,
    fontFamily: fonts.interBold,
    color: '#FFFFFF',
  },
  voiceNoteContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  voiceNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  voiceNoteTitle: {
    fontSize: 13,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  recordButton: {
    backgroundColor: '#000851',
    borderRadius: 6,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingButtonActive: {
    backgroundColor: '#EF4444',
  },
  recordedButton: {
    backgroundColor: '#10B981',
  },
  recordDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: fonts.interBold,
  },
  voiceNoteActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  voiceRecordedInfo: {
    fontSize: 11.5,
    fontFamily: fonts.interMedium,
    color: '#059669',
  },
  clearVoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  clearVoiceText: {
    fontSize: 11.5,
    fontFamily: fonts.interMedium,
    color: '#EF4444',
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  serviceCountHint: {
    fontSize: 11.5,
    fontFamily: fonts.interMedium,
    color: '#64748B',
  },
  deptTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 3,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deptTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  deptTabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  deptTabText: {
    fontSize: 12.5,
    fontFamily: fonts.interMedium,
    color: '#64748B',
  },
  deptTabTextActive: {
    fontFamily: fonts.interBold,
    color: '#2563EB',
  },
  deptBadgeCount: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  deptBadgeCountActive: {
    backgroundColor: '#EFF6FF',
  },
  deptBadgeCountText: {
    fontSize: 10.5,
    fontFamily: fonts.interBold,
    color: '#64748B',
  },
  deptBadgeCountTextActive: {
    color: '#2563EB',
  },
});

