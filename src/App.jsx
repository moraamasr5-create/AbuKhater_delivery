import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import OrderInbox from './components/orders/OrderInbox';
import ReportsView from './components/reports/ReportsView';
import { useApp } from './context/AppContext';
import { Package, Bike, Clock, Plus, MapPin, AlertTriangle, Receipt, Globe, Monitor, ChevronLeft, ChevronRight, UtensilsCrossed, PlusCircle, Menu } from 'lucide-react';

const MATAREYA_AREAS = [
  'المطرية - الرئيسي',
  'عزبة النخل',
  'عين شمس الشرقية',
  'عين شمس الغربية',
  'حلمية الزيتون',
  'النعام',
  'المطرية - المسلة',
  'المطرية - ش ترعة الإسماعيلية',
  'اخرى (إدخال يدوي)'
];

const MANAGERS = ['أ/عبـدالله', 'أ/فتحـي', 'مدير3', 'الفرع الثاني'];

const PilotManagement = () => {
  const { pilots, togglePilotShift, addNewPilot } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPilotName, setNewPilotName] = useState('');
  const [newPilotPhone, setNewPilotPhone] = useState('');

  const handleToggleShift = (pilotId, currentStatus) => {
    const password = prompt(currentStatus === 'open'
      ? 'أدخل الرقم السري لإغلاق شيفت الطيار ():'
      : 'أدخل الرقم السري لفتح شيفت الطيار ():');

    if (password === '123') {
      togglePilotShift(pilotId);
    } else {
      alert('كلمة المرور غير صحيحة');
    }
  };

  const onAddPilot = (e) => {
    e.preventDefault();
    if (!newPilotName) return;
    addNewPilot(newPilotName, newPilotPhone);
    setShowAddModal(false);
    setNewPilotName('');
    setNewPilotPhone('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>إدارة الطيارين</h2>
      </header>

      {/* Modal for Add Pilot */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div className="glass-card" style={{ padding: '24px', width: '350px', border: '1px solid var(--accent)' }}>
            <h3 style={{ marginBottom: '16px', color: 'var(--accent)' }}>إضافة طيار جديد</h3>
            <form onSubmit={onAddPilot} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                autoFocus
                placeholder="اسم الطيار"
                value={newPilotName}
                onChange={e => setNewPilotName(e.target.value)}
                className="glass-card"
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                required
              />
              <input
                placeholder="رقم الهاتف"
                value={newPilotPhone}
                onChange={e => setNewPilotPhone(e.target.value)}
                className="glass-card"
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                required
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--accent)' }}>حفظ</button>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '8px', borderRadius: '8px', cursor: 'pointer', flex: 0.5 }}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {pilots.map(pilot => (
          <div key={pilot.id} className="glass-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ fontSize: '1.1rem' }}>{pilot.name}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{pilot.phone}</p>

              {(() => {
                const now = new Date();
                const sessionMinutes = (pilot.shiftStatus === 'open' && pilot.lastOpenedAt)
                  ? Math.floor((now - new Date(pilot.lastOpenedAt)) / (1000 * 60))
                  : 0;
                const totalWorked = (pilot.totalMinutes || 0) + sessionMinutes;
                const target = 600; // 10 hours
                const remaining = target - totalWorked;

                if (remaining <= 0) {
                  return <p style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: 'bold' }}>✅ اكتملت الـ 10 ساعات</p>;
                }

                const remainsH = Math.floor(remaining / 60);
                const remainsM = remaining % 60;

                return (
                  <p style={{ color: 'var(--warning)', fontSize: '0.85rem' }}>
                    باقي: {remainsH > 0 && `${remainsH}h `}{remainsM}m (لإتمام 10س)
                  </p>
                );
              })()}
            </div>
            <button
              onClick={() => handleToggleShift(pilot.id, pilot.shiftStatus)}
              className="btn-primary"
              style={{ background: pilot.shiftStatus === 'open' ? 'var(--danger)' : 'var(--accent)', fontSize: '0.8rem', padding: '8px 16px' }}
            >
              {pilot.shiftStatus === 'open' ? 'إغلاق الشيفت' : 'فتح الشيفت'}
            </button>
          </div>
        ))}
      </div>
      {/* Floating Add Button - Bottom Left (Matches Reservation Style) */}
      <button
        onClick={() => {
          const pass = prompt('أدخل كلمة المرور لإضافة طيار جديد:');
          if (pass === '8080') setShowAddModal(true);
          else if (pass !== null) alert('كلمة المرور غير صحيحة');
        }}
        className="btn-primary"
        style={{
          position: 'fixed',
          bottom: '40px',
          left: '10%',
          transform: 'translateX(-50%)',
          background: 'var(--accent)',
          padding: '16px 32px',
          borderRadius: '20px',
          boxShadow: '0 15px 35px rgba(16, 185, 129, 0.4)',
          zIndex: 100,
          border: '2px solid rgba(255,255,255,0.1)',
          fontSize: '1.1rem'
        }}
      >
        <Plus size={24} /> إضافة طيار جديد
      </button>
    </div>
  );
};

const EditOrderModal = ({ order, onClose }) => {
  const { updateOrder } = useApp();
  const [formData, setFormData] = useState({ ...order });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateOrder(order.id, formData);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div className="glass-card" style={{ padding: '24px', width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3>تعديل طلب #{order.id}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>رقم البون (ID)</label>
            <input className="glass-card" style={{ width: '100%', padding: '8px', color: 'white' }} value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>العميل</label>
            <input className="glass-card" style={{ width: '100%', padding: '8px', color: 'white' }} value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>الهاتف</label>
            <input className="glass-card" style={{ width: '100%', padding: '8px', color: 'white' }} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>المنطقة</label>
            <select className="glass-card" style={{ width: '100%', padding: '8px', color: 'white', background: '#1e293b' }} value={formData.area} onChange={e => setFormData({ ...formData, area: e.target.value })}>
              {MATAREYA_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>طريقة الدفع</label>
            <select
              className="glass-card"
              style={{ width: '100%', padding: '12px', marginTop: '4px', background: '#1e293b', color: 'white', border: '1px solid var(--border)', borderRadius: '8px' }}
              value={formData.paymentMethod}
              onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
            >
              <option value="Cash">نقدي (Cash)</option>
              <option value="Online"> أنستاباي</option>
              <option value="Wallet">محفظة إلكترونية</option>
            </select>
          </div>

          {(formData.paymentMethod === 'Wallet') && (
            <div style={{ background: 'rgba(255,165,0,0.1)', padding: '12px', borderRadius: '8px', border: '1px dashed var(--warning)' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--warning)', marginBottom: '8px' }}>📸 صورة إيصال المحفظة (إجباري)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData({ ...formData, paymentProof: reader.result });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                style={{ fontSize: '0.8rem', color: 'white' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>حفظ التعديلات</button>
            <button type="button" onClick={onClose} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', color: 'white', cursor: 'pointer', borderRadius: '8px' }}>إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DashboardView = () => {
  const { orders, pilots, activeStats, completeOrder, confirmOrder, updateOrder, failDelivery } = useApp();
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editModalData, setEditModalData] = useState(null);
  const [viewPilotId, setViewPilotId] = useState(null);

  const stats = [
    { label: 'طلبات اليوم', value: activeStats.totalOrders, icon: Package, color: 'var(--primary)' },
    { label: 'طيارين في الخدمة', value: pilots.filter(p => p.shiftStatus === 'open').length, icon: Bike, color: 'var(--accent)' },
    { label: 'متوسط التأخير', value: `${activeStats.averageDelay} د`, icon: Clock, color: activeStats.averageDelay > 40 ? 'var(--danger)' : 'var(--warning)' },
    { label: 'قيد المراجعة', value: orders.filter(o => o.status === 'pending' || o.status === 'pending_timer').length, icon: Package, color: 'var(--primary)' },
  ];

  // Group active orders by pilot
  const activeOrders = orders.filter(o => o.status === 'active');
  const ordersByPilot = activeOrders.reduce((acc, o) => {
    if (!acc[o.pilotId]) acc[o.pilotId] = [];
    acc[o.pilotId].push(o);
    return acc;
  }, {});

  const pilotsWithOrders = pilots.filter(p => ordersByPilot[p.id]);

  // Set default view pilot if none selected and pilots exist
  useEffect(() => {
    if (!viewPilotId && pilotsWithOrders.length > 0) {
      setViewPilotId(pilotsWithOrders[0].id);
    }
  }, [pilotsWithOrders, viewPilotId]);

  const activePilots = pilots.filter(p => p.shiftStatus === 'open');
  const closedPilots = pilots.filter(p => p.shiftStatus === 'closed');

  const getElapsedTime = (timestamp) => {
    const diff = Math.floor((new Date() - new Date(timestamp)) / (1000 * 60));
    return diff;
  };

  const delayedOrders = activeOrders.filter(o => getElapsedTime(o.timestamp) > 40);

  const handleReassign = (orderId, newPilotId) => {
    if (window.confirm('هل أنت متأكد من تغيير الطيار لهذا الطلب؟')) {
      confirmOrder(orderId, newPilotId);
      setEditingOrderId(null);
    }
  };

  const handleEditOrder = (order) => {
    const password = prompt('أدخل كلمة مرور المشرف للتعديل:');
    if (password === '8080') {
      setEditModalData(order);
    } else {
      alert('كلمة المرور غير صحيحة');
    }
  };

  const handleFailDelivery = (orderId) => {
    const reason = prompt("يرجى إدخال سبب فشل التوصيل (مثال: العميل لدية شكوة معينة ):");
    if (reason) {
      failDelivery(orderId, reason);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {editModalData && <EditOrderModal order={editModalData} onClose={() => setEditModalData(null)} />}

      {delayedOrders.length > 0 && (
        <div className="glass-card" style={{
          background: 'rgba(220, 38, 38, 0.2)',
          border: '1px solid var(--danger)',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'pulse 2s infinite'
        }}>
          <AlertTriangle color="var(--danger)" size={24} />
          <div>
            <h3 style={{ color: 'var(--danger)', fontWeight: 'bold' }}>تنبيه: يوجد {delayedOrders.length} طلبات متأخرة!</h3>
            <p style={{ fontSize: '0.9rem', color: 'white' }}>
              يرجى مراجعة الطلبات بالأرقام: {delayedOrders.map(o => '#' + o.id).join(', ')}
            </p>
          </div>
        </div>
      )}

      <header>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>لوحة التحكم</h1>
        <p style={{ color: 'var(--text-muted)' }}>مرحباً بك في نظام إدارة دليفري أبو خاطر</p>
      </header>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        {stats.map((stat, i) => (
          <div key={i} className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ padding: '12px', borderRadius: '12px', background: `${stat.color}20`, color: stat.color }}>
              <stat.icon size={28} />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{stat.label}</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <div className="glass-card" style={{ padding: '24px', borderTop: '4px solid var(--primary)' }}>
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem' }}>
            <MapPin size={24} color="var(--primary)" /> رحلات الدليفري الحالية (تحقق المشرف)
          </h3>

          <div style={{ display: 'flex', gap: '24px', minHeight: '300px' }}>
            {/* Pilots List Side */}
            <div style={{ width: '250px', borderLeft: '1px solid var(--border)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '10px' }}>الطيارين في الخارج:</h4>
              {pilotsWithOrders.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>لا يوجد طيارين في الخارج حالياً</p>
              ) : (
                pilotsWithOrders.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setViewPilotId(p.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: 'none',
                      background: viewPilotId === p.id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                      color: viewPilotId === p.id ? 'black' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'right',
                      fontWeight: 'bold'
                    }}
                  >
                    <span>{p.name}</span>
                    <span style={{ fontSize: '0.8rem', background: viewPilotId === p.id ? 'rgba(0,0,0,0.2)' : 'var(--primary)', padding: '2px 8px', borderRadius: '4px', color: viewPilotId === p.id ? 'black' : 'black' }}>
                      {ordersByPilot[p.id]?.length || 0}
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Orders Table Side */}
            <div style={{ flex: 1 }}>
              {viewPilotId && ordersByPilot[viewPilotId] ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ textAlign: 'right', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                      <th style={{ padding: '16px 8px', color: 'var(--text-muted)' }}>رقم البون #</th>
                      <th style={{ padding: '16px 8px', color: 'var(--text-muted)' }}>تفاصيل العميل</th>
                      <th style={{ padding: '16px 8px', color: 'var(--text-muted)' }}>المنطقة</th>
                      <th style={{ padding: '16px 8px', color: 'var(--text-muted)' }}>التوقيت</th>
                      <th style={{ padding: '16px 8px', color: 'var(--text-muted)', textAlign: 'center' }}>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersByPilot[viewPilotId].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).map(order => {
                      const elapsed = getElapsedTime(order.timestamp);
                      const isDelayed = elapsed > 40;

                      return (
                        <tr key={order.id} style={{ borderBottom: '1px solid var(--border)', background: isDelayed ? 'rgba(220, 38, 38, 0.1)' : 'transparent', transition: 'background 0.2s' }}>
                          <td style={{ padding: '16px 8px', fontWeight: '900', fontSize: '1.3rem', color: 'var(--primary)', fontFamily: 'monospace' }}>
                            #{order.originalId || order.id}
                            <button onClick={() => handleEditOrder(order)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '8px', color: 'var(--text-muted)', opacity: 0.7 }} title="تعديل">
                              <span style={{ fontSize: '1rem' }}>✏️</span>
                            </button>
                          </td>
                          <td style={{ padding: '16px 8px' }}>
                            <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{order.customerName}</p>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{order.total > 0 ? `${order.total} ج.م` : ''}</p>
                          </td>
                          <td style={{ padding: '16px 8px', fontSize: '1.1rem' }}>{order.area || 'غير محدد'}</td>
                          <td style={{ padding: '16px 8px' }}>
                            <span style={{
                              color: isDelayed ? 'var(--danger)' : elapsed > 25 ? 'var(--warning)' : 'var(--accent)',
                              fontWeight: 'bold',
                              fontSize: '1.1rem',
                              display: 'flex', alignItems: 'center', gap: '6px'
                            }}>
                              {elapsed} د {isDelayed && <span className="pulse-dot">⚠️</span>}
                            </span>
                          </td>
                          <td style={{ padding: '16px 8px' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                onClick={() => completeOrder(order.id)}
                                style={{ padding: '8px 16px', borderRadius: '6px', background: 'var(--success)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold', flex: 1 }}
                              >
                                تسليم ✅
                              </button>
                              <button
                                onClick={() => handleFailDelivery(order.id)}
                                style={{ padding: '8px 12px', borderRadius: '6px', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', cursor: 'pointer' }}
                                title="فشل التوصيل"
                              >
                                ❌
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                  {pilotsWithOrders.length > 0 ? 'الرجاء اختيار طيار لعرض طلباته' : 'لا توجد رحلات نشطة حالياً'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <section style={{ opacity: 0.9 }}>
        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bike size={20} color="var(--accent)" /> نشاط الطيارين (الوردية الحالية)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>

          {/* Active Pilots Card */}
          <div className="glass-card" style={{ padding: '20px', borderRight: '4px solid var(--accent)' }}>
            <h4 style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>طيارين متاحين ({activePilots.length})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activePilots.length > 0 ? activePilots.map(p => {
                const currentLoad = orders.filter(o =>
                  o.pilotId === p.id &&
                  (o.status === 'active' || o.status === 'driver_assigned')
                ).length;
                const isOut = p.state === 'out';

                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: isOut ? 'var(--warning)' : 'var(--success)' }}></div>
                      <div>
                        <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{p.name}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isOut ? 'خارج للتوصيل 🏍️' : 'متاح في المطعم ✅'}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.8rem', background: currentLoad >= 7 ? 'var(--danger)' : 'var(--primary)', padding: '2px 8px', borderRadius: '4px', color: 'black' }}>
                      {currentLoad} طلبات
                    </span>
                  </div>
                );
              }) : <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>لا يوجد طيارين متاحين</p>}
            </div>
          </div>

          {/* Closed Pilots Card */}
          <div className="glass-card" style={{ padding: '20px', borderRight: '4px solid var(--danger)' }}>
            <h4 style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>شيفت مغلق ({closedPilots.length})</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {closedPilots.map(p => (
                <span key={p.id} style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {p.name}
                </span>
              ))}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};

const SIMPLE_MENU = {
  'سندوتشات': ['أسبايسي', 'بدون تومية', 'بدون شطة', 'بدون سلطة', 'بدون طحينة', 'بدون أضافات'],
  'مشويات': ['سوي زيادة', ''],
  'مقبلات': ['بطاطس محمرة', 'كول سلو', 'ثومية', 'طحينة', 'مخلل'],
  'مشروبات': ['بيبسي', 'سفن اب', 'مياه معدنية', 'عصير']
};

const ManualOrderForm = ({ onClose, initialData }) => {
  const { addOrder, sendToN8N } = useApp();
  const [formData, setFormData] = useState(initialData?.formData || {
    receiptNo: '',
    customerName: '',
    phone: '',
    area: MATAREYA_AREAS[0],
    customArea: '',
    total: '',
    deliveryFee: 20,
    itemsDescription: '', // Legacy fallback
    paymentMethod: 'Cash',
    paymentProof: null
  });
  const [selectedItems, setSelectedItems] = useState(initialData?.selectedItems || {});
  const [activeCategory, setActiveCategory] = useState('سندوتشات');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const deliveryFees = Array.from({ length: (100 - 20) / 5 + 1 }, (_, i) => 20 + i * 5);

  const handleAddItem = (item) => {
    setSelectedItems(prev => ({
      ...prev,
      [item]: (prev[item] || 0) + 1
    }));
  };

  const handleRemoveItem = (item) => {
    setSelectedItems(prev => {
      const active = { ...prev };
      if (active[item] > 1) {
        active[item] -= 1;
      } else {
        delete active[item];
      }
      return active;
    });
  };

  const printKitchenTicket = () => {
    if (!formData.receiptNo) {
      alert('الرجاء إدخال رقم البون أولاً للطباعة');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const itemsHtml = Object.entries(selectedItems)
      .map(([name, count]) => `<div style="display:flex; justify-content:space-between; margin-bottom:5px; font-weight:bold;"><span>${name}</span><span>x${count}</span></div>`)
      .join('');

    // Connect to Ethernet Printer via n8n Bridge
    sendToN8N({
      id: formData.receiptNo,
      customer: formData.customerName,
      items: selectedItems,
      notes: formData.itemsDescription,
      type: 'KITCHEN_TICKET_PRINT'
    }, 'PRINT_JOB');

    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <title>Kitchen Ticket #${formData.receiptNo}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { 
            font-family: 'Courier New', monospace; 
            padding: 5mm; 
            width: 70mm; 
            margin: 0 auto; 
            text-align: center;
            background: white; 
            color: black;
          }
          .header { font-size: 32px; font-weight: 800; border-bottom: 3px solid #000; padding-bottom: 5px; margin-bottom: 15px; }
          .meta { font-size: 16px; margin-bottom: 15px; text-align: right; border-bottom: 1px dashed #000; padding-bottom: 5px; }
          .items { margin-bottom: 15px; text-align: right; }
          .footer { font-size: 14px; font-weight: bold; margin-top: 20px; border-top: 2px dashed #000; padding-top: 10px; }
          .item-row { display: flex; justify-content: space-between; margin-bottom: 5px; font-weight: bold; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="header">#${formData.receiptNo}</div>
        <div class="meta">
          <div>العميل: ${formData.customerName || 'عام'}</div>
          <div>التوقيت: ${new Date().toLocaleTimeString('ar-EG')}</div>
        </div>
        <div class="items">
          ${Object.entries(selectedItems)
        .map(([name, count]) => `<div class="item-row"><span>${name}</span><span>x${count}</span></div>`)
        .join('')}
          ${formData.itemsDescription ? `<p style="margin-top:10px; font-size:14px; text-align:right;">ملاحظات: ${formData.itemsDescription}</p>` : ''}
        </div>
        <div class="footer">أبو خاطر - بون المطبخ</div>
        <script>
          window.onload = () => { window.print(); setTimeout(() => window.close(), 500); };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.receiptNo) {
      alert('يجب إدخال رقم البون من المطبخ');
      return;
    }

    const itemsList = Object.entries(selectedItems).map(([name, count]) => ({ name, count }));
    const autoDescription = itemsList.map(i => `${i.count}x ${i.name}`).join(', ');

    addOrder({
      id: formData.receiptNo,
      type: 'restaurant',
      customerName: formData.customerName,
      phone: formData.phone,
      area: formData.area === 'اخرى (إدخال يدوي)' ? formData.customArea : formData.area,
      total: Number(formData.total) || 0,
      deliveryFee: Number(formData.deliveryFee),
      itemsDescription: autoDescription + (formData.itemsDescription ? ` (${formData.itemsDescription})` : ''),
      items: itemsList,
      itemsCount: itemsList.reduce((acc, curr) => acc + curr.count, 0),
      paymentMethod: formData.paymentMethod,
      paymentProof: formData.paymentProof
    });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)', overflowY: 'auto', padding: '20px' }}>
      <div className="glass-card" style={{ position: 'relative', padding: '24px', width: isMenuOpen ? '900px' : '500px', maxWidth: '100%', display: 'grid', gridTemplateColumns: isMenuOpen ? '1.2fr 2fr' : '1fr', gap: '24px', border: '1px solid var(--primary)', transition: 'all 0.3s ease' }}>

        {/* Floating Toggle Button - Center Left Edge */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{
            position: 'absolute',
            left: '-20px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: isMenuOpen ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
            border: 'none',
            color: 'white',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease'
          }}
          title={isMenuOpen ? "إخفاء القائمة" : "إظهار قائمة المطبخ"}
        >
          {isMenuOpen ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
        </button>

        {/* Left Column: Form Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', display: 'flex', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Monitor size={24} /> بيانات الأوردر (Call Center)
            </h3>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--primary)', fontWeight: 'bold' }}>رقم بون الكول سنتر (POS Ticket)</label>
            <input
              type="text"
              className="glass-card"
              style={{ background: 'black', color: 'var(--primary)', padding: '12px', border: '1px solid var(--primary)', borderRadius: '8px', width: '100%', fontSize: '1.4rem', fontWeight: 'bold', textAlign: 'center' }}
              placeholder="1054"
              required
              autoFocus
              value={formData.receiptNo}
              onChange={e => setFormData({ ...formData, receiptNo: e.target.value })}
            />
          </div>
          {/* 
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              className="glass-card"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}
              placeholder="اسم العميل"
              required
              value={formData.customerName}
              onChange={e => setFormData({ ...formData, customerName: e.target.value })}
            />
            <input
              type="tel"
              className="glass-card"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}
              placeholder="رقم الهاتف"
              required
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
            />
          </div> */}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>منطقة التوصيل</label>
            <select
              className="glass-card"
              style={{ background: '#1e293b', color: 'white', padding: '12px', border: '1px solid var(--border)', borderRadius: '15px' }}
              value={formData.area}
              onChange={e => setFormData({ ...formData, area: e.target.value })}
            >
              {MATAREYA_AREAS.map(area => <option key={area} value={area}>{area}</option>)}
            </select>
          </div>

          {formData.area === 'اخرى (إدخال يدوي)' && (
            <input
              className="glass-card"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}
              placeholder="ادخل المنطقة يدوياً"
              required
              value={formData.customArea}
              onChange={e => setFormData({ ...formData, customArea: e.target.value })}
            />
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>إجمالي الفاتورة (اختياري)</label>
              <input
                // type="number"
                className="glass-card"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}
                placeholder="0"
                value={formData.total}
                onChange={e => setFormData({ ...formData, total: e.target.value })}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>خدمة التوصيل</label>
              <select
                className="glass-card"
                style={{ background: '#1e293b', color: 'white', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}
                value={formData.deliveryFee}
                onChange={e => setFormData({ ...formData, deliveryFee: e.target.value })}
              >
                {deliveryFees.map(fee => <option key={fee} value={fee}>{fee} ج.م</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>طريقة الدفع</label>
            <select
              className="glass-card"
              style={{ background: '#1e293b', color: 'white', padding: '12px', border: '1px solid var(--border)', borderRadius: '15px' }}
              value={formData.paymentMethod}
              onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
            >
              <option value="Cash">نقدي</option>
              <option value="Wallet">محفظة إلكترونية (Etisalat Cash)</option>
              <option value="Visa">انستاباي (instapay)</option>
            </select>
          </div>

          {(formData.paymentMethod === 'Wallet' || formData.paymentMethod === 'Visa') && (
            <div style={{ background: 'rgba(255,165,0,0.1)', padding: '12px', borderRadius: '8px', border: '1px dashed var(--warning)' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--warning)', marginBottom: '8px' }}>📸 صورة التحويل / الإيصال (إجباري)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData({ ...formData, paymentProof: reader.result });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                style={{ fontSize: '0.8rem', color: 'white' }}
              />
              {formData.paymentProof && <p style={{ color: 'var(--success)', fontSize: '0.8rem', marginTop: '4px' }}>✅ تم رفع الصورة</p>}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
            <button type="submit" onClick={handleSubmit} className="btn-primary" style={{ flex: 2, justifyContent: 'center', height: '48px' }}>حفظ الطلب</button>
            <button type="button" onClick={onClose} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: '8px' }}>إلغاء</button>
          </div>
        </div>



        {/* Right Column: Menu Selection */}
        {isMenuOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderRight: '1px solid var(--border)', paddingRight: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>تحديد الأصناف (للمطبخ)</h3>
              <button
                type="button"
                onClick={printKitchenTicket}
                className="btn-primary"
                style={{ background: 'white', color: 'black', fontSize: '0.8rem', padding: '6px 12px' }}
              >
                <Receipt size={16} /> طباعة بون المطبخ
              </button>
            </div>

            {/* Categories Tabs */}
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px' }}>
              {Object.keys(SIMPLE_MENU).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: 'none',
                    background: activeCategory === cat ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                    color: activeCategory === cat ? 'white' : 'var(--text-muted)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Items Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
              {SIMPLE_MENU[activeCategory].map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleAddItem(item)}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: selectedItems[item] ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.02)',
                    color: selectedItems[item] ? 'var(--primary)' : 'var(--text-main)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{ fontSize: '0.9rem' }}>{item}</span>
                  {selectedItems[item] && (
                    <span style={{ fontSize: '0.8rem', background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '10px' }}>
                      x{selectedItems[item]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Selected Summary */}
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '12px', color: 'var(--text-muted)' }}>ملخص الطلب</h4>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.keys(selectedItems).length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>لم يتم اختيار أصناف</p>
                ) : (
                  Object.entries(selectedItems).map(([item, count]) => (
                    <div key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                      <span>{item}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: 'bold' }}>x{count}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item)}
                          style={{ background: 'var(--danger)', border: 'none', color: 'white', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          -
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <textarea
                className="glass-card"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', marginTop: '12px', minHeight: '60px', resize: 'none' }}
                placeholder="ملاحظات إضافية للمطبخ..."
                value={formData.itemsDescription}
                onChange={e => setFormData({ ...formData, itemsDescription: e.target.value })}
              />
            </div>

          </div>
        )}

      </div>
    </div >
  );
};

const ExternalOrderForm = ({ onClose, initialData }) => {
  const { addOrder } = useApp();
  const [formData, setFormData] = useState(initialData?.formData || {
    receiptNo: '',
    platform: 'Talabat',
    customerName: 'عميل أبلكيشن',
    phone: '',
    deliveryFee: 20,
    area: MATAREYA_AREAS[0],
    paymentMethod: 'Cash',
    paymentProof: null
  });
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.receiptNo) {
      alert('يجب إدخال رقم البون من المطبخ');
      return;
    }

    addOrder({
      id: formData.receiptNo,
      type: 'talabat',
      customerName: `${formData.customerName} (${formData.platform})`,
      phone: formData.phone || 'N/A',
      area: formData.area,
      total: 0, // Usually prepaid or separate
      deliveryFee: Number(formData.deliveryFee),
      itemsDescription: `طلب ${formData.platform}`,
      itemsCount: 1,
      paymentMethod: formData.paymentMethod,
      paymentProof: formData.paymentProof
    });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '  rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(12px)' }}>
      <div className="glass-card" style={{ padding: '32px', width: '480px', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid var(--accent)' }}>
        <h3 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border)', paddingBottom: '12px', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Globe size={24} /> أوردر خارجي (Talabat)
        </h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--accent)', fontWeight: 'bold' }}>رقم  هاشتاج الاوردر (Talabat)</label>
            <input
              type="text"
              className="glass-card"
              style={{ background: 'black', color: 'var(--accent)', padding: '12px', border: '1px solid var(--accent)', borderRadius: '8px', width: '100%', fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'center' }}
              placeholder="POS Receipt #"
              required
              autoFocus
              value={formData.receiptNo}
              onChange={e => setFormData({ ...formData, receiptNo: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <select
              className="glass-card"
              style={{ background: '#1e293b', color: 'white', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}
              value={formData.platform}
              onChange={e => setFormData({ ...formData, platform: e.target.value })}
            >
              <option value="Talabat">Talabat</option>
              <option value="Noon">Noon Food</option>
              <option value="ElMenus">ElMenus</option>
              <option value="Other">أخرى</option>
            </select>
            <input
              type="number"
              className="glass-card"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}
              placeholder="خدمة التوصيل"
              required
              value={formData.deliveryFee}
              onChange={e => setFormData({ ...formData, deliveryFee: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center', height: '48px', background: 'var(--accent)' }}>إضافة</button>
            <button type="button" onClick={onClose} style={{ flex: 0.5, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: '8px' }}>إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ReservationModal = ({ onClose }) => {
  const { addReservation } = useApp();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    type: 'restaurant',
    customerName: '',
    phone: '',
    date: new Date().toISOString().split('T')[0],
    time: '14:00',
    guests: 2,
    deposit: 50,
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step < 2) {
      setStep(2);
      return;
    }
    addReservation(formData);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(10px)' }}>
      <div className="glass-card" style={{ padding: '32px', width: '480px', border: '1px solid #8b5cf6', boxShadow: '0 0 40px rgba(139, 92, 246, 0.2)' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem' }}>
            <UtensilsCrossed size={28} /> طلب حجز جديد
          </h3>
          <div style={{ display: 'flex', gap: '4px' }}>
            <div style={{ width: '20px', height: '4px', borderRadius: '2px', background: step === 1 ? '#8b5cf6' : 'rgba(255,255,255,0.1)' }}></div>
            <div style={{ width: '20px', height: '4px', borderRadius: '2px', background: step === 2 ? '#8b5cf6' : 'rgba(255,255,255,0.1)' }}></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {step === 1 ? (
            <>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['restaurant', 'cafe'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: t })}
                    style={{
                      flex: 1, padding: '20px', borderRadius: '16px', border: '2px solid',
                      borderColor: formData.type === t ? '#8b5cf6' : 'rgba(255,255,255,0.05)',
                      background: formData.type === t ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                      color: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: '0.2s'
                    }}
                  >
                    <span style={{ fontSize: '2rem' }}>{t === 'restaurant' ? '🍽️' : '☕'}</span>
                    <span style={{ fontWeight: 'bold' }}>{t === 'restaurant' ? 'حجز مطعم' : 'حجز كافيه'}</span>
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input required className="glass-card" style={{ width: '100%', padding: '14px', color: 'white', fontSize: '1.1rem' }} placeholder="الاسم الكامل للعميل" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} />
                <input required type="tel" className="glass-card" style={{ width: '100%', padding: '14px', color: 'white', fontSize: '1.1rem' }} placeholder="رقم الموبايل" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>التاريخ</label>
                  <input required type="date" className="glass-card" style={{ width: '100%', padding: '12px', color: 'white' }} value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>الوقت</label>
                  <input required type="time" className="glass-card" style={{ width: '100%', padding: '12px', color: 'white' }} value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
                </div>
              </div>
            </>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>مراجعة تفاصيل الحجز</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>النوع:</span><strong>{formData.type === 'cafe' ? 'كافيه ☕' : 'مطعم 🍽️'}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>العميل:</span><strong>{formData.customerName}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>التاريخ:</span><strong>{formData.date} في {formData.time}</strong></div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                  <div className="glass-card" style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>عدد الأفراد</span>
                    <input type="number" style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }} value={formData.guests} onChange={e => setFormData({ ...formData, guests: e.target.value })} />
                  </div>
                  <div className="glass-card" style={{ padding: '12px', textAlign: 'center', border: '1px solid #8b5cf6' }}>
                    <span style={{ fontSize: '0.8rem', color: '#8b5cf6' }}>العربون (ج.م)</span>
                    <input type="number" style={{ background: 'transparent', border: 'none', color: '#8b5cf6', width: '100%', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }} value={formData.deposit} onChange={e => setFormData({ ...formData, deposit: e.target.value })} />
                  </div>
                </div>

                <textarea className="glass-card" style={{ width: '100%', padding: '12px', color: 'white', marginTop: '12px', minHeight: '80px' }} placeholder="ملاحظات إضافية..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            {step === 2 && <button type="button" onClick={() => setStep(1)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', borderRadius: '12px', cursor: 'pointer' }}>سابق</button>}
            <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center', background: '#8b5cf6', height: '54px', fontSize: '1.1rem' }}>
              {step === 1 ? 'متابعة الحجز' : 'تأكيد وإرسال للمدير'}
            </button>
            <button type="button" onClick={onClose} style={{ flex: step === 1 ? 1 : 0, overflow: 'hidden', padding: step === 1 ? '12px' : '0', width: step === 1 ? 'auto' : '0', background: 'transparent', border: '1px solid var(--border)', color: 'white', cursor: 'pointer', borderRadius: '12px', transition: '0.2s' }}>إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ConfirmPaymentModal = ({ res, onClose }) => {
  const { confirmReservation } = useApp();
  const [refNum, setRefNum] = useState('');
  const [proof, setProof] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProof(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    confirmReservation(res.id, refNum, proof);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
      <div className="glass-card" style={{ padding: '24px', width: '380px', border: '1px solid var(--success)' }}>
        <h3 style={{ marginBottom: '16px', color: 'var(--success)' }}>تأكيد استلام العربون</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>رقم التحويل / المرجع</label>
            <input required className="glass-card" style={{ width: '100%', padding: '12px', color: 'white' }} placeholder="أدخل الرقم هنا..." value={refNum} onChange={e => setRefNum(e.target.value)} />
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px dashed var(--border)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.85rem', marginBottom: '10px' }}>📸 صورة إيصال التحويل</p>
            <input required type="file" accept="image/*" onChange={handleFile} style={{ fontSize: '0.8rem', color: 'white' }} />
            {proof && <img src={proof} alt="preview" style={{ marginTop: '10px', width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn-primary" style={{ flex: 2, background: 'var(--success)', justifyContent: 'center' }}>تأكيد نهائي</button>
            <button type="button" onClick={onClose} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', color: 'white', cursor: 'pointer', borderRadius: '8px' }}>رجوع</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ReservationView = () => {
  const { reservations, deleteReservation } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [confirmingRes, setConfirmingRes] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {showModal && <ReservationModal onClose={() => setShowModal(false)} />}
      {confirmingRes && <ConfirmPaymentModal res={confirmingRes} onClose={() => setConfirmingRes(null)} />}

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#8b5cf6', letterSpacing: '-1px' }}>منظم حجوزات أبو خاطر</h1>
          <p style={{ color: 'var(--text-muted)' }}>إدارة طاولات المطعم والكافيه الخارجي</p>
        </div>
      </header>

      {/* Floating Add Button - Bottom Center */}
      <button
        onClick={() => setShowModal(true)}
        className="btn-primary"
        style={{
          position: 'fixed',
          bottom: '40px',
          left: '10%',
          transform: 'translateX(-50%)',
          background: '#8b5cf6',
          padding: '16px 32px',
          borderRadius: '20px',
          boxShadow: '0 15px 35px rgba(139, 92, 246, 0.4)',
          zIndex: 100,
          border: '2px solid rgba(255,255,255,0.1)',
          fontSize: '1.1rem'
        }}
      >
        <PlusCircle size={24} /> حجز طـاولة جديـد
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
        {reservations.length === 0 ? (
          <div className="glass-card" style={{ gridColumn: '1/-1', padding: '80px', textAlign: 'center', opacity: 0.8 }}>
            <UtensilsCrossed size={48} color="#8b5cf6" style={{ marginBottom: '16px', opacity: 0.5 }} />
            <h3 style={{ color: 'var(--text-muted)' }}>لا يوجد حجوزات مسجلة حالياً</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>ابدأ بإضافة أول حجز عبر الزر في الأعلى</p>
          </div>
        ) : (
          [...reservations].sort((a, b) => {
            const dateA = new Date(`${a.date || ''} ${a.time || ''}`);
            const dateB = new Date(`${b.date || ''} ${b.time || ''}`);
            return dateA - dateB;
          }).map(res => (
            <div key={res.id} className="glass-card" style={{ padding: '28px', position: 'relative', borderTop: `4px solid ${res.status === 'confirmed' ? 'var(--success)' : '#8b5cf6'}`, transition: 'transform 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <span style={{ fontSize: '0.8rem', background: 'rgba(139, 92, 246, 0.1)', padding: '6px 12px', borderRadius: '20px', color: '#8b5cf6', fontWeight: 'bold' }}>#{res.id}</span>
                <span style={{
                  fontSize: '0.8rem',
                  background: res.status === 'confirmed' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  color: res.status === 'confirmed' ? 'var(--success)' : 'var(--warning)',
                  padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold'
                }}>
                  {res.status === 'confirmed' ? 'تم التأكيد ✅' : 'في انتظار العربون ⏳'}
                </span>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '4px' }}>{res.customerName} {res.type === 'cafe' ? '☕' : '🍽️'}</h3>
                <p style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '1.1rem' }}>{res.phone}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', padding: '16px', background: 'rgba(0,0,0,0.15)', borderRadius: '12px' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>الموعد والتاريخ</p>
                  <p style={{ fontSize: '1rem', fontWeight: '600' }}>{res.date}</p>
                  <p style={{ fontSize: '0.9rem', color: '#8b5cf6' }}>{res.time}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>عدد الضيوف</p>
                  <p style={{ fontSize: '1.2rem', fontWeight: '800' }}>{res.guests}</p>
                  <p style={{ fontSize: '0.8rem' }}>أفراد</p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>مبلغ التأمين</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--warning)' }}>{res.deposit} ج.م</span>
                </div>
                {res.refNumber && (
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>رقم التحويل</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--accent)' }}>{res.refNumber}</span>
                  </div>
                )}
              </div>

              {res.notes && (
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  " {res.notes} "
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                {res.status === 'pending' ? (
                  <button
                    onClick={() => setConfirmingRes(res)}
                    style={{ flex: 2, padding: '12px', borderRadius: '10px', background: 'var(--success)', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    تأكيد الاستلام
                  </button>
                ) : (
                  <div style={{ flex: 2, textAlign: 'center', color: 'var(--success)', fontWeight: 'bold', padding: '12px' }}>تم الاعتماد بنجاح</div>
                )}
                <button onClick={() => { if (window.confirm('هل أنت متأكد من حذف هذا الحجز؟')) deleteReservation(res.id) }} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', cursor: 'pointer' }}>حذف</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const ExtraTripForm = ({ onClose, initialData }) => {
  const { addOrder } = useApp();
  const [formData, setFormData] = useState(initialData?.formData || {
    requester: MANAGERS[0],
    notes: '',
    value: 10
  });

  const tripValues = Array.from({ length: (50 - 10) / 5 + 1 }, (_, i) => 10 + i * 5);

  const handleSubmit = (e) => {
    e.preventDefault();
    addOrder({
      id: `Trip-${Date.now().toString().slice(-4)}`,
      type: 'trip',
      customerName: formData.requester,
      phone: 'داخلي',
      area: 'مشوار خاص',
      total: 0,
      deliveryFee: Number(formData.value),
      itemsDescription: formData.notes,
      itemsCount: 1
    });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(12px)' }}>
      <div className="glass-card" style={{ padding: '32px', width: '480px', display: 'flex', flexDirection: 'column', gap: '20px', border: '1px solid var(--warning)' }}>
        <h3 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border)', paddingBottom: '12px', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bike size={24} /> رحلة إضافية (Non-Kitchen)
        </h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>صاحب الطلب / الجهة</label>
            <select
              className="glass-card"
              style={{ background: '#1e293b', color: 'white', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}
              value={formData.requester}
              onChange={e => setFormData({ ...formData, requester: e.target.value })}
            >
              {MANAGERS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>قيمة المشوار (للأجور)</label>
            <select
              className="glass-card"
              style={{ background: '#1e293b', color: 'white', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}
              value={formData.value}
              onChange={e => setFormData({ ...formData, value: e.target.value })}
            >
              {tripValues.map(v => <option key={v} value={v}>{v} ج.م</option>)}
            </select>
          </div>

          <textarea
            className="glass-card"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'white', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', minHeight: '80px', resize: 'none' }}
            placeholder="ملاحظات توضيحية للمشوار (اختياري)"
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
          />

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center', height: '48px', background: 'var(--warning)', color: 'black' }}>تسجيل المشوار</button>
            <button type="button" onClick={onClose} style={{ flex: 0.5, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: '8px' }}>إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeModal, setActiveModal] = useState('none');
  const [reeditData, setReeditData] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isShiftOpen, deleteOrder } = useApp();

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Prevent scroll when sidebar is open (Mobile)
  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? 'hidden' : 'auto';
  }, [isSidebarOpen]);

  const handleReedit = (order) => {
    // Pack data for the forms
    let initial = {};
    if (order.type === 'restaurant') {
      initial = {
        formData: {
          receiptNo: order.originalId || order.id,
          customerName: order.customerName,
          phone: order.phone,
          area: order.area,
          total: order.total,
          deliveryFee: order.deliveryFee,
          itemsDescription: order.itemsDescription,
          paymentMethod: order.paymentMethod,
          paymentProof: order.paymentProof
        },
        selectedItems: order.items?.reduce((acc, curr) => ({ ...acc, [curr.name]: curr.count }), {}) || {}
      };
      setReeditData(initial);
      setActiveModal('manual');
    } else if (order.type === 'talabat' || order.type === 'external') {
      initial = {
        formData: {
          receiptNo: order.originalId || order.id,
          platform: order.customerName.includes('Talabat') ? 'Talabat' : order.customerName.includes('Noon') ? 'Noon' : 'Other',
          customerName: 'عميل أبلكيشن',
          phone: order.phone,
          deliveryFee: order.deliveryFee,
          area: order.area,
          paymentMethod: order.paymentMethod,
          paymentProof: order.paymentProof
        }
      };
      setReeditData(initial);
      setActiveModal('external');
    } else if (order.type === 'trip') {
      initial = {
        formData: {
          requester: order.customerName,
          notes: order.itemsDescription,
          value: order.deliveryFee
        }
      };
      setReeditData(initial);
      setActiveModal('trip');
    }

    deleteOrder(order.id);
  };

  const handleCloseModal = () => {
    setActiveModal('none');
    setReeditData(null);
  };

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  return (
    <div className="layout" dir="rtl">
      {/* Mobile Menu Toggle */}
      <button className="menu-toggle" onClick={toggleSidebar}>
        <Menu size={20} />
        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>القائمة</span>
      </button>

      {/* Overlay: click outside closes menu */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isSidebarOpen={isSidebarOpen}
        closeSidebar={closeSidebar}
      />
      <main className="main-content">
        {isShiftOpen && (
          <div style={{ position: 'fixed', top: '24px', left: '32px', zIndex: 100, display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setActiveModal('manual')}
              className="btn-primary"
              style={{ color: '#000000ff', background: '#15ff00c2', boxShadow: '0 4px 12px rgba(249, 234, 22, 0.50)' }}
            >
              <Plus size={18} />
              <span> أوردر مـــطــعــم </span>
            </button>

            <button
              onClick={() => setActiveModal('external')}
              className="btn-primary"
              style={{ color: '#000000ff', background: '#ff5e00d0', boxShadow: '0 4px 12px rgba(249, 234, 22, 0.50)' }}
            >
              <Plus size={18} />
              <span> أوردر طلبات </span>
            </button>

            <button
              onClick={() => setActiveModal('trip')}
              className="btn-primary"
              style={{ color: '#000000ff', background: '#da2929bd', boxShadow: '0 4px 12px rgba(218, 215, 10, 0.50)' }}
            >
              <Plus size={18} />
              <span>مشوار خاص</span>
            </button>
          </div>
        )}

        {activeModal === 'manual' && <ManualOrderForm onClose={handleCloseModal} initialData={reeditData} />}
        {activeModal === 'external' && <ExternalOrderForm onClose={handleCloseModal} initialData={reeditData} />}
        {activeModal === 'trip' && <ExtraTripForm onClose={handleCloseModal} initialData={reeditData} />}

        <div style={{ position: 'relative' }}>
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'inbox' && <OrderInbox onReedit={handleReedit} />}
          {activeTab === 'pilots' && <PilotManagement />}
          {activeTab === 'reservations' && <ReservationView />}
          {activeTab === 'reports' && <ReportsView />}
        </div>
      </main>
    </div>
  );
}

export default App;
