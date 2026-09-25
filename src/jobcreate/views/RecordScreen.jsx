import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ScrollView, TextInput, TouchableOpacity, RefreshControl, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, spacing } from '../../common/config/theme';
import styles from '../styles/recordStyles';
import { Card } from '../../common/components/Card';
import { FileText, Calendar, Wrench, Search, X, Filter, ChevronRight, Truck, Clock, CheckCircle } from 'lucide-react-native';
import { base_url, record_list, brands_list } from '../../common/config/constant';
import { retrieveEncryptedData, getInitials } from '../../common/config/storage';
import axios from 'axios';
import { RecordSkeleton } from '../components/loading/RecordSkeleton';
import DateTimePicker from '@react-native-community/datetimepicker';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (e) {
    return dateStr;
  }
};

export function RecordScreen({ createdJobCards, navigation }) {
  const [queueList, setQueueList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [brands, setBrands] = useState([]);
  const [activeTab, setActiveTab] = useState('In Progress');

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const token = await retrieveEncryptedData('token');
        const response = await axios.get(`${base_url}${brands_list}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (response.data && response.data.success && response.data.data?.brands) {
          setBrands(response.data.data.brands);
        }
      } catch (error) {
        console.error('Error fetching brands in RecordScreen:', error);
      }
    };
    fetchBrands();
  }, []);

  // Date Range Filter States
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Temporary date values for the picker modal
  const [tempFromDate, setTempFromDate] = useState(null);
  const [tempToDate, setTempToDate] = useState(null);

  // Native Date Picker Visibility States
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const fetchQueue = async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) {
      setLoading(true);
    }
    try {
      const token = await retrieveEncryptedData('token');

      const params = {};
      params.page = 1;
      params.limit = 100;

      if (fromDate) {
        const d = new Date(fromDate);
        params.fromDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
      if (toDate) {
        const d = new Date(toDate);
        params.toDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }

      console.log('RecordScreen - Fetching queue with params:', params);

      const response = await axios.get(`${base_url}${record_list}`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params
      });
      console.log('RecordScreen - Job Card Queue Response:', response.data);

      const cardsArray = response.data.data?.jobCards || response.data.data?.entries || [];

      if (response.data && response.data.success) {
        setQueueList(cardsArray);
      }
    } catch (error) {
      console.error('Error fetching queue in RecordScreen:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getRecordData = (item) => {
    if (!item) return null;
    return {
      id: item.id,
      customer: {
        name: item.customer?.name,
        mobileNo: item.customer?.mobileNo,
      },
      vehicle: {
        registrationNumber: item.vehicle?.registrationNumber,
        brand: item.vehicle?.brand,
        model: item.vehicle?.model,
        color: item.vehicle?.color,
      },
      serviceCount: item.serviceCount,
      date: item.createdAt,
      status: item.currentStatus?.code,
    };
  };

  useEffect(() => {
    fetchQueue(true);
  }, [fromDate, toDate]);

  useEffect(() => {
    if (navigation) {
      const unsubscribe = navigation.addListener('focus', () => {
        fetchQueue(false);
      });
      return unsubscribe;
    }
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchQueue(false);
  };

  const onFromDateChange = (event, selectedDate) => {
    setShowFromPicker(false);
    if (selectedDate) {
      setTempFromDate(selectedDate);
    }
  };

  const onToDateChange = (event, selectedDate) => {
    setShowToPicker(false);
    if (selectedDate) {
      setTempToDate(selectedDate);
    }
  };

  const filteredLocalCards = (createdJobCards || []).filter(
    (local) => !queueList.some((q) => {
      const localGateId = String(local.gateEntryId);
      const localId = String(local.id);
      const qGateId = String(q.gateEntryId);
      const qId = String(q.id);
      return (localGateId && localGateId === qGateId) || (localId && localId === qId);
    })
  );

  const allJobCards = [...filteredLocalCards, ...queueList];

  const filteredCards = allJobCards.filter((card) => {
    const recordData = getRecordData(card);
    if (!recordData) return false;

    // Tab Filter
    if (activeTab === 'In Progress' && recordData.status === 'DELIVERED') return false;
    if (activeTab === 'Delivered' && recordData.status !== 'DELIVERED') return false;

    // 1. Text Search Filter
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = !query || (
      recordData.vehicle?.registrationNumber?.toLowerCase().includes(query) ||
      recordData.customer?.name?.toLowerCase().includes(query) ||
      recordData.vehicle?.brand?.name?.toLowerCase().includes(query) ||
      recordData.vehicle?.model?.toLowerCase().includes(query)
    );

    // 2. Date Range Filter
    let matchesDate = true;
    if (fromDate || toDate) {
      const cardDate = recordData.date ? new Date(recordData.date) : null;
      if (cardDate && !isNaN(cardDate.getTime())) {
        cardDate.setHours(0, 0, 0, 0);

        if (fromDate) {
          const start = new Date(fromDate);
          start.setHours(0, 0, 0, 0);
          if (cardDate < start) matchesDate = false;
        }

        if (toDate) {
          const end = new Date(toDate);
          end.setHours(23, 59, 59, 999);
          if (cardDate > end) matchesDate = false;
        }
      } else {
        matchesDate = false;
      }
    }

    return matchesQuery && matchesDate;
  });

  const renderItem = ({ item }) => {
    const recordData = getRecordData(item);
    if (!recordData) return null;

    const initials = getInitials(recordData.customer?.name || '');

    return (
      <TouchableOpacity
        onPress={() => {
          console.log('RecordScreen - Navigating to RecordDetailScreen with jobCardId:', recordData.id);
          navigation.navigate('RecordDetailScreen', {
            jobCardId: recordData.id,
          });
        }}
        activeOpacity={0.8}
      >
        <View style={styles.itemCardMain}>
          {/* Left: Avatar */}
          <View style={styles.cardAvatar}>
            <Text style={styles.cardAvatarText}>
              {initials}
            </Text>
          </View>

          {/* Right: Info */}
          <View style={styles.cardInfoContainer}>
            {/* Row 1 */}
            <View style={styles.cardRowBetween}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {recordData.customer?.name}
              </Text>
              <View style={styles.cardPlateBadge}>
                <Text style={styles.cardPlateText} numberOfLines={1}>
                  {recordData.vehicle?.registrationNumber}
                </Text>
              </View>
            </View>

            {/* Row 2 */}
            <View style={styles.cardRowBetween}>
              <Text style={styles.cardSpecs} numberOfLines={1}>
                {[recordData.vehicle?.brand?.name, recordData.vehicle?.model, recordData.vehicle?.color].filter(Boolean).join(' • ')}
              </Text>
              <View style={styles.cardDateRow}>
                <Calendar size={12} color="#94A3B8" />
                <Text style={styles.cardDateText}>
                  {formatDate(recordData.date)}
                </Text>
              </View>
            </View>

            {/* Row 3 */}
            <View style={styles.cardRowBetween}>
              <View style={styles.cardServicesBadge}>
                <Wrench size={12} color="#4F46E5" />
                <Text style={styles.cardServicesText}>
                  {recordData.serviceCount} {recordData.serviceCount === 1 ? 'Service' : 'Services'}
                </Text>
              </View>
              <View style={styles.cardChevronContainer}>
                <ChevronRight size={16} color="#475569" />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>

        {/* Header Title with Counter */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Service Records</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {/* Search Toggle Button */}
            <TouchableOpacity
              onPress={() => {
                setIsSearchVisible(!isSearchVisible);
                if (isSearchVisible) {
                  setSearchQuery('');
                }
              }}
              style={[
                styles.filterButtonPrimary,
                { elevation: 0, shadowOpacity: 0 }
              ]}
            >
              <Search size={20} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Date Filter Button */}
            <TouchableOpacity
              onPress={() => {
                setTempFromDate(fromDate);
                setTempToDate(toDate);
                setFilterModalVisible(true);
              }}
              style={[
                styles.filterButtonPrimary,
                { elevation: 0, shadowOpacity: 0 }
              ]}
            >
              <Filter size={20} color="#FFFFFF" />
              {(fromDate || toDate) && (
                <View style={styles.filterIndicatorPrimary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Row */}
        {isSearchVisible && (
          <View style={styles.searchContainerMain}>
            <View style={styles.searchBarPrimary}>
              <Search size={20} color="#94A3B8" />
              <TextInput
                placeholder="Search by vehicle number, name, or model..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInputPrimary}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClearButtonPrimary}>
                  <X size={18} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'In Progress' ? styles.tabButtonActive : styles.tabButtonInactive
            ]}
            onPress={() => setActiveTab('In Progress')}
          >
            <Clock size={18} color={activeTab === 'In Progress' ? '#FFFFFF' : colors.text} />
            <Text style={[
              styles.tabButtonText,
              activeTab === 'In Progress' ? styles.tabButtonTextActive : styles.tabButtonTextInactive
            ]}>In Progress</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'Delivered' ? styles.tabButtonActive : styles.tabButtonInactive
            ]}
            onPress={() => setActiveTab('Delivered')}
          >
            <CheckCircle size={18} color={activeTab === 'Delivered' ? '#FFFFFF' : colors.text} />
            <Text style={[
              styles.tabButtonText,
              activeTab === 'Delivered' ? styles.tabButtonTextActive : styles.tabButtonTextInactive
            ]}>Delivered</Text>
          </TouchableOpacity>
        </View>

        {/* Active Filters Summary */}
        {(fromDate || toDate) ? (
          <View style={styles.activeFiltersContainer}>
            <View style={styles.filterChip}>
              <Calendar size={13} color={colors.primary} />
              <Text style={styles.filterChipText}>
                Filter: {fromDate ? formatDate(fromDate) : 'Start'} to {toDate ? formatDate(toDate) : 'End'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setFromDate(null);
                  setToDate(null);
                }}
                style={styles.filterClearButton}
              >
                <X size={12} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {loading && queueList.length === 0 ? (
          <RecordSkeleton />
        ) : (
          <FlatList
            data={filteredCards}
            keyExtractor={(item) => {
              const recordData = getRecordData(item);
              return recordData?.id ? String(recordData.id) : String(Math.random());
            }}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={filteredCards.length === 0 ? { flexGrow: 1, paddingBottom: 120 } : { paddingBottom: 120 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
            }
            ListEmptyComponent={
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: spacing.xl,
                  gap: spacing.sm,
                }}
              >
                <View
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: colors.primarySoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: spacing.xs,
                  }}
                >
                  <FileText size={36} color={colors.primary} />
                </View>
                <Text style={{ fontFamily: fonts.inter, fontSize: 16, color: colors.text, textAlign: 'center' }}>
                  {searchQuery ? 'No Matching Records' : 'No Job Cards Created Yet'}
                </Text>
                <Text style={{ fontFamily: fonts.inter, fontSize: 13, color: colors.mutedText, textAlign: 'center', maxWidth: 280, lineHeight: 18 }}>
                  {searchQuery
                    ? 'Try adjusting your search terms or clearing the filter.'
                    : 'Create new job cards from the Home/Queue screen to see them recorded here.'}
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Date Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>

            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Date Range</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)} style={styles.modalCloseButton}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md, paddingBottom: 20 }}>

              {/* Inputs for Date Range */}
              <View style={styles.dateInputsRow}>
                <TouchableOpacity
                  onPress={() => setShowFromPicker(true)}
                  style={[
                    styles.dateInputButton,
                    showFromPicker && {
                      backgroundColor: colors.primarySoft,
                      borderColor: colors.primary,
                    }
                  ]}
                >
                  <Text style={styles.dateInputLabel}>From Date</Text>
                  <Text style={{ fontFamily: fonts.inter, fontSize: 14, color: tempFromDate ? colors.text : colors.mutedText, marginTop: 4 }}>
                    {tempFromDate ? formatDate(tempFromDate) : 'Select Date'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowToPicker(true)}
                  style={[
                    styles.dateInputButton,
                    showToPicker && {
                      backgroundColor: colors.primarySoft,
                      borderColor: colors.primary,
                    }
                  ]}
                >
                  <Text style={styles.dateInputLabel}>To Date</Text>
                  <Text style={{ fontFamily: fonts.inter, fontSize: 14, color: tempToDate ? colors.text : colors.mutedText, marginTop: 4 }}>
                    {tempToDate ? formatDate(tempToDate) : 'Select Date'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  onPress={() => {
                    setTempFromDate(null);
                    setTempToDate(null);
                    setFromDate(null);
                    setToDate(null);
                    setFilterModalVisible(false);
                  }}
                  style={styles.resetButton}
                >
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setFromDate(tempFromDate);
                    setToDate(tempToDate);
                    setFilterModalVisible(false);
                  }}
                  style={[styles.applyButton, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.applyButtonText}>Apply Filter</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Native Date Pickers */}
            {showFromPicker && (
              <DateTimePicker
                value={tempFromDate || new Date()}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={onFromDateChange}
              />
            )}

            {showToPicker && (
              <DateTimePicker
                value={tempToDate || new Date()}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={onToDateChange}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
