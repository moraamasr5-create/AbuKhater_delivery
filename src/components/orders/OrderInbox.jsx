import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Check, X, AlertCircle, UserPlus, RotateCcw, Clock, Bike, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // 🪄 استيراد مكتبة التحريك لعمل الـ Live Dashboard

const RESTAURANT_COORDS = { lat: 30.126131, lng: 31.298350 };

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
};

const getZone = (dist) => {
    if (dist <= 3) return { id: 1, color: '#10b981' };
    if (dist <= 7) return { id: 2, color: '#3b82f6' };
    if (dist <= 10) return { id: 3, color: '#8b5cf6' };
    if (dist <= 15) return { id: 4, color: '#f59e0b' };
    return { id: 'Out', color: '#ef4444' };
};

const OrderInbox = ({ onReedit }) => {
    const { orders, pilots, confirmOrder, deleteOrder, cancelOrder, isShiftOpen, assignPilot, startDelivery, completeOrder, failDelivery, getSuggestedPilot, syncExternalOrders, userRole } = useApp();
    const handleCancel = (id) => {
        const reason = prompt('هل أنت متأكد من إلغاء الطلب؟ يرجى إدخال سبب الإلغاء:');
        if (reason) cancelOrder(id, reason);
    };
    const [selectedPilot, setSelectedPilot] = useState({});
    const [auditTimers, setAuditTimers] = useState({});
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [previewImage, setPreviewImage] = useState(null); // 🖼️ حالة عرض الصورة الكبيرة (Modal)

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        try {
            await syncExternalOrders();
        } finally {
            setTimeout(() => setIsRefreshing(false), 1000);
        }
    };

    // 🔴 تصفية الطلبات المعروضة بناءً على نوع المستخدم (ادمن او طيار)
    const inboxOrders = orders.filter(o => {
        if (userRole === 'admin') {
            // الادمن بيشوف الطلبات في مراحل التجهيز والانتظار
            return ['pending', 'pending_timer', 'waiting_driver', 'driver_assigned'].includes(o.status);
        } else {
            // الطيار بيشوف بس الطلبات اللي اتسندت ليه أو اللي "في الطريق" للتسليم
            return ['driver_assigned', 'active'].includes(o.status);
        }
    });

    const availablePilots = pilots.filter(p => p.shiftStatus === 'open');

    // Effect to handle local countdown
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const newTimers = {};
            inboxOrders.forEach(order => {
                if (order.status === 'pending_timer') {
                    const diff = Math.max(0, 5 - Math.floor((now - new Date(order.timestamp)) / 1000));
                    newTimers[order.id] = diff;
                }
            });
            setAuditTimers(newTimers);
        }, 500);
        return () => clearInterval(interval);
    }, [orders]); // Depend on orders to refresh

    const handlePrint = (order, pilotName = 'Not Assigned') => {
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (!printWindow) return;
        const itemsHtml = order.items ? order.items.map(i => `<div style="display:flex; justify-content:space-between; margin-bottom:5px; font-weight:bold;"><span>${i.name}</span><span>x${i.count}</span></div>`).join('') : '';
        const htmlContent = `
            <!DOCTYPE html>
            <html dir="rtl">
            <head><title>Kitchen Ticket #{order.originalId || order.id}</title>
            <style>body { font-family: 'Courier New', monospace; padding: 20px; width: 80mm; margin: 0 auto; text-align: center; } .header { font-size: 32px; font-weight: 800; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 15px; } .meta { font-size: 14px; margin-bottom: 15px; text-align: right; } .items { border-bottom: 2px dashed #000; padding-bottom: 15px; margin-bottom: 15px; text-align: right; } .footer { font-size: 12px; font-weight: bold; margin-top: 20px; }</style>
            </head>
            <body>
            <div class="header">#{order.originalId || order.id}</div>
            <div class="meta">
                <div>العميل: ${order.customerName}</div>
                <div>التوقيت: ${new Date().toLocaleTimeString('ar-EG')}</div>
                <div style="margin-top:5px; font-weight:bold; border:1px solid #000; padding:5px; text-align:center;">الطيار: ${pilotName}</div>
            </div>
            <div class="items">${itemsHtml || '<p>' + (order.itemsDescription || '') + '</p>'}</div>
            <div class="footer">نسخة المطبخ (FINAL) - Delivery Logic</div>
            <script>window.print();window.close();</script>
            </body></html>`;
        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const handleAssignAndPrint = (orderId) => {
        let pilotId = selectedPilot[orderId];

        // If no manual selection, try to get the suggested pilot
        if (!pilotId) {
            const suggested = getSuggestedPilot();
            if (suggested) pilotId = suggested.id;
        }

        if (!pilotId) {
            alert('please select a pilot');
            return;
        }

        // Validate pilot status
        const selectedPilotObj = pilots.find(p => p.id === pilotId);
        if (selectedPilotObj && selectedPilotObj.state === 'out') {
            alert('هذا الطيار في رحلة توصيل حالياً ولا يمكن إسناد طلب جديد له 🚫');
            return;
        }

        assignPilot(orderId, pilotId);

        // Find pilot name for print
        const pilotName = pilots.find(p => p.id === pilotId)?.name || 'Unknown';
        // Need to pass order object, but state might not be updated yet. Use current order data + new pilot.
        const order = orders.find(o => o.id === orderId);
        if (order) handlePrint({ ...order, pilotId }, pilotName);
    };

    if (!isShiftOpen) {
        return (
            <div className="glass-card" style={{ padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <AlertCircle size={48} color="var(--warning)" />
                <h2>يجب فتح الوردية أولاً لاستقبال الطلبات</h2>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '25px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '700' }}>مرحلة التجهيز والإسناد</h2>
                    <p style={{ color: 'var(--text-muted)' }}>مراجعة الطلبات &gt; اختيار الطيار (Fair Queue) &gt; الطباعة والإسناد &gt; خروج الطيار</p>
                </div>
                <button
                    onClick={handleManualRefresh}
                    disabled={isRefreshing}
                    className="btn-primary"
                    style={{
                        background: 'var(--primary)',
                        gap: '8px',
                        padding: '12px 24px',
                        boxShadow: '0 4px 15px rgba(79, 70, 229, 0.4)'
                    }}
                >
                    <RefreshCw size={20} className={isRefreshing ? 'pulse-dot' : ''} />
                    <span style={{ fontWeight: 'bold' }}>تنشيط الاستلام</span>
                </button>
            </header>

            {inboxOrders.length === 0 ? (
                <div className="glass-card" style={{ padding: '80px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)' }}>لا توجد طلبات في مرحلة الإعداد</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <AnimatePresence mode="popLayout">
                        {inboxOrders.map(order => {
                            const isInGracePeriod = order.status === 'pending_timer';
                            const timeLeft = auditTimers[order.id] || 0;
                            const suggestedPilot = order.status === 'waiting_driver' ? getSuggestedPilot() : null;
                            const isOnline = !!order.customer;

                            const normalized = isOnline ? {
                                name: order.customer?.name || "عميل غير معروف",
                                phone: order.customer?.phone_primary || order.customer?.phone || order.customer?.phone_final || "غير متوفر",
                                phone2: order.customer?.phone && order.customer?.phone !== order.customer?.phone_primary ? order.customer.phone : null,
                                address: order.customer?.address || "No Address",
                                deliveryFee: order.totals?.delivery_fee || 0,
                                total: order.totals?.total || order.payment?.amount_total || 0,
                                paymentMethod: order.payment?.method || "unknown",
                                lat: order.lat || order.lan || 30.0444, // Default to Cairo for MVP WOW effect
                                lng: order.lng || order.len || 31.2357, // Default to Cairo for MVP WOW effect
                                screenshot: order.screenshot
                            } : null;

                            if (isOnline && normalized.screenshot?.includes("drive.google.com")) {
                                const match = normalized.screenshot.match(/\/d\/([^\/]+)/);
                                if (match) normalized.screenshot = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w500`;
                            }

                            let statusColor = 'var(--border)';
                            let statusBg = 'transparent';
                            if (order.status === 'pending') { statusColor = 'var(--warning)'; statusBg = 'rgba(245, 158, 11, 0.05)'; }
                            if (order.status === 'waiting_driver') { statusColor = 'var(--accent)'; statusBg = 'rgba(16, 185, 129, 0.05)'; }
                            if (order.status === 'driver_assigned') { statusColor = '#3b82f6'; statusBg = 'rgba(59, 130, 246, 0.05)'; }

                            return (
                                <motion.div
                                    key={order.id}
                                    layout // 🪄 تحريك العناصر الأخرى بسلاسة عند حذف عنصر
                                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: 20, scale: 0.9, transition: { duration: 0.2 } }}
                                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                    className={`glass-card order-card order-card-grid ${order.status === 'pending' ? 'pulse-new' : ''}`}
                                    style={{ padding: '24px', alignItems: 'center', borderLeft: `6px solid ${statusColor}`, background: statusBg, position: 'relative' }}
                                >

                                    {/* Status Indicator Badge */}
                                    <div style={{ position: 'absolute', top: '12px', right: '12px', background: statusColor, color: '#fff', fontSize: '0.7rem', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', boxShadow: `0 2px 10px ${statusColor}80` }}>
                                        {order.status === 'pending' ? 'طلب جديد' : order.status === 'waiting_driver' ? 'بانتظار الطيار' : order.status === 'active' ? 'في الطريق 🚚' : 'تم الإسناد'}
                                    </div>

                                    {/* 1. Order ID & Badge */}
                                    <div>
                                        <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--primary)' }}>#{order.originalId || order.id} {order.type === 'talabat' && <span style={{ fontSize: '0.6rem', verticalAlign: 'middle', background: '#ff5722', color: 'white', padding: '2px', borderRadius: '4px' }}>Talabat</span>}</h3>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {new Date(order.timestamp).toLocaleTimeString('ar-EG')}
                                        </p>

                                        {/* 📍 Zone & Distance Badge */}
                                        {isOnline && normalized.lat && normalized.lng && (
                                            <div style={{ marginTop: '8px' }}>
                                                {(() => {
                                                    const dist = calculateDistance(RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng, normalized.lat, normalized.lng);
                                                    const zoneCfg = getZone(dist);
                                                    return (
                                                        <div style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                            padding: '4px 10px', borderRadius: '12px', background: `${zoneCfg.color}15`,
                                                            border: `1px solid ${zoneCfg.color}30`, color: zoneCfg.color, fontSize: '0.75rem', fontWeight: 'bold'
                                                        }}>
                                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: zoneCfg.color }}></div>
                                                            نطاق {zoneCfg.id} • {dist} كم
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}

                                        {isInGracePeriod && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>Grace: {timeLeft}s</span>}
                                    </div>

                                    {/* 2. Customer Info */}
                                    <div>
                                        {isOnline ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {/* 1. Header (Name + Phones Badge) */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                                                    <h4 style={{ margin: '0', fontWeight: '900', fontSize: '1.5rem', color: 'var(--primary)', textShadow: '0 0 15px rgba(79, 70, 229, 0.2)' }}>
                                                        🧍 {normalized.name}
                                                    </h4>
                                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        <a href={`tel:${normalized.phone}`} style={{
                                                            fontSize: '0.85rem', fontWeight: 'bold', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6',
                                                            padding: '4px 12px', borderRadius: '20px', textDecoration: 'none', border: '1px solid rgba(59, 130, 246, 0.2)',
                                                            display: 'flex', alignItems: 'center', gap: '4px'
                                                        }}>
                                                            📞 {normalized.phone}
                                                        </a>
                                                        {normalized.phone2 && (
                                                            <a href={`tel:${normalized.phone2}`} style={{
                                                                fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)',
                                                                padding: '4px 12px', borderRadius: '20px', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)'
                                                            }}>
                                                                📞 {normalized.phone2}
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* 2. Address (Max 2 lines, ellipsis) */}
                                                <p style={{
                                                    margin: '0', fontSize: '1rem', color: 'var(--text-muted)', lineHeight: '1.4',
                                                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                                                }} title={normalized.address}>
                                                    📍 {normalized.address}
                                                </p>

                                                {/* 3. Smart Payment Summary */}
                                                <div style={{
                                                    padding: '10px 16px', background: (Number(normalized.deliveryFee) + Number(normalized.total)) > 0 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.05)',
                                                    borderRadius: '12px', border: `1px solid ${(Number(normalized.deliveryFee) + Number(normalized.total)) > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'}`,
                                                    width: 'fit-content'
                                                }}>
                                                    {(Number(normalized.deliveryFee) + Number(normalized.total)) > 0 ? (
                                                        <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#10b981' }}>
                                                            💰 {normalized.deliveryFee} + {normalized.total} = {Number(normalized.deliveryFee) + Number(normalized.total)} EGP
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#f59e0b' }}>
                                                            💰 لم يتم تحديد السعر
                                                        </span>
                                                    )}
                                                </div>

                                                {/* 4. Actions Row (Badges + Location + Screenshot) */}
                                                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                                                    {/* 💳 Payment Method Badge */}
                                                    {(() => {
                                                        const method = (normalized.paymentMethod || "").toLowerCase();
                                                        let badge = { text: "💳 Online", color: "var(--text-muted)", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)", glow: "transparent" };

                                                        if (method === 'cash') badge = { text: "💵 كاش", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.2)", glow: "rgba(16, 185, 129, 0.1)" };
                                                        else if (method === 'vodafone_cash' || method.includes('vodafone')) badge = { text: "📱 فودافون", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.2)", glow: "rgba(239, 68, 68, 0.1)" };
                                                        else if (method === 'instapay') badge = { text: "⚡ InstaPay", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)", border: "rgba(59, 130, 246, 0.2)", glow: "rgba(59, 130, 246, 0.1)" };

                                                        return (
                                                            <div style={{
                                                                padding: '6px 16px', borderRadius: '30px', fontSize: '0.85rem', fontWeight: '800',
                                                                background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
                                                                boxShadow: `0 0 10px ${badge.glow}`
                                                            }}>
                                                                {badge.text}
                                                            </div>
                                                        );
                                                    })()}

                                                    {/* 🟡 Location Button */}
                                                    {normalized.lat && normalized.lng && (
                                                        <button
                                                            onClick={() => window.open(`https://www.google.com/maps?q=${normalized.lat},${normalized.lng}`, '_blank')}
                                                            className="btn-primary hover-scale"
                                                            style={{
                                                                padding: '6px 16px', fontSize: '0.85rem', background: '#f59e0b',
                                                                color: 'white', borderRadius: '30px', border: 'none', fontWeight: 'bold',
                                                                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)', display: 'flex', alignItems: 'center', gap: '6px'
                                                            }}
                                                        >
                                                            🟡 اللوكيشن
                                                        </button>
                                                    )}

                                                    {/* 🖼️ Mini Preview Thumbnail */}
                                                    {normalized.screenshot && (
                                                        <div
                                                            onClick={() => setPreviewImage(normalized.screenshot)}
                                                            className="hover-scale"
                                                            style={{
                                                                width: '42px', height: '42px', borderRadius: '10px', overflow: 'hidden',
                                                                cursor: 'pointer', border: '2px solid rgba(255,255,255,0.1)',
                                                                boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                                                            }}
                                                        >
                                                            <img src={normalized.screenshot} alt="preview" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <h4 style={{ margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {order.customerName || order.customer?.name || "عميل غير معروف"}
                                                    {order.total === 0 && (
                                                        <span style={{ fontSize: '0.6rem', background: 'var(--danger)', color: 'white', padding: '2px 6px', borderRadius: '4px', animation: 'pulse 2s infinite' }}>⚠️ راجع الطلب</span>
                                                    )}
                                                </h4>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    {order.area || order.customer?.address || "غير مسجل"}
                                                </p>

                                                {/* 📍 Zone & Distance Badge for Manual Orders */}
                                                {order.lat && order.lng && (
                                                    <div style={{ marginTop: '8px' }}>
                                                        {(() => {
                                                            const dist = calculateDistance(RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng, order.lat, order.lng);
                                                            const zoneCfg = getZone(dist);
                                                            return (
                                                                <div style={{
                                                                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                                    padding: '4px 10px', borderRadius: '12px', background: `${zoneCfg.color}15`,
                                                                    border: `1px solid ${zoneCfg.color}30`, color: zoneCfg.color, fontSize: '0.75rem', fontWeight: 'bold'
                                                                }}>
                                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: zoneCfg.color }}></div>
                                                                    نطاق {zoneCfg.id} • {dist} كم
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                )}

                                                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>

                                                    {/* 💵 Payment Badge */}
                                                    {(() => {
                                                        const method = (order.payment?.method || order.paymentMethod || "غير محدد").toLowerCase();
                                                        const isCash = method.includes('cash') && !method.includes('vodafone');
                                                        const isVF = method.includes('vodafone') || method.includes('v-cash') || method.includes('فودافون');

                                                        return (
                                                            <div style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                padding: '4px 10px',
                                                                borderRadius: '20px',
                                                                fontSize: '0.8rem',
                                                                fontWeight: '600',
                                                                background: isCash ? 'rgba(16, 185, 129, 0.15)' : isVF ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.05)',
                                                                color: isCash ? '#10b981' : isVF ? '#a78bfa' : 'var(--text-muted)',
                                                                border: `1px solid ${isCash ? 'rgba(16, 185, 129, 0.2)' : isVF ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.1)'}`
                                                            }}>
                                                                {isCash ? '💵 كاش' : isVF ? '📱 فودافون كاش' : `💳 ${method}`}
                                                            </div>
                                                        );
                                                    })()}

                                                    {/* 🖼️ Mini Preview Thumbnail */}
                                                    {(order.screenshot || order.image || order.attachment || order.paymentProof) && (
                                                        <div
                                                            onClick={() => setPreviewImage(order.screenshot || order.image || order.attachment || order.paymentProof)}
                                                            className="hover-scale"
                                                            style={{
                                                                width: '45px',
                                                                height: '45px',
                                                                borderRadius: '8px',
                                                                overflow: 'hidden',
                                                                cursor: 'pointer',
                                                                border: '2px solid var(--border)'
                                                            }}
                                                            title="عرض صورة التحويل"
                                                        >
                                                            <img
                                                                src={order.screenshot || order.image || order.attachment || order.paymentProof}
                                                                alt="preview"
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            />
                                                        </div>
                                                    )}

                                                    {/* 📍 Location Button (Prominent Map Access) */}
                                                    {order.lat && order.lng && (
                                                        <button
                                                            onClick={() => window.open(`https://www.google.com/maps?q=${order.lat},${order.lng}`, '_blank')}
                                                            className="btn-primary hover-scale"
                                                            style={{
                                                                padding: '8px 16px',
                                                                fontSize: '0.8rem',
                                                                background: 'var(--primary)',
                                                                color: 'white',
                                                                borderRadius: '20px',
                                                                gap: '6px',
                                                                boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)'
                                                            }}
                                                            title="فتح الموقع على الخريطة"
                                                        >
                                                            📍 عرض الموقع
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* 3. Workflow Action Area */}
                                    <div>
                                        {/* Stage 1: Pending -> Confirm (Admin Only) */}
                                        {(order.status === 'pending' || order.status === 'pending_timer') && userRole === 'admin' && (
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                {isInGracePeriod ? (
                                                    <button
                                                        onClick={() => onReedit(order)}
                                                        className="btn-primary"
                                                        style={{ width: '100%', background: 'var(--warning)', color: 'black' }}
                                                    >
                                                        <RotateCcw size={18} /> الرجوع خطوة للتعديل
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => confirmOrder(order.id)}
                                                        className="btn-primary"
                                                        style={{ width: '100%' }}
                                                    >
                                                        <Check size={18} /> تأكيد وقبول
                                                    </button>
                                                )}
                                                <button onClick={() => handleCancel(order.id)} className="btn-danger-outline"><X size={18} /></button>
                                            </div>
                                        )}

                                        {/* Stage 2: Waiting Driver -> Assign (Admin Only) */}
                                        {order.status === 'waiting_driver' && userRole === 'admin' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {suggestedPilot && (
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <span style={{ fontWeight: 'bold' }}>⭐ مقترح:</span> {suggestedPilot.name}
                                                    </div>
                                                )}
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <select
                                                        className="glass-card"
                                                        style={{ flex: 1, padding: '8px', background: '#1f2937', color: 'white', border: '1px solid var(--border)' }}
                                                        onChange={(e) => setSelectedPilot({ ...selectedPilot, [order.id]: e.target.value })}
                                                        value={selectedPilot[order.id] || suggestedPilot?.id || ''}
                                                    >
                                                        <option value="">اختر طيار...</option>
                                                        {availablePilots.map(p => (
                                                            <option key={p.id} value={p.id} disabled={p.state === 'out'}>
                                                                {p.name} {p.state === 'out' ? '(في توصيل 🚫)' : '(متاح)'} - {p.ordersCount || 0} طلبات
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        onClick={() => handleAssignAndPrint(order.id)}
                                                        disabled={!selectedPilot[order.id] && !suggestedPilot}
                                                        className="btn-primary"
                                                        style={{ background: 'var(--accent)' }}
                                                        title="إسناد وطباعة البون"
                                                    >
                                                        <UserPlus size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Stage 3: Assigned -> Out (Admin or Assigned Driver) */}
                                        {order.status === 'driver_assigned' && (
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ marginBottom: '8px', fontSize: '0.9rem' }}>
                                                    الطيار: <strong>{pilots.find(p => p.id === order.pilotId)?.name}</strong>
                                                </div>
                                                <button
                                                    onClick={() => startDelivery(order.id)}
                                                    className="btn-primary"
                                                    style={{ width: '100%', background: 'var(--success)' }}
                                                >
                                                    <Bike size={18} /> ابدأ الرحلة الآن
                                                </button>
                                            </div>
                                        )}

                                        {/* Stage 4: Out -> Complete/Fail (Driver View) */}
                                        {order.status === 'active' && userRole === 'driver' && (
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button
                                                    onClick={() => completeOrder(order.id)}
                                                    className="btn-primary"
                                                    style={{ flex: 2, background: 'var(--success)' }}
                                                >
                                                    <Check size={18} /> تم التسليم
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const reason = prompt('سبب فشل التوصيل:');
                                                        if (reason) failDelivery(order.id, reason);
                                                    }}
                                                    className="btn-danger-outline"
                                                    style={{ flex: 1 }}
                                                >
                                                    <X size={18} /> فشل
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', flexDirection: 'column', alignItems: 'center' }}>
                                        <button onClick={() => handlePrint(order)} style={{ background: 'none', border: 'none', cursor: 'pointer' }} title="طباعة نسخة"><span style={{ fontSize: '1.2rem' }}>🖨️</span></button>
                                        {!isInGracePeriod && order.status !== 'pending' && (
                                            <button onClick={() => handleCancel(order.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white' }} title="إلغاء الطلب"><X size={20} /></button>
                                        )}
                                    </div>

                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* 🖼️ Full Image Modal Preview */}
            <AnimatePresence>
                {previewImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setPreviewImage(null)}
                        style={{
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 9999, backdropFilter: 'blur(10px)', padding: '40px'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}
                        >
                            <img src={previewImage} alt="Full view" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
                            <button onClick={() => setPreviewImage(null)} style={{ position: 'absolute', top: '-15px', right: '-15px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer' }}><X size={18} /></button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default OrderInbox;
