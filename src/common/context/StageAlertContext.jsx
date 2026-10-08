import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { BackHandler, AppState } from 'react-native';
import axios from 'axios';
import socketService from '../services/socketService.js';
import { base_url, notification_list, notification_marked } from '../config/constant.js';
import { retrieveEncryptedData } from '../config/storage.js';
import { navigate, navigationRef } from '../navigation/navigationRef.js';
import { StageAlertModal } from '../components/StageAlertModal.jsx';

const StageAlertContext = createContext({
  activeAlert: null,
  alertQueue: [],
  showAlert: () => {},
  dismissAlert: () => {},
  checkPendingAlerts: () => {}
});

export const useStageAlert = () => useContext(StageAlertContext);

// Utility functions to extract critical IDs & Vehicle Numbers from alerts or messages
const extractVehicleNumber = (alert) => {
  if (!alert) return '';
  if (alert.vehicleNo && alert.vehicleNo !== 'Vehicle') return alert.vehicleNo;
  if (alert.registrationNo) return alert.registrationNo;
  if (alert.vehicle?.registrationNo) return alert.vehicle.registrationNo;
  if (alert.vehicle?.registrationNumber) return alert.vehicle.registrationNumber;
  if (alert.gateEntry?.vehicle?.registrationNumber) return alert.gateEntry.vehicle.registrationNumber;
  if (alert.jobCard?.vehicle?.registrationNumber) return alert.jobCard.vehicle.registrationNumber;

  const msg = `${alert.title || ''} ${alert.message || ''}`;

  // Match "vehicle YN67TY4443" or "vehicle: YN67TY4443"
  const vehicleKeywordMatch = msg.match(/vehicle[:\s]+([A-Z0-9]{4,15})/i);
  if (vehicleKeywordMatch) {
    return vehicleKeywordMatch[1].toUpperCase().replace(/[- ]/g, '');
  }

  // Match standard license plate format (e.g. TN890K7891, YN67TY4443)
  const indMatch = msg.match(/\b([A-Z]{2}[- ]?[0-9]{1,3}[- ]?[A-Z]{0,3}[- ]?[0-9]{3,4})\b/i);
  if (indMatch) return indMatch[1].toUpperCase().replace(/[- ]/g, '');

  const forMatch = msg.match(/for\s+([A-Z0-9]{4,15})/i);
  if (forMatch) {
    const matchedWord = forMatch[1].toLowerCase();
    if (!['delivery', 'completed', 'vehicle', 'job', 'card'].includes(matchedWord)) {
      return forMatch[1].toUpperCase();
    }
  }

  return '';
};

const extractJobCardId = (alert) => {
  if (!alert) return null;
  if (alert.jobCardId) return alert.jobCardId;
  if (alert.jobCard?.id) return alert.jobCard.id;
  if (alert.rawItem?.jobCardId) return alert.rawItem.jobCardId;

  const msg = `${alert.title || ''} ${alert.message || ''}`;
  // Match "JC0102" or "Reference: JC0102" or "Job card JC0102"
  const jcMatch = msg.match(/\b(JC[-0-9a-zA-Z]+)\b/i) || msg.match(/Reference:\s*(JC[-0-9a-zA-Z]+|[0-9]+)/i);
  if (jcMatch) {
    return jcMatch[1].replace(/[.,]/g, '');
  }
  return null;
};

const extractGateEntryId = (alert) => {
  if (!alert) return null;
  if (alert.gateEntryId) return alert.gateEntryId;
  if (alert.gateEntry?.id) return alert.gateEntry.id;
  if (alert.rawItem?.gateEntryId) return alert.rawItem.gateEntryId;
  if (alert.type === 'DELAY_ALERT' && !alert.jobCardId) {
    return alert.id;
  }
  return null;
};

export function StageAlertProvider({ children }) {
  const [alertQueue, setAlertQueue] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [isActionScreenActive, setIsActionScreenActive] = useState(false);

  // Set of dismissed alert IDs/keys to prevent them from popping up again
  const dismissedKeysRef = useRef(new Set());

  // Helper to permanently mark alert as read on backend & in local memory
  const markAlertDismissed = useCallback(async (alert) => {
    if (!alert) return;

    const vNo = extractVehicleNumber(alert);
    const stageName = alert.stageName || alert.title || '';
    const alertId = alert.id ? String(alert.id) : null;

    if (alertId) dismissedKeysRef.current.add(alertId);
    if (vNo && stageName) dismissedKeysRef.current.add(`${vNo}_${stageName}`);

    // Call backend API to mark notification read in database
    if (alertId && !alertId.startsWith('temp-')) {
      try {
        const token = await retrieveEncryptedData('token');
        if (token) {
          await axios.put(`${base_url}${notification_marked}/${alertId}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      } catch (err) {
        // Quiet fail
        console.log('Error marking notification read in backend:', err?.message);
      }
    }
  }, []);

  // 1. Queue Management helper
  const pushAlert = useCallback((newAlert) => {
    if (!newAlert) return;

    const alertId = newAlert.id ? String(newAlert.id) : null;
    const vNo = extractVehicleNumber(newAlert);
    const stageName = newAlert.stageName || newAlert.title || '';
    const key = `${vNo}_${stageName}`;

    // Skip if already dismissed
    if ((alertId && dismissedKeysRef.current.has(alertId)) || (vNo && dismissedKeysRef.current.has(key))) {
      return;
    }

    setAlertQueue((prev) => {
      const exists = prev.some(
        (a) =>
          (a.id && alertId && String(a.id) === alertId) ||
          (vNo && extractVehicleNumber(a) === vNo && (a.stageName || a.title) === stageName)
      );
      if (exists) return prev;
      return [...prev, newAlert];
    });
  }, []);

  // 2. Cancel / Dismissal handler
  const handleCancel = useCallback(() => {
    setActiveAlert((curr) => {
      if (curr) {
        markAlertDismissed(curr);
        setAlertQueue((prev) => prev.filter((a) => a !== curr));
      }
      return null;
    });
  }, [markAlertDismissed]);

  // 3. Message-Based and Payload-Based Smart Redirection handler
  const handleProceed = useCallback(() => {
    if (!activeAlert) return;

    // Immediately suppress any popup while navigating into the job action screen
    setIsActionScreenActive(true);

    const currentAlert = activeAlert;
    markAlertDismissed(currentAlert);
    setAlertQueue((prev) => prev.filter((a) => a !== currentAlert));
    setActiveAlert(null);

    const normalizedRole = String(userRole || '').toLowerCase().replace(/\s+/g, '-');
    const vNo = extractVehicleNumber(currentAlert);
    const jcId = extractJobCardId(currentAlert);
    const geId = extractGateEntryId(currentAlert);
    const alertMsg = (currentAlert.message || currentAlert.title || '').toLowerCase();

    console.log('Stage Alert Navigating:', { role: normalizedRole, vNo, jcId, geId, alertMsg });

    const isAssignMechanicDelay =
      alertMsg.includes('unassigned') ||
      alertMsg.includes('assignment_pending') ||
      alertMsg.includes('assignment pending') ||
      alertMsg.includes('without a mechanic') ||
      alertMsg.includes('without a bay') ||
      alertMsg.includes('assign mechanic') ||
      alertMsg.includes('assign technician') ||
      alertMsg.includes('assign bay') ||
      /\b(assignment\s*pending|pending\s*assignment)\b/i.test(alertMsg) ||
      /\bassign\s*(mechanic|technician|bay)\b/i.test(alertMsg);

    const isAdditionalWorkDelay =
      alertMsg.includes('additional work') ||
      alertMsg.includes('extra work') ||
      alertMsg.includes('approval');

    const isBodyShop = alertMsg.includes('body shop') || alertMsg.includes('body-shop') || alertMsg.includes('bodyshop');

    // A. Role: Floor Supervisor or Manager
    if (normalizedRole === 'floor-supervisor' || normalizedRole === 'manager') {
      // 1. If mechanic is not assigned -> Go directly to Assign Mechanic screen
      if (isAssignMechanicDelay) {
        navigate('AssignMechanic', {
          jobCardId: jcId,
          vehicleNo: vNo,
          highlightJobCardId: jcId,
          department: isBodyShop ? 'body-shop' : 'mechanical',
        });
        return;
      }

      // 2. If specific job card detail is available -> Go to Floor Job Card View Screen
      if (jcId) {
        navigate('FloorJobCardViewScreen', {
          jobCardId: jcId,
          card: {
            id: jcId,
            jobCardId: jcId,
            vehicleNo: vNo,
            registrationNo: vNo,
            status: currentAlert.stageName || currentAlert.statusName || 'Delayed',
          },
          vehicleNo: vNo,
        });
        return;
      }

      // 3. Fallback to Floor Job Cards List
      navigate('FloorJobCards');
      return;
    }

    // B. Role: CRM Team
    if (normalizedRole === 'crm-team') {
      // If notification indicates completed or delivery, navigate to record detail
      if (jcId && (alertMsg.includes('completed') || alertMsg.includes('ready for delivery') || alertMsg.includes('delivered'))) {
        navigate('RecordDetailScreen', {
          id: jcId,
          jobCardId: jcId,
          vehicleNumber: vNo,
          vehicleNo: vNo,
        });
        return;
      }

      // If Gate Entry / Vehicle awaiting Job Card creation -> Go directly into JobCardWizard with prefilled vehicle
      if (geId || vNo) {
        const vehiclePayload = {
          id: String(geId || Date.now()),
          gateEntryId: geId || String(Date.now()),
          vehicleNumber: vNo,
          vehicleModel: currentAlert.model || currentAlert.vehicleModel || '',
          ownerName: currentAlert.customerName || currentAlert.owner || '',
          customerMobile: currentAlert.customerMobile || currentAlert.mobile || '',
          entryType: currentAlert.entryType || 'SERVICE',
          waitingMinutes: currentAlert.waitingMinutes || 0,
        };

        navigate('JobCardWizard', {
          selectedVehicle: vehiclePayload,
          entry: {
            id: String(geId || Date.now()),
            gateEntryId: geId,
            vehicle: { registrationNumber: vNo, model: currentAlert.model || '' },
            customer: { name: currentAlert.customerName || '', mobileNo: currentAlert.customerMobile || '' },
            entryType: currentAlert.entryType || 'SERVICE',
          },
        });
        return;
      }

      // Default CRM fallback
      navigate('JobDashboard');
      return;
    }

    // C. Role: Gate Security
    if (normalizedRole === 'gate-security') {
      if (geId) {
        navigate('HistoryDetail', {
          id: geId,
          gateEntryId: geId,
          vehicleNumber: vNo,
        });
      } else {
        navigate('GateHome');
      }
      return;
    }

    // D. Global Fallback
    navigate('MainTabs');
  }, [activeAlert, userRole, markAlertDismissed]);

  // 4. Load user role & initiate socket connection
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const storedRole = await retrieveEncryptedData('roleName');
        if (isMounted && storedRole) {
          setUserRole(storedRole);
        }
        await socketService.connect();
      } catch (err) {
        console.error('StageAlertProvider init error:', err);
      }
    };

    init();

    const handleSocketDelayAlert = (data) => {
      console.log('Received real-time stage delay alert via Socket:', data);
      if (data) {
        pushAlert(data);
      }
    };

    const handleNotificationRead = (data) => {
      if (!data) return;
      const notifId = data.notificationId ? String(data.notificationId) : null;
      const jcId = data.jobCardId ? String(data.jobCardId) : null;

      if (notifId) dismissedKeysRef.current.add(notifId);

      setAlertQueue((prev) =>
        prev.filter((item) => {
          if (notifId && String(item.id) === notifId) return false;
          if (jcId && (String(item.jobCardId) === jcId || String(item.rawItem?.jobCardId) === jcId)) return false;
          return true;
        })
      );

      setActiveAlert((curr) => {
        if (!curr) return null;
        if (notifId && String(curr.id) === notifId) return null;
        if (jcId && (String(curr.jobCardId) === jcId || String(curr.rawItem?.jobCardId) === jcId)) return null;
        return curr;
      });
    };

    const handleNotificationReadAll = () => {
      setAlertQueue([]);
      setActiveAlert(null);
    };

    socketService.on('stageDelayAlert', handleSocketDelayAlert);
    socketService.on('stageScheduleAlert', handleSocketDelayAlert);
    socketService.on('notification-created', (notif) => {
      console.log('Received notification-created via Socket:', notif);
      if (notif?.type === 'DELAY_ALERT' || notif?.type === 'UNASSIGNED_ALERT' || notif?.isStageDelay) {
        pushAlert(notif);
      }
    });
    socketService.on('notification', (notif) => {
      if (notif?.type === 'DELAY_ALERT' || notif?.type === 'UNASSIGNED_ALERT' || notif?.isStageDelay) {
        pushAlert(notif);
      }
    });
    socketService.on('notification-read', handleNotificationRead);
    socketService.on('notification-read-all', handleNotificationReadAll);

    return () => {
      isMounted = false;
      socketService.off('stageDelayAlert');
      socketService.off('stageScheduleAlert');
      socketService.off('notification-created');
      socketService.off('notification');
      socketService.off('notification-read', handleNotificationRead);
      socketService.off('notification-read-all', handleNotificationReadAll);
    };
  }, [pushAlert]);

  // 5. Periodic sync & AppState listener to check unread alerts from backend
  const checkPendingAlerts = useCallback(async () => {
    try {
      const token = await retrieveEncryptedData('token');
      if (!token) return;

      const response = await axios.get(`${base_url}${notification_list}?page=1&unreadOnly=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success && response.data.data?.notifications) {
        const delayAlerts = response.data.data.notifications.filter((n) => {
          if (n.readAt || n.isRead) return false;
          const alertId = n.id ? String(n.id) : null;
          const vNo = extractVehicleNumber(n);
          const stageName = n.stageName || n.title || '';
          const key = `${vNo}_${stageName}`;

          if (alertId && dismissedKeysRef.current.has(alertId)) return false;
          if (vNo && dismissedKeysRef.current.has(key)) return false;

          return n.type === 'DELAY_ALERT' || n.type === 'UNASSIGNED_ALERT';
        });

        if (delayAlerts.length > 0) {
          delayAlerts.forEach((alert) => pushAlert(alert));
        }
      }
    } catch (err) {
      console.log('StageAlert: Check pending alerts check failed', err?.message);
    }
  }, [pushAlert]);

  useEffect(() => {
    checkPendingAlerts();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkPendingAlerts();
      }
    });

    const interval = setInterval(() => {
      checkPendingAlerts();
    }, 45000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [checkPendingAlerts]);

  // 6. Check active navigation route to avoid interrupting user while on action screens
  useEffect(() => {
    const actionScreens = [
      'JobCardWizard',
      'FloorJobCardViewScreen',
      'RecordDetailScreen',
      'AssignMechanic',
      'AdditionalWork',
      'AddAdditionalWorkScreen',
      'EditSelectedServicesScreen',
      'JobCardImagesScreen',
      'HistoryDetail',
      'Notification'
    ];

    const checkRoute = () => {
      try {
        if (navigationRef && typeof navigationRef.isReady === 'function' && navigationRef.isReady()) {
          const currentRoute = navigationRef.getCurrentRoute();
          const routeName = currentRoute?.name;
          const isOnActionScreen = actionScreens.includes(routeName);
          setIsActionScreenActive(isOnActionScreen);
          if (isOnActionScreen) {
            setActiveAlert(null);
          }
        }
      } catch {
        // Safe fallback
      }
    };

    const unsubscribe = navigationRef?.addListener?.('state', checkRoute);
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // 7. Update active alert when queue changes and user is NOT currently on an action screen
  useEffect(() => {
    if (!isActionScreenActive && !activeAlert && alertQueue.length > 0) {
      setActiveAlert(alertQueue[0]);
    } else if (isActionScreenActive && activeAlert) {
      setActiveAlert(null);
    }
  }, [alertQueue, activeAlert, isActionScreenActive]);

  // 8. Lock Back Button while Modal Alert is Active
  useEffect(() => {
    if (activeAlert) {
      const backAction = () => true;
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

      return () => {
        backHandler.remove();
      };
    }
  }, [activeAlert]);

  return (
    <StageAlertContext.Provider
      value={{
        activeAlert,
        alertQueue,
        showAlert: pushAlert,
        dismissAlert: handleCancel,
        checkPendingAlerts
      }}
    >
      {children}
      <StageAlertModal
        visible={!!activeAlert}
        alert={activeAlert}
        role={userRole}
        onProceed={handleProceed}
        onCancel={handleCancel}
      />
    </StageAlertContext.Provider>
  );
}
