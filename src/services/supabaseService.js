// Developed & Owned by D.AmrMamdouh - 01038035884
import { supabase } from '../config/supabaseClient';

export const supabaseService = {
  // 1. fetchOrders
  async fetchOrders() {
    try {
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
        
        // items fallback to raw_payload.items if empty
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
          paymentScreenshot: row.payment_proof_url || rawPayload.payment?.screenshot || null,
          status: mappedStatus,
          displayStatus: rawStatus || 'pending',
          timestamp: row.created_at || rawPayload.timestamp || new Date().toISOString(),
          pilotId: row.pilot_id || null,
          pilotName: row.pilot_name || null,
          lat: row.coordinates?.lat || rawPayload.customer?.delivery_info?.coordinates?.lat || null,
          lng: row.coordinates?.lng || rawPayload.customer?.delivery_info?.coordinates?.lon || null,
          rawPayload: rawPayload
        };
      });
    } catch (err) {
      console.error('❌ Supabase fetchOrders exception:', err);
      return [];
    }
  },

  // 2. updateOrderStatus
  async updateOrderStatus(orderId, newStatus, reason = null, extraFields = {}) {
    try {
      const cleanId = String(orderId).replace('EXT-', '');
      let dbStatus = newStatus;

      // Keep the same Arabic/English dual mapping logic
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

      if (error) {
        console.error(`❌ Supabase updateOrderStatus error for ${cleanId}:`, error);
      } else {
        console.log(`✅ Supabase status updated to ${dbStatus} for order ${cleanId}`);
      }
    } catch (err) {
      console.error('❌ Supabase updateOrderStatus exception:', err);
    }
  },

  // 3. fetchReservations
  async fetchReservations() {
    try {
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
        deposit: Number(row.deposit) || 0,
        timestamp: row.created_at || new Date().toISOString()
      }));
    } catch (err) {
      console.error('❌ Supabase fetchReservations exception:', err);
      return [];
    }
  },

  // 4. updateReservationStatus
  async updateReservationStatus(id, newStatus, refNum = null) {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: newStatus, ref_number: refNum })
        .eq('id', id);

      if (error) console.error('❌ Supabase updateReservationStatus error:', error);
    } catch (err) {
      console.error('❌ Supabase updateReservationStatus exception:', err);
    }
  },

  // 5. fetchDeliveryDrivers (now pilots)
  async fetchDeliveryDrivers() {
    try {
      const { data, error } = await supabase
        .from('pilots')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.error('❌ Supabase fetchDeliveryDrivers error:', error);
        return [];
      }

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
    } catch (err) {
      console.error('❌ Supabase fetchDeliveryDrivers exception:', err);
      return [];
    }
  },

  async addDeliveryDriver(driverData) {
    try {
      const { data, error } = await supabase
        .from('pilots')
        .insert([{
          name: driverData.name,
          phone: driverData.phone,
          vehicle: driverData.vehicle || 'موتوسيكل',
          shift_hours: driverData.shift || '',
          number_motor: driverData.number_motor || null,
          number_id: driverData.number_id || null
        }])
        .select();

      if (error) console.error('❌ Supabase addDeliveryDriver error:', error);
      return data;
    } catch (err) {
      console.error('❌ Supabase addDeliveryDriver exception:', err);
      return null;
    }
  },

  // 6. updateDriverStatus / updatePilotState
  async updatePilotState(id, stateUpdates) {
    try {
      const { error } = await supabase
        .from('pilots')
        .update(stateUpdates)
        .eq('id', id);

      if (error) {
        console.error('❌ Supabase updatePilotState error:', error);
      }
    } catch (err) {
      console.error('❌ Supabase updatePilotState exception:', err);
    }
  },

  async updateDriverStatus(id, isOnline) {
    return this.updatePilotState(id, { shift_status: isOnline ? 'open' : 'closed' });
  },

  // 7. saveShiftReport
  async saveShiftReport(reportData) {
    try {
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

      if (error) console.error('❌ Supabase saveShiftReport daily_reports error:', error);

      await supabase.from('shifts')
        .update({ status: 'closed', end_time: reportData.endTime, 
                  total_orders: reportData.ordersCount, stats: reportData })
        .eq('id', reportData.id);

    } catch (err) {
      console.error('❌ Supabase saveShiftReport exception:', err);
    }
  },

  async createShift(shiftData) {
    try {
      const { data, error } = await supabase
        .from('shifts')
        .insert([{
          id: shiftData.id,
          date: shiftData.date,
          start_time: shiftData.startTime,
          status: 'open'
        }])
        .select();
      if (error) console.error('❌ createShift:', error);
      return data;
    } catch (err) {
      console.error('❌ createShift exception:', err);
      return null;
    }
  },

  async createReservation(resData) {
    try {
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
          deposit: resData.deposit || 0,
          status: 'pending'
        }])
        .select();

      if (error) console.error('❌ Supabase createReservation error:', error);
      return data;
    } catch (err) {
      console.error('❌ Supabase createReservation exception:', err);
      return null;
    }
  },

  async deleteReservation(id) {
    try {
      const cleanId = String(id).replace('RES-', '');
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', cleanId);

      if (error) console.error('❌ Supabase deleteReservation error:', error);
    } catch (err) {
      console.error('❌ Supabase deleteReservation exception:', err);
    }
  },
  
  // 9. fetchFeedbacks
  async fetchFeedbacks() {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase fetchFeedbacks error:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('❌ Supabase fetchFeedbacks exception:', err);
      return [];
    }
  },

  async deleteFeedback(id) {
    try {
      const { error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', id);

      if (error) console.error('❌ Supabase deleteFeedback error:', error);
      return !error;
    } catch (err) {
      console.error('❌ Supabase deleteFeedback exception:', err);
      return false;
    }
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pilots' }, payload => {
        console.log('🔄 Realtime Driver Update:', payload);
        callback(payload);
      })
      .subscribe();
  }
};
