import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { API_CONFIG } from '../config/apiConfig';
import { supabaseService } from '../services/supabaseService';

const AppContext = createContext();

import {
  getNormalizedNow,
  getLogicalShiftDateString,
  calculateDelayMinutes,
  getSafeISOTime,
  generateSafeId
} from '../utils/shiftLogic';
import { safeParseOrder } from '../utils/safeOrderParser';

/**
 * 🔴 الدالة دي هي المسؤولة عن إرسال أي تحديث عام للبيانات لـ Supabase
 */
const sendToN8N = async (payload, type) => {
  try {
    if (type === 'SHIFT_CLOSE') {
      await supabaseService.saveShiftReport(payload);
    }
  } catch (e) {
    console.error('Supabase Integration Error:', e);
  }
};

const mergePilots = (prevPilots, fetchedPilots) => {
  const mergedFetched = fetchedPilots.map(fp => {
    const existing = prevPilots.find(p => p.id === fp.id);
    if (!existing) return fp;
    const LOCAL_PILOT_FIELDS = ['ordersCount', 'totalMinutes', 'balance', 'shiftStatus', 'state', 'lastReturnTime', 'shiftUsed', 'lastOpenedAt'];
    const mergedFields = {};
    LOCAL_PILOT_FIELDS.forEach(f => {
      if (existing[f] !== undefined) {
        mergedFields[f] = existing[f];
      }
    });
    return { ...fp, ...mergedFields };
  });

  const localOnly = prevPilots.filter(p => !fetchedPilots.some(fp => fp.id === p.id));
  return [...mergedFetched, ...localOnly];
};

export const AppProvider = ({ children }) => {
  // 🔴 نظام الأدوار (Role System)
  // بنحدد هنا إذا كان المستخدم 'admin' (مدير) أو 'casher' (كاشير) أو '' (غير مسجل دخول)
  const [userRole, setUserRole] = useState(() => {
    return sessionStorage.getItem('b_delivery_session_user') || '';
  });

  // حفظ الدور في المتصفح ودور الجلسة
  useEffect(() => {
    if (userRole) {
      sessionStorage.setItem('b_delivery_session_user', userRole);
    } else {
      sessionStorage.removeItem('b_delivery_session_user');
    }
  }, [userRole]);

  // تهيئة كلمات المرور الافتراضية إذا لم تكن موجودة
  useEffect(() => {
    if (!localStorage.getItem('b_delivery_password_admin')) {
      localStorage.setItem('b_delivery_password_admin', '8080');
    }
    if (!localStorage.getItem('b_delivery_password_casher')) {
      localStorage.setItem('b_delivery_password_casher', '8080');
    }
  }, []);

  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('delivery_orders');
      return (saved && saved !== 'undefined') ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [reservations, setReservations] = useState([]);
  const [pilots, setPilots] = useState([]);

  const [currentShift, setCurrentShift] = useState(() => {
    try {
      const saved = localStorage.getItem('delivery_current_shift');
      return (saved && saved !== 'undefined') ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [dailyReports, setDailyReports] = useState(() => {
    try {
      const saved = localStorage.getItem('delivery_reports');
      return (saved && saved !== 'undefined') ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('delivery_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('delivery_pilots', JSON.stringify(pilots));
  }, [pilots]);

  useEffect(() => {
    localStorage.setItem('delivery_current_shift', JSON.stringify(currentShift));
  }, [currentShift]);

  useEffect(() => {
    localStorage.setItem('delivery_reports', JSON.stringify(dailyReports));
  }, [dailyReports]);

  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('delivery_audit_logs');
      return (saved && saved !== 'undefined') ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('delivery_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('delivery_reservations', JSON.stringify(reservations));
  }, [reservations]);

  // System Timer for Auto-Shift Close (at 4 AM)
  useEffect(() => {
    const checkAutoClose = () => {
      const now = getNormalizedNow();
      if (currentShift && now.getHours() === 4) {
        // Only trigger if there are no active orders (already handled in closeShift logic)
        // This will attempt a force-close which triggers the JSON download
        closeShift(true);
      }
    };

    const timer = setInterval(checkAutoClose, 10 * 60 * 1000); // Check every 10 mins
    return () => clearInterval(timer);
  }, [currentShift]);

  // 🔥 3. Real-time Dashboard (Supabase Live System)
  const retryRef = useRef(0);
  const pendingUpdatesRef = useRef(new Set()); // Set of supabaseIds being updated

  const updateExternalOrderStatus = async (orderId, newStatus, reason = null, extraFields = {}) => {
    pendingUpdatesRef.current.add(String(orderId));
    try {
      await supabaseService.updateOrderStatus(orderId, newStatus, reason, extraFields);
    } catch (e) {
      console.error('External Status Update Exception:', e);
    } finally {
      setTimeout(() => {
        pendingUpdatesRef.current.delete(String(orderId));
      }, 2000);
    }
  };

  useEffect(() => {
    if (currentShift?.status !== 'open' || !API_CONFIG.AUTO_REFRESH) return;

    let ordersSub, pilotsSub, resSub;

    const fetchInitialData = async () => {
      try {
        const [fetchedOrders, fetchedPilots, fetchedRes] = await Promise.all([
          supabaseService.fetchOrders(),
          supabaseService.fetchDeliveryDrivers(),
          supabaseService.fetchReservations()
        ]);

        if (fetchedPilots) setPilots(prev => mergePilots(prev, fetchedPilots));
        if (fetchedRes) setReservations(fetchedRes);

        if (fetchedOrders && fetchedOrders.length > 0) {
          setOrders(prev => {
            const newOrdersForAudio = fetchedOrders.filter(fo => {
              const notInPrev = !prev.some(o => (o.originalId || o.id) === fo.originalId);
              const isRecentlyCreated = fo.timestamp &&
                (Date.now() - new Date(fo.timestamp).getTime()) < 3 * 60 * 1000;
              return notInPrev && isRecentlyCreated;
            });

            if (newOrdersForAudio.length > 0) {
              new Audio(API_CONFIG.SOUNDS.NEW_ORDER).play().catch(() => { });
              logAction('LIVE_SYNC', `Supabase Sync: Received ${newOrdersForAudio.length} new orders`, 'System');
            }

            const LOCAL_ONLY_FIELDS = ['pilotId', 'assignedAt', 'confirmedAt', 'startTime', 'endTime', 'failureReason', 'cancellationReason', 'cancelledAt', 'logs', 'shiftId'];

            const mergedOrders = fetchedOrders.map(fo => {
              const existing = prev.find(o => (o.originalId || o.id) === fo.originalId);
              if (!existing) return fo;

              const isPending = pendingUpdatesRef.current.has(String(fo.supabaseId)) || pendingUpdatesRef.current.has(String(fo.originalId));
              const localIsNewer = existing.confirmedAt || existing.assignedAt || existing.startTime;

              const mergedStatus = isPending ? existing.status : (localIsNewer ? existing.status : fo.status);

              const localFields = {};
              LOCAL_ONLY_FIELDS.forEach(f => {
                if (existing[f] !== undefined) localFields[f] = existing[f];
              });

              return { ...fo, ...localFields, status: mergedStatus };
            });

            const manualOrders = prev.filter(p => !p.supabaseId && !fetchedOrders.some(fo => fo.originalId === (p.originalId || p.id)));

            return [...mergedOrders, ...manualOrders];
          });
        }
      } catch (err) {
        console.error('📡 Supabase Fetch Error:', err);
      }
    };

    fetchInitialData();

    // 🚀 Subscribing to Realtime Database Changes
    ordersSub = supabaseService.subscribeToOrders(() => {
      fetchInitialData(); // Re-fetch all data gently on change
    });

    pilotsSub = supabaseService.subscribeToDrivers(() => {
      supabaseService.fetchDeliveryDrivers().then(fetched => {
        if (fetched) setPilots(prev => mergePilots(prev, fetched));
      });
    });

    resSub = supabaseService.subscribeToReservations(() => {
      supabaseService.fetchReservations().then(setReservations);
    });

    // Fallback polling just in case WebSocket drops
    const pollTimer = setInterval(fetchInitialData, 30000);

    return () => {
      clearInterval(pollTimer);
      if (ordersSub) ordersSub.unsubscribe();
      if (pilotsSub) pilotsSub.unsubscribe();
      if (resSub) resSub.unsubscribe();
    };
  }, [currentShift]);

  // Keep pilots' ordersCount synchronized with the completed orders of the current shift
  useEffect(() => {
    if (!currentShift) return;
    setPilots(prev => {
      let changed = false;
      const updated = prev.map(p => {
        const finishedCount = orders.filter(o => String(o.pilotId) === String(p.id) && o.status === 'completed').length;
        if (p.ordersCount !== finishedCount) {
          changed = true;
          return { ...p, ordersCount: finishedCount };
        }
        return p;
      });
      return changed ? updated : prev;
    });
  }, [orders, currentShift]);

  const syncExternalOrders = async () => {
    if (currentShift?.status !== 'open') return;
    try {
      const fetchedOrders = await supabaseService.fetchOrders();
      setOrders(prev => {
        const onlyNew = fetchedOrders.filter(fo => !prev.some(p => (p.originalId || p.id) === fo.originalId));
        return [...onlyNew, ...prev];
      });
    } catch (e) {
      console.error('Manual sync failed', e);
    }
  };

  const logAction = (action, details, user = 'System') => {
    const newLog = {
      id: generateSafeId('log'),
      timestamp: getSafeISOTime(),
      action,
      details,
      user,
      shiftId: currentShift?.id || 'NO_SHIFT'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const getSuggestedPilot = () => {
    // 1. Filter Available Pilots
    const available = pilots.filter(p => p.shiftStatus === 'open' && p.state === 'available');
    if (available.length === 0) return null;

    const getTime = (timeStr) => {
      if (!timeStr) return 0;
      const parsed = new Date(timeStr).getTime();
      return isNaN(parsed) ? 0 : parsed;
    };

    // 2. Sort by Last Return Time (Oldest First - FIFO), then by Order Count (Balancing)
    return available.sort((a, b) => {
      const timeA = getTime(a.lastReturnTime);
      const timeB = getTime(b.lastReturnTime);
      if (timeA !== timeB) return timeA - timeB; // First back
      return (a.ordersCount || 0) - (b.ordersCount || 0); // Least orders
    })[0];
  };

  const openShift = () => {
    if (currentShift) return;
    const newShift = {
      id: generateSafeId('shift'),
      date: getLogicalShiftDateString(),
      startTime: getSafeISOTime(),
      status: 'open'
    };
    setCurrentShift(newShift);
    // Reset pilots for new shift: Available, No Orders, Last Return = Now (Start of Queue)
    setPilots(prev => prev.map(p => ({
      ...p,
      shiftStatus: 'closed',
      state: 'available',
      lastReturnTime: getSafeISOTime(),
      balance: 0,
      totalMinutes: 0,
      ordersCount: 0,
      shiftUsed: false,
      lastOpenedAt: null
    })));
    logAction('SHIFT_OPEN', 'New shift started', 'Manager');
  };

  const closeShift = (force = false) => {
    if (!currentShift) return false;

    const activeOrderStatuses = ['active', 'waiting_driver', 'driver_assigned', 'pending', 'pending_timer'];
    const hasActiveOrders = orders.some(o => activeOrderStatuses.includes(o.status));
    const hasOpenPilotShifts = pilots.some(p => p.shiftStatus === 'open');

    // If forced (4 AM), we allow closing even if pilots are open (they will be auto-closed by reset)
    // But we still block if there are active orders (safety)
    if (hasActiveOrders || (!force && hasOpenPilotShifts)) {
      const msg = hasActiveOrders
        ? '⚠️ لا يمكن إغلاق الوردية! يوجد طلبات نشطة.'
        : '⚠️ لا يمكن إغلاق الوردية! يوجد طيارين لم يغلقوا شفتاتهم بعد.';
      alert(msg);
      return false;
    }

    const stats = activeStats();

    const snapshot = {
      ...currentShift,
      endTime: getSafeISOTime(),
      status: 'closed',
      ordersCount: stats.totalOrders,
      totalDeliveryFees: stats.pilotPerformance.reduce((sum, p) => sum + p.feeEarnings, 0),
      totalAttendancePay: stats.pilotPerformance.reduce((sum, p) => sum + p.attendancePay, 0),
      totalPilotDues: stats.pilotPerformance.reduce((sum, p) => sum + p.totalEarnings, 0),
      pilotStats: stats.pilotPerformance,
      archivedOrders: orders
    };

    setDailyReports(prev => [snapshot, ...prev]);

    // Automatic JSON Download for Audit
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snapshot, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `Shift_Report_${snapshot.date.replace(/\//g, '-')}_Full.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (e) {
      console.error("Failed to auto-download shift report", e);
    }

    logAction('SHIFT_CLOSE', `Shift closed. Orders: ${stats.totalOrders}. File Generated.`, 'Manager');
    sendToN8N(snapshot, 'SHIFT_CLOSE');

    setOrders([]);
    setCurrentShift(null);
    setPilots(prev => prev.map(p => ({ ...p, shiftStatus: 'closed', state: 'available', balance: 0, totalMinutes: 0, shiftUsed: false, lastOpenedAt: null })));
    return true;
  };

  const addOrder = (orderData) => {
    if (!orderData.id) {
      alert('خطأ: لا يوجد رقم بون');
      return;
    }

    // Check for duplicates based on originalId or id
    const existingCount = orders.filter(o => (o.originalId || o.id) === orderData.id).length;

    if (existingCount >= 2) {
      alert(`رقم البون ${orderData.id} مكرر أكثر من الحد المسموح (مرتين فقط)!`);
      return;
    }

    if (!currentShift) {
      alert('⚠️ يجب فتح وردية أولاً لإضافة طلبات!');
      return;
    }

    // Generate unique ID if duplicate
    const finalId = existingCount > 0 ? `${orderData.id}_2` : orderData.id;

    const newOrder = {
      ...orderData,
      id: finalId,
      originalId: orderData.id, // Store original receipt No for display
      source: orderData.source || 'manual',
      status: 'pending_timer', // Initial status
      timestamp: getSafeISOTime(),
      shiftId: currentShift.id, // Link to Shift
      logs: [{ time: getSafeISOTime(), action: 'CREATED', user: 'System' }] // Internal Order Log
    };
    setOrders(prev => [newOrder, ...prev]);
    logAction('ORDER_CREATE', `Order #${orderData.id} created`, 'Operator');
    sendToN8N(newOrder, 'ORDER_CREATE');

    setTimeout(() => {
      setOrders(currentOrders => currentOrders.map(o =>
        (o.id === newOrder.id && o.status === 'pending_timer')
          ? { ...o, status: 'pending' } // New (Review)
          : o
      ));
    }, 5000);
  };

  const updateOrder = (oldId, updatedData) => {
    setOrders(prev => {
      // If ID is being changed, check for duplicates
      if (oldId !== updatedData.id && prev.some(o => o.id === updatedData.id)) {
        alert(`رقم البون ${updatedData.id} مستخدم بالفعل! لا يمكن التعديل.`);
        return prev;
      }

      return prev.map(o => o.id === oldId ? { ...o, ...updatedData } : o);
    });
    logAction('ORDER_UPDATE', `Order #${oldId} updated (New ID: ${updatedData.id})`, 'Supervisor');
  };

  const deleteOrder = (orderId) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    logAction('ORDER_DELETE', `Order #${orderId} deleted`, 'Supervisor');
  };

  const cancelOrder = (orderId, reason) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status === 'cancelled') return;

    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, status: 'cancelled', cancellationReason: reason, cancelledAt: getSafeISOTime() }
        : o
    ));
    logAction('ORDER_CANCEL', `Order #${orderId} cancelled. Reason: ${reason}`, 'Supervisor');
    sendToN8N({ ...order, status: 'cancelled', cancellationReason: reason }, 'ORDER_CANCEL');
    if (order.supabaseId) {
      updateExternalOrderStatus(order.supabaseId, 'cancelled', reason);
    }
  };

  // Step 1: Manager Confirms Details -> Waiting For Driver
  const confirmOrder = async (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || !['pending', 'pending_timer'].includes(order.status)) return;

    const updatedOrder = { ...order, status: 'waiting_driver', confirmedAt: getSafeISOTime() };

    setOrders(prev => prev.map(o =>
      o.id === orderId ? updatedOrder : o
    ));
    logAction('ORDER_CONFIRM', `Order #${orderId} confirmed. Waiting for driver.`, 'Supervisor');
    if (order.supabaseId) {
      updateExternalOrderStatus(order.supabaseId, 'confirmed');
    }

    try {
      await printerService.printKitchenReceipt(updatedOrder);
      await printerService.printCashierReceipt(updatedOrder);
    } catch (err) {
      console.error('❌ فشل الطباعة التلقائية:', err);
    }
  };

  // Step 2: Assign Driver (Locks Order, Ready to Print)
  const assignPilot = (orderId, pilotId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || ['driver_assigned', 'active', 'completed', 'cancelled', 'failed_delivery'].includes(order.status)) return;

    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, status: 'driver_assigned', pilotId, assignedAt: getSafeISOTime() }
        : o
    ));
    const pilotName = pilots.find(p => String(p.id) === String(pilotId))?.name || 'Unknown';
    logAction('ORDER_ASSIGN', `Order #${orderId} assigned to ${pilotName}`, 'Supervisor');
    if (order.supabaseId) {
      updateExternalOrderStatus(order.supabaseId, 'driver_assigned', null, { pilot_id: String(pilotId), pilot_name: pilotName });
    }
  };

  // Step 3: Start Delivery (Pilot Leaves -> Status Out)
  const startDelivery = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.pilotId || order.status === 'active' || order.status === 'completed') return;

    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, status: 'active', startTime: getSafeISOTime() }
        : o
    ));

    // Mark Pilot as OUT
    setPilots(prev => prev.map(p =>
      String(p.id) === String(order.pilotId)
        ? { ...p, state: 'out' }
        : p
    ));

    logAction('DELIVERY_START', `Order #${orderId} out for delivery`, 'System');
    if (order.supabaseId) {
      updateExternalOrderStatus(order.supabaseId, 'out_for_delivery');
    }
  };

  // Step 4: Complete (Pilot Returns -> Status Available + Queue Update)
  const completeOrder = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status === 'completed') return;

    const nowTime = getSafeISOTime();
    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, status: 'completed', endTime: nowTime, deliveredAt: nowTime }
        : o
    ));

    // Return Pilot to Queue (Last Return Time = Now) only if they have no other active orders left
    if (order.pilotId) {
      setPilots(prev => prev.map(p => {
        if (String(p.id) === String(order.pilotId)) {
          const otherActive = orders.some(o => String(o.pilotId) === String(p.id) && o.status === 'active' && o.id !== orderId);
          const nextState = otherActive ? 'out' : 'available';
          const returnTimeUpdates = nextState === 'available' ? { lastReturnTime: nowTime } : {};
          return {
            ...p,
            state: nextState,
            ...returnTimeUpdates
          };
        }
        return p;
      }));
    }
    logAction('ORDER_COMPLETE', `Order #${orderId} completed`, 'Supervisor');
    sendToN8N({ ...order, status: 'completed', endTime: nowTime, deliveredAt: nowTime }, 'ORDER_COMPLETE');
    if (order.supabaseId) {
      updateExternalOrderStatus(order.supabaseId, 'completed');
    }
  };

  const failDelivery = (orderId, reason) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || order.status === 'failed_delivery') return;

    const nowTime = getSafeISOTime();
    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, status: 'failed_delivery', failureReason: reason, endTime: nowTime, failedAt: nowTime }
        : o
    ));

    // Return Pilot to Queue (Last Return Time = Now) only if they have no other active orders left
    if (order.pilotId) {
      setPilots(prev => prev.map(p => {
        if (String(p.id) === String(order.pilotId)) {
          const otherActive = orders.some(o => String(o.pilotId) === String(p.id) && o.status === 'active' && o.id !== orderId);
          const nextState = otherActive ? 'out' : 'available';
          const returnTimeUpdates = nextState === 'available' ? { lastReturnTime: nowTime } : {};
          return {
            ...p,
            state: nextState,
            ...returnTimeUpdates
          };
        }
        return p;
      }));
    }
    logAction('DELIVERY_FAIL', `Order #${orderId} failed delivery. Reason: ${reason}`, 'Supervisor');
    sendToN8N({ ...order, status: 'failed_delivery', failureReason: reason, endTime: nowTime, failedAt: nowTime }, 'ORDER_FAIL');
    if (order.supabaseId) {
      updateExternalOrderStatus(order.supabaseId, 'failed_delivery', reason);
    }
  };

  const togglePilotShift = async (pilotId) => {
    const pilot = pilots.find(p => String(p.id) === String(pilotId));
    if (!pilot) return;

    const newStatus = pilot.shiftStatus === 'open' ? 'closed' : 'open';

    if (newStatus === 'open' && pilot.shiftUsed) {
      alert('⚠️ هذا الطيار قام بفتح وردية مسبقاً في هذا اليوم. لا يمكن فتحه مرة أخرى.');
      return;
    }

    // Call Supabase to update status (boolean)
    await supabaseService.updateDriverStatus(pilotId, newStatus === 'open');

    // Optimistically update UI
    setPilots(prev => prev.map(p => {
      if (String(p.id) === String(pilotId)) {
        const now = getNormalizedNow();
        let sessionMinutes = 0;
        if (newStatus === 'closed' && p.lastOpenedAt) {
          sessionMinutes = calculateDelayMinutes(p.lastOpenedAt);
        }

        const updates = newStatus === 'open'
          ? { state: 'available', lastReturnTime: getSafeISOTime(), lastOpenedAt: getSafeISOTime() }
          : {
            state: 'off',
            lastOpenedAt: null,
            shiftUsed: true,
            totalMinutes: (p.totalMinutes || 0) + sessionMinutes
          };

        return {
          ...p,
          shiftStatus: newStatus,
          ...updates
        };
      }
      return p;
    }));
  };

  const activeStats = () => {
    const finishedOrders = orders.filter(o => o.status === 'completed');
    const failedOrders = orders.filter(o => o.status === 'failed_delivery');

    const pilotPerformance = pilots.map(p => {
      const pOrders = finishedOrders.filter(o => String(o.pilotId) === String(p.id));
      const pFailed = failedOrders.filter(o => String(o.pilotId) === String(p.id));

      // Calculate current active minutes if still open
      const currentActiveSession = (p.shiftStatus === 'open' && p.lastOpenedAt)
        ? calculateDelayMinutes(p.lastOpenedAt)
        : 0;

      const totalMinutes = (p.totalMinutes || 0) + currentActiveSession;

      let feeEarnings = 0;
      let restaurantEarnings = 0;
      let talabatEarnings = 0;
      let onlineEarnings = 0;
      let tripEarnings = 0;
      let ordersCount = 0;
      let tripsCount = 0;
      let restaurantOrdersCount = 0;
      let talabatOrdersCount = 0;
      let onlineOrdersCount = 0;

      [...pOrders, ...pFailed].forEach(o => {
        const fee = Number(o.deliveryFee) || 0;
        const source = o.source || (o.type === 'trip' ? 'external' : o.type === 'talabat' || o.type === 'external' ? 'talabat' : 'manual');
        const isCompleted = o.status === 'completed';

        if (source === 'external') {
          if (isCompleted) {
            feeEarnings += fee;
            tripEarnings += fee;
          }
          tripsCount++;
        } else {
          const share = fee / 2;
          if (isCompleted) {
            feeEarnings += share;
            ordersCount++;
          }

          if (source === 'online') {
            if (isCompleted) onlineEarnings += share;
            onlineOrdersCount++;
          } else if (source === 'talabat') {
            if (isCompleted) talabatEarnings += share;
            talabatOrdersCount++;
          } else {
            if (isCompleted) restaurantEarnings += share;
            restaurantOrdersCount++;
          }
        }
      });

      const attendancePay = Math.floor(totalMinutes / 15) * 5;

      return {
        ...p,
        ordersCount,
        tripsCount,
        restaurantOrdersCount,
        talabatOrdersCount,
        onlineOrdersCount,
        failedCount: pFailed.length,
        totalMinutes,
        feeEarnings,
        restaurantEarnings,
        talabatEarnings,
        onlineEarnings,
        tripEarnings,
        attendancePay,
        totalEarnings: feeEarnings + attendancePay
      };
    });

    const delays = orders
      .filter(o => o.status === 'pending' || o.status === 'active')
      .map(o => {
        if (o.status === 'active' && o.startTime) {
          return calculateDelayMinutes(o.startTime);
        }
        return calculateDelayMinutes(o.timestamp);
      });

    const averageDelay = delays.length > 0
      ? Math.floor(delays.reduce((a, b) => a + b, 0) / delays.length)
      : 0;

    return {
      totalOrders: finishedOrders.length + failedOrders.length,
      onlineOrdersCount: finishedOrders.filter(o => o.source === 'online').length + failedOrders.filter(o => o.source === 'online').length,
      averageDelay,
      activeDelaysCount: delays.filter(d => d > 30).length, // Orders delayed more than 30 mins
      pilotPerformance,
      reservationStats: {
        totalDeposits: reservations.filter(r => r.status === 'confirmed').reduce((sum, r) => sum + (Number(r.deposit) || 0), 0),
        count: reservations.length,
        pendingCount: reservations.filter(r => r.status === 'pending').length
      }
    };
  };

  const addReservation = async (resData) => {
    // Save to Supabase
    const savedData = await supabaseService.createReservation(resData);

    if (savedData && savedData.length > 0) {
      const row = savedData[0];
      const newRes = {
        supabaseId: row.id,
        id: `RES-${row.id}`,
        timestamp: row.created_at || getSafeISOTime(),
        status: 'pending',
        deposit: resData.deposit || 50,
        ...resData
      };
      // Optimistic update
      setReservations(prev => [newRes, ...prev]);
      logAction('RES_CREATE', `Reservation for ${resData.customerName}`, 'Cashier');
    } else {
      alert('حدث خطأ أثناء حفظ الحجز.');
    }
  };

  const confirmReservation = (id, refNum, paymentProof = null) => {
    const existing = reservations.find(r => r.id === id);
    if (!existing || existing.status === 'confirmed') return; // Idempotent check

    setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'confirmed', refNumber: refNum, paymentProof, confirmedAt: getSafeISOTime() } : r));
    logAction('RES_CONFIRM', `Reservation ${id} confirmed with Ref: ${refNum}`, 'Manager');
    sendToN8N({ ...existing, status: 'confirmed', refNumber: refNum, paymentProof }, 'RESERVATION_CONFIRM');
  };

  const deleteReservation = async (id) => {
    await supabaseService.deleteReservation(id);
    setReservations(prev => prev.filter(r => r.id !== id));
    logAction('RES_DELETE', `Reservation ${id} deleted`, 'Supervisor');
  };

  const addNewPilot = async (pilotData) => {
    const { name, phone, shift, number_id, number_motor } = pilotData;

    if (pilots.some(p => p.name === name)) {
      return { success: false, error: 'اسم الطيار موجود بالفعل!' };
    }

    const savedData = await supabaseService.addDeliveryDriver(pilotData);

    if (savedData && savedData.length > 0) {
      const row = savedData[0];
      const newPilot = {
        id: row.id,
        name,
        phone,
        numberId: row.number_id,
        numberMotor: row.number_motor,
        shift: shift || 'غير محدد',
        state: 'available',
        shiftStatus: 'closed',
        vehicle: 'موتوسيكل',
        ordersCount: 0,
        totalMinutes: 0,
        balance: 0,
        shiftUsed: false
      };
      setPilots(prev => [...prev, newPilot]);
      logAction('PILOT_ADD', `New pilot added: ${name}`, 'Manager');
      return { success: true };
    } else {
      return { success: false, error: 'حدث خطأ أثناء إضافة الطيار.' };
    }
  };

  return (
    <AppContext.Provider value={{
      orders, pilots, currentShift, dailyReports, auditLogs, reservations,
      userRole, setUserRole, // 🔐 تصدير بيانات الدور لباقي السيستم
      openShift, closeShift, addOrder, deleteOrder, cancelOrder, confirmOrder, completeOrder, failDelivery, togglePilotShift, updateOrder, addNewPilot,
      addReservation, confirmReservation, deleteReservation,
      isShiftOpen: currentShift?.status === 'open',
      activeStats: activeStats(),
      assignPilot, startDelivery, getSuggestedPilot,
      sendToN8N, syncExternalOrders
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
