import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { printerService } from '../../services/printerService';
import { FileText, Printer, Download, RefreshCw, DollarSign, ShoppingBag, CheckCircle2, XCircle, TrendingUp, Bike, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ReportsView = () => {
  const { orders, pilots } = useApp();
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'drivers'
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);

  // 1. حساب إحصائيات اليوم (Daily Report Data)
  const dailyStats = React.useMemo(() => {
    let totalSales = 0;
    let completedOrders = 0;
    let cancelledOrders = 0;
    let totalDeliveryFees = 0;
    let totalCash = 0;

    orders.forEach(o => {
      const isCompleted = o.status === 'completed' || o.status === 'delivered';
      const isCancelled = o.status === 'cancelled';

      if (isCompleted) {
        completedOrders++;
        totalSales += Number(o.total || 0);
        totalDeliveryFees += Number(o.deliveryFee || 0);
        if ((o.paymentMethod || '').toLowerCase().includes('cash')) {
          totalCash += Number(o.total || 0);
        }
      } else if (isCancelled) {
        cancelledOrders++;
      }
    });

    return {
      totalSales,
      totalOrders: orders.length,
      completedOrders,
      cancelledOrders,
      totalDeliveryFees,
      totalCash
    };
  }, [orders]);

  // 2. حساب إحصائيات كل طيار (Drivers Reports Data)
  const driversReports = React.useMemo(() => {
    return pilots.map(p => {
      const driverOrders = orders.filter(o => String(o.pilotId) === String(p.id));
      const deliveredOrders = driverOrders.filter(o => o.status === 'completed' || o.status === 'delivered');
      const returnedOrders = driverOrders.filter(o => o.status === 'cancelled' || o.status === 'returned');

      let totalCollected = 0;
      deliveredOrders.forEach(o => {
        totalCollected += Number(o.total || 0);
      });

      return {
        id: p.id,
        name: p.name,
        vehicle: p.numberMotor || 'بدون لوحة',
        ordersCount: driverOrders.length,
        deliveredCount: deliveredOrders.length,
        returnedCount: returnedOrders.length,
        totalCollected
      };
    });
  }, [orders, pilots]);

  // 3. طباعة التقرير اليومي
  const handlePrintDaily = async () => {
    setIsPrinting(true);
    try {
      const res = await printerService.printDailyReport(dailyStats);
      if (res.success) {
        alert(res.fallback ? '⚠️ تم إرسال التقرير لنافذة الطباعة (الوضع الاحتياطي)' : '✅ تم إرسال التقرير لطابعة XP الحرارية بنجاح');
      }
    } catch (e) {
      alert('❌ فشل إرسال أمر الطباعة');
    } finally {
      setIsPrinting(false);
    }
  };

  // 4. طباعة تقرير طيار محدد
  const handlePrintDriver = async (driverData) => {
    setIsPrinting(true);
    try {
      const res = await printerService.printDriverReport(driverData);
      if (res.success) {
        alert(res.fallback ? '⚠️ تم إرسال التقرير لنافذة الطباعة (الوضع الاحتياطي)' : '✅ تم إرسال تقرير الطيار لطابعة XP الحرارية بنجاح');
      }
    } catch (e) {
      alert('❌ فشل إرسال أمر الطباعة');
    } finally {
      setIsPrinting(false);
    }
  };

  // 5. تصدير البيانات إلى CSV
  const exportToCSV = (type = 'daily') => {
    let headers = [];
    let rows = [];

    if (type === 'daily') {
      headers = ['Metric', 'Value'];
      rows = [
        ['إجمالي المبيعات', `${dailyStats.totalSales} EGP`],
        ['إجمالي الطلبات', dailyStats.totalOrders],
        ['الطلبات المكتملة', dailyStats.completedOrders],
        ['الطلبات الملغية', dailyStats.cancelledOrders],
        ['إجمالي رسوم التوصيل', `${dailyStats.totalDeliveryFees} EGP`],
        ['إجمالي الكاش المحصل', `${dailyStats.totalCash} EGP`]
      ];
    } else {
      headers = ['اسم الطيار', 'المركبة', 'إجمالي الطلبات', 'المسلمة', 'المرتجعة', 'التحصيل'];
      rows = driversReports.map(d => [
        d.name, d.vehicle, d.ordersCount, d.deliveredCount, d.returnedCount, `${d.totalCollected} EGP`
      ]);
    }

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + 
      [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Report_${type}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDrivers = driversReports.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 🔴 Header Tabs & Actions */}
      <div className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setActiveTab('daily')}
            style={{
              padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s ease',
              background: activeTab === 'daily' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
              color: activeTab === 'daily' ? 'white' : 'var(--text-muted)', border: 'none'
            }}
          >
            📊 التقرير اليومي الشامل
          </button>
          <button
            onClick={() => setActiveTab('drivers')}
            style={{
              padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s ease',
              background: activeTab === 'drivers' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
              color: activeTab === 'drivers' ? 'white' : 'var(--text-muted)', border: 'none'
            }}
          >
            🛵 تقارير وردية الطيارين
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => exportToCSV(activeTab)}
            className="btn-primary hover-scale"
            style={{ background: '#10b981', gap: '8px' }}
          >
            <Download size={18} /> تصدير CSV
          </button>
          {activeTab === 'daily' && (
            <button
              onClick={handlePrintDaily}
              disabled={isPrinting}
              className="btn-primary hover-scale"
              style={{ background: 'var(--accent)', gap: '8px', opacity: isPrinting ? 0.7 : 1 }}
            >
              <Printer size={18} /> {isPrinting ? 'جاري الطباعة...' : 'طباعة التقرير الحراري'}
            </button>
          )}
        </div>
      </div>

      {/* 🔴 Content Sections */}
      <AnimatePresence mode="wait">
        {activeTab === 'daily' ? (
          <motion.div
            key="daily"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}
          >
            {/* 1. إجمالي المبيعات */}
            <div className="glass-card hover-scale" style={{ padding: '24px', borderLeft: '6px solid #10b981', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 'bold' }}>إجمالي المبيعات</span>
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '10px', borderRadius: '12px' }}><DollarSign size={24} /></div>
              </div>
              <h2 style={{ fontSize: '2.4rem', margin: 0, fontWeight: '900', color: '#10b981' }}>{dailyStats.totalSales} <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>ج.م</span></h2>
            </div>

            {/* 2. إجمالي الطلبات */}
            <div className="glass-card hover-scale" style={{ padding: '24px', borderLeft: '6px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 'bold' }}>عدد الطلبات</span>
                <div style={{ background: 'rgba(79, 70, 229, 0.15)', color: 'var(--primary)', padding: '10px', borderRadius: '12px' }}><ShoppingBag size={24} /></div>
              </div>
              <h2 style={{ fontSize: '2.4rem', margin: 0, fontWeight: '900', color: 'var(--primary)' }}>{dailyStats.totalOrders}</h2>
            </div>

            {/* 3. الطلبات المكتملة */}
            <div className="glass-card hover-scale" style={{ padding: '24px', borderLeft: '6px solid #3b82f6', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 'bold' }}>الطلبات المكتملة</span>
                <div style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', padding: '10px', borderRadius: '12px' }}><CheckCircle2 size={24} /></div>
              </div>
              <h2 style={{ fontSize: '2.4rem', margin: 0, fontWeight: '900', color: '#3b82f6' }}>{dailyStats.completedOrders}</h2>
            </div>

            {/* 4. الطلبات الملغية */}
            <div className="glass-card hover-scale" style={{ padding: '24px', borderLeft: '6px solid #ef4444', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 'bold' }}>الطلبات الملغية</span>
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '10px', borderRadius: '12px' }}><XCircle size={24} /></div>
              </div>
              <h2 style={{ fontSize: '2.4rem', margin: 0, fontWeight: '900', color: '#ef4444' }}>{dailyStats.cancelledOrders}</h2>
            </div>

            {/* 5. إجمالي رسوم التوصيل */}
            <div className="glass-card hover-scale" style={{ padding: '24px', borderLeft: '6px solid #f59e0b', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 'bold' }}>رسوم التوصيل (Delivery Fees)</span>
                <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '10px', borderRadius: '12px' }}><Bike size={24} /></div>
              </div>
              <h2 style={{ fontSize: '2.4rem', margin: 0, fontWeight: '900', color: '#f59e0b' }}>{dailyStats.totalDeliveryFees} <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>ج.م</span></h2>
            </div>

            {/* 6. إجمالي الكاش */}
            <div className="glass-card hover-scale" style={{ padding: '24px', borderLeft: '6px solid #8b5cf6', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 'bold' }}>إجمالي الكاش المحصل</span>
                <div style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', padding: '10px', borderRadius: '12px' }}><TrendingUp size={24} /></div>
              </div>
              <h2 style={{ fontSize: '2.4rem', margin: 0, fontWeight: '900', color: '#8b5cf6' }}>{dailyStats.totalCash} <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>ج.م</span></h2>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="drivers"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={20} />
                <input
                  type="text"
                  placeholder="ابحث عن طيار بالاسم..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="glass-card"
                  style={{ width: '100%', padding: '16px 48px 16px 16px', borderRadius: '12px', border: '1px solid var(--border)', color: 'white', background: 'rgba(255,255,255,0.05)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {filteredDrivers.map(d => (
                <div key={d.id} className="glass-card hover-scale" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '6px solid var(--accent)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: '1.4rem', color: 'white', fontWeight: '900' }}>{d.name}</h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '6px' }}>{d.vehicle}</span>
                    </div>
                    <button
                      onClick={() => handlePrintDriver(d)}
                      disabled={isPrinting}
                      style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Printer size={16} /> طباعة التقرير
                    </button>
                  </div>

                  <div className="grid-2" style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', gap: '12px' }}>
                    <div><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>إجمالي الطلبات</span><div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{d.ordersCount}</div></div>
                    <div><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>الطلبات المسلمة</span><div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#10b981' }}>{d.deliveredCount}</div></div>
                    <div><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>المرتجعات</span><div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ef4444' }}>{d.returnedCount}</div></div>
                    <div><span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>التحصيل النقدي</span><div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent)' }}>{d.totalCollected} ج</div></div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ReportsView;
