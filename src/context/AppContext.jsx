import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_PILOTS } from '../db/pilots';
import { API_CONFIG } from '../config/apiConfig';

const AppContext = createContext();

const sendToN8N = async (payload, type) => {
  try {
    // We use a fire-and-forget approach or log if it fails, but don't block UI
    fetch(API_CONFIG.N8N_SEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'Delivery_System_React',
        timestamp: new Date().toISOString(),
        type,
        payload
      })
    }).catch(err => console.error('n8n Webhook Error:', err));
  } catch (e) {
    console.error('n8n Integration Error:', e);
  }
};

export const AppProvider = ({ children }) => {
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('delivery_orders');
      return (saved && saved !== 'undefined') ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [reservations, setReservations] = useState(() => {
    try {
      const saved = localStorage.getItem('delivery_reservations');
      return (saved && saved !== 'undefined') ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [pilots, setPilots] = useState(() => {
    try {
      const saved = localStorage.getItem('delivery_pilots');
      return (saved && saved !== 'undefined') ? JSON.parse(saved) : INITIAL_PILOTS;
    } catch { return INITIAL_PILOTS; }
  });

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
      const now = new Date();
      if (currentShift && now.getHours() === 4) {
        // Only trigger if there are no active orders (already handled in closeShift logic)
        // This will attempt a force-close which triggers the JSON download
        closeShift(true);
      }
    };

    const timer = setInterval(checkAutoClose, 10 * 60 * 1000); // Check every 10 mins
    return () => clearInterval(timer);
  }, [currentShift]);

  // Polling for new external orders (n8n Integration)
  useEffect(() => {
    if (currentShift?.status !== 'open') return;

    const fetchIncomingOrders = async () => {
      if (!API_CONFIG.AUTO_REFRESH) return;
      try {
        const response = await fetch(API_CONFIG.N8N_FETCH_URL);
        if (!response.ok) return;
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          let hasNew = false;
          const mappedOrders = data
            .filter(extOrder =>
              extOrder.order_id &&
              Number(extOrder.totals?.total) > 0 &&
              !orders.some(o => (o.originalId || o.id) === String(extOrder.order_id))
            )
            .map(extOrder => {
              hasNew = true;
              return {
                id: `EXT-${Date.now()}-${extOrder.order_id}`,
                originalId: String(extOrder.order_id),
                type: 'external',
                customerName: extOrder.customer?.full_name || 'عميل خارجي',
                phone: extOrder.customer?.phone_1 || 'غير مسجل',
                area: extOrder.customer?.delivery_info?.area_id || 'غير محدد',
                total: Number(extOrder.totals?.total || 0),
                deliveryFee: Number(extOrder.totals?.delivery_fee || 0),
                itemsDescription: extOrder.itemsSummary || 'طلب من التطبيق',
                items: extOrder.items?.map(i => ({ name: i.name, count: i.quantity, price: i.price })) || [],
                paymentMethod: extOrder.customer?.payment_method || 'Cash',
                timestamp: new Date().toISOString(),
                status: 'pending'
              };
            });

          if (hasNew) {
            setOrders(prev => [...mappedOrders, ...prev]);
            new Audio(API_CONFIG.SOUNDS.NEW_ORDER).play().catch(e => console.log('Audio disabled by browser'));
            logAction('EXT_SYNC', `Synced ${mappedOrders.length} new orders from n8n`, 'System');
          }
        }
      } catch (e) {
        console.error('Failed to fetch from n8n:', e);
      }
    };

    const pollTimer = setInterval(fetchIncomingOrders, API_CONFIG.POLLING_INTERVAL); // Use interval from config
    return () => clearInterval(pollTimer);
  }, [orders, currentShift]);

  const syncExternalOrders = async () => {
    if (currentShift?.status !== 'open') return;
    try {
      const response = await fetch(API_CONFIG.N8N_FETCH_URL);
      if (!response.ok) return;
      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        let hasNew = false;
        const mappedOrders = data
          .filter(extOrder =>
            extOrder.order_id &&
            Number(extOrder.totals?.total) > 0 &&
            !orders.some(o => (o.originalId || o.id) === String(extOrder.order_id))
          )
          .map(extOrder => {
            hasNew = true;
            return {
              id: `EXT-${Date.now()}-${extOrder.order_id}`,
              originalId: String(extOrder.order_id),
              type: 'external',
              customerName: extOrder.customer?.full_name || 'عميل خارجي',
              phone: extOrder.customer?.phone_1 || 'غير مسجل',
              area: extOrder.customer?.delivery_info?.area_id || 'غير محدد',
              total: Number(extOrder.totals?.total || 0),
              deliveryFee: Number(extOrder.totals?.delivery_fee || 0),
              itemsDescription: extOrder.itemsSummary || 'طلب من التطبيق',
              items: extOrder.items?.map(i => ({ name: i.name, count: i.quantity, price: i.price })) || [],
              paymentMethod: extOrder.customer?.payment_method || 'Cash',
              timestamp: new Date().toISOString(),
              status: 'pending'
            };
          });

        if (hasNew) {
          setOrders(prev => [...mappedOrders, ...prev]);
          new Audio(API_CONFIG.SOUNDS.NEW_ORDER).play().catch(e => console.log('Audio disabled by browser'));
          logAction('EXT_SYNC', `Manual Sync: ${mappedOrders.length} new orders from n8n`, 'System');
        }
      }
    } catch (e) {
      console.error('Manual Sync Failed:', e);
    }
  };

  const logAction = (action, details, user = 'System') => {
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
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

    // 2. Sort by Last Return Time (Oldest First - FIFO), then by Order Count (Balancing)
    return available.sort((a, b) => {
      const timeA = new Date(a.lastReturnTime || 0).getTime();
      const timeB = new Date(b.lastReturnTime || 0).getTime();
      if (timeA !== timeB) return timeA - timeB; // First back
      return (a.ordersCount || 0) - (b.ordersCount || 0); // Least orders
    })[0];
  };

  const openShift = () => {
    if (currentShift) return;
    const newShift = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('ar-EG'),
      startTime: new Date().toISOString(),
      status: 'open'
    };
    setCurrentShift(newShift);
    // Reset pilots for new shift: Available, No Orders, Last Return = Now (Start of Queue)
    setPilots(prev => prev.map(p => ({
      ...p,
      shiftStatus: 'closed',
      state: 'available',
      lastReturnTime: new Date().toISOString(),
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
      endTime: new Date().toISOString(),
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
      status: 'pending_timer', // Initial status
      timestamp: new Date().toISOString(),
      shiftId: currentShift.id, // Link to Shift
      logs: [{ time: new Date().toISOString(), action: 'CREATED', user: 'System' }] // Internal Order Log
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
    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, status: 'cancelled', cancellationReason: reason, cancelledAt: new Date().toISOString() }
        : o
    ));
    logAction('ORDER_CANCEL', `Order #${orderId} cancelled. Reason: ${reason}`, 'Supervisor');
    const order = orders.find(o => o.id === orderId);
    if (order) sendToN8N({ ...order, status: 'cancelled', cancellationReason: reason }, 'ORDER_CANCEL');
  };

  // Step 1: Manager Confirms Details -> Waiting For Driver
  const confirmOrder = (orderId) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId
        ? { ...order, status: 'waiting_driver', confirmedAt: new Date().toISOString() }
        : order
    ));
    logAction('ORDER_CONFIRM', `Order #${orderId} confirmed. Waiting for driver.`, 'Supervisor');
  };

  // Step 2: Assign Driver (Locks Order, Ready to Print)
  const assignPilot = (orderId, pilotId) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId
        ? { ...order, status: 'driver_assigned', pilotId, assignedAt: new Date().toISOString() }
        : order
    ));
    const pilotName = pilots.find(p => p.id === pilotId)?.name || 'Unknown';
    logAction('ORDER_ASSIGN', `Order #${orderId} assigned to ${pilotName}`, 'Supervisor');
  };

  // Step 3: Start Delivery (Pilot Leaves -> Status Out)
  const startDelivery = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.pilotId) return;

    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, status: 'active', startTime: new Date().toISOString() }
        : o
    ));

    // Mark Pilot as OUT
    setPilots(prev => prev.map(p =>
      p.id === order.pilotId
        ? { ...p, state: 'out' }
        : p
    ));

    logAction('DELIVERY_START', `Order #${orderId} out for delivery`, 'System');
  };

  // Step 4: Complete (Pilot Returns -> Status Available + Queue Update)
  const completeOrder = (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, status: 'completed', endTime: new Date().toISOString() }
        : o
    ));

    // Return Pilot to Queue (Last Return Time = Now)
    if (order.pilotId) {
      setPilots(prev => prev.map(p =>
        p.id === order.pilotId
          ? { ...p, state: 'available', lastReturnTime: new Date().toISOString(), ordersCount: (p.ordersCount || 0) + 1 }
          : p
      ));
    }
    logAction('ORDER_COMPLETE', `Order #${orderId} completed`, 'Supervisor');
    sendToN8N({ ...order, status: 'completed' }, 'ORDER_COMPLETE');
  };

  const failDelivery = (orderId, reason) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, status: 'failed_delivery', failureReason: reason, endTime: new Date().toISOString() }
        : o
    ));

    // Return Pilot to Queue (Last Return Time = Now)
    if (order.pilotId) {
      setPilots(prev => prev.map(p =>
        p.id === order.pilotId
          ? { ...p, state: 'available', lastReturnTime: new Date().toISOString() } // Returned, but maybe didn't complete? Keep count same or inc? I'll keep it same as effort isn't 'gain'.
          : p
      ));
    }
    logAction('DELIVERY_FAIL', `Order #${orderId} failed delivery. Reason: ${reason}`, 'Supervisor');
    sendToN8N({ ...order, status: 'failed_delivery', failureReason: reason }, 'ORDER_FAIL');
  };

  const togglePilotShift = (pilotId) => {
    setPilots(prev => prev.map(pilot => {
      if (pilot.id === pilotId) {
        const newStatus = pilot.shiftStatus === 'open' ? 'closed' : 'open';

        if (newStatus === 'open' && pilot.shiftUsed) {
          alert('⚠️ هذا الطيار قام بفتح وردية مسبقاً في هذا اليوم. لا يمكن فتحه مرة أخرى.');
          return pilot;
        }

        const now = new Date();
        let sessionMinutes = 0;
        if (newStatus === 'closed' && pilot.lastOpenedAt) {
          sessionMinutes = Math.floor((now - new Date(pilot.lastOpenedAt)) / (1000 * 60));
        }

        // When opening shift, set as available and queue time = now
        const updates = newStatus === 'open'
          ? { state: 'available', lastReturnTime: now.toISOString(), lastOpenedAt: now.toISOString() }
          : {
            state: 'off',
            lastOpenedAt: null,
            shiftUsed: true,
            totalMinutes: (pilot.totalMinutes || 0) + sessionMinutes
          };

        return {
          ...pilot,
          shiftStatus: newStatus,
          ...updates
        };
      }
      return pilot;
    }));
  };

  const activeStats = () => {
    const finishedOrders = orders.filter(o => o.status === 'completed');
    const failedOrders = orders.filter(o => o.status === 'failed_delivery');
    const now = new Date();

    const pilotPerformance = pilots.map(p => {
      const pOrders = finishedOrders.filter(o => o.pilotId === p.id);
      const pFailed = failedOrders.filter(o => o.pilotId === p.id);

      // Calculate current active minutes if still open
      const currentActiveSession = (p.shiftStatus === 'open' && p.lastOpenedAt)
        ? Math.floor((now - new Date(p.lastOpenedAt)) / (1000 * 60))
        : 0;

      const totalMinutes = (p.totalMinutes || 0) + currentActiveSession;

      let feeEarnings = 0;
      let restaurantEarnings = 0;
      let talabatEarnings = 0;
      let tripEarnings = 0;
      let ordersCount = 0;
      let tripsCount = 0;
      let restaurantOrdersCount = 0;
      let talabatOrdersCount = 0;

      pOrders.forEach(o => {
        const fee = Number(o.deliveryFee) || 0;
        if (o.type === 'trip') {
          feeEarnings += fee;
          tripEarnings += fee;
          tripsCount++;
        } else if (o.type === 'talabat' || o.type === 'external') {
          const share = fee / 2;
          feeEarnings += share;
          talabatEarnings += share;
          ordersCount++;
          talabatOrdersCount++;
        } else {
          const share = fee / 2;
          feeEarnings += share;
          restaurantEarnings += share;
          ordersCount++;
          restaurantOrdersCount++;
        }
      });

      const attendancePay = Math.floor(totalMinutes / 15) * 5;

      return {
        ...p,
        ordersCount,
        tripsCount,
        restaurantOrdersCount,
        talabatOrdersCount,
        failedCount: pFailed.length,
        totalMinutes,
        feeEarnings,
        restaurantEarnings,
        talabatEarnings,
        tripEarnings,
        attendancePay,
        totalEarnings: feeEarnings + attendancePay
      };
    });

    const delays = orders
      .filter(o => o.status === 'pending' || o.status === 'active')
      .map(o => {
        const start = new Date(o.timestamp);
        return Math.floor((now - start) / (1000 * 60));
      });

    const averageDelay = delays.length > 0
      ? Math.floor(delays.reduce((a, b) => a + b, 0) / delays.length)
      : 0;

    return {
      totalOrders: finishedOrders.length + failedOrders.length,
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

  const addReservation = (resData) => {
    const newRes = {
      id: `RES-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      status: 'pending',
      deposit: 50, // Standard deposit from docs
      ...resData
    };
    setReservations(prev => [newRes, ...prev]);
    logAction('RES_CREATE', `Reservation for ${resData.customerName}`, 'Cashier');
    sendToN8N(newRes, 'RESERVATION_CREATE');
  };

  const confirmReservation = (id, refNum, paymentProof = null) => {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status: 'confirmed', refNumber: refNum, paymentProof, confirmedAt: new Date().toISOString() } : r));
    logAction('RES_CONFIRM', `Reservation ${id} confirmed with Ref: ${refNum}`, 'Manager');
    const updated = reservations.find(r => r.id === id);
    if (updated) sendToN8N({ ...updated, status: 'confirmed', refNumber: refNum, paymentProof }, 'RESERVATION_CONFIRM');
  };

  const deleteReservation = (id) => {
    setReservations(prev => prev.filter(r => r.id !== id));
    logAction('RES_DELETE', `Reservation ${id} deleted`, 'Supervisor');
  };

  const addNewPilot = (name, phone) => {
    if (pilots.some(p => p.name === name)) {
      alert('اسم الطيار موجود بالفعل!');
      return;
    }
    const newPilot = {
      id: `p-${Date.now()}`,
      name,
      phone,
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
  };

  return (
    <AppContext.Provider value={{
      orders, pilots, currentShift, dailyReports, auditLogs, reservations,
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
