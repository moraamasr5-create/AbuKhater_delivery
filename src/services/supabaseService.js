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
        const orderId = row.raw_payload?.order_id || `#${row.id.slice(0, 6)}`;
        const items = row.raw_payload?.items || [];
        const safeItems = items.map(item => ({
          name: item.name || item.item_name || "صنف غير معروف",
          count: Number(item.quantity || item.count || 1),
          price: Number(item.price || item.unit_price || 0)
        }));

        const itemsDescription = safeItems.length > 0
          ? safeItems.map(i => `${i.count}x ${i.name}`).join(', ')
          : "طلب خارجي (بدون تفاصيل)";

        return {
          supabaseId: row.id,
          id: `EXT-${orderId}`,
          originalId: String(orderId),
          type: row.order_type === 'delivery' ? 'online' : 'takeaway',
          customerName: row.customer_name || 'عميل غير معروف',
          phone: row.customer_phone || 'غير مسجل',
          phone2: row.customer_phone_2 || '',
          area: row.delivery_address || 'استلام من المطعم',
          total: Number(row.total_amount) || 0,
          deliveryFee: Number(row.delivery_fee) || 0,
          items: safeItems,
          itemsDescription: itemsDescription,
          paymentMethod: row.payment_method || 'Cash',
          paymentScreenshot: row.payment_screenshot || null,
          status: row.status || 'pending',
          timestamp: row.created_at || new Date().toISOString(),
          source: 'online'
        };
      });
    } catch (err) {
      console.error('❌ Supabase fetchOrders exception:', err);
      return [];
    }
  },

  // 2. تحديث حالة الطلب
  async updateOrderStatus(orderId, newStatus) {
    try {
      const cleanId = String(orderId).replace('EXT-', '');
      
      // نبحث عن الطلب سواء بـ UUID أو بـ order_id المخزن في JSON
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .or(`id.eq.${cleanId},raw_payload->>order_id.eq.${cleanId}`);

      if (error) {
        console.error(`❌ Supabase updateOrderStatus error for ${cleanId}:`, error);
      } else {
        console.log(`✅ Supabase status updated to ${newStatus} for order ${cleanId}`);
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

  // 5. حفظ تقرير الوردية (Shift Report)
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
  }
};
