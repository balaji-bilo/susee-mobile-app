import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Platform,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import RNFS from 'react-native-fs';
import Toast from 'react-native-simple-toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Car,
  FileText,
  User,
  Phone,
  Calendar,
  PlusCircle,
  Clock,
  Pencil,
  ChevronDown,
  ChevronUp,
  Mic,
  Play,
  Volume2,
  MoreVertical,
  Pause,
  VolumeX,
  MapPin,
  Image as LucideImage,
} from 'lucide-react-native';
import { colors, fonts } from '../../common/config/theme';
import { RupeeFormatText } from '../../common/components/RupeeFormatText';
import { retrieveEncryptedData } from '../../common/config/storage';
import { base_url } from '../../common/config/constant';
import { FloorJobCardSkeleton } from '../components/FloorJobCardSkeleton';

function formatVehicleNumber(num) {
  if (!num) return '';
  const clean = num.replace(/\s+/g, '').toUpperCase();
  const match = clean.match(/^([A-Z]{2})([0-9]{2})([A-Z]{1,3})([0-9]{1,4})$/);
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
  }
  return clean;
}

export function formatStatusLabel(status) {
  if (!status) return 'Pending';
  const norm = String(status).trim().toLowerCase().replace(/[\s_]+/g, '');
  if (norm === 'inprogress' || norm === 'ongoing') return 'In Progress';
  if (norm === 'completed' || norm === 'done') return 'Completed';
  if (norm === 'pending') return 'Pending';
  if (norm === 'assigned') return 'Assigned';
  if (norm === 'rejected' || norm === 'cancelled') return 'Rejected';
  if (norm === 'postponed') return 'Postponed';

  return String(status)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}

function getStatusBadgeConfig(statusName) {
  const norm = (statusName || '').toLowerCase().replace(/[\s_]+/g, '');

  if (norm.includes('completed') || norm === 'done') {
    return { bg: '#ECFDF5', border: '#A7F3D0', text: '#059669', dot: '#059669' };
  }
  if (norm.includes('inprogress') || norm.includes('ongoing')) {
    return { bg: '#EEF2FF', border: '#C7D2FE', text: '#4F46E5', dot: '#4F46E5' };
  }
  if (norm.includes('assigned')) {
    return { bg: '#E0F2FE', border: '#BAE6FD', text: '#0284C7', dot: '#0284C7' };
  }
  if (norm.includes('rejected') || norm.includes('cancelled')) {
    return { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', dot: '#DC2626' };
  }
  if (norm.includes('postponed')) {
    return { bg: '#F1F5F9', border: '#CBD5E1', text: '#64748B', dot: '#64748B' };
  }

  // Default (Pending, etc.)
  return { bg: '#FFFBEB', border: '#FDE68A', text: '#D97706', dot: '#D97706' };
}

export function FloorJobCardViewScreen({ route, navigation }) {
  const { card: navCard } = route?.params || {};

  // Accordion state for Assigned Work Item (defaults to open for first item)
  const [expandedWorkId, setExpandedWorkId] = useState('w1');
  // Accordion state for Approvals
  const [expandedApprovalId, setExpandedApprovalId] = useState('INIT');

  // Audio Playback State
  const [audioRecorderPlayer] = useState(() => new AudioRecorderPlayer());
  const [playingId, setPlayingId] = useState(null);
  const [playTime, setPlayTime] = useState('00:00');
  const [duration, setDuration] = useState('00:00');
  const [playProgress, setPlayProgress] = useState('0%');
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = async () => {
    try {
      if (isMuted) {
        await audioRecorderPlayer.setVolume(1.0);
        setIsMuted(false);
      } else {
        await audioRecorderPlayer.setVolume(0.0);
        setIsMuted(true);
      }
    } catch (err) {
      console.log('Mute error:', err);
    }
  };

  const handleDownload = (url, approvalCode) => {
    if (!url) {
      Toast.show('No audio URL found', Toast.SHORT);
      return;
    }

    Alert.alert(
      "Download Audio",
      "Do you want to download this voice note to your phone?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Download",
          onPress: async () => {
            try {
              Toast.show('Downloading audio...', Toast.SHORT);

              let rawFileName = url.substring(url.lastIndexOf('/') + 1) || '';
              rawFileName = rawFileName.split('?')[0]; // Strip URL parameters
              if (!rawFileName || !rawFileName.includes('.')) {
                rawFileName = `VoiceNote_${approvalCode || 'Audio'}.mp3`;
              } else {
                rawFileName = `VoiceNote_${approvalCode || 'Audio'}_${rawFileName}`;
              }
              const fileName = rawFileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');

              // Android standard downloads directory
              const downloadDest = `${RNFS.DownloadDirectoryPath}/${fileName}`;

              const result = await RNFS.downloadFile({
                fromUrl: url,
                toFile: downloadDest,
              }).promise;

              if (result.statusCode === 200) {
                if (Platform.OS === 'android') {
                  try {
                    await RNFS.scanFile(downloadDest);
                  } catch (scanErr) {
                    console.log('Scan error:', scanErr);
                  }
                }
                Toast.show(`Saved to Downloads folder!`, Toast.LONG);
              } else {
                Toast.show(`Failed to download (Status: ${result.statusCode})`, Toast.LONG);
              }
            } catch (err) {
              console.log('Download error:', err);
              Toast.show('Error downloading file', Toast.LONG);
            }
          }
        }
      ]
    );
  };

  const onStartPlay = async (url, id) => {
    try {
      if (playingId) {
        await audioRecorderPlayer.stopPlayer();
        audioRecorderPlayer.removePlayBackListener();
      }
      setPlayingId(id);
      setPlayTime('00:00');
      setDuration('...');
      setPlayProgress('0%');

      if (!url) {
        setPlayingId(null);
        setDuration('00:00');
        return;
      }

      // Download file to cache to bypass Android streaming duration limitations
      let rawFileName = url.substring(url.lastIndexOf('/') + 1) || '';
      rawFileName = rawFileName.split('?')[0]; // Strip URL parameters
      const fileName = rawFileName.replace(/[^a-zA-Z0-9.\-_]/g, '_') || `audio_${id}.mp3`;
      const localPath = `${RNFS.CachesDirectoryPath}/${fileName}`;

      const fileExists = await RNFS.exists(localPath);
      if (!fileExists) {
        const downloadResult = await RNFS.downloadFile({
          fromUrl: url,
          toFile: localPath,
        }).promise;

        if (downloadResult.statusCode !== 200) {
          throw new Error('Failed to download audio file');
        }
      }

      setDuration('00:00');

      await audioRecorderPlayer.startPlayer(localPath);
      audioRecorderPlayer.addPlayBackListener((e) => {
        setPlayTime(audioRecorderPlayer.mmssss(Math.floor(e.currentPosition)).substring(0, 5));
        setDuration(audioRecorderPlayer.mmssss(Math.floor(e.duration)).substring(0, 5));

        let progress = 0;
        if (e.duration > 0) {
          progress = (e.currentPosition / e.duration) * 100;
        }
        setPlayProgress(`${Math.min(progress, 100)}%`);

        if (e.currentPosition >= e.duration && e.duration > 0) {
          audioRecorderPlayer.stopPlayer();
          audioRecorderPlayer.removePlayBackListener();
          setPlayingId(null);
          setPlayTime('00:00');
          setPlayProgress('0%');
        }
      });
    } catch (err) {
      console.log('Play error:', err);
      setPlayingId(null);
      setPlayTime('00:00');
      setDuration('00:00');
    }
  };

  const onPausePlay = async () => {
    try {
      await audioRecorderPlayer.pausePlayer();
      setPlayingId(null);
    } catch (err) {
      console.log('Pause error:', err);
    }
  };

  // Fallback data matching desktop view (JC0052)
  const defaultCard = {
    id: 'JC0052',
    vehicleNo: 'TN78UI9012',
    owner: 'Sutha',
    mobile: '8523691476',
    brandModel: 'Tata Tata567 Tata67',
    expectedDelivery: '04 Sep 2026, 03:48 PM',
    serviceType: 'SERVICE',
    status: 'Mechanical In Progress',
    mechanic: 'sakthivel',
    bay: 'Test001',
    estCost: '₹1,485',
    created: '23 Sep 2026, 02:09 PM',
    selectedServices: [
      { id: '1', name: 'Armrest', qty: 'x1', status: 'In Progress', rate: '₹350' },
      { id: '2', name: 'Door Dent', qty: 'x1', status: 'Pending', rate: '₹1,000' },
    ],
    additionalWork: [
      { id: 'a1', name: 'Brake shoe', status: 'Pending', rate: '₹800' },
    ],
    estimateSummary: {
      baseSubtotal: '₹550',
      additionalWork: '₹800',
      tax: '₹135',
      grandTotal: '₹1,485',
    },
    assignedWork: [
      {
        id: 'w1',
        serviceName: 'Armrest',
        empName: 'huka - EMP0012',
        status: 'In Progress',
        startTime: '23 Sep 2026, 02:48 PM',
        endTime: 'Not Started',
      },
    ],
    jobProgressSteps: [
      { id: 1, title: 'Vehicle Entry', desc: '24 Sep 2026, 09:40 AM · Gate Security', status: 'completed' },
      { id: 2, title: 'Job Card Created', desc: '24 Sep 2026, 09:40 AM · CRM Team · ₹6,325 est.', status: 'completed' },
      { id: 3, title: 'Mechanical Work', desc: 'Assigned to fathima · bay7009', status: 'active' },
      { id: 4, title: 'Customer Approvals', desc: 'Pending — 3 items awaiting', status: 'active' },
      { id: 5, title: 'Body Shop', desc: 'Body Shop Work Completed', status: 'completed' },
      { id: 6, title: 'Vehicle Delivery', desc: 'Expected: 29 Sep 2026, 05:00 PM', status: 'pending' },
    ]
  };

  const directJobCardId = route?.params?.jobCardId;
  const initialCard = navCard || (directJobCardId ? { id: directJobCardId, jobCardId: directJobCardId, vehicleNo: route?.params?.vehicleNo || '' } : defaultCard);

  const [cardData, setCardData] = useState(initialCard);
  const [servicesList, setServicesList] = useState(
    initialCard?.selectedServices || []
  );
  const [additionalWorkList, setAdditionalWorkList] = useState(
    initialCard?.additionalWork || []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchJobCardDetail = async (isRefresh = false) => {
    const jcId = directJobCardId || navCard?.jobCardId || navCard?.id || cardData?.jobCardId || cardData?.id;
    if (!jcId) {
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    if (isRefresh) {
      setIsRefreshing(true);
    }

    try {
      const token = await retrieveEncryptedData('token');
      const res = await axios.get(`${base_url}/job-cards/detail/${jcId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success && res.data?.data) {
        const item = res.data.data;
        const taxRate = item.billing?.taxRate ?? item.taxRate ?? 18;
        const servicesListRaw = item.services || [];

        const formatServiceItem = (s) => {
          const rawPrice = s.price !== undefined ? s.price : (s.rate || 0);
          const numPrice = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0;
          const statusText = s.serviceStatus?.statusName || s.serviceStatus?.statusCode || s.approvalStatus?.statusName || s.approvalStatus?.statusCode || s.status || 'Pending';
          const approvalCode = String(s.approvalStatus?.statusCode || s.approvalStatus || (s.isAdditional ? 'PENDING' : 'APPROVED')).toUpperCase();
          const serviceCode = String(s.serviceStatus?.statusCode || s.status || 'PENDING').toUpperCase();
          return {
            id: s.id,
            name: s.serviceName || s.name || s.serviceItem?.name || 'Unknown Service',
            qty: `x${s.quantity || 1}`,
            status: statusText,
            rate: `₹${numPrice.toLocaleString('en-IN')}`,
            isAdditional: Boolean(s.isAdditional),
            approvalStatusCode: approvalCode,
            serviceStatusCode: serviceCode,
            category: s.serviceItem?.category?.name || s.category || '',
            categorySlug: s.serviceItem?.category?.slug || s.categorySlug || '',
            isCompleted: serviceCode.includes('COMPLETED') || serviceCode.includes('DONE'),
          };
        };

        const rawInitial = servicesListRaw.filter(s => !s.isAdditional);
        const rawAddl = servicesListRaw.filter(s => s.isAdditional);

        const selServices = servicesListRaw.map(formatServiceItem);
        const addlServices = rawAddl.map(formatServiceItem);

        const validInitial = rawInitial.filter(s => s.serviceStatus?.statusCode !== 'REJECTED' && s.serviceStatus?.statusCode !== 'CANCELLED');
        const initialSum = validInitial.reduce((sum, s) => sum + (Number(s.price || 0) * Number(s.quantity || 1)), 0);

        const validAddl = rawAddl.filter(s => s.serviceStatus?.statusCode !== 'REJECTED' && s.serviceStatus?.statusCode !== 'CANCELLED');
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

        const serverOrigin = base_url.replace(/\/api\/?$/, '');

        const formattedApprovals = (item.approvals || []).map(a => {
          let rawVoiceNoteUrl = a.voice_note_url || a.voiceNoteUrl || '';
          if (rawVoiceNoteUrl && !rawVoiceNoteUrl.startsWith('http') && !rawVoiceNoteUrl.startsWith('data:')) {
            rawVoiceNoteUrl = `${serverOrigin}${rawVoiceNoteUrl.startsWith('/') ? '' : '/'}${rawVoiceNoteUrl}`;
          }
          return {
            id: a.id,
            approvalCode: a.approvalCode || `AW${a.id}`,
            status: a.status?.statusCode || a.customerResponse || 'Pending',
            explanation: a.mechanicExplanation || '',
            voiceNoteUrl: rawVoiceNoteUrl,
            createdAt: a.createdAt ? new Date(a.createdAt).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '',
          };
        });

        const createdDate = item.createdAt ? new Date(item.createdAt).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'Pending';
        const entryDate = item.gateEntry?.entryTime ? new Date(item.gateEntry.entryTime).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : createdDate;
        const estCostString = `₹${(grandTotal || item.totalEstimate || 0).toLocaleString('en-IN')}`;
        const expDel = item.expectedDeliveryAt ? new Date(item.expectedDeliveryAt).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : 'Pending';
        const entryActor = item.gateEntry?.createdByUser?.fullName || item.gateEntry?.enteredBy?.fullName || 'Gate Security';
        const creatorActor = item.advisor?.fullName || item.createdByUser?.fullName || 'CRM Team';

        // ── Exact web-matching job progress logic (mirrors JobCardDetailPage.jsx) ──
        const _isServiceBodyshop = (s) => {
          const cat = String(s.categorySlug || s.serviceItem?.category?.slug || s.category?.slug || s.serviceItem?.category?.name || s.category?.name || '').toLowerCase();
          if (cat && (cat.includes('body') || cat.includes('mechanic'))) return cat.includes('body');
          const name = String(s.serviceName || s.name || s.serviceItem?.name || '').toLowerCase();
          return name.includes('body') || name.includes('denting') || name.includes('paint');
        };
        const _isAssignmentBodyshop = (a) => {
          const cat = String(a.jobCardService?.serviceItem?.category?.slug || a.service?.category?.slug || a.jobCardService?.serviceItem?.category?.name || a.service?.category?.name || '').toLowerCase();
          if (cat && (cat.includes('body') || cat.includes('mechanic'))) return cat.includes('body');
          return cat.includes('body') || cat.includes('denting') || cat.includes('paint');
        };
        const _getAssignmentStatusValue = (a) => {
          const code = String(a?.status?.statusCode || a?.status?.code || '').toUpperCase();
          if (code.includes('ON_HOLD') || code.includes('POSTPONED')) return 'ON_HOLD';
          if (code.includes('COMPLETED')) return 'COMPLETED';
          if (code.includes('IN_PROGRESS')) return 'IN_PROGRESS';
          return 'ASSIGNED';
        };

        const tlAllServices = (item.services || []).map(s => ({
          name: s.serviceName || s.serviceItem?.name || s.name || 'Unknown',
          status: s.serviceStatus?.statusCode || s.serviceStatus?.code || s.status || 'PENDING',
          categorySlug: s.categorySlug || s.category?.slug || s.serviceItem?.category?.slug || '',
          category: s.category || s.serviceItem?.category,
          serviceItem: s.serviceItem,
          isAdditional: !!s.isAdditional,
        }));
        const tlAssignments = (item.workAssignments || []).filter(a => a?.assignedUser || a?.jobCardService || a?.service);

        const _hasBodyshopWork = tlAllServices.some(_isServiceBodyshop) || tlAssignments.some(_isAssignmentBodyshop);
        const _hasMechanicalWork = tlAllServices.some(s => !_isServiceBodyshop(s)) || tlAssignments.some(a => !_isAssignmentBodyshop(a));

        const _mechAssignments = tlAssignments.filter(a => !_isAssignmentBodyshop(a));
        const _bodyAssignments = tlAssignments.filter(a => _isAssignmentBodyshop(a));

        const _isMechDone = _hasMechanicalWork && (
          _mechAssignments.length > 0
            ? _mechAssignments.every(a => !!a.completedAt || _getAssignmentStatusValue(a) === 'COMPLETED')
            : tlAllServices.filter(s => !_isServiceBodyshop(s)).every(s => s.status === 'COMPLETED' || s.status === 'REJECTED')
        );
        const _isBodyDone = _hasBodyshopWork && (
          _bodyAssignments.length > 0
            ? _bodyAssignments.every(a => !!a.completedAt || _getAssignmentStatusValue(a) === 'COMPLETED')
            : tlAllServices.filter(s => _isServiceBodyshop(s)).every(s => s.status === 'COMPLETED' || s.status === 'REJECTED')
        );
        const _isMechActive = _mechAssignments.some(a => { const st = _getAssignmentStatusValue(a); return st === 'IN_PROGRESS' || st === 'ASSIGNED'; });
        const _isBodyActive = _bodyAssignments.some(a => { const st = _getAssignmentStatusValue(a); return st === 'IN_PROGRESS' || st === 'ASSIGNED'; });
        const _isMechPostponed = tlAllServices.filter(s => !_isServiceBodyshop(s)).some(s => s.status === 'POSTPONED');
        const _isBodyPostponed = tlAllServices.filter(s => _isServiceBodyshop(s)).some(s => s.status === 'POSTPONED');
        const _isMechWorking = _mechAssignments.some(a => a.startedAt || _getAssignmentStatusValue(a) === 'IN_PROGRESS');
        const _isBodyWorking = _bodyAssignments.some(a => a.startedAt || _getAssignmentStatusValue(a) === 'IN_PROGRESS');

        const _mechState = !_hasMechanicalWork ? 'completed'
          : (_isMechDone ? 'completed' : (_isMechActive ? 'active' : (_mechAssignments.length === 0 ? 'in_progress' : 'pending')));
        const _bodyState = !_hasBodyshopWork ? 'completed'
          : (_isBodyDone ? 'completed' : (_isBodyActive ? 'active' : (_bodyAssignments.length === 0 ? 'in_progress' : 'pending')));

        const _pendingApprovals = (item.approvals || []).filter(a => String(a.statusCode || a.customerResponse || a.status || '').toUpperCase().includes('PENDING')).length;
        const _isDelivered = String(item.currentStatus?.statusCode || item.status || '').toUpperCase().includes('DELIVERED');
        const _deliveryState = _isDelivered ? 'completed'
          : ((!_hasMechanicalWork || _isMechDone) && (!_hasBodyshopWork || _isBodyDone) && _pendingApprovals === 0 ? 'active' : 'pending');

        const _activeMech = _mechAssignments.find(a => !a.completedAt) || _mechAssignments[0] || {};
        const _mechName = _activeMech.assignedUser?.fullName || 'Unassigned';
        const _mechBay = _activeMech.bay?.bayName || _activeMech.bay?.bayCode || _activeMech.bay?.name || '—';
        const _activeBody = _bodyAssignments.find(a => !a.completedAt) || _bodyAssignments[0] || {};
        const _bodyName = _activeBody.assignedUser?.fullName || 'Unassigned';
        const _additionalSvcs = tlAllServices.filter(s => s.isAdditional);

        const newJobProgressSteps = [
          {
            id: 1, title: 'Vehicle Entry',
            desc: `${entryDate} · ${entryActor}`,
            status: 'completed',
          },
          {
            id: 2, title: 'Job Card Created',
            desc: `${createdDate} · ${creatorActor} · ${estCostString} est.`,
            status: 'completed',
          },
          {
            id: 3, title: 'Mechanical Work',
            desc: !_hasMechanicalWork ? 'N/A (No Mechanical Services)'
              : (_isMechDone ? 'Mechanical Work Completed'
                : (_isMechPostponed ? 'Postponed'
                  : (_mechAssignments.length > 0
                    ? (_isMechWorking ? `In Progress by ${_mechName}` : `Assigned to ${_mechName}${_mechBay !== '—' ? ` · ${_mechBay}` : ''}`)
                    : 'Pending Assignment'))),
            status: _mechState,
          },
          {
            id: 4, title: 'Customer Approvals',
            desc: _pendingApprovals > 0
              ? `Pending — ${_pendingApprovals} item${_pendingApprovals > 1 ? 's' : ''} awaiting`
              : (_additionalSvcs.length > 0 ? 'All additional work approved' : 'No pending approval'),
            status: _pendingApprovals > 0 ? 'active' : 'completed',
          },
          {
            id: 5, title: 'Body Shop',
            desc: !_hasBodyshopWork ? 'N/A (No Body Shop Services)'
              : (_isBodyDone ? 'Body Shop Work Completed'
                : (_isBodyPostponed ? 'Postponed'
                  : (_bodyAssignments.length > 0
                    ? (_isBodyWorking ? `In Progress by ${_bodyName}` : `Assigned to ${_bodyName}`)
                    : 'Pending Body Shop Work'))),
            status: _bodyState,
          },
          {
            id: 6, title: 'Vehicle Delivery',
            desc: _isDelivered ? 'Vehicle Delivered'
              : (_deliveryState === 'active'
                ? `Ready for Delivery — Expected: ${expDel}`
                : `Expected: ${expDel}`),
            status: _deliveryState,
          },
        ];

        setCardData(prev => ({
          ...prev,
          id: item.jobCardNo || prev.id,
          jobCardId: item.id,
          vehicleNo: item.vehicle?.registrationNo || prev.vehicleNo,
          owner: item.customer?.fullName || prev.owner,
          mobile: item.customer?.mobileNo || prev.mobile,
          brandModel: `${item.vehicle?.brand?.name || ''} ${item.vehicle?.model || ''}`.trim() || prev.brandModel,
          expectedDelivery: expDel,
          status: item.currentStatus?.statusName || prev.status,
          approvals: formattedApprovals,
          estimateSummary: {
            baseSubtotal: `₹${baseSub.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
            additionalWork: `₹${addlSum.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
            tax: `₹${totalTax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
            grandTotal: `₹${grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
          },
          jobProgressSteps: newJobProgressSteps,
        }));

        setServicesList(selServices);
        setAdditionalWorkList(addlServices);
      }
    } catch (err) {
      console.error('Failed to fetch job card detail:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchJobCardDetail();
    }, [navCard?.id, navCard?.jobCardId])
  );

  useEffect(() => {
    if (route?.params?.updatedServices) {
      setServicesList(route.params.updatedServices);
    }
    if (route?.params?.updatedAdditionalWork) {
      setAdditionalWorkList(route.params.updatedAdditionalWork);
    }
  }, [route?.params?.updatedServices, route?.params?.updatedAdditionalWork]);

  const card = cardData;
  const jobProgressSteps = card.jobProgressSteps || defaultCard.jobProgressSteps;
  const services = servicesList;
  const additionalWork = additionalWorkList;
  const estimate = card.estimateSummary || defaultCard.estimateSummary;
  const assignedWork = card.assignedWork || defaultCard.assignedWork;

  const insets = useSafeAreaInsets();
  const safeTop = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0);
  const topPadding = safeTop + 6;

  const isReadyForDelivery =
    route?.params?.activeTab === 'READY_FOR_DELIVERY' ||
    String(card.status || '').toUpperCase().includes('READY') ||
    String(card.status || '').toUpperCase().includes('DELIVER');

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Navigation Header Bar */}
      <View style={[styles.detailHeaderBar, { paddingTop: topPadding }]}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation?.goBack()}
        >
          <ArrowLeft size={19} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitleText}>Job Card Details</Text>
        </View>
      </View>

      {isLoading ? (
        <FloorJobCardSkeleton />
      ) : (
        <ScrollView
          style={styles.detailScroll}
          contentContainerStyle={[styles.detailScrollContent, { paddingBottom: 40 + insets.bottom }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchJobCardDetail(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {/* Main Title Container */}
          <View style={styles.detailTitleCard}>
            <View style={styles.titleAccentLine} />
            <View style={{ flex: 1 }}>
              <Text style={styles.detailTitle}>Job Card: {card.id}</Text>
              <Text style={styles.detailSubtitle}>Created on {card.created}</Text>
            </View>
            <TouchableOpacity
              style={styles.imagesBtn}
              activeOpacity={0.7}
              onPress={() => navigation?.navigate('JobCardImagesScreen', { cardId: card.id, photos: card.photos })}
            >
              <LucideImage size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          {/* JOB PROGRESS */}

          {/* 1. Vehicle & Owner Details */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Car size={16} color="#0D9488" style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>Vehicle & Owner Details</Text>
            </View>

            <View style={styles.gridContainer}>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Owner Name</Text>
                <View style={styles.iconValRow}>
                  <User size={13} color="#64748B" />
                  <Text style={styles.gridVal}>{card.owner}</Text>
                </View>
              </View>

              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Mobile Number</Text>
                <Text style={styles.gridValBold}>{card.mobile}</Text>
              </View>
            </View>

            <View style={[styles.gridContainer, { marginTop: 12 }]}>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Registration Number</Text>
                <Text style={styles.gridValPlate}>{formatVehicleNumber(card.vehicleNo)}</Text>
              </View>

              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Brand & Model</Text>
                <Text style={styles.gridVal}>{card.brandModel || 'Tata Tata567 Tata67'}</Text>
              </View>
            </View>

            <View style={[styles.gridContainer, { marginTop: 12 }]}>
              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Expected Delivery Date</Text>
                <View style={styles.iconValRow}>
                  <Calendar size={13} color="#0D9488" />
                  <Text style={styles.gridValTeal}>
                    {card.expectedDelivery || '04 Sep 2026, 03:48 PM'}
                  </Text>
                </View>
              </View>

              <View style={styles.gridCol}>
                <Text style={styles.gridLabel}>Service Type</Text>
                <View style={styles.serviceTypeBadge}>
                  <Text style={styles.serviceTypeText}>{card.serviceType || 'SERVICE'}</Text>
                </View>
              </View>
            </View>
          </View>
          <JobProgressTimeline steps={jobProgressSteps} />

          {/* 2. Selected Services */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <FileText size={16} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>Selected Services</Text>
              </View>
              {!isReadyForDelivery && (
                <TouchableOpacity
                  style={styles.editSectionBtn}
                  activeOpacity={0.7}
                  onPress={() =>
                    navigation?.navigate('EditSelectedServicesScreen', {
                      card: { ...card, selectedServices: services },
                      onSaveServices: (newServices) => {
                        setServicesList(newServices);
                        setAdditionalWorkList(prevAddl =>
                          prevAddl.map(item => {
                            const match = newServices.find(s => s.id === item.id);
                            return match ? { ...item, status: match.status } : item;
                          })
                        );
                        fetchJobCardDetail();
                      },
                    })
                  }
                >
                  <Pencil size={12} color={colors.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.editSectionBtnText}>Edit Status</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeadText, { flex: 2 }]}>Service Description</Text>
              <Text style={[styles.tableHeadText, { flex: 1, textAlign: 'center' }]}>Qty</Text>
              <Text style={[styles.tableHeadText, { flex: 1.5, textAlign: 'center' }]}>Status</Text>
              <Text style={[styles.tableHeadText, { flex: 1, textAlign: 'right' }]}>Rate</Text>
            </View>

            {services.map((item, idx) => {
              const stBadge = getStatusBadgeConfig(item.status);
              return (
                <View
                  key={item.id || idx}
                  style={[
                    styles.tableRow,
                    idx === services.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <Text style={[styles.tableCellText, { flex: 2 }]}>{item.name}</Text>
                  <Text style={[styles.tableCellMuted, { flex: 1, textAlign: 'center' }]}>
                    {item.qty || 'x1'}
                  </Text>
                  <View style={{ flex: 1.5, alignItems: 'center' }}>
                    <View
                      style={[
                        styles.statusPillSmall,
                        {
                          backgroundColor: stBadge.bg,
                          borderColor: stBadge.border,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.smallDot,
                          { backgroundColor: stBadge.dot },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusPillTextSmall,
                          { color: stBadge.text },
                        ]}
                      >
                        {formatStatusLabel(item.status)}
                      </Text>
                    </View>
                  </View>
                  <RupeeFormatText style={[styles.tableCellBold, { flex: 1, textAlign: 'right' }]}>
                    {item.rate}
                  </RupeeFormatText>
                </View>
              );
            })}
          </View>

          {/* 3. Additional Work & Services (Always displayed so user can add additional work anytime) */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <PlusCircle size={16} color="#059669" style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>Additional Work & Services</Text>
              </View>
              {!isReadyForDelivery && (
                <TouchableOpacity
                  style={styles.editSectionBtn}
                  activeOpacity={0.7}
                  onPress={() =>
                    navigation?.navigate('AddAdditionalWorkScreen', {
                      card: { ...card, currentServices: services },
                      department: route?.params?.department || null,
                      activeTab: route?.params?.activeTab || null,
                      onSaveAdditionalWork: (newItems) => {
                        setAdditionalWorkList(prev => [...prev, ...newItems]);
                        setServicesList(prev => {
                          const existingIds = new Set(prev.map(p => p.id));
                          const toAdd = newItems.filter(item => !existingIds.has(item.id)).map(item => ({
                            ...item,
                            qty: item.qty || 'x1',
                          }));
                          return [...prev, ...toAdd];
                        });
                        fetchJobCardDetail();
                      },
                    })
                  }
                >
                  <Pencil size={12} color="#059669" style={{ marginRight: 4 }} />
                  <Text style={[styles.editSectionBtnText, { color: '#059669' }]}>
                    {additionalWork && additionalWork.length > 0 ? 'Edit / Add' : '+ Add Work'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {additionalWork && additionalWork.length > 0 ? (
              <>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeadText, { flex: 2.5 }]}>Service Description</Text>
                  <Text style={[styles.tableHeadText, { flex: 1.5, textAlign: 'center' }]}>Status</Text>
                  <Text style={[styles.tableHeadText, { flex: 1, textAlign: 'right' }]}>Rate</Text>
                </View>

                {additionalWork.map((item, idx) => {
                  const stBadge = getStatusBadgeConfig(item.status);
                  return (
                    <View
                      key={item.id || idx}
                      style={[
                        styles.tableRow,
                        idx === additionalWork.length - 1 && { borderBottomWidth: 0 },
                      ]}
                    >
                      <Text style={[styles.tableCellText, { flex: 2.5 }]}>{item.name}</Text>
                      <View style={{ flex: 1.5, alignItems: 'center' }}>
                        <View
                          style={[
                            styles.statusPillSmall,
                            {
                              backgroundColor: stBadge.bg,
                              borderColor: stBadge.border,
                              borderWidth: 1,
                            },
                          ]}
                        >
                          <View style={[styles.smallDot, { backgroundColor: stBadge.dot }]} />
                          <Text
                            style={[
                              styles.statusPillTextSmall,
                              { color: stBadge.text },
                            ]}
                          >
                            {formatStatusLabel(item.status)}
                          </Text>
                        </View>
                      </View>
                      <RupeeFormatText style={[styles.tableCellBold, { flex: 1, textAlign: 'right' }]}>
                        {item.rate}
                      </RupeeFormatText>
                    </View>
                  );
                })}
              </>
            ) : (
              <View style={{ paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 12.5, fontFamily: fonts.inter, color: '#94A3B8' }}>
                  No additional work requested yet.
                </Text>
                {!isReadyForDelivery && (
                  <TouchableOpacity
                    style={[styles.editSectionBtn, { marginTop: 10, paddingHorizontal: 14, paddingVertical: 6 }]}
                    activeOpacity={0.7}
                    onPress={() =>
                      navigation?.navigate('AddAdditionalWorkScreen', {
                        card: { ...card, currentServices: services },
                        department: route?.params?.department || null,
                        activeTab: route?.params?.activeTab || null,
                        onSaveAdditionalWork: (newItems) => {
                          setAdditionalWorkList(prev => [...prev, ...newItems]);
                          setServicesList(prev => {
                            const existingIds = new Set(prev.map(p => p.id));
                            const toAdd = newItems.filter(item => !existingIds.has(item.id)).map(item => ({
                              ...item,
                              qty: item.qty || 'x1',
                            }));
                            return [...prev, ...toAdd];
                          });
                          fetchJobCardDetail();
                        },
                      })
                    }
                  >
                    <PlusCircle size={13} color="#059669" style={{ marginRight: 5 }} />
                    <Text style={[styles.editSectionBtnText, { color: '#059669' }]}>+ Add Additional Work</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderBetween}>
              <Text style={styles.sectionTitle}>Estimate Summary</Text>
              <View style={[styles.statusPillSmall, styles.statusPillIndigo]}>
                <View style={[styles.smallDot, { backgroundColor: '#4F46E5' }]} />
                <Text style={[styles.statusPillTextSmall, { color: '#4F46E5' }]}>
                  {card.status || 'Mechanical In Progress'}
                </Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Base Subtotal</Text>
              <RupeeFormatText style={styles.summaryVal}>{estimate.baseSubtotal}</RupeeFormatText>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Additional Work</Text>
              <RupeeFormatText style={styles.summaryVal}>{estimate.additionalWork}</RupeeFormatText>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (10%)</Text>
              <RupeeFormatText style={styles.summaryVal}>{estimate.tax}</RupeeFormatText>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryTotalRow}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <RupeeFormatText style={styles.grandTotalVal}>{estimate.grandTotal}</RupeeFormatText>
            </View>
          </View>
          {/* 3.5 Additional Work Messages & Voice Notes */}
          {card.approvals && card.approvals.filter(a => a.explanation || a.voiceNoteUrl).length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Mic size={16} color="#0D9488" style={{ marginRight: 6 }} />
                <Text style={styles.sectionTitle}>Additional Work Messages & Voice Notes</Text>
              </View>

              {card.approvals.filter(a => a.explanation || a.voiceNoteUrl).map((approval, idx) => {
                const itemId = approval.id || String(idx);
                const isExpanded = expandedApprovalId === 'INIT' ? idx === 0 : expandedApprovalId === itemId;

                return (
                  <View key={itemId} style={[styles.voiceNoteCard, { marginBottom: 12 }]}>
                    <TouchableOpacity
                      style={[styles.voiceNoteHeader, !isExpanded && { marginBottom: 0 }]}
                      activeOpacity={0.7}
                      onPress={() => setExpandedApprovalId(isExpanded ? null : itemId)}
                    >
                      <View>
                        <Text style={styles.approvalReqText}>APPROVAL REQUEST: {approval.approvalCode}</Text>
                        <Text style={styles.voiceNoteDate}>{approval.createdAt}</Text>
                      </View>
                      <View>
                        {isExpanded ? <ChevronUp size={18} color="#64748B" /> : <ChevronDown size={18} color="#64748B" />}
                      </View>
                    </TouchableOpacity>

                    {isExpanded && (
                      <View>
                        {approval.explanation ? (
                          <>
                            <Text style={styles.voiceNoteLabel}>Explanation / Message</Text>
                            <View style={styles.voiceNoteMsgBox}>
                              <Text style={styles.voiceNoteMsgText}>{approval.explanation}</Text>
                            </View>
                          </>
                        ) : null}

                        {approval.voiceNoteUrl ? (
                          <View style={styles.audioPlayerBox}>
                            <View style={styles.audioPlayerHeader}>
                              <Mic size={12} color="#059669" style={{ marginRight: 4 }} />
                              <Text style={styles.audioPlayerTitle}>Recorded Voice Note Audio:</Text>
                            </View>

                            <View style={styles.audioControlsRow}>
                              <TouchableOpacity
                                style={styles.playBtn}
                                onPress={() => {
                                  const isThisPlaying = playingId === itemId;
                                  if (isThisPlaying) {
                                    onPausePlay();
                                  } else {
                                    onStartPlay(approval.voiceNoteUrl, itemId);
                                  }
                                }}
                              >
                                {playingId === itemId ? (
                                  <Pause size={16} color="#0F172A" fill="#0F172A" />
                                ) : (
                                  <Play size={16} color="#0F172A" fill="#0F172A" />
                                )}
                              </TouchableOpacity>
                              <Text style={styles.audioTimeText}>
                                {playingId === itemId ? `${playTime} / ${duration}` : '00:00 / 00:00'}
                              </Text>

                              <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: playingId === itemId ? playProgress : '0%' }]} />
                              </View>

                              <TouchableOpacity onPress={toggleMute} style={{ marginLeft: 8, padding: 4 }}>
                                {isMuted ? (
                                  <VolumeX size={16} color="#0F172A" />
                                ) : (
                                  <Volume2 size={16} color="#0F172A" />
                                )}
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleDownload(approval.voiceNoteUrl, approval.approvalCode)} style={{ marginLeft: 4, padding: 4 }}>
                                <MoreVertical size={16} color="#0F172A" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : null}
                      </View>
                    )}
                  </View>
                )
              })}
            </View>
          )}

          {/* 4. Estimate Summary */}


          {/* 5. Assigned Mechanical Work (Accordion inside item box) */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderBetween}>
              <Text style={styles.sectionTitle}>Assigned Mechanical Work</Text>
              <View style={styles.assignmentCountBadge}>
                <Text style={styles.assignmentCountText}>
                  {assignedWork.length} Assignment
                </Text>
              </View>
            </View>

            {assignedWork.map((work, idx) => {
              const itemId = work.id || String(idx);
              const isItemExpanded = expandedWorkId === itemId;

              return (
                <View key={itemId} style={styles.assignedWorkBox}>
                  <TouchableOpacity
                    style={[
                      styles.workTopRow,
                      { marginBottom: isItemExpanded ? 10 : 0 },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => setExpandedWorkId(isItemExpanded ? null : itemId)}
                  >
                    <View style={styles.workUserCircle}>
                      <User size={14} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.workTitle}>{work.serviceName}</Text>
                      <Text style={styles.workEmpText}>{work.empName}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={[styles.statusPillSmall, { backgroundColor: getStatusBadgeConfig(work.status).bg, borderColor: getStatusBadgeConfig(work.status).border }]}>
                        <View style={[styles.smallDot, { backgroundColor: getStatusBadgeConfig(work.status).dot }]} />
                        <Text style={[styles.statusPillTextSmall, { color: getStatusBadgeConfig(work.status).text }]}>
                          {work.status}
                        </Text>
                      </View>
                      {isItemExpanded ? (
                        <ChevronUp size={16} color="#64748B" />
                      ) : (
                        <ChevronDown size={16} color="#64748B" />
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Collapsible Time Tracking Container */}
                  {isItemExpanded && (
                    <View style={styles.timeTrackContainer}>
                      <View style={styles.timeTrackCol}>
                        <Text style={styles.timeTrackLabel}>START TIME</Text>
                        <View style={styles.iconValRow}>
                          <Clock size={12} color="#0D9488" />
                          <Text style={styles.timeTrackValTeal}>{work.startTime}</Text>
                        </View>
                      </View>

                      <View style={styles.timeTrackCol}>
                        <Text style={styles.timeTrackLabel}>END TIME</Text>
                        <View style={styles.iconValRow}>
                          <Clock size={12} color="#94A3B8" />
                          <Text style={styles.timeTrackValMuted}>{work.endTime}</Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

export default FloorJobCardViewScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  detailHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitleText: {
    fontFamily: fonts.inter,
    fontSize: 20,
    color: colors.primary,
    fontWeight: '700',
  },
  detailScroll: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  detailScrollContent: {
    padding: 14,
    paddingBottom: 40,
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
  imagesBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  timelineContainer: {
    marginTop: 6,
    paddingHorizontal: 4,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timelineIconCol: {
    width: 28,
    alignItems: 'center',
  },
  timelineCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    zIndex: 2,
  },
  timelineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 28,
    marginTop: -2,
    marginBottom: -2,
    zIndex: 1,
  },
  timelineTextCol: {
    flex: 1,
    paddingBottom: 24,
    paddingLeft: 12,
  },
  timelineTitle: {
    fontSize: 13.5,
    fontFamily: fonts.interBold,
    color: '#1E293B',
    marginBottom: 3,
  },
  timelineDesc: {
    fontSize: 12,
    fontFamily: fonts.interMedium,
    color: '#64748B',
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
  editSectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  editSectionBtnText: {
    fontSize: 11.5,
    fontFamily: fonts.interBold,
    color: colors.primary,
  },
  voiceNoteCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginTop: 4,
  },
  voiceNoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  approvalReqText: {
    fontSize: 11,
    fontFamily: fonts.interBold,
    color: '#0F172A',
  },
  voiceNoteDate: {
    fontSize: 10.5,
    fontFamily: fonts.interMedium,
    color: '#64748B',
  },
  voiceNoteLabel: {
    fontSize: 11,
    fontFamily: fonts.interMedium,
    color: '#475569',
    marginBottom: 4,
  },
  voiceNoteMsgBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    padding: 10,
    marginBottom: 12,
  },
  voiceNoteMsgText: {
    fontSize: 12.5,
    fontFamily: fonts.inter,
    color: '#334155',
  },
  audioPlayerBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    padding: 10,
  },
  audioPlayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  audioPlayerTitle: {
    fontSize: 11,
    fontFamily: fonts.interBold,
    color: '#059669',
  },
  audioControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  playBtn: {
    marginRight: 8,
  },
  audioTimeText: {
    fontSize: 11,
    fontFamily: fonts.interMedium,
    color: '#0F172A',
    marginRight: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
  },
  progressBarFill: {
    width: '0%',
    height: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 2,
  },
});

// ─── Job Progress Timeline Component (matches web JobCardDetailPage.jsx) ──────
function getStepStyle(state) {
  switch (state) {
    case 'completed': return { dot: '#1F8E57', border: '#1F8E57', bg: '#E5F7EE' };
    case 'active': return { dot: '#000F7E', border: '#000F7E', bg: '#EFF6FF' };
    case 'in_progress': return { dot: '#C98414', border: '#C98414', bg: '#FFF4D8' };
    default: return { dot: '#CBD5E1', border: '#CBD5E1', bg: '#F1F5F9' };
  }
}

function JobProgressTimeline({ steps }) {
  return (
    <View style={tlStyles.card}>
      {/* Static header — no toggle */}
      <View style={tlStyles.header}>
        {/* <View style={tlStyles.headerDot} /> */}
        <Text style={tlStyles.headerTitle}>JOB PROGRESS</Text>
      </View>

      <View style={tlStyles.body}>
        {steps.map((step, idx) => {
          const style = getStepStyle(step.status);
          const isLast = idx === steps.length - 1;
          const isPostponed = step.desc === 'Postponed';

          return (
            <View key={step.id} style={tlStyles.stepRow}>
              <View style={tlStyles.leftCol}>
                <View style={[tlStyles.dot, { borderColor: style.border, backgroundColor: style.bg }]}>
                  {step.status !== 'pending' && (
                    <View style={[tlStyles.dotInner, { backgroundColor: style.dot }]} />
                  )}
                </View>
                {!isLast && (
                  <View style={[tlStyles.line, { backgroundColor: step.status === 'completed' ? '#1F8E57' : '#E2E8F0' }]} />
                )}
              </View>
              <View style={[tlStyles.content, isLast && { paddingBottom: 0 }]}>
                <Text style={[tlStyles.stepTitle, step.status === 'pending' && { color: '#94A3B8' }]}>
                  {step.title}
                </Text>
                <Text style={[
                  tlStyles.stepSubtitle,
                  isPostponed && { color: '#C98414', fontWeight: '600' },
                  step.status === 'pending' && { color: '#CBD5E1' },
                ]}>
                  {step.desc}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const tlStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1F8E57' },
  headerTitle: { fontSize: 11.5, fontWeight: '800', letterSpacing: 1.2, color: '#334155' },
  body: {
    paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4,
  },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 56 },
  leftCol: { width: 26, alignItems: 'center', marginRight: 12 },
  dot: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginTop: 12, zIndex: 2,
  },
  dotInner: { width: 9, height: 9, borderRadius: 5 },
  line: { width: 2, flex: 1, minHeight: 20, marginTop: 2, borderRadius: 1 },
  content: { flex: 1, paddingTop: 10, paddingBottom: 14 },
  stepTitle: { fontSize: 13.5, fontWeight: '700', color: '#0F172A', marginBottom: 3 },
  stepSubtitle: { fontSize: 12, color: '#64748B', fontWeight: '400', lineHeight: 17 },
});
