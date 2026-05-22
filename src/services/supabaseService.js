// Developed & Owned by D.AmrMamdouh - 01038035884
import { supabase } from './supabase/supabaseClient';

const QUEUE_KEY = 'delivery_pending_sync';

// Offline Sync Helpers
const getPendingQueue = () => {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY)) || []; }
  catch { return []; }
};

const savePendingQueue = (queue) => {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

const queueSync = (action, payload) => {
  const q = getPendingQueue();
  q.push({ action, payload, id: Date.now() });
  savePendingQueue(q);
};

export const processPendingSync = async () => {
  if (!navigator.onLine) return;
  const q = getPendingQueue();
  if (!q.length) return;

  console.log(`🔄 Processing ${q.length} pending offline syncs...`);
  const remainingQueue = [];

  for (const item of q) {
    try {
      if (item.action === 'updateOrderStatus') {
        await supabaseService.updateOrderStatus(item.payload.orderId, item.payload.newStatus, item.payload.reason, item.payload.extraFields, true);
      } else if (item.action === 'updatePilotState') {
        await supabaseService.updatePilotState(item.payload.id, item.payload.stateUpdates, true);
      } else if (item.action === 'saveShiftReport') {
        await supabaseService.saveShiftReport(item.payload, true);
      } else if (item.action === 'createShift') {
        await supabaseService.createShift(item.payload, true);
      } else if (item.action === 'updateMenuAvailability') {
        await supabaseService.updateMenuAvailability(item.payload.itemName, item.payload.isAvailable, true);
      } else if (item.action === 'saveOrder') {
        await supabaseService.saveOrder(item.payload, true);
      }
    } catch (e) {
      console.warn('⚠️ Offline sync item failed, keeping in queue:', item);
      remainingQueue.push(item);
    }
  }

  savePendingQueue(remainingQueue);
};

// Auto process on connect
window.addEventListener('online', processPendingSync);

// Helper to wrap calls
const withOfflineSupport = async (actionName, promiseFn, queuePayload, skipQueue = false) => {
  try {
    if (!navigator.onLine) throw new Error('Offline');
    const res = await promiseFn();
    return res;
  } catch (err) {
    console.warn(`⚠️ Supabase offline fallback for ${actionName}`, err);
    if (!skipQueue && queuePayload) {
      queueSync(actionName, queuePayload);
    }
    return null; // Return null to let UI continue from localStorage
  }
};

export const supabaseService = {
  // 1. fetchOrders
  async fetchOrders() {
    return withOfflineSupport('fetchOrders', async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('❌ Supabase fetchOrders error:', error);
        return [];
      }

      if (!data) return [];

      return data.map(row => {
        const rawPayload = row.raw_payload || {};
        const orderId = rawPayload.order_id || `#${row.id.slice(0, 6)}`;
        
        const rawItems = (row.items && Array.isArray(row.items) && row.items.length > 0) 
            ? row.items 
            : (rawPayload.items || []);
        
        const safeItems = rawItems.map(item => ({
          name: item.name || item.item_name || "صنف غير معروف",
          count: Number(item.quantity || item.count || 1),
          price: Number(item.price || item.unit_price || 0),
          category: item.category || item.category_name || "عام",
          total: Number(item.total || (Number(item.price || 0) * Number(item.quantity || 1)))
        }));

        const itemsDescription = safeItems.length > 0
          ? safeItems.map(i => `${i.count}x ${i.name}`).join(', ')
          : "طلب خارجي (بدون تفاصيل)";

        let mappedStatus = 'pending';
        const rawStatus = String(row.status || '').trim();
        if (rawStatus === 'out_for_delivery' || rawStatus === 'active') mappedStatus = 'active';
        else if (rawStatus === 'confirmed') mappedStatus = 'waiting_driver';
        else if (['pending', 'waiting_driver', 'driver_assigned', 'completed', 'cancelled', 'failed_delivery'].includes(rawStatus)) {
          mappedStatus = rawStatus;
        }

        return {
          supabaseId: row.id,
          id: `EXT-${orderId}`,
          originalId: String(orderId),
          type: row.type || 'delivery',
          source: row.source || 'online',
          customerName: row.customer_name || rawPayload.customer?.full_name || 'عميل غير معروف',
          phone: row.phone_1 || rawPayload.customer?.phone_1 || 'غير مسجل',
          phone2: row.phone_2 || rawPayload.customer?.phone_2 || '',
          area: row.address || rawPayload.customer?.delivery_info?.address || 'استلام من المطعم',
          total: Number(row.totals?.total || 0),
          deliveryFee: Number(row.totals?.delivery_fee || 0),
          subtotal: Number(row.totals?.subtotal || 0),
          serviceFee: Number(row.totals?.service_fee || 0),
          paidNow: Number(row.totals?.paid_now || 0),
          remainingAmount: Number(row.totals?.remaining_amount || 0),
          items: safeItems,
          itemsDescription: itemsDescription,
          paymentMethod: row.payment_method || rawPayload.customer?.payment_method || 'Cash',
          paymentScreenshot: row.payment_proof_url || row.payment_screenshot || rawPayload.payment?.screenshot || null,
          status: mappedStatus,
          displayStatus: rawStatus || 'pending',
          timestamp: row.created_at || rawPayload.timestamp || new Date().toISOString(),
          pilotId: row.pilot_id || null,
          pilotName: row.pilot_name || null,
          lat: row.latitude || row.coordinates?.lat || rawPayload.customer?.delivery_info?.coordinates?.lat || null,
          lng: row.longitude || row.coordinates?.lng || rawPayload.customer?.delivery_info?.coordinates?.lon || null,
          rawPayload: rawPayload
        };
      });
    }, null);
  },

  /**
   * حفظ الطلبات الجديدة بقاعدة البيانات مع إحداثيات مباشرة
   */
  async saveOrder(order, skipQueue = false) {
    return withOfflineSupport('saveOrder', async () => {
      const payload = {
        status: order.status || 'pending',
        type: order.type || 'delivery',
        source: order.source || 'manual',
        customer_name: order.customerName || order.customer?.name,
        phone_1: order.phone || order.customer?.phone,
        address: order.area || order.customer?.address,
        totals: {
          total: order.total || 0,
          delivery_fee: order.deliveryFee || 0
        },
        latitude: order.lat || order.latitude || null,
        longitude: order.lng || order.longitude || null,
        raw_payload: order.rawPayload || order
      };
      
      const { error } = await supabase.from('orders').insert([payload]);
      if (error) throw error;
    }, order, skipQueue);
  },

  // 2. updateOrderStatus
  async updateOrderStatus(orderId, newStatus, reason = null, extraFields = {}, skipQueue = false) {
    return withOfflineSupport('updateOrderStatus', async () => {
      const cleanId = String(orderId).replace('EXT-', '');
      let dbStatus = newStatus;

      if (newStatus === 'confirmed' || newStatus === 'waiting_driver') {
        dbStatus = 'في التحضير';
      } else if (newStatus === 'cancelled') {
        dbStatus = reason ? `ملغي (${reason})` : 'ملغي';
      } else if (newStatus === 'driver_assigned') {
        dbStatus = 'تم الإسناد للطيار';
      } else if (newStatus === 'out_for_delivery' || newStatus === 'active') {
        dbStatus = 'في الطريق للتسليم';
      } else if (newStatus === 'completed') {
        dbStatus = 'تم التوصيل';
      } else if (newStatus === 'failed_delivery') {
        dbStatus = reason ? `فشل التوصيل (${reason})` : 'فشل التوصيل';
      }

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
      
      const updatePayload = { status: dbStatus, ...extraFields };
      if (extraFields.pilot_id) updatePayload.pilot_id = extraFields.pilot_id;
      if (extraFields.pilot_name) updatePayload.pilot_name = extraFields.pilot_name;

      let query = supabase.from('orders').update(updatePayload);

      if (isUuid) {
        query = query.eq('id', cleanId);
      } else {
        const numStr = cleanId.startsWith('#') ? cleanId : `#${cleanId}`;
        query = query.eq('raw_payload->>order_id', numStr);
      }

      const { error } = await query;
      if (error) throw error;
    }, { orderId, newStatus, reason, extraFields }, skipQueue);
  },

  // 3. fetchReservations
  async fetchReservations() {
    return withOfflineSupport('fetchReservations', async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !data) return [];

      return data.map(row => ({
        supabaseId: row.id,
        id: `RES-${row.id}`,
        customerName: row.customer_name || 'عميل بدون اسم',
        phone: row.phone || '',
        date: row.date || '',
        time: row.time || '',
        guests: row.guests || 2,
        locationType: row.location_type || 'restaurant',
        notes: row.notes || '',
        paymentProof: row.payment_proof_url || null,
        status: row.status || 'pending',
        deposit: Number(row.deposit_amount) || 0,
        timestamp: row.created_at || new Date().toISOString()
      }));
    }, null);
  },

  // 4. updateReservationStatus
  async updateReservationStatus(id, newStatus, refNum = null, skipQueue = false) {
    return withOfflineSupport('updateReservationStatus', async () => {
      const { error } = await supabase
        .from('reservations')
        .update({ status: newStatus, ref_number: refNum })
        .eq('id', id);
      if (error) throw error;
    }, { id, newStatus, refNum }, skipQueue);
  },

  // 5. fetchDeliveryDrivers
  async fetchDeliveryDrivers() {
    return withOfflineSupport('fetchDeliveryDrivers', async () => {
      const { data, error } = await supabase
        .from('delivery')
        .select('*')
        .order('id', { ascending: true });

      if (error) return [];
      if (!data) return [];

      return data.map(row => ({
        id: row.id,
        name: row.name || 'طيار غير معروف',
        phone: row.phone || 'غير مسجل',
        state: row.state || 'available',
        balance: Number(row.balance) || 0,
        vehicle: row.vehicle || 'موتوسيكل',
        created_at: row.created_at,
        shiftStatus: row.shift_status || 'closed',
        lastReturnTime: row.last_return_time || null,
        lastOpenedAt: row.last_opened_at || null,
        totalMinutes: Number(row.total_minutes) || 0,
        ordersCount: Number(row.orders_count) || 0,
        shift: row.shift_hours || '',
        numberMotor: row.number_motor || '',
        numberId: row.number_id || null,
        shiftUsed: Boolean(row.shift_used) || false,
      }));
    }, null);
  },

  async addDeliveryDriver(driverData, skipQueue = false) {
    return withOfflineSupport('addDeliveryDriver', async () => {
      const { data, error } = await supabase
        .from('delivery')
        .insert([{
          name: driverData.name,
          phone: driverData.phone,
          vehicle: driverData.vehicle || 'موتوسيكل',
          shift_hours: driverData.shift || '',
          number_motor: driverData.number_motor || null,
          number_id: driverData.number_id || null
        }])
        .select();

      if (error) throw error;
      return data;
    }, driverData, skipQueue);
  },

  // 6. updatePilotState
  async updatePilotState(id, stateUpdates, skipQueue = false) {
    return withOfflineSupport('updatePilotState', async () => {
      const { error } = await supabase
        .from('delivery')
        .update(stateUpdates)
        .eq('id', id);
      if (error) throw error;
    }, { id, stateUpdates }, skipQueue);
  },

  async updateDriverStatus(id, isOnline) {
    return this.updatePilotState(id, { shift_status: isOnline ? 'open' : 'closed' });
  },

  // 7. saveShiftReport
  async saveShiftReport(reportData, skipQueue = false) {
    return withOfflineSupport('saveShiftReport', async () => {
      const { error } = await supabase
        .from('daily_reports')
        .insert([{
          shift_id: reportData.id,
          date: reportData.date,
          start_time: reportData.startTime,
          end_time: reportData.endTime,
          orders_count: reportData.ordersCount,
          total_delivery_fees: reportData.totalDeliveryFees,
          total_pilot_dues: reportData.totalPilotDues,
          report_data: reportData,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      await supabase.from('shifts')
        .update({ status: 'closed', end_time: reportData.endTime, 
                  total_orders: reportData.ordersCount, stats: reportData })
        .eq('id', reportData.id);
    }, reportData, skipQueue);
  },

  async createShift(shiftData, skipQueue = false) {
    return withOfflineSupport('createShift', async () => {
      const { data, error } = await supabase
        .from('shifts')
        .insert([{
          id: shiftData.id,
          date: shiftData.date,
          start_time: shiftData.startTime,
          status: 'open'
        }])
        .select();
      if (error) throw error;
      return data;
    }, shiftData, skipQueue);
  },

  async createReservation(resData, skipQueue = false) {
    return withOfflineSupport('createReservation', async () => {
      const { data, error } = await supabase
        .from('reservations')
        .insert([{
          customer_name: resData.customerName,
          phone: resData.phone,
          date: resData.date,
          time: resData.time,
          guests: resData.guests,
          location_type: resData.type || resData.locationType,
          notes: resData.notes,
          deposit_amount: resData.deposit || 0,
          status: 'pending'
        }])
        .select();
      if (error) throw error;
      return data;
    }, resData, skipQueue);
  },

  async deleteReservation(id, skipQueue = false) {
    return withOfflineSupport('deleteReservation', async () => {
      const cleanId = String(id).replace('RES-', '');
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', cleanId);
      if (error) throw error;
    }, { id }, skipQueue);
  },
  
  // Kitchen Sync: Menu Availability
  async fetchMenuAvailability() {
    return withOfflineSupport('fetchMenuAvailability', async () => {
      const { data, error } = await supabase
        .from('menu_availability')
        .select('*');
      if (error) throw error;
      
      const availabilityMap = {};
      if (data) {
        data.forEach(item => {
          availabilityMap[item.item_name] = item.is_available;
        });
      }
      return availabilityMap;
    }, null);
  },

  async updateMenuAvailability(itemName, isAvailable, skipQueue = false) {
    return withOfflineSupport('updateMenuAvailability', async () => {
      const { error } = await supabase
        .from('menu_availability')
        .upsert({ item_name: itemName, is_available: isAvailable }, { onConflict: 'item_name' });
      if (error) throw error;
    }, { itemName, isAvailable }, skipQueue);
  },

  // 9. fetchFeedbacks
  async fetchFeedbacks() {
    return withOfflineSupport('fetchFeedbacks', async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }, null);
  },

  async deleteFeedback(id, skipQueue = false) {
    return withOfflineSupport('deleteFeedback', async () => {
      const { error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return !error;
    }, { id }, skipQueue);
  },

  // 8. Realtime Subscriptions
  subscribeToOrders(callback) {
    return supabase
      .channel('custom-orders-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        console.log('🔄 Realtime Order Update:', payload);
        callback(payload);
      })
      .subscribe();
  },

  subscribeToReservations(callback) {
    return supabase
      .channel('custom-reservations-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, payload => {
        console.log('🔄 Realtime Reservation Update:', payload);
        callback(payload);
      })
      .subscribe();
  },

  subscribeToDrivers(callback) {
    return supabase
      .channel('custom-drivers-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delivery' }, payload => {
        console.log('🔄 Realtime Driver Update:', payload);
        callback(payload);
      })
      .subscribe();
  }
};
