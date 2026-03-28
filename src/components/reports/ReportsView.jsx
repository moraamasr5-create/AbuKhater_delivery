import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { FileText, Download, Trash2, Calendar, Clock, DollarSign, Bike, TrendingUp, Home, Globe, Printer, UtensilsCrossed } from 'lucide-react';

const ReportsView = () => {
    const { currentShift, dailyReports, activeStats, closeShift, openShift, isShiftOpen, orders, reservations } = useApp();
    const [selectedPilotDetails, setSelectedPilotDetails] = React.useState(null);
    const [showDues, setShowDues] = React.useState(false);
    const [showArchives, setShowArchives] = React.useState(false);

    const handlePrintShiftReport = (report) => {
        const printWindow = window.open('', '_blank', 'width=900,height=900');
        if (!printWindow) return;

        const pilotSummaryHtml = (report.pilotStats || []).map(p => `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px; text-align: right;">${p.name}</td>
                <td style="padding: 10px; text-align: center;">${p.restaurantOrdersCount || 0}</td>
                <td style="padding: 10px; text-align: center;">${p.talabatOrdersCount || 0}</td>
                <td style="padding: 10px; text-align: center;">${p.tripsCount || 0}</td>
                <td style="padding: 10px; text-align: left; font-weight: bold;">${Math.floor(p.totalEarnings)} ج.م</td>
            </tr>
        `).join('');

        const htmlContent = `
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <title>تقرير وردية - ${report.date}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                    .header { text-align: center; border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #333; color: white; padding: 12px; text-align: right; }
                    .summary-box { background: #f4f4f4; padding: 20px; border-radius: 8px; margin-top: 30px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
                    .total-final { grid-column: span 2; background: #333; color: white; padding: 15px; text-align: center; font-size: 1.5rem; border-radius: 8px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>تقرير ختامي للوردية</h1>
                    <p>التاريخ: <strong>${report.date}</strong></p>
                    <p>من: ${new Date(report.startTime).toLocaleTimeString('ar-EG')} | إلى: ${new Date(report.endTime).toLocaleTimeString('ar-EG')}</p>
                </div>

                <section>
                    <h2>إحصائيات الطيارين</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>الطيار</th>
                                <th style="text-align: center;">مطعم</th>
                                <th style="text-align: center;">طلبات</th>
                                <th style="text-align: center;">مشاوير</th>
                                <th style="text-align: left;">المستحقات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pilotSummaryHtml}
                        </tbody>
                    </table>
                </section>

                <section class="summary-box">
                    <div>إجمالي عدد الطلبات: <strong>${report.ordersCount}</strong></div>
                    <div>إجمالي بدل الحضور: <strong>${report.totalAttendancePay} ج.م</strong></div>
                    <div>إجمالي نصيب التوصيل: <strong>${report.totalDeliveryFees} ج.م</strong></div>
                    <div class="total-final">إجمالي مصروف الدليفري: ${report.totalPilotDues} ج.م</div>
                </section>

                <div style="margin-top: 50px; text-align: center; font-size: 0.9rem; color: #888;">
                    تاريخ الطباعة: ${new Date().toLocaleString('ar-EG')} - نظام إدارة الدليفري
                </div>
                <script>window.print();</script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    useEffect(() => {
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                setSelectedPilotDetails(null);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, []);

    const handleCloseShift = () => {
        const now = new Date();
        const currentHour = now.getHours();

        if (currentHour >= 4 && currentHour < 12) {
            closeShift(true);
        } else {
            const password = prompt('برجاء إدخال كلمة المرور لإغلاق اليوم:');
            if (password === '8080') {
                closeShift(false);
            } else if (password !== null) {
                alert('كلمة المرور غير صحيحة');
            }
        }
    };

    const handleOpenShift = () => {
        const password = prompt('برجاء إدخال كلمة المرور لفتح وردية جديدة:');
        if (password === '8080') {
            openShift();
        } else {
            alert('كلمة المرور غير صحيحة');
        }
    };

    const getPilotOrders = (pilotId) => {
        // Filter orders for the current shift and specific pilot (Only completed or failed)
        return orders
            .filter(o => o.pilotId === pilotId && (o.status === 'completed' || o.status === 'failed_delivery'))
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    };

    const handlePrintPilotReport = (pilot) => {
        const pOrders = getPilotOrders(pilot.id);
        const printWindow = window.open('', '_blank', 'width=800,height=900');
        if (!printWindow) return;

        const ordersHtml = pOrders.map(o => {
            const isFailed = o.status === 'failed_delivery';
            const share = isFailed ? 0 : (o.type === 'trip' ? o.deliveryFee : (o.deliveryFee / 2));
            return `
                <tr style="border-bottom: 1px solid #eee; ${isFailed ? 'color: #888;' : ''}">
                    <td style="padding: 10px; text-align: right;">#${o.originalId || o.id}</td>
                    <td style="padding: 10px; text-align: right;">${new Date(o.timestamp).toLocaleTimeString('ar-EG')}</td>
                    <td style="padding: 10px; text-align: right;">
                        ${o.type === 'trip' ? 'مشوار' : (o.type === 'talabat' || o.type === 'external') ? 'طلبات' : 'مطعم'}
                        ${isFailed ? '<br/><small>(فشل: ' + o.failureReason + ')</small>' : ''}
                    </td>
                    <td style="padding: 10px; text-align: left;">${o.deliveryFee} ج.م</td>
                    <td style="padding: 10px; text-align: left; font-weight: bold;">${share} ج.م</td>
                </tr>
            `;
        }).join('');

        const htmlContent = `
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <title>تقرير طيار - ${pilot.name}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                    .header { text-align: center; border-bottom: 3px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                    .section { margin-bottom: 30px; }
                    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-top: 20px; }
                    .summary-item { background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #ddd; text-align: center; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #333; color: white; padding: 12px; text-align: right; }
                    .total-box { margin-top: 30px; padding: 20px; background: #333; color: white; border-radius: 8px; text-align: center; font-size: 1.4rem; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>كشف حساب طيار</h1>
                    <p style="font-size: 1.2rem;">الطيار: <strong>${pilot.name}</strong></p>
                    <p>التاريخ: ${new Date().toLocaleDateString('ar-EG')} | الوقت: ${new Date().toLocaleTimeString('ar-EG')}</p>
                </div>

                <div class="section">
                    <h2 style="border-right: 5px solid #333; padding-right: 15px;">ملخص الوردية</h2>
                    <div class="summary-grid">
                        <div class="summary-item"><div>مطعم</div><strong>${pilot.restaurantOrdersCount || 0}</strong></div>
                        <div class="summary-item"><div>طلبات</div><strong>${pilot.talabatOrdersCount || 0}</strong></div>
                        <div class="summary-item"><div>مشاوير</div><strong>${pilot.tripsCount || 0}</strong></div>
                        <div class="summary-item"><div>ساعات</div><strong>${(pilot.totalMinutes / 60).toFixed(1)} س</strong></div>
                    </div>
                </div>

                <div class="section">
                    <h2 style="border-right: 5px solid #333; padding-right: 15px;">تفاصيل الرحلات</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>رقم البون</th>
                                <th>الوقت</th>
                                <th>النوع</th>
                                <th style="text-align: left;">القيمة</th>
                                <th style="text-align: left;">الصافي</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ordersHtml}
                        </tbody>
                    </table>
                </div>

                <div class="section">
                    <h2 style="border-right: 5px solid #333; padding-right: 15px;">الأرباح النهائية</h2>
                    <div style="display: flex; justify-content: space-between; margin-top: 15px; font-size: 1.1rem;">
                        <span>إجمالي نصيب التوصيل:</span>
                        <strong>${pilot.feeEarnings} ج.م</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 1.1rem;">
                        <span>حساب ساعات الحضور:</span>
                        <strong>${pilot.attendancePay} ج.م</strong>
                    </div>
                    <div class="total-box">
                        الإجمالي المستحق للطيار: ${Math.floor(pilot.totalEarnings)} ج.م
                    </div>
                </div>

                <div style="margin-top: 50px; text-align: center; font-size: 0.9rem; color: #888;">
                    تاريخ الطباعة: ${new Date().toLocaleString('ar-EG')} - نظام إدارة الدليفري
                </div>

                <script>window.print();</script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {selectedPilotDetails && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
                    <div className="glass-card" style={{ width: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>تفاصيل رحلات: {selectedPilotDetails.name}</h3>
                            <button onClick={() => setSelectedPilotDetails(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><span style={{ fontSize: '1.5rem' }}>&times;</span></button>
                        </div>
                        <div style={{ padding: '20px', overflowY: 'auto' }}>
                            {/* Summary Section */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                                {(() => {
                                    const pOrders = getPilotOrders(selectedPilotDetails.id);
                                    const restaurantCount = pOrders.filter(o => o.type === 'restaurant').length;
                                    const talabatCount = pOrders.filter(o => o.type === 'talabat' || o.type === 'external').length;
                                    const tripCount = pOrders.filter(o => o.type === 'trip').length;

                                    return (
                                        <>
                                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.8rem', color: '#60a5fa', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Home size={14} /> مطعم</div>
                                                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'white' }}>{restaurantCount}</div>
                                            </div>
                                            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.8rem', color: '#fbbf24', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Globe size={14} /> طلبات</div>
                                                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'white' }}>{talabatCount}</div>
                                            </div>
                                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.8rem', color: '#34d399', marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Bike size={14} /> مشاوير</div>
                                                <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'white' }}>{tripCount}</div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
                                        <th style={{ padding: '10px 0', textAlign: 'right' }}>رقم الطلب</th>
                                        <th style={{ padding: '10px 0', textAlign: 'right' }}>النوع</th>
                                        <th style={{ padding: '10px 0', textAlign: 'right' }}>قيمة التوصيل</th>
                                        <th style={{ padding: '10px 0', textAlign: 'right' }}>نصيب الطيار</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getPilotOrders(selectedPilotDetails.id).length === 0 ? (
                                        <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد رحلات مسجلة</td></tr>
                                    ) : (
                                        getPilotOrders(selectedPilotDetails.id).map(order => {
                                            const isFailed = order.status === 'failed_delivery';
                                            const pilotShare = isFailed ? 0 : (order.type === 'trip' ? order.deliveryFee : (order.deliveryFee / 2));

                                            return (
                                                <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: isFailed ? 0.6 : 1 }}>
                                                    <td style={{ padding: '12px 0' }}>#{order.originalId || order.id}</td>
                                                    <td style={{ padding: '12px 0' }}>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span>{order.type === 'trip' ? 'مشوار' : (order.type === 'talabat' || order.type === 'external') ? 'طلبات' : 'مطعم'}</span>
                                                            {isFailed && <span style={{ fontSize: '0.7rem', color: 'var(--danger)' }}>فشل: {order.failureReason}</span>}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '12px 0' }}>{order.deliveryFee} ج.م</td>
                                                    <td style={{ padding: '12px 0', color: isFailed ? 'var(--danger)' : 'var(--accent)', fontWeight: 'bold' }}>
                                                        {pilotShare} ج.م
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ padding: '20px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>إجمالي المستحقات</span>
                                    <span style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent)' }}>{Math.floor(selectedPilotDetails.totalEarnings)} <small style={{ fontSize: '0.9rem' }}>ج.م</small></span>
                                </div>
                                <div style={{ textAlign: 'left', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>نصيب التوصيل:</span>
                                        <span style={{ fontWeight: '600' }}>{selectedPilotDetails.feeEarnings} ج.م</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>حساب الساعات:</span>
                                        <span style={{ fontWeight: '600' }}>{selectedPilotDetails.attendancePay} ج.م</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    className="btn-primary"
                                    onClick={() => handlePrintPilotReport(selectedPilotDetails)}
                                    style={{ flex: 1, height: '45px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                >
                                    <Printer size={18} /> طباعة كشف الحساب
                                </button>
                                <button className="btn-primary" onClick={() => setSelectedPilotDetails(null)} style={{ flex: 1, height: '45px', background: 'rgba(255,255,255,0.1)', color: 'white' }}>إغلاق التفاصيل</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '800' }}>تقارير الدليفري</h2>
                    <p style={{ color: 'var(--text-muted)' }}>متابعة أداء الطيارين ومستحقاتهم في الوردية</p>
                </div>

            </header>

            {/* Current Active Report */}
            {isShiftOpen ? (
                <div className="glass-card" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(124, 58, 237, 0.1)', color: 'var(--primary)' }}>
                            <Clock size={20} />
                        </div>
                        <h3 style={{ fontSize: '1.2rem' }}>الوردية النشطة</h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: 'auto' }}>
                            بدأت في: {new Date(currentShift.startTime).toLocaleTimeString('ar-EG')}
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                        <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>إجمالي الطلبات</p>
                            <h4 style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                                {activeStats.totalOrders}
                                <small style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-muted)', marginRight: '8px' }}>
                                    ({activeStats.totalOrders - activeStats.pilotPerformance.reduce((acc, p) => acc + (p.tripsCount || 0), 0)} طلب + {activeStats.pilotPerformance.reduce((acc, p) => acc + (p.tripsCount || 0), 0)} مشوار)
                                </small>
                            </h4>
                        </div>
                        <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>متوسط التأخير</p>
                            <h4 style={{ fontSize: '1.5rem', fontWeight: '700', color: activeStats.averageDelay > 40 ? 'var(--danger)' : 'white' }}>{activeStats.averageDelay} دقيقة</h4>
                        </div>
                        <div style={{ padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '8px' }}>إيرادات الحجازات (عربون)</p>
                            {showDues ? (
                                <h4 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#8b5cf6' }}>
                                    {activeStats.reservationStats?.totalDeposits || 0} ج.م
                                    <small style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--text-muted)', marginRight: '8px' }}>
                                        ({activeStats.reservationStats?.count || 0} إجمالي الحجوزات)
                                    </small>
                                </h4>
                            ) : (
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>🔒 مغلق للمشرف</div>
                            )}
                        </div>
                    </div>

                    {/* Owner Financial Summary - EXCLUSIVE */}
                    {showDues && (
                        <div style={{ background: 'rgba(139, 92, 246, 0.1)', border: '2px solid #8b5cf6', padding: '24px', borderRadius: '20px', marginBottom: '32px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <TrendingUp color="#8b5cf6" size={28} />
                                <h3 style={{ color: '#8b5cf6', margin: 0, fontSize: '1.4rem' }}>تقرير صاحب المطعم (صافي الأرباح)</h3>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
                                <div style={{ borderRight: '3px solid rgba(139, 92, 246, 0.3)', paddingRight: '20px' }}>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '4px' }}>ربح الدليفري الصافي</p>
                                    <p style={{ fontSize: '1.6rem', fontWeight: '800' }}>{activeStats.pilotPerformance.reduce((a, b) => a + (b.totalEarnings - b.attendancePay), 0)} ج.م</p>
                                </div>
                                <div style={{ borderRight: '3px solid rgba(139, 92, 246, 0.3)', paddingRight: '20px' }}>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '4px' }}>ربح الحجوزات الصافي</p>
                                    <p style={{ fontSize: '1.6rem', fontWeight: '800' }}>{activeStats.reservationStats?.totalDeposits || 0} ج.م</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '4px' }}>إجمالي الربح العام للوردية</p>
                                    <p style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--accent)' }}>
                                        {Math.floor(activeStats.pilotPerformance.reduce((a, b) => a + b.totalEarnings, 0) + (activeStats.reservationStats?.totalDeposits || 0))} ج.م
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reservations Summary Section - Concise & Abbreviated */}
                    <section style={{ marginBottom: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                            <UtensilsCrossed size={20} color="#8b5cf6" />
                            <h4 style={{ fontSize: '1.2rem', margin: 0 }}>ملخص حجزات الوردية</h4>
                        </div>
                        <div className="glass-card" style={{ overflowX: 'auto', background: 'rgba(139, 92, 246, 0.05)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#a78bfa' }}>
                                        <th style={{ padding: '12px', textAlign: 'right' }}>العميل</th>
                                        <th style={{ padding: '12px', textAlign: 'center' }}>العدد</th>
                                        <th style={{ padding: '12px', textAlign: 'right' }}>الهاتف</th>
                                        <th style={{ padding: '12px', textAlign: 'right' }}>العربون</th>
                                        <th style={{ padding: '12px', textAlign: 'center' }}>صورة التحويل</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reservations.length === 0 ? (
                                        <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>لا توجد حجوزات نشطة</td></tr>
                                    ) : (
                                        reservations.map(res => (
                                            <tr key={res.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                <td style={{ padding: '12px' }}>
                                                    <div style={{ fontWeight: '600' }}>{res.customerName}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{res.type === 'cafe' ? 'كافيه' : 'مطعم'} | {res.id}</div>
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>{res.guests} افراد</td>
                                                <td style={{ padding: '12px', fontSize: '0.85rem' }}>{res.phone}</td>
                                                <td style={{ padding: '12px' }}>
                                                    <span style={{ color: res.status === 'confirmed' ? 'var(--success)' : 'var(--warning)', fontWeight: 'bold' }}>
                                                        {res.deposit} ج.م
                                                    </span>
                                                    {res.status === 'confirmed' && <div style={{ fontSize: '0.65rem' }}>#{res.refNumber}</div>}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    {res.paymentProof ? (
                                                        <div
                                                            onClick={() => {
                                                                const w = window.open('about:blank');
                                                                if (w) w.document.write(`<img src="${res.paymentProof}" style="max-width:100%"/>`);
                                                            }}
                                                            style={{ cursor: 'pointer', width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', margin: '0 auto', border: '1px solid #8b5cf6' }}
                                                        >
                                                            <img src={res.paymentProof} alt="proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>لا يوجد</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Bike size={18} /> تفصيل مستحقات الطيارين
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                        {activeStats.pilotPerformance.map(pilot => (
                            <div key={pilot.id} style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                                    <span style={{ fontWeight: '800', fontSize: '1.2rem', color: 'var(--primary)' }}>{pilot.name}</span>
                                    {showDues ? (
                                        <span style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '1.2rem', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 12px', borderRadius: '8px' }}>
                                            {Math.floor(pilot.totalEarnings)} ج.م
                                        </span>
                                    ) : (
                                        <span style={{ color: 'var(--text-muted)' }}>****</span>
                                    )}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                                    {/* Workload Stats */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        <span>🏠 مطعم: <strong>{pilot.restaurantOrdersCount || 0}</strong></span>
                                        <span>🌐 طلبات: <strong>{pilot.talabatOrdersCount || 0}</strong></span>
                                        <span>🏍️ مشاوير: <strong>{pilot.tripsCount || 0}</strong></span>
                                        <span>🕒 عمل: <strong>{(pilot.totalMinutes / 60).toFixed(1)} س</strong></span>
                                    </div>

                                    {showDues && (
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px dashed var(--border)' }}>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>تفاصيل الأرباح:</p>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: '0.9rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Home size={14} /> مطعم:</span>
                                                    <span style={{ fontWeight: 'bold' }}>{pilot.restaurantEarnings}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Globe size={14} /> طلبات:</span>
                                                    <span style={{ fontWeight: 'bold' }}>{pilot.talabatEarnings}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Bike size={14} /> مشاوير:</span>
                                                    <span style={{ fontWeight: 'bold' }}>{pilot.tripEarnings}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent)' }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> حضور:</span>
                                                    <span style={{ fontWeight: 'bold' }}>{pilot.attendancePay}</span>
                                                </div>
                                            </div>

                                            <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                                <span>إجمالي التوصيل:</span>
                                                <strong>{pilot.feeEarnings} ج.م</strong>
                                            </div>
                                        </div>
                                    )}

                                    {!showDues && (
                                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
                                            تفاصيل المستحقات مخفية 🔒
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                                    <button
                                        onClick={() => setSelectedPilotDetails(pilot)}
                                        style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'background 0.2s' }}
                                    >
                                        <FileText size={16} /> كشف تفصيلي
                                    </button>
                                    {showDues && (
                                        <button
                                            onClick={() => {
                                                const element = document.createElement("a");
                                                const file = new Blob([JSON.stringify(pilot, null, 2)], { type: 'application/json' });
                                                element.href = URL.createObjectURL(file);
                                                element.download = `Pilot_${pilot.name.replace(/\s+/g, '_')}_Report.json`;
                                                document.body.appendChild(element);
                                                element.click();
                                            }}
                                            title="حفظ الملف"
                                            style={{ padding: '0 16px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--warning)', color: 'var(--warning)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            <Download size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="glass-card" style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <Calendar size={48} color="var(--text-muted)" />
                    <div>
                        <h3 style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>لا توجد وردية مفتوحة حالياً</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>اضغط على الزر أدناه لبدء يوم عمل جديد</p>
                    </div>
                    <button onClick={handleOpenShift} className="btn-primary" style={{ background: 'var(--accent)', marginTop: '8px' }}>
                        <TrendingUp size={18} />
                        <span>فتح وردية جديدة</span>
                    </button>
                </div>
            )}

            {/* Archived Reports */}
            <section style={{ marginTop: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FileText size={22} /> سجل الورديات السابقة
                    </h3>
                    {!showArchives && (
                        <button
                            onClick={() => {
                                const pass = prompt('كلمة المرور للمشرف:');
                                if (pass === '8080') setShowArchives(true);
                                else alert('خطأ في كلمة المرور');
                            }}
                            className="btn-primary"
                            style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 16px', fontSize: '0.85rem' }}
                        >
                            🔒 فتح السجل (مشرف)
                        </button>
                    )}
                </div>

                {showArchives ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {dailyReports.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>لا توجد تقارير مؤرشفة بعد.</p>
                        ) : (
                            dailyReports.map(report => (
                                <div key={report.id} className="glass-card report-card-grid" style={{ padding: '20px', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ fontWeight: '600' }}>تقرير يوم {report.date}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            {new Date(report.startTime).toLocaleTimeString('ar-EG')} - {new Date(report.endTime).toLocaleTimeString('ar-EG')}
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>الطلبات</p>
                                        <p style={{ fontWeight: '600' }}>
                                            {report.ordersCount}
                                            <small style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                                                ({(report.archivedOrders || []).filter(o => o.type !== 'trip').length} طلب + {(report.archivedOrders || []).filter(o => o.type === 'trip').length} مشوار)
                                            </small>
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>بدل الحضور</p>
                                        <p style={{ fontWeight: '600' }}>{report.totalAttendancePay} ج.م</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>إجمالي المستحقات</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <p style={{ fontWeight: '700', color: 'var(--warning)', fontSize: '1.1rem' }}>{report.totalPilotDues} ج.م</p>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                {(() => {
                                                    const restaurantDues = (report.archivedOrders || []).filter(o => o.type === 'restaurant').reduce((sum, o) => sum + (o.deliveryFee / 2), 0);
                                                    const talabatDues = (report.archivedOrders || []).filter(o => o.type === 'talabat' || o.type === 'external').reduce((sum, o) => sum + (o.deliveryFee / 2), 0);
                                                    const tripDues = (report.archivedOrders || []).filter(o => o.type === 'trip').reduce((sum, o) => sum + o.deliveryFee, 0);

                                                    return (
                                                        <>
                                                            <span>🏠 مطعم: {restaurantDues}</span>
                                                            <span>🌐 طلبات: {talabatDues}</span>
                                                            <span>🏍️ مشاوير: {tripDues}</span>
                                                            <span>🕒 حضور: {report.totalAttendancePay}</span>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <button
                                            onClick={() => handlePrintShiftReport(report)}
                                            title="طباعة التقرير"
                                            style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <Printer size={18} /> <span style={{ fontSize: '0.8rem' }}>طباعة</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                const element = document.createElement("a");
                                                const file = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                                                element.href = URL.createObjectURL(file);
                                                element.download = `Shift_Report_${report.date}.json`;
                                                document.body.appendChild(element);
                                                element.click();
                                            }}
                                            title="تصدير كـ JSON"
                                            style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <Download size={18} /> <span style={{ fontSize: '0.8rem' }}>JSON</span>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div style={{ padding: '30px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '12px', background: 'rgba(0,0,0,0.1)' }}>
                        <p style={{ color: 'var(--text-muted)' }}>⚠️ سجل الورديات السابقة مخفي لدواعي الأمان. يرجى إدخال كلمة المرور للعرض.</p>
                    </div>
                )}
            </section>
        </div>
    );
};

export default ReportsView;
