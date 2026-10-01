import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import {
  Search,
  FileText,
  User,
  Phone,
  Wrench,
  Layers,
  Calendar,
  MoreVertical,
  Filter,
  ArrowLeft,
  Car,
  PlusCircle,
  Clock,
  ChevronRight,
} from 'lucide-react-native';
import { colors, fonts } from '../../common/config/theme';
import { AssignTechnicianModal } from '../components/AssignTechnicianModal';
import { RupeeFormatText } from '../../common/components/RupeeFormatText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloorSupervisorHeader } from '../components/FloorSupervisorHeader';
import axios from 'axios';
import { base_url, mobile_floor_job_cards } from '../../common/config/constant';
import { retrieveEncryptedData } from '../../common/config/storage';
import { useFocusEffect } from '@react-navigation/native';

function formatVehicleNumber(num) {
  if (!num) return '';
  const clean = num.replace(/\s+/g, '').toUpperCase();
  const match = clean.match(/^([A-Z]{2})([0-9]{2})([A-Z]{1,3})([0-9]{1,4})$/);
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
  }
  return clean;
}

export function FloorJobCardsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const tabsScrollViewRef = useRef(null);
  const flatListRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedCardForAssign, setSelectedCardForAssign] = useState(null);

  const tabs = [
    { key: 'ALL', label: 'All' },
    { key: 'MECHANICAL', label: 'Mechanical' },
    { key: 'BODY_SHOP', label: 'Body Shop' },
    { key: 'READY_FOR_DELIVERY', label: 'Ready for Delivery' },
  ];

  const [jobCards, setJobCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchJobCards = async (isRefresh = false) => {
    try {
      if (!isRefresh) setIsLoading(true);
      const token = await retrieveEncryptedData('token');
      const response = await axios.get(`${base_url}${mobile_floor_job_cards}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1000 }
      });

      if (response.data.success) {
        const data = response.data.data;
        if (data && data.length > 0) {
          console.log('Raw API Response Data (First Item):', JSON.stringify(data[0], null, 2));
        }
        const formatted = data.map((item) => {
          return {
            id: item.jobCardNo,
            jobCardId: item.id,
            vehicleNo: item.vehicle?.registrationNo || '',
            owner: item.customer?.fullName || '',
            initial: item.customer?.fullName?.[0] || 'U',
            mobile: item.customer?.mobileNo || '',
            brandModel: `${item.vehicle?.brand?.name || ''} ${item.vehicle?.model || ''}`.trim(),
            expectedDelivery: item.expectedDeliveryAt ? new Date(item.expectedDeliveryAt).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '',
            serviceType: item.serviceType?.name || (typeof item.serviceType === 'string' ? item.serviceType : 'SERVICE'),
            workType: item.workType?.name || (typeof item.workType === 'string' ? item.workType : 'Both'),
            status: item.currentStatus?.statusName || 'Pending',
            mechanic: item.technician || (item.assignedMechanics?.length > 0 ? item.assignedMechanics.map(m => m.fullName).join(', ') : 'Unassigned'),
            bay: item.bay?.bayName || item.bay?.bayCode || item.assignedBay?.bayName || item.assignedBay?.bayCode || 'Unassigned',
            estCost: `₹${(item.totalEstimate || 0).toLocaleString('en-IN')}`,
            created: item.createdAt ? new Date(item.createdAt).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '',
            workAssignments: item.workAssignments || [],
            assignmentHistory: item.assignmentHistory || [],
            selectedServices: (item.services || []).map(s => ({
              id: s.id,
              name: s.serviceName || s.serviceItem?.name || 'Unknown Service',
              qty: `x${s.quantity || 1}`,
              status: s.serviceStatus?.statusName || s.serviceStatus?.statusCode || 'Pending',
              rate: `₹${(Number(s.price) || 0).toLocaleString('en-IN')}`,
              isAdditional: Boolean(s.isAdditional),
              approvalStatusCode: String(s.approvalStatus?.statusCode || s.approvalStatus || (s.isAdditional ? 'PENDING' : 'APPROVED')).toUpperCase(),
              serviceStatusCode: String(s.serviceStatus?.statusCode || s.status || 'PENDING').toUpperCase(),
              category: s.serviceItem?.category?.name || s.category || '',
              categorySlug: s.serviceItem?.category?.slug || s.categorySlug || '',
              isCompleted: String(s.serviceStatus?.statusCode || s.status || '').toUpperCase().includes('COMPLETED'),
            })),
            additionalWork: (item.services?.filter(s => s.isAdditional) || []).map(s => ({
              id: s.id,
              name: s.serviceName || s.serviceItem?.name || 'Unknown Service',
              qty: `x${s.quantity || 1}`,
              status: s.serviceStatus?.statusName || s.serviceStatus?.statusCode || 'Pending',
              rate: `₹${(Number(s.price) || 0).toLocaleString('en-IN')}`,
              isAdditional: true,
              approvalStatusCode: String(s.approvalStatus?.statusCode || s.approvalStatus || 'PENDING').toUpperCase(),
              serviceStatusCode: String(s.serviceStatus?.statusCode || s.status || 'PENDING').toUpperCase(),
              category: s.serviceItem?.category?.name || s.category || '',
              categorySlug: s.serviceItem?.category?.slug || s.categorySlug || '',
              isCompleted: String(s.serviceStatus?.statusCode || s.status || '').toUpperCase().includes('COMPLETED'),
            })),
            estimateSummary: (() => {
              const taxRate = item.billing?.taxRate ?? item.taxRate ?? 18;
              const servicesList = item.services || [];

              const validInitial = servicesList.filter(s => !s.isAdditional && s.serviceStatus?.statusCode !== 'REJECTED' && s.serviceStatus?.statusCode !== 'CANCELLED');
              const initialSum = validInitial.reduce((sum, s) => sum + (Number(s.price || 0) * Number(s.quantity || 1)), 0);

              const validAddl = servicesList.filter(s => s.isAdditional && s.serviceStatus?.statusCode !== 'REJECTED' && s.serviceStatus?.statusCode !== 'CANCELLED');
              const addlSum = validAddl.reduce((sum, s) => sum + (Number(s.price || 0) * Number(s.quantity || 1)), 0);

              const rawSubtotal = item.billing?.serviceSubtotal ?? item.serviceSubtotal ?? (item.totalEstimate / (1 + taxRate / 100));
              const hasItemPrices = validInitial.some(s => Number(s.price) > 0);

              const fallbackBase = Math.max(0, rawSubtotal - addlSum);
              const baseSub = hasItemPrices ? initialSum : (fallbackBase > 0 ? fallbackBase : rawSubtotal);

              const discount = item.billing?.discountAmount ?? item.discountAmount ?? 0;
              const combinedSub = baseSub + addlSum;
              const taxable = Math.max(0, combinedSub - discount);
              const totalTax = taxable * (taxRate / 100);
              const grandTotal = taxable + totalTax;

              return {
                baseSubtotal: `₹${baseSub.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
                additionalWork: `₹${addlSum.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
                tax: `₹${totalTax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
                grandTotal: `₹${grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
              };
            })(),
            assignedWork: (item.assignmentHistory || item.workAssignments || []).map(a => ({
              id: a.id,
              serviceName: a.service?.serviceName || a.service?.category?.name || 'Unknown',
              empName: a.assignedUser ? (a.assignedUser.employeeCode ? `${a.assignedUser.fullName} - ${a.assignedUser.employeeCode}` : a.assignedUser.fullName) : 'Unassigned',
              status: a.status?.statusName || a.status?.statusCode || (typeof a.status === 'string' ? a.status : (a.completedAt ? 'Completed' : 'Assigned')),
              startTime: a.startedAt ? new Date(a.startedAt).toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : 'Not Started',
              endTime: a.completedAt ? new Date(a.completedAt).toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : 'Not Completed',
            })),
            approvals: (item.approvals || []).map(a => {
              let rawVoiceNoteUrl = a.voice_note_url || a.voiceNoteUrl || '';
              if (rawVoiceNoteUrl && !rawVoiceNoteUrl.startsWith('http')) {
                const serverOrigin = base_url.replace(/\/api\/?$/, '');
                rawVoiceNoteUrl = `${serverOrigin}${rawVoiceNoteUrl.startsWith('/') ? '' : '/'}${rawVoiceNoteUrl}`;
              }
              return {
                id: a.id,
                approvalCode: a.approvalCode || `AW${Math.floor(Math.random() * 100000)}`,
                status: a.status?.statusCode || a.customerResponse || 'Pending',
                explanation: a.mechanicExplanation || '',
                voiceNoteUrl: rawVoiceNoteUrl,
                createdAt: a.createdAt ? new Date(a.createdAt).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '',
              };
            }),
            jobProgressSteps: (() => {
              const createdDate = item.createdAt ? new Date(item.createdAt).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'Pending';
              const entryDate = item.gateEntry?.entryTime ? new Date(item.gateEntry.entryTime).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : createdDate;
              const estCostString = `₹${(item.totalEstimate || 0).toLocaleString('en-IN')}`;
              const pendingApprovalsCount = (item.approvals || []).filter(a => String(a.statusCode || a.customerResponse || a.status || '').toUpperCase().includes('PENDING')).length;
              const isJobDelivered = String(item.currentStatus?.statusCode || item.status || '').toUpperCase().includes('DELIVERED');
              const mechanicName = item.technician || (item.assignedMechanics?.length > 0 ? item.assignedMechanics.map(m => m.fullName).join(', ') : 'Unassigned');
              const bayName = item.bay?.bayName || item.bay?.bayCode || item.assignedBay?.bayName || item.assignedBay?.bayCode || 'Unassigned';
              const expDel = item.expectedDeliveryAt ? new Date(item.expectedDeliveryAt).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'Pending';

              // Use the real job card status code from deriveJobCardStatus() on the backend
              const statusCode = String(item.currentStatus?.statusCode || '').toUpperCase();
              const isMechanicalPhase  = statusCode.includes('MECHANICAL');
              const isBodyShopPhase    = statusCode.includes('BODY_SHOP');
              const isReadyOrDelivered = statusCode.includes('READY_FOR_DELIVERY') || statusCode.includes('DELIVERED');

              // Does this job have any body-shop category services?
              const hasBodyShopServices = (item.services || []).some(s => {
                const slug = String(s.serviceItem?.category?.slug || '').toLowerCase();
                const catName = String(s.serviceItem?.category?.name || '').toLowerCase();
                return slug.includes('body') || catName.includes('body');
              });

              // Mechanical: completed once job moves past it; active while in mechanical; pending if not started
              const mechanicalStatus =
                isReadyOrDelivered || isBodyShopPhase ? 'completed' :
                isMechanicalPhase || mechanicName !== 'Unassigned' ? 'active' : 'pending';

              // Body Shop: pending (grayed) if no body-shop services exist on this job
              const bodyShopStatus =
                !hasBodyShopServices  ? 'pending' :
                isReadyOrDelivered    ? 'completed' :
                isBodyShopPhase       ? 'active' : 'pending';

              // Customer Approvals: pending if no approvals at all (not falsely green)
              const approvals = item.approvals || [];
              const approvalStatus =
                approvals.length === 0    ? 'pending' :
                pendingApprovalsCount > 0 ? 'active'  : 'completed';
              const approvalDesc =
                approvals.length === 0    ? 'No approval required' :
                pendingApprovalsCount > 0 ? `Pending — ${pendingApprovalsCount} items awaiting` : 'All approved';

              return [
                { id: 1, title: 'Vehicle Entry',      desc: `${entryDate} · Gate Security`,                          status: 'completed' },
                { id: 2, title: 'Job Card Created',   desc: `${createdDate} · CRM Team · ${estCostString} est.`,     status: 'completed' },
                { id: 3, title: 'Mechanical Work',    desc: `Assigned to ${mechanicName} · ${bayName}`,              status: mechanicalStatus },
                { id: 4, title: 'Customer Approvals', desc: approvalDesc,                                             status: approvalStatus },
                { id: 5, title: 'Body Shop',          desc: hasBodyShopServices ? 'Body Shop Work' : 'Not required', status: bodyShopStatus },
                { id: 6, title: 'Vehicle Delivery',   desc: isJobDelivered ? 'Delivered' : `Expected: ${expDel}`,    status: isJobDelivered ? 'completed' : 'pending' },
              ];
            })(),
            photos: (() => {
              const rawPhotos = [
                ...(Array.isArray(item?.photos) ? item.photos : []),
                ...(Array.isArray(item?.media) ? item.media : []),
                ...(Array.isArray(item?.mediaFiles) ? item.mediaFiles : []),
                ...(Array.isArray(item?.vehicle?.mediaFiles) ? item.vehicle.mediaFiles : []),
                ...(Array.isArray(item?.gateEntry?.mediaFiles) ? item.gateEntry.mediaFiles : [])
              ];

              const serverOrigin = base_url.replace(/\/api\/?$/, '');
              return rawPhotos.map(p => {
                let url = p?.fileUrl || p?.mediaUrl || p?.url || p?.blobUrl || '';
                if (url) {
                  url = url.replace(/\\/g, '/'); // Fix Windows backslashes
                  if (!url.startsWith('http') && !url.startsWith('data:') && !url.startsWith('blob:')) {
                    url = `${serverOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
                  }
                  url = url.replace(/ /g, '%20'); // Handle spaces WITHOUT double-encoding SAS tokens
                }
                return {
                  id: p?.id || Math.random().toString(),
                  url: url,
                  category: p?.category || p?.name || 'Unknown',
                  fileName: p?.fileName || p?.originalname || p?.name || ''
                };
              }).filter(p => p.url); // filter out empties
            })(),
          };
        });
        setJobCards(formatted);
        setVisibleCount(5);
      }
    } catch (error) {
      console.log('Error fetching floor job cards:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setSelectedStatusFilter('ALL');
      setSearchQuery('');
      if (tabsScrollViewRef.current) {
        tabsScrollViewRef.current.scrollTo({ x: 0, y: 0, animated: false });
      }
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({ offset: 0, animated: false });
      }
      fetchJobCards();
    }, [])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchJobCards(true);
  };

  React.useEffect(() => {
    setVisibleCount(5);
  }, [searchQuery, selectedStatusFilter]);

  const handleLoadMore = () => {
    if (visibleCount < filteredCards.length && !isLoadingMore) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setVisibleCount(prev => prev + 5);
        setIsLoadingMore(false);
      }, 500);
    }
  };

  const getDeptAssignment = (assignments, deptAliases) => {
    if (!assignments || !Array.isArray(assignments)) return { mechanic: null, bay: null };
    const deptAssignments = assignments.filter(a => {
      const slug = a.service?.category?.slug?.toLowerCase() || '';
      const name = a.service?.category?.name?.toLowerCase() || '';
      return deptAliases.some(alias => slug.includes(alias) || name.includes(alias));
    });
    const active = deptAssignments.find(a => !a.completedAt) || deptAssignments[0];
    if (!active) return { mechanic: null, bay: null };
    return {
      mechanic: active.assignedUser?.fullName || active.assignedMechanic?.fullName || null,
      bay: active.bay?.bayName || active.bay?.bayCode || null,
    };
  };

  const getTabCount = (key) => {
    if (key === 'ALL') return jobCards.length;
    if (key === 'READY_FOR_DELIVERY') {
      return jobCards.filter((c) => (c.status || '').toUpperCase().includes('READY')).length;
    }

    return jobCards.filter((c) => {
      const s = (c.status || '').toUpperCase();
      const st = (c.serviceType || '').toUpperCase();
      const isDeliveryOrReject = s.includes('DELIVER') || s.includes('READY') || s.includes('REJECT');
      const isBodyShop = s.includes('BODY') || st.includes('BODY');

      const assignments = c.workAssignments || c.assignmentHistory || [];

      if (key === 'MECHANICAL') {
        const mechInfo = getDeptAssignment(assignments, ['mechanical', 'mechanic', 'floor']);
        return !isBodyShop && !isDeliveryOrReject && mechInfo.mechanic !== null;
      }
      if (key === 'BODY_SHOP') {
        const bodyInfo = getDeptAssignment(assignments, ['body', 'paint', 'denting']);
        return isBodyShop && !isDeliveryOrReject && bodyInfo.mechanic !== null;
      }
      return false;
    }).length;
  };

  const filteredCards = jobCards.filter((card) => {
    const matchesSearch =
      card.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.vehicleNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.mobile.includes(searchQuery);

    const s = (card.status || '').toUpperCase();
    const st = (card.serviceType || '').toUpperCase();
    const isReadyForDelivery = s.includes('READY');
    const isBodyShop = s.includes('BODY') || st.includes('BODY');
    const isDeliveryOrReject = s.includes('DELIVER') || s.includes('READY') || s.includes('REJECT');

    const assignments = card.workAssignments || card.assignmentHistory || [];
    const mechInfo = getDeptAssignment(assignments, ['mechanical', 'mechanic', 'floor']);
    const bodyInfo = getDeptAssignment(assignments, ['body', 'paint', 'denting']);

    let matchesStatus = true;
    if (selectedStatusFilter === 'ALL') {
      matchesStatus = true;
    } else if (selectedStatusFilter === 'READY_FOR_DELIVERY') {
      matchesStatus = isReadyForDelivery;
    } else if (selectedStatusFilter === 'MECHANICAL') {
      matchesStatus = !isBodyShop && !isDeliveryOrReject && mechInfo.mechanic !== null;
    } else if (selectedStatusFilter === 'BODY_SHOP') {
      matchesStatus = isBodyShop && !isDeliveryOrReject && bodyInfo.mechanic !== null;
    }

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    if (status.includes('Ready for Delivery')) return { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' };
    if (status.includes('Pending')) return { bg: '#EEF2FF', text: colors.primary, border: '#C7D2FE' };
    if (status.includes('Progress')) return { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' };
    if (status.includes('Approved')) return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' };
    return { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0' };
  };

  const getWorkTypeStyle = (type) => {
    if (!type) return null;
    const t = type.toLowerCase();
    if (t === 'both') {
      return { bg: '#F3E8FF', text: '#9333EA', border: '#E9D5FF' };
    } else if (t === 'mechanic') {
      return { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' };
    } else if (t === 'body shop') {
      return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' };
    }
    return { bg: '#F1F5F9', text: '#475569', border: '#E2E8F0' };
  };

  const handleOpenAssignModal = (card) => {
    const isReady =
      selectedStatusFilter === 'READY_FOR_DELIVERY' ||
      String(card?.status || '').toUpperCase().includes('READY') ||
      String(card?.status || '').toUpperCase().includes('DELIVER');
    if (isReady) return;

    setSelectedCardForAssign(card);
    setAssignModalVisible(true);
  };

  const handleAssignSuccess = ({ jobCardNumber, technician, bay }) => {
    setJobCards((prevCards) =>
      prevCards.map((card) => {
        if (card.id === jobCardNumber || card.id === selectedCardForAssign?.id) {
          return {
            ...card,
            mechanic: technician || card.mechanic,
            bay: bay || card.bay,
            status: 'Mechanical Assigned',
          };
        }
        return card;
      })
    );
    setAssignModalVisible(false);
    setSelectedCardForAssign(null);
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Main Container */}
      <View style={styles.container}>
        <FloorSupervisorHeader title="Job Cards" />

        {/* Search Bar with Filter Icon */}
        <View style={styles.searchBar}>
          <Search size={16} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search vehicle, owner, mobile, job ID..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
            <Filter size={16} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Horizontal Filter Pill Tabs with Badges */}
        <View style={styles.tabsContainer}>
          <ScrollView
            ref={tabsScrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
          >
            {tabs.map((tab) => {
              const isActive = selectedStatusFilter === tab.key;
              const count = getTabCount(tab.key);

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabPill, isActive && styles.tabPillActive]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedStatusFilter(tab.key)}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                  <View
                    style={[
                    styles.tabBadge,
                    isActive ? styles.tabBadgeActive : styles.tabBadgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabBadgeText,
                      isActive
                        ? styles.tabBadgeTextActive
                        : styles.tabBadgeTextInactive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

        {/* Job Cards List */}
        {isLoading ? (
          <View style={styles.centerLoadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading Job Cards...</Text>
          </View>
        ) : filteredCards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <FileText size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No matching job cards found</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredCards.slice(0, visibleCount)}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 130 + insets.bottom }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[colors.primary]} />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.2}
            ListFooterComponent={() =>
              isLoadingMore ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              const statusStyle = getStatusColor(item.status);
              const assignments = item.workAssignments || item.assignmentHistory || [];

              let displayMechanic = item.mechanic;
              let displayBay = item.bay;

              if (selectedStatusFilter === 'MECHANICAL') {
                const mechInfo = getDeptAssignment(assignments, ['mechanical', 'mechanic', 'floor']);
                displayMechanic = mechInfo.mechanic || 'Unassigned';
                displayBay = mechInfo.bay || 'Unassigned';
              } else if (selectedStatusFilter === 'BODY_SHOP') {
                const bodyInfo = getDeptAssignment(assignments, ['body', 'paint', 'denting']);
                displayMechanic = bodyInfo.mechanic || 'Unassigned';
                displayBay = bodyInfo.bay || 'Unassigned';
              }

              const isReadyForDelivery =
                selectedStatusFilter === 'READY_FOR_DELIVERY' ||
                String(item.status || '').toUpperCase().includes('READY') ||
                String(item.status || '').toUpperCase().includes('DELIVER');

              return (
                <TouchableOpacity
                  style={styles.card}
                  activeOpacity={0.88}
                  onPress={() => {
                    console.log('List Page Clicked Item (Mapped Data):', JSON.stringify(item, null, 2));
                    navigation?.navigate('FloorJobCardViewScreen', {
                      card: item,
                      jobCardId: item.id,
                      department: selectedStatusFilter === 'BODY_SHOP' ? 'body-shop' : (selectedStatusFilter === 'MECHANICAL' ? 'mechanical' : null),
                      activeTab: selectedStatusFilter,
                    });
                  }}
                >
                  <View style={styles.cardHeader}>
                    {/* IND License Plate */}
                    <View style={styles.indPlateContainer}>
                      <View style={styles.indBlueBox}>
                        <View style={styles.indDot} />
                        <Text style={styles.indText}>IND</Text>
                      </View>
                      <View style={styles.plateNumberBox}>
                        <Text style={styles.plateNumberText}>
                          {formatVehicleNumber(item.vehicleNo)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.idGroup}>
                      <View style={styles.jobTagPill}>
                        <Text style={styles.jobTagText}>#{item.id}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Horizontal Divider Line with Space */}
                  <View style={styles.cardDivider} />

                  {/* Badges Row (Addl. Work and Work Type) */}
                  <View style={styles.statusRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {item.additionalWork && item.additionalWork.length > 0 && (
                        <View style={styles.addlWorkBadge}>
                          <Text style={styles.addlWorkText}>Addl. Work</Text>
                        </View>
                      )}
                    </View>

                    {item.workType && (() => {
                      const wtStyle = getWorkTypeStyle(item.workType);
                      return (
                        <View style={[styles.workTypeBadge, { backgroundColor: wtStyle.bg, borderColor: wtStyle.border }]}>
                          <Text style={[styles.workTypeText, { color: wtStyle.text }]}>{item.workType}</Text>
                        </View>
                      );
                    })()}
                  </View>

                  {/* Owner & Mobile */}
                  <View style={styles.detailsRow}>
                    <View style={styles.detailCol}>
                      <Text style={styles.detailLabel}>OWNER</Text>
                      <View style={styles.iconTextRow}>
                        <User size={12} color="#64748B" />
                        <Text style={styles.detailVal}>{item.owner}</Text>
                      </View>
                    </View>

                    <View style={styles.detailCol}>
                      <Text style={styles.detailLabel}>MOBILE</Text>
                      <View style={styles.iconTextRow}>
                        <Phone size={12} color="#64748B" />
                        <Text style={styles.detailVal}>{item.mobile}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Mechanic & Bay Badges (Disabled / non-interactive when Ready for Delivery) */}
                  <View style={styles.assignmentRow}>
                    <View style={styles.tagCol}>
                      <Text style={styles.detailLabel}>MECHANIC</Text>
                      <TouchableOpacity
                        style={[styles.tagBadge, displayMechanic !== 'Unassigned' && styles.tagBadgeActive]}
                        activeOpacity={isReadyForDelivery ? 1 : 0.7}
                        disabled={isReadyForDelivery}
                        onPress={() => !isReadyForDelivery && handleOpenAssignModal(item)}
                      >
                        <Wrench size={11} color={displayMechanic !== 'Unassigned' ? colors.primary : '#94A3B8'} />
                        <Text style={[styles.tagText, displayMechanic !== 'Unassigned' && styles.tagTextActive]}>
                          {displayMechanic}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.tagCol}>
                      <Text style={styles.detailLabel}>BAY</Text>
                      <TouchableOpacity
                        style={[styles.tagBadge, displayBay !== 'Unassigned' && styles.tagBadgeActiveGreen]}
                        activeOpacity={isReadyForDelivery ? 1 : 0.7}
                        disabled={isReadyForDelivery}
                        onPress={() => !isReadyForDelivery && handleOpenAssignModal(item)}
                      >
                        <Layers size={11} color={displayBay !== 'Unassigned' ? '#059669' : '#94A3B8'} />
                        <Text style={[styles.tagText, displayBay !== 'Unassigned' && styles.tagTextGreen]}>
                          {displayBay}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Status Badge (Moved below Mechanic and Bay) */}
                  <View style={{ marginBottom: 10 }}>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusStyle.bg, borderColor: statusStyle.border, alignSelf: 'flex-start' },
                      ]}
                    >
                      <View style={[styles.statusDot, { backgroundColor: statusStyle.text }]} />
                      <Text style={[styles.statusText, { color: statusStyle.text }]} numberOfLines={2}>
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  {/* Footer */}
                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.costLabel}>ESTIMATED COST</Text>
                      <RupeeFormatText style={styles.costVal}>{item.estCost}</RupeeFormatText>
                    </View>

                    <View style={styles.timeCol}>
                      <Calendar size={11} color="#64748B" style={{ marginRight: 4 }} />
                      <Text style={styles.createdText}>{item.created}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}

        {/* Assign Technician Modal Popup */}
        <AssignTechnicianModal
          visible={assignModalVisible}
          onClose={() => setAssignModalVisible(false)}
          jobCardNumber={selectedCardForAssign?.id || 'JC0044'}
          jobCardId={selectedCardForAssign?.jobCardId || selectedCardForAssign?.id}
          department={selectedStatusFilter === 'BODY_SHOP' ? 'body-shop' : 'mechanical'}
          onAssignSuccess={handleAssignSuccess}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerTitleCol: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 22,
    fontFamily: fonts.interBold,
    color: '#0F172A',
    fontWeight: '800',
  },
  screenSubtitle: {
    fontSize: 12,
    fontFamily: fonts.inter,
    color: '#94A3B8',
    marginTop: 1,
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySoft || '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  counterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  counterBadgeText: {
    fontSize: 12,
    fontFamily: fonts.interBold,
    color: colors.primary,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.inter,
    color: '#0F172A',
  },
  filterBtn: {
    padding: 4,
  },

  /* Horizontal Filter Tabs */
  tabsContainer: {
    marginBottom: 10,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    elevation: 1,
  },
  tabPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontFamily: fonts.interBold,
    color: '#475569',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  tabBadgeInactive: {
    backgroundColor: '#F1F5F9',
  },
  tabBadgeText: {
    fontSize: 10,
    fontFamily: fonts.interBold,
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },
  tabBadgeTextInactive: {
    color: '#64748B',
  },

  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 110,
    gap: 9,
  },

  /* Compact Card Styling */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  idGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  jobTagPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  jobTagText: {
    fontSize: 12,
    fontFamily: fonts.interBold,
    color: colors.primary,
  },
  indPlateContainer: {
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
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 1,
  },
  indDot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: '#F59E0B',
  },
  indText: {
    fontSize: 6.5,
    fontFamily: fonts.interBold,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  plateNumberBox: {
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  plateNumberText: {
    fontSize: 12.5,
    fontFamily: fonts.interBold,
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  moreBtn: {
    padding: 2,
    marginLeft: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11.5,
    fontFamily: fonts.interSemiBold,
  },
  addlWorkBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  addlWorkText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: fonts.interBold,
  },
  workTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  workTypeText: {
    fontSize: 10.5,
    fontFamily: fonts.interBold,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 8,
    fontFamily: fonts.interBold,
    color: '#94A3B8',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  iconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailVal: {
    fontSize: 12,
    fontFamily: fonts.interBold,
    color: '#334155',
  },
  assignmentRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  tagCol: {
    flex: 1,
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagBadgeActive: {
    backgroundColor: '#EEF2FF',
    borderColor: colors.primary,
  },
  tagBadgeActiveGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  tagText: {
    fontSize: 11,
    fontFamily: fonts.interMedium,
    color: '#64748B',
  },
  tagTextActive: {
    color: colors.primary,
    fontFamily: fonts.interSemiBold,
  },
  tagTextGreen: {
    color: '#059669',
    fontFamily: fonts.interSemiBold,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  costLabel: {
    fontSize: 8,
    fontFamily: fonts.interBold,
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
  costVal: {
    fontSize: 14,
    fontFamily: fonts.interBold,
    color: '#0F172A',
    marginTop: 1,
  },
  timeCol: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  createdText: {
    fontSize: 10.5,
    fontFamily: fonts.interMedium,
    color: '#64748B',
  },
  centerLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 70,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: fonts.interMedium,
    color: '#64748B',
    marginTop: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.interMedium,
    color: '#94A3B8',
    marginTop: 12,
  },

  /* Detail View Styles */
  detailHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 13,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  detailScroll: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  detailScrollContent: {
    padding: 14,
    paddingBottom: 110,
    gap: 12,
  },
  detailTitleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  titleAccentLine: {
    width: 4,
    height: 36,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginRight: 12,
  },
  detailTitle: {
    fontSize: 19,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  detailSubtitle: {
    fontSize: 11.5,
    fontFamily: fonts.inter,
    color: '#64748B',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 9.5,
    fontFamily: fonts.interBold,
    color: '#94A3B8',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  gridVal: {
    fontSize: 12.5,
    fontFamily: fonts.interMedium,
    color: '#334155',
  },
  gridValBold: {
    fontSize: 12.5,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  gridValPlate: {
    fontSize: 12.5,
    fontFamily: fonts.interBold,
    color: colors.primary,
  },
  gridValTeal: {
    fontSize: 12,
    fontFamily: fonts.interBold,
    color: '#0D9488',
  },
  iconValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  serviceTypeText: {
    fontSize: 10.5,
    fontFamily: fonts.interBold,
    color: '#475569',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  tableHeadText: {
    fontSize: 10,
    fontFamily: fonts.interBold,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableCellText: {
    fontSize: 12,
    fontFamily: fonts.interMedium,
    color: '#1E293B',
  },
  tableCellMuted: {
    fontSize: 12,
    fontFamily: fonts.interMedium,
    color: '#64748B',
  },
  tableCellBold: {
    fontSize: 12.5,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  statusPillSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  statusPillIndigo: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  statusPillOrange: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  statusPillGreen: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  smallDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusPillTextSmall: {
    fontSize: 10,
    fontFamily: fonts.interBold,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: fonts.interMedium,
    color: '#64748B',
  },
  summaryVal: {
    fontSize: 12.5,
    fontFamily: fonts.interSemiBold,
    color: '#1E293B',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  grandTotalVal: {
    fontSize: 17,
    fontFamily: fonts.interBold,
    color: colors.primary,
  },
  assignmentCountBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  assignmentCountText: {
    fontSize: 10.5,
    fontFamily: fonts.interBold,
    color: colors.primary,
  },
  assignedWorkBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
  },
  workTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  workUserCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workTitle: {
    fontSize: 12.5,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  workEmpText: {
    fontSize: 10.5,
    fontFamily: fonts.interMedium,
    color: '#64748B',
  },
  timeTrackContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  timeTrackCol: {
    flex: 1,
  },
  timeTrackLabel: {
    fontSize: 8.5,
    fontFamily: fonts.interBold,
    color: '#94A3B8',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  timeTrackValTeal: {
    fontSize: 11,
    fontFamily: fonts.interBold,
    color: '#0D9488',
  },
  timeTrackValMuted: {
    fontSize: 11,
    fontFamily: fonts.interMedium,
    color: '#64748B',
  },
});

export default FloorJobCardsScreen;
