import { supabase } from '../config/supabaseClient';

/**
 * خدمة التفاعل المباشر مع Supabase لنظام التوصيل وإدارة المطعم
 * بديلاً عن n8n Webhooks
 */

export const supabaseService = {
  // 1. جلب الطلبات النشطة والجديدة
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

      // تحويل هيكل Supabase إلى الهيكل الذي يتوقعه نظام الداشبورد
      return data.map(row => {
        const rawPayload = row.raw_payload || {};
        const orderId = rawPayload.order_id || `#${row.id.slice(0, 6)}`;
        const items = rawPayload.items || [];
        const safeItems = items.map(item => ({
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
        if (rawStatus === 'تم التأكيد' || rawStatus === 'waiting_driver' || rawStatus === 'confirmed') mappedStatus = 'waiting_driver';
        else if (rawStatus.includes('ملغي') || rawStatus === 'cancelled') mappedStatus = 'cancelled';
        else if (rawStatus === 'تم الإسناد للطيار' || rawStatus === 'driver_assigned') mappedStatus = 'driver_assigned';
        else if (rawStatus === 'في الطريق للتسليم' || rawStatus === 'active' || rawStatus === 'out_for_delivery') mappedStatus = 'active';
        else if (rawStatus === 'تم التسليم' || rawStatus === 'completed') mappedStatus = 'completed';
        else if (rawStatus.includes('فشل التوصيل') || rawStatus === 'failed_delivery') mappedStatus = 'failed_delivery';
        else if (rawStatus === 'pending' || rawStatus === 'pending_timer') mappedStatus = rawStatus;

        return {
          supabaseId: row.id,
          id: `EXT-${orderId}`,
          originalId: String(orderId),
          type: row.order_type === 'delivery' ? 'online' : 'takeaway',
          customerName: row.customer_name || rawPayload.customer?.full_name || 'عميل غير معروف',
          phone: row.customer_phone || rawPayload.customer?.phone_1 || 'غير مسجل',
          phone2: row.customer_phone_2 || rawPayload.customer?.phone_2 || '',
          area: row.delivery_address || rawPayload.customer?.delivery_info?.address || 'استلام من المطعم',
          total: Number(row.total_amount) || 0,
          deliveryFee: Number(row.delivery_fee) || 0,
          subtotal: Number(rawPayload.totals?.subtotal || 0),
          serviceFee: Number(row.service_fee || rawPayload.totals?.service_fee || 0),
          paidNow: Number(row.paid_now || rawPayload.totals?.paid_now || rawPayload.payment?.paid_now || 0),
          remainingAmount: Number(row.remaining_amount || rawPayload.totals?.remaining_amount || rawPayload.payment?.remaining_amount || 0),
          items: safeItems,
          itemsDescription: itemsDescription,
          paymentMethod: row.payment_method || rawPayload.customer?.payment_method || 'Cash',
          paymentScreenshot: row.payment_screenshot || rawPayload.payment?.screenshot || null,
          status: mappedStatus,
          displayStatus: rawStatus || 'pending',
          timestamp: row.created_at || rawPayload.timestamp || new Date().toISOString(),
          source: 'online',
          lat: row.latitude || rawPayload.customer?.delivery_info?.coordinates?.lat || null,
          lng: row.longitude || rawPayload.customer?.delivery_info?.coordinates?.lon || null,
          rawPayload: rawPayload
        };
      });
    } catch (err) {
      console.error('❌ Supabase fetchOrders exception:', err);
      return [];
    }
  },

  // 2. تحديث حالة الطلب
  async updateOrderStatus(orderId, newStatus, reason = null) {
    try {
      const cleanId = String(orderId).replace('EXT-', '');
      let dbStatus = newStatus;

      if (newStatus === 'confirmed' || newStatus === 'waiting_driver') {
        dbStatus = 'تم التأكيد';
      } else if (newStatus === 'cancelled') {
        dbStatus = reason ? `ملغي (${reason})` : 'ملغي';
      } else if (newStatus === 'driver_assigned') {
        dbStatus = 'تم الإسناد للطيار';
      } else if (newStatus === 'out_for_delivery' || newStatus === 'active') {
        dbStatus = 'في الطريق للتسليم';
      } else if (newStatus === 'completed') {
        dbStatus = 'تم التسليم';
      } else if (newStatus === 'failed_delivery') {
        dbStatus = reason ? `فشل التوصيل (${reason})` : 'فشل التوصيل';
      }
      
      // نبحث عن الطلب سواء بـ UUID أو بـ order_id المخزن في JSON
      const { error } = await supabase
        .from('orders')
        .update({ status: dbStatus })
        .or(`id.eq.${cleanId},raw_payload->>order_id.eq.${cleanId}`);

      if (error) {
        console.error(`❌ Supabase updateOrderStatus error for ${cleanId}:`, error);
      } else {
        console.log(`✅ Supabase status updated to ${dbStatus} for order ${cleanId}`);
      }
    } catch (err) {
      console.error('❌ Supabase updateOrderStatus exception:', err);
    }
  },

  // 3. جلب الحجوزات
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
        id: `RES-${row.id.slice(0, 6)}`,
        customerName: row.name || 'عميل بدون اسم',
        phone: row.phone || '',
        date: row.date || '',
        time: row.time || '',
        guests: row.guests || 2,
        locationType: row.location_type || 'restaurant',
        notes: row.notes || '',
        paymentProof: row.payment_screenshot || null,
        status: row.status || 'pending',
        timestamp: row.created_at || new Date().toISOString()
      }));
    } catch (err) {
      console.error('❌ Supabase fetchReservations exception:', err);
      return [];
    }
  },

  // 4. تحديث حالة الحجز
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

  // 5. جلب بيانات الطيارين (Drivers)
  async fetchDeliveryDrivers() {
    try {
      const { data, error } = await supabase
        .from('delivery')
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
        numberMotor: row.number_motor || '',
        numberId: row.number_id || null,
        startShift: row.start_shift || null,
        endShift: row.end_shif || null,
        status: row.status ? 'online' : 'offline',
        idDelivery: row.id_delivery || null,
        shift: row.start_shift && row.end_shif ? `${row.start_shift} - ${row.end_shif}` : 'بدون شيفت',
        zone: row.id_delivery === 1 ? 'مطرية' : row.id_delivery === 2 ? 'عين شمس' : 'عام',
        shiftStatus: row.status ? 'open' : 'closed' // For AppContext compatibility
      }));
    } catch (err) {
      console.error('❌ Supabase fetchDeliveryDrivers exception:', err);
      return [];
    }
  },

  async addDeliveryDriver(driverData) {
    try {
      const shiftStr = driverData.shift || '';
      const parts = shiftStr.split('-');
      
      const { data, error } = await supabase
        .from('delivery')
        .insert([{
          name: driverData.name,
          phone: driverData.phone,
          start_shift: parts[0]?.trim() || null,
          end_shif: parts[1]?.trim() || null,
          number_id: driverData.number_id ? parseInt(driverData.number_id, 10) || null : null,
          number_motor: driverData.number_motor?.trim() || null,
          status: false
        }])
        .select();

      if (error) console.error('❌ Supabase addDeliveryDriver error:', error);
      return data;
    } catch (err) {
      console.error('❌ Supabase addDeliveryDriver exception:', err);
      return null;
    }
  },

  // 6. تحديث حالة الطيار (متصل/غير متصل)
  async updateDriverStatus(id, isOnline) {
    try {
      const { error } = await supabase
        .from('delivery')
        .update({ status: isOnline })
        .eq('id', id);

      if (error) {
        console.error('❌ Supabase updateDriverStatus error:', error);
      }
    } catch (err) {
      console.error('❌ Supabase updateDriverStatus exception:', err);
    }
  },

  // 7. حفظ تقرير الوردية (Shift Report)
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

      if (error) console.error('❌ Supabase saveShiftReport error:', error);
    } catch (err) {
      console.error('❌ Supabase saveShiftReport exception:', err);
    }
  },

  async createReservation(resData) {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .insert([{
          customer_name: resData.customerName,
          customer_phone: resData.phone,
          reservation_date: resData.date,
          reservation_time: resData.time,
          guests_count: resData.guests,
          location_type: resData.type || resData.locationType,
          notes: resData.notes,
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
