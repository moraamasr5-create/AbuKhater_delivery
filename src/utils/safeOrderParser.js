/**
 * 🛡️ Safe Order Parser & Repair Engine
 * هذا المحرك يضمن أن أي بيانات قادمة من n8n يتم تنظيفها وترميمها
 * قبل دخولها إلى الـ State أو عرضها في الداشبورد.
 */

export const repairOrder = (order) => {
    if (!order) return null;

    // 💰 معالجة الماليات (Financial Healing)
    const rawTotal = order.payment?.amount_total || order.totals?.total || 0;
    const rawDelivery = order.payment?.delivery_fee || order.totals?.delivery_fee || 0;

    const safeTotal = isNaN(Number(rawTotal)) ? 0 : Number(rawTotal);
    const safeDelivery = isNaN(Number(rawDelivery)) ? 0 : Number(rawDelivery);

    // 👤 معالجة بيانات العميل (Customer Healing)
    const customer = order.customer || {};
    const safeCustomer = {
        name: (customer.name || customer.full_name || "عميل غير معروف").trim(),
        phone: customer.phone_primary || customer.phone || customer.mobile || "غير مسجل",
        address: customer.address || "غير محدد - استلام فرع"
    };

    // 🍔 معالجة الأصناف (Items Healing)
    const items = Array.isArray(order.items) ? order.items : [];
    const safeItems = items.map(item => ({
        name: item.name || "صنف غير معروف",
        count: Number(item.quantity || item.count || item.qty || 1) || 1,
        price: Number(item.price || 0) || 0
    }));

    // تجميع الوصف النصي للأصناف
    const safeItemsDescription = safeItems.length > 0
        ? safeItems.map(i => `${i.count}x ${i.name}`).join(', ')
        : "طلب خارجي (بدون تفاصيل)";

    return {
        ...order,
        customerName: safeCustomer.name,
        phone: safeCustomer.phone,
        area: safeCustomer.address,
        total: safeTotal,
        deliveryFee: safeDelivery,
        items: safeItems,
        itemsDescription: safeItemsDescription,
        paymentMethod: order.payment?.method || 'Cash',
        status: order.status || 'pending',
        timestamp: order.created_at || new Date().toISOString(),
        source: order.source || 'online' // 🌐 تحديد المصدر (أونلاين افتراضياً للطلبات الخارجية)
    };
};

/**
 * 📡 API Contract Layer
 * التحقق من صحة الأوردر وتجهيزه للسيستم
 */
export const safeParseOrder = (rawOrder) => {
    try {
        if (!rawOrder || !rawOrder.order_id) {
            console.warn('⚠️ Missing order_id, skipping record');
            return null;
        }

        // إرسال البيانات لمحرك الإصلاح
        const repaired = repairOrder(rawOrder);

        return {
            id: `EXT-${repaired.order_id}`, // توحيد الـ ID للسيستم
            originalId: String(repaired.order_id),
            type: 'external',
            ...repaired
        };
    } catch (error) {
        console.error('🔥 Critical error while parsing order:', error, rawOrder);
        return null;
    }
};
