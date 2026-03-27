import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Check, X, AlertCircle, UserPlus, RotateCcw, Clock, Bike, RefreshCw } from 'lucide-react';

const OrderInbox = ({ onReedit }) => {
    const { orders, pilots, confirmOrder, deleteOrder, cancelOrder, isShiftOpen, assignPilot, startDelivery, getSuggestedPilot, syncExternalOrders } = useApp();
    const handleCancel = (id) => {
        const reason = prompt('هل أنت متأكد من إلغاء الطلب؟ يرجى إدخال سبب الإلغاء:');
        if (reason) cancelOrder(id, reason);
    };
    const [selectedPilot, setSelectedPilot] = useState({});
    const [auditTimers, setAuditTimers] = useState({});
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        try {
            await syncExternalOrders();
        } finally {
            setTimeout(() => setIsRefreshing(false), 1000);
        }
    };

    // Filter for all orders in the "Inbox" workflow stages
    const inboxOrders = orders.filter(o =>
        ['pending', 'pending_timer', 'waiting_driver', 'driver_assigned'].includes(o.status)
    );

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
                    {inboxOrders.map(order => {
                        const isInGracePeriod = order.status === 'pending_timer';
                        const timeLeft = auditTimers[order.id] || 0;
                        const suggestedPilot = order.status === 'waiting_driver' ? getSuggestedPilot() : null;

                        // Auto-select suggested pilot if not manually selected yet
                        // Note: This relies on render loop, safer to just use suggested as default value in select

                        let statusColor = 'var(--border)';
                        let statusBg = 'transparent';
                        if (order.status === 'pending') { statusColor = 'var(--warning)'; statusBg = 'rgba(245, 158, 11, 0.05)'; }
                        if (order.status === 'waiting_driver') { statusColor = 'var(--accent)'; statusBg = 'rgba(16, 185, 129, 0.05)'; }
                        if (order.status === 'driver_assigned') { statusColor = '#3b82f6'; statusBg = 'rgba(59, 130, 246, 0.05)'; }

                        return (
                            <div key={order.id} className="glass-card" style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1.5fr 1.5fr auto', gap: '24px', alignItems: 'center', borderLeft: `6px solid ${statusColor}`, background: statusBg }}>

                                {/* 1. Order ID & Badge */}
                                <div>
                                    <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--primary)' }}>#{order.originalId || order.id} {order.type === 'talabat' && <span style={{ fontSize: '0.6rem', verticalAlign: 'middle', background: '#ff5722', color: 'white', padding: '2px', borderRadius: '4px' }}>Talabat</span>}</h3>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {new Date(order.timestamp).toLocaleTimeString('ar-EG')}
                                    </p>
                                    {isInGracePeriod && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>Grace: {timeLeft}s</span>}
                                </div>

                                {/* 2. Customer Info */}
                                <div>
                                    <h4 style={{ margin: '0 0 4px 0' }}>{order.customerName}</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{order.area}</p>
                                    <p style={{ fontWeight: 'bold' }}>
                                        {order.total || 0} ج.م
                                        {order.paymentMethod && <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-muted)', marginRight: '5px' }}>({order.paymentMethod === 'Visa' ? '💳 فيزا' : order.paymentMethod === 'Wallet' ? '📱 محفظة' : '💵 كاش'})</span>}
                                        {order.paymentProof && <span style={{ cursor: 'pointer', marginLeft: '5px' }} onClick={() => { const w = window.open(); w.document.write('<img src="' + order.paymentProof + '" style="max-width:100%"/>'); }} title="عرض صورة التحويل">📸</span>}
                                    </p>
                                </div>

                                {/* 3. Workflow Action Area */}
                                <div>
                                    {/* Stage 1: Pending -> Confirm */}
                                    {(order.status === 'pending' || order.status === 'pending_timer') && (
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

                                    {/* Stage 2: Waiting Driver -> Assign */}
                                    {order.status === 'waiting_driver' && (
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

                                    {/* Stage 3: Assigned -> Out */}
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
                                                <Bike size={18} /> خروج للدليفري
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

                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default OrderInbox;
