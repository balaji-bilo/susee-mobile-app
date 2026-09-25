import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, StatusBar, Platform, UIManager, RefreshControl, Modal, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import {
  Calendar as CalendarIcon,
  X,
  SlidersHorizontal,
  ChevronRight,
  Car,
  Phone,
  Clock,
  Inbox,
  Search,
  ArrowDownLeft,
  LogOut
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import styles from '../styles/HistoryScreenStyles.jsx';
import { COLORS, FONTS } from '../../common/config/theme';
import axios from 'axios';
import { base_url, get_history } from '../../common/config/constant';
import { showToast } from '../../common/utils/toast';
import Skeleton from '../components/Skeleton';
import { retrieveEncryptedData } from '../../common/config/storage';

function HistoryCardSkeleton() {
  return (
    <View style={styles.card}>
      <Skeleton style={styles.skeletonCardLeftCircle} />
      <View style={styles.cardMiddle}>
        <View style={styles.skeletonRow1}>
          <Skeleton style={styles.skeletonPlate} />
          <Skeleton style={styles.skeletonBadge} />
        </View>
        <View style={styles.skeletonRow2}>
          <Skeleton style={styles.skeletonText1} />
        </View>
        <View style={styles.skeletonRow3}>
          <Skeleton style={styles.skeletonText2} />
        </View>
      </View>
      <Skeleton style={styles.skeletonChevron} />
    </View>
  );
}

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HistoryScreen({ navigation }) {
  const [cache, setCache] = useState({
    All: { records: [], page: 1, hasMore: true, loaded: false },
    Entry: { records: [], page: 1, hasMore: true, loaded: false },
    Exit: { records: [], page: 1, hasMore: true, loaded: false }
  });
  const [summary, setSummary] = useState({ totalEntries: 0, totalExits: 0, currentlyInside: 0, totalLogs: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [entryTypeFilter, setEntryTypeFilter] = useState('All');
  const [tempFromDate, setTempFromDate] = useState(null);
  const [tempToDate, setTempToDate] = useState(null);
  const [tempEntryTypeFilter, setTempEntryTypeFilter] = useState('All');
  const [activePicker, setActivePicker] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (showFilters) {
      setTempFromDate(fromDate);
      setTempToDate(toDate);
      setTempEntryTypeFilter(entryTypeFilter);
    }
  }, [showFilters]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  useEffect(() => {
    setCache({
      All: { records: [], page: 1, hasMore: true, loaded: false },
      Entry: { records: [], page: 1, hasMore: true, loaded: false },
      Exit: { records: [], page: 1, hasMore: true, loaded: false }
    });
  }, [debouncedSearchQuery, fromDate, toDate, entryTypeFilter]);

  useEffect(() => {
    if (isFocused) {
      setCache({
        All: { records: [], page: 1, hasMore: true, loaded: false },
        Entry: { records: [], page: 1, hasMore: true, loaded: false },
        Exit: { records: [], page: 1, hasMore: true, loaded: false }
      });
    }
  }, [isFocused]);

  const fmtDate = (d) => {
    if (!d) return '';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatISODate = (d) => {
    if (!d) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateHeader = (dateStr) => {
    const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    if (dateStr === todayStr) {
      return `Today, ${dateStr}`;
    } else if (dateStr === yesterdayStr) {
      return `Yesterday, ${dateStr}`;
    }
    return dateStr;
  };

  const loadData = useCallback(async (pageNum = 1, isLoadMore = false) => {
    if (pageNum === 1) {
      setLoading(true);
      setRefreshing(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const token = await retrieveEncryptedData('token');
      let url = `${base_url}${get_history}?page=${pageNum}&limit=10`;

      if (debouncedSearchQuery.trim()) {
        url += `&registrationNumber=${encodeURIComponent(debouncedSearchQuery.trim())}`;
      }
      if (fromDate && !toDate) {
        const formattedDate = formatISODate(fromDate);
        url += `&fromDate=${formattedDate}&toDate=${formattedDate}`;
      } else if (toDate && !fromDate) {
        const formattedDate = formatISODate(toDate);
        url += `&fromDate=${formattedDate}&toDate=${formattedDate}`;
      } else {
        if (fromDate) {
          url += `&fromDate=${formatISODate(fromDate)}`;
        }
        if (toDate) {
          url += `&toDate=${formatISODate(toDate)}`;
        }
      }
      if (entryTypeFilter && entryTypeFilter !== 'All') {
        url += `&entryType=${entryTypeFilter.toLowerCase()}`;
      }

      if (activeTab && activeTab !== 'All') {
        url += `&status=${activeTab.toLowerCase()}`;
      }

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = response.data;
      if (result && result.success && result.data && Array.isArray(result.data.entries)) {
        if (result.data.summary) {
          setSummary(result.data.summary);
        }
        const mapped = result.data.entries.map(item => {
          const entryTime = item.entryTime ? new Date(item.entryTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
          const exitTime = item.exitTime ? new Date(item.exitTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
          const metaStr = item.meta || `Entered ${entryTime}${exitTime ? ` • Exited ${exitTime}` : ''}`;

          return {
            vehicleNumber: item.vehicle?.registrationNumber || item.registrationNumber || item.vehicleNumber || '',
            whatsappNumber: item.customer?.mobileNo || item.whatsappNumber || '',
            status: item.exitTime ? 'Exit' : 'Entry',
            entryType: item.entryType || 'Service',
            date: item.date || (item.entryTime ? new Date(item.entryTime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''),
            meta: metaStr,
            entryTime,
            exitTime,
            entryTimestamp: item.entryTime || null,
            exitTimestamp: item.exitTime || null,
            rawItem: item,
          };
        });

        const localFiltered = activeTab === 'All'
          ? mapped
          : mapped.filter(item => item.status?.toLowerCase() === activeTab.toLowerCase());

        let newHasMore = true;
        if (result.meta) {
          newHasMore = pageNum < result.meta.totalPages;
        } else {
          newHasMore = result.data.entries.length === 10;
        }

        setCache(prev => {
          const prevTabCache = prev[activeTab];
          return {
            ...prev,
            [activeTab]: {
              records: isLoadMore ? [...prevTabCache.records, ...localFiltered] : localFiltered,
              page: pageNum,
              hasMore: newHasMore,
              loaded: true
            }
          };
        });
      } else {
        setCache(prev => ({
          ...prev,
          [activeTab]: {
            records: isLoadMore ? prev[activeTab].records : [],
            page: pageNum,
            hasMore: false,
            loaded: true
          }
        }));
      }
    } catch (error) {
      console.error('Fetch history error:', error);
      showToast(error?.message || 'Failed to fetch history');
      setCache(prev => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          hasMore: false,
          loaded: true
        }
      }));
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [debouncedSearchQuery, fromDate, toDate, entryTypeFilter, activeTab]);

  useEffect(() => {
    if (isFocused) {
      const currentTabCache = cache[activeTab];
      if (!currentTabCache.loaded && !loading && !loadingMore) {
        loadData(1, false);
      }
    }
  }, [isFocused, activeTab, cache, loadData, loading, loadingMore]);

  const handleRefresh = () => {
    setCache({
      All: { records: [], page: 1, hasMore: true, loaded: false },
      Entry: { records: [], page: 1, hasMore: true, loaded: false },
      Exit: { records: [], page: 1, hasMore: true, loaded: false }
    });
  };

  const handleLoadMore = () => {
    const currentTabCache = cache[activeTab];
    if (!loading && !loadingMore && currentTabCache.hasMore && currentTabCache.loaded) {
      const nextPage = currentTabCache.page + 1;
      loadData(nextPage, true);
    }
  };

  const processedData = useMemo(() => {
    const records = cache[activeTab].records;
    if (records.length === 0) {
      return [];
    }

    const grouped = [];
    const groups = {};
    records.forEach(item => {
      const d = item.date || 'Unknown Date';
      if (!groups[d]) {
        groups[d] = [];
      }
      groups[d].push(item);
    });

    Object.keys(groups).forEach(date => {
      grouped.push({ isHeader: true, title: date, count: groups[date].length });
      grouped.push(...groups[date]);
    });
    return grouped;
  }, [cache, activeTab]);

  const stats = useMemo(() => {
    return {
      totalEntries: summary.totalEntries || 0,
      totalExits: summary.totalExits || 0,
      currentlyInside: summary.currentlyInside || 0,
    };
  }, [summary]);

  const renderItem = ({ item }) => {
    if (item.isHeader) {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>{formatDateHeader(item.title)}</Text>
          <View style={styles.sectionHeaderBadge}>
            <Text style={styles.sectionHeaderBadgeText}>{item.count} Logs</Text>
          </View>
        </View>
      );
    }

    const isEntry = item.status?.toLowerCase() === 'inside' || item.status?.toLowerCase() === 'entry';
    const statusColor = isEntry ? '#10B981' : '#EF4444';

    let entryTypeBadgeStyle = styles.badgeVisitor;
    let entryTypeBadgeTextStyle = styles.badgeVisitorText;
    if (item.entryType) {
      const typeLower = item.entryType.toLowerCase();
      if (typeLower === 'service') {
        entryTypeBadgeStyle = styles.badgeService;
        entryTypeBadgeTextStyle = styles.badgeServiceText;
      } else if (typeLower === 'pickup') {
        entryTypeBadgeStyle = styles.badgePickup;
        entryTypeBadgeTextStyle = styles.badgePickupText;
      } else if (typeLower === 'enquiry') {
        entryTypeBadgeStyle = styles.badgeEnquiry;
        entryTypeBadgeTextStyle = styles.badgeEnquiryText;
      }
    }

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => navigation.navigate('HistoryDetail', item)}
        style={[styles.card, { borderLeftColor: statusColor }]}
      >
        <View style={[styles.cardLeftCircle, { borderColor: statusColor }]}>
          <Text style={[styles.cardLeftCircleText, { color: statusColor }]}>
            {isEntry ? 'IN' : 'OUT'}
          </Text>
        </View>

        <View style={styles.cardMiddle}>
          <View style={styles.cardRow1}>
            <Car size={13} color={COLORS.primary} style={{ marginRight: 2 }} />
            <Text style={styles.cardPlateNumber}>{item.vehicleNumber}</Text>

            {item.entryType && (
              <View style={entryTypeBadgeStyle}>
                <Text style={entryTypeBadgeTextStyle}>
                  {item.entryType.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.cardInfoRow}>
            <Phone size={12} color="#64748B" style={{ marginRight: 6 }} />
            <Text style={styles.cardInfoText}>{item.whatsappNumber || 'N/A'}</Text>
          </View>

          <View style={styles.cardSubInfoRow}>
            <Clock size={12} color="#64748B" style={{ marginRight: 6 }} />
            <Text style={styles.cardSubInfoText}>
              {isEntry ? item.entryTime : item.exitTime || item.entryTime}
            </Text>
          </View>
        </View>

        <View style={styles.cardRightChevron}>
          <ChevronRight size={16} color="#64748B" />
        </View>

        <View style={[isEntry ? styles.badgeEntry : styles.badgeExit, { position: 'absolute', top: 10, right: 12 }]}>
          <Text style={isEntry ? styles.badgeEntryText : styles.badgeExitText}>
            {isEntry ? 'ENTRY' : 'EXIT'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {isFocused && <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />}

      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>History Log</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.headerActionBtn, showSearch && { borderColor: COLORS.primary }]}
            onPress={() => setShowSearch(prev => !prev)}
          >
            <Search size={18} color={showSearch ? COLORS.primary : '#64748B'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerActionBtn, showFilters && { borderColor: COLORS.primary }]}
            onPress={() => setShowFilters(prev => !prev)}
          >
            <SlidersHorizontal size={18} color={showFilters ? COLORS.primary : '#64748B'} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={processedData}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item, index) => item.isHeader ? `header_${item.title}_${index}` : `${item.vehicleNumber}_${index}`}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
          />
        }
        ListHeaderComponent={
          <>
            {showSearch && (
              <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                  <Search size={18} color="#64748B" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by vehicle or phone..."
                    placeholderTextColor="#64748B"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => {
                      setSearchQuery('');
                      setDebouncedSearchQuery('');
                    }}>
                      <X size={16} color="#64748B" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            <View style={styles.statsCardRow}>
              <View style={styles.statsCardSingle}>
                <Text style={styles.statsCardLabel}>Total Entries</Text>
                <View style={styles.statsCardMiddleRow}>
                  <View style={[styles.statsCardIconContainer, { backgroundColor: '#E6F4EA' }]}>
                    <ArrowDownLeft size={16} color="#10B981" />
                  </View>
                  <Text style={[styles.statsCardValue, { color: '#10B981' }]}>{stats.totalEntries}</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.4}
                  style={styles.statsCardLinkBtn}
                  onPress={() => setActiveTab('All')}
                >
                  <Text style={styles.statsCardLinkText}>View all</Text>
                  <ChevronRight size={10} color="#1A73E8" />
                </TouchableOpacity>
              </View>

              <View style={styles.statsCardSingle}>
                <Text style={styles.statsCardLabel}>Total Exits</Text>
                <View style={styles.statsCardMiddleRow}>
                  <View style={[styles.statsCardIconContainer, { backgroundColor: '#FCE8E6' }]}>
                    <LogOut size={14} color="#EF4444" />
                  </View>
                  <Text style={[styles.statsCardValue, { color: '#EF4444' }]}>{stats.totalExits}</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.4}
                  style={styles.statsCardLinkBtn}
                  onPress={() => setActiveTab(activeTab === 'Exit' ? 'All' : 'Exit')}
                >
                  <Text style={styles.statsCardLinkText}>View all</Text>
                  <ChevronRight size={10} color="#1A73E8" />
                </TouchableOpacity>
              </View>

              <View style={styles.statsCardSingle}>
                <Text style={styles.statsCardLabel}>Currently Inside</Text>
                <View style={styles.statsCardMiddleRow}>
                  <View style={[styles.statsCardIconContainer, { backgroundColor: '#E8F0FE' }]}>
                    <Car size={16} color="#1A73E8" />
                  </View>
                  <Text style={[styles.statsCardValue, { color: '#1A73E8' }]}>{stats.currentlyInside}</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.4}
                  style={styles.statsCardLinkBtn}
                  onPress={() => setActiveTab(activeTab === 'Entry' ? 'All' : 'Entry')}
                >
                  <Text style={styles.statsCardLinkText}>View all</Text>
                  <ChevronRight size={10} color="#1A73E8" />
                </TouchableOpacity>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.skeletonContainer}>
              <HistoryCardSkeleton />
              <HistoryCardSkeleton />
              <HistoryCardSkeleton />
              <HistoryCardSkeleton />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Inbox size={40} color="#64748B" style={{ marginBottom: 12, opacity: 0.5 }} />
              <Text style={styles.emptyText}>
                No records found matching your filters
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : null
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
      />

      {activePicker === 'from' && (
        <DateTimePicker
          value={tempFromDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setActivePicker(null);
            if (selectedDate) {
              setTempFromDate(selectedDate);
            }
          }}
        />
      )}
      {activePicker === 'to' && (
        <DateTimePicker
          value={tempToDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setActivePicker(null);
            if (selectedDate) {
              setTempToDate(selectedDate);
            }
          }}
        />
      )}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowFilters(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.bottomSheetContainer}>
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Filter Options</Text>
                  <TouchableOpacity onPress={() => setShowFilters(false)} style={styles.sheetCloseBtn}>
                    <X size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <View style={[styles.dateFilterContainer, { paddingHorizontal: 0 }]}>
                  <TouchableOpacity
                    style={[styles.dateCard, activePicker === 'from' && styles.dateCardActive]}
                    onPress={() => setActivePicker('from')}
                  >
                    <CalendarIcon size={15} color={COLORS.primary} style={styles.dateIconContainer} />
                    <View style={styles.dateLabelContainer}>
                      <Text style={styles.dateLabel}>From Date</Text>
                      <Text style={styles.dateValue}>
                        {tempFromDate ? fmtDate(tempFromDate) : 'Select Date'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <Text style={styles.dateSeparatorText}>to</Text>

                  <TouchableOpacity
                    style={[styles.dateCard, activePicker === 'to' && styles.dateCardActive]}
                    onPress={() => setActivePicker('to')}
                  >
                    <CalendarIcon size={15} color={COLORS.primary} style={styles.dateIconContainer} />
                    <View style={styles.dateLabelContainer}>
                      <Text style={styles.dateLabel}>To Date</Text>
                      <Text style={styles.dateValue}>
                        {tempToDate ? fmtDate(tempToDate) : 'Select Date'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={[styles.typeContainer, { paddingHorizontal: 0 }]}>
                  <Text style={styles.typeLabel}>Entry Type</Text>
                  <View style={styles.typeChipRow}>
                    {['All', 'Service', 'Enquiry'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.typeChip,
                          tempEntryTypeFilter === type && styles.typeChipActive
                        ]}
                        onPress={() => setTempEntryTypeFilter(type)}
                      >
                        <Text
                          style={[
                            styles.typeChipText,
                            tempEntryTypeFilter === type && styles.typeChipTextActive
                          ]}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.sheetButtonsRow}>
                  <TouchableOpacity
                    style={styles.resetBtn}
                    activeOpacity={0.7}
                    onPress={() => {
                      setFromDate(null);
                      setToDate(null);
                      setEntryTypeFilter('All');
                      setTempFromDate(null);
                      setTempToDate(null);
                      setTempEntryTypeFilter('All');
                      setShowFilters(false);
                    }}
                  >
                    <Text style={styles.resetBtnText}>Reset</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.applyBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      setFromDate(tempFromDate);
                      setToDate(tempToDate);
                      setEntryTypeFilter(tempEntryTypeFilter);
                      setShowFilters(false);
                    }}
                  >
                    <Text style={styles.applyBtnText}>Apply Filters</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}
