/**
 * إعدادات الروابط والـ API لنظام أبو خاطر
 * مجمع هنا لسهولة التعديل في مكان واحد
 */

export const API_CONFIG = {
    // 1. رابط إرسال البيانات (Webhook)
    // يُستخدم لإرسال الطلبات الجديدة، الحجوزات، وإجراءات الطيارين إلى n8n
    N8N_SEND_URL: 'https://restaurant1abukhater.app.n8n.cloud/webhook-test/OrderReview',

    // 2. رابط جلب الطلبات (Polling)
    // يُستخدم لسحب الطلبات الجديدة القادمة من "أونلاين" بشكل آلي كل 15 ثانية
    N8N_FETCH_URL: 'https://restaurant1abukhater.app.n8n.cloud/webhook-test/GetNewOrders',

    // 3. روابط التنبيهات الصوتية
    // تعليق: يمكنك تغيير الرابط بأي ملف صوتي MP3 آخر
    SOUNDS: {
        NEW_ORDER: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
        ALERT: 'https://assets.mixkit.co/active_storage/sfx/2857/2857-preview.mp3'
    },

    // 4. إعدادات النظام (System Config)
    POLLING_INTERVAL: 15000, // سرعة فحص الطلبات الجديدة بالمللي ثانية
    AUTO_REFRESH: false      // تعطيل التحديث التلقائي (الاعتماد على المزامنة اليدوية فقط)
};
