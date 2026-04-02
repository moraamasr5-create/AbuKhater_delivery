import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import OrderInbox from './components/orders/OrderInbox';
import ReportsView from './components/reports/ReportsView';
import { useApp } from './context/AppContext';
import { Package, Bike, Clock, Plus, MapPin, AlertTriangle, Receipt, Globe, Monitor, ChevronLeft, ChevronRight, UtensilsCrossed, PlusCircle, Menu, Ruler, ShieldAlert } from 'lucide-react';

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

const AREAS_METADATA = [
  // Zone 1: 0-3km (Base)
  { name: 'المطرية - الرئيسي', lat: 30.126, lng: 31.298, zone: 1, fee: 20 },
  { name: 'المسلة', lat: 30.132, lng: 31.302, zone: 1, fee: 20 },
  { name: 'مسطرد', lat: 30.141, lng: 31.295, zone: 1, fee: 25 },
  { name: 'الشارع الجديد', lat: 30.148, lng: 31.292, zone: 1, fee: 25 },

  // Zone 2: 3-7km
  { name: 'عين شمس', lat: 30.121, lng: 31.332, zone: 2, fee: 30 },
  { name: 'النعام', lat: 30.115, lng: 31.318, zone: 2, fee: 35 },
  { name: 'حلمية الزيتون', lat: 30.111, lng: 31.305, zone: 2, fee: 35 },
  { name: 'الأميرية', lat: 30.105, lng: 31.292, zone: 2, fee: 30 },
  { name: 'السواح', lat: 30.101, lng: 31.288, zone: 2, fee: 35 },

  // Zone 3: 7-10km
  { name: 'الخصوص', lat: 30.165, lng: 31.312, zone: 3, fee: 45 },
  { name: 'المرج', lat: 30.155, lng: 31.345, zone: 3, fee: 50 },
  { name: 'جسر السويس', lat: 30.115, lng: 31.365, zone: 3, fee: 55 },
  { name: 'مصر الجديدة', lat: 30.091, lng: 31.334, zone: 3, fee: 60 },

  // Zone 4: 10-15km
  { name: 'مدينة نصر', lat: 30.061, lng: 31.335, zone: 4, fee: 75 },
  { name: 'القلج', lat: 30.185, lng: 31.368, zone: 4, fee: 70 },
  { name: 'الخانكة', lat: 30.215, lng: 31.378, zone: 4, fee: 80 }
];

const MATAREYA_AREAS = AREAS_METADATA.map(a => a.name).concat(['اخرى (إدخال يدوي)']);

const MANAGERS = ['أ/عبـدالله', 'أ/فتحـي', 'مدير3', 'الفرع الثاني'];

const PilotManagement = () => {
  const { pilots, togglePilotShift, addNewPilot } = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPilotName, setNewPilotName] = useState('');
  const [newPilotPhone, setNewPilotPhone] = useState('');
  const [newPilotShift, setNewPilotShift] = useState('8:00A - 6:00P');

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
    addNewPilot(newPilotName, newPilotPhone, newPilotShift);
    setShowAddModal(false);
    setNewPilotName('');
    setNewPilotPhone('');
    setNewPilotShift('8:00A - 6:00P');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>إدارة الطيارين</h2>
        <button
          onClick={() => {
            const pass = prompt('أدخل كلمة المرور لإضافة طيار جديد:');
            if (pass === '8080') setShowAddModal(true);
            else if (pass !== null) alert('كلمة المرور غير صحيحة');
          }}
          className="btn-primary"
          style={{ background: 'var(--accent)', padding: '10px 20px', borderRadius: '12px', fontSize: '0.95rem' }}
        >
          <Plus size={18} /> إضافة طيار جديد
        </button>
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
              <input
                placeholder="مواعيد العمل (مثال: 8:00A - 6:00P)"
                value={newPilotShift}
                onChange={e => setNewPilotShift(e.target.value)}
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

              <p style={{ color: 'var(--warning)', fontSize: '0.85rem', fontWeight: 'bold', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} />
                الوردية: {pilot.shift || 'غير محدد'}
              </p>
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
    <div className="grid" style={{ gap: '32px' }}>
      {editModalData && <EditOrderModal order={editModalData} onClose={() => setEditModalData(null)} />}

      {delayedOrders.length > 0 && (
        <div className="card" style={{
          background: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '16px',
          animation: 'pulse 2s infinite'
        }}>
          <AlertTriangle color="var(--danger)" size={24} />
          <div>
            <h3 style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '1rem' }}>تنبيه: يوجد {delayedOrders.length} طلبات متأخرة!</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', opacity: 0.8 }}>
              يرجى مراجعة الطلبات بالأرقام: {delayedOrders.map(o => '#' + o.id).join(', ')}
            </p>
          </div>
        </div>
      )}

      <header>
        <h1>لوحة التحكم</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>مرحباً بك في نظام إدارة دليفري أبو خاطر</p>
      </header>

      {/* Stats Cards */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        {stats.map((stat, i) => (
          <div key={i} className="card flex" style={{ alignItems: 'center', padding: '20px' }}>
            <div style={{ padding: '12px', borderRadius: '12px', background: `${stat.color}15`, color: stat.color }}>
              <stat.icon size={24} />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{stat.label}</p>
              <h3 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ borderTop: '4px solid var(--primary)', padding: '0' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
          <h3 className="flex" style={{ fontSize: '1.2rem', margin: 0 }}>
            <MapPin size={22} color="var(--primary)" /> رحلات الدليفري الحالية
          </h3>
        </div>

        <div className="flex flex-wrap" style={{ minHeight: '400px', gap: '0' }}>
          {/* Pilots List Side */}
          <div style={{ width: '100%', maxWidth: '280px', borderLeft: '1px solid var(--border)', padding: '20px' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '16px' }}>الطيارين في الخارج:</h4>
            <div className="grid" style={{ gap: '8px' }}>
              {pilotsWithOrders.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>لا يوجد طيارين في الخارج حالياً</p>
              ) : (
                pilotsWithOrders.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setViewPilotId(p.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      borderRadius: '12px',
                      border: 'none',
                      background: viewPilotId === p.id ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                      color: viewPilotId === p.id ? 'white' : 'var(--text-main)',
                      textAlign: 'right',
                      fontWeight: '700',
                      minHeight: '44px'
                    }}
                  >
                    <span>{p.name}</span>
                    <span style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '6px' }}>
                      {ordersByPilot[p.id]?.length || 0}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Orders Table Side */}
          <div style={{ flex: 1, minWidth: '300px', padding: '20px', overflowX: 'auto' }}>
            {viewPilotId && ordersByPilot[viewPilotId] ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ textAlign: 'right', color: 'var(--text-muted)', borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '12px 8px' }}>بون #</th>
                    <th style={{ padding: '12px 8px' }}>العميل</th>
                    <th style={{ padding: '12px 8px' }}>المنطقة</th>
                    <th style={{ padding: '12px 8px' }}>الوقت</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersByPilot[viewPilotId].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).map(order => {
                    const elapsed = getElapsedTime(order.timestamp);
                    const isDelayed = elapsed > 40;

                    return (
                      <tr key={order.id} style={{ borderBottom: '1px solid var(--border)', background: isDelayed ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                        <td style={{ padding: '16px 8px' }}>
                          <span style={{ fontWeight: '800', color: 'var(--primary)' }}>#{order.originalId || order.id}</span>
                          <button onClick={() => handleEditOrder(order)} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', marginRight: '4px', opacity: 0.6 }}>✏️</button>
                        </td>
                        <td style={{ padding: '16px 8px' }}>
                          <p style={{ fontWeight: 'bold' }}>{order.customerName}</p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.total > 0 ? `${order.total} ج.م` : ''}</p>
                        </td>
                        <td style={{ padding: '16px 8px' }}>{order.area}</td>
                        <td style={{ padding: '16px 8px' }}>
                          <span style={{ color: isDelayed ? 'var(--danger)' : elapsed > 25 ? 'var(--warning)' : 'var(--accent)', fontWeight: 'bold' }}>
                            {elapsed} د
                          </span>
                        </td>
                        <td style={{ padding: '16px 8px' }}>
                          <div className="flex" style={{ justifyContent: 'center', gap: '8px' }}>
                            <button onClick={() => completeOrder(order.id)} style={{ padding: '6px 12px', background: 'var(--success)', border: 'none', color: 'white', fontSize: '0.85rem' }}>تسليم</button>
                            <button onClick={() => handleFailDelivery(order.id)} style={{ padding: '6px 8px', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)' }}>❌</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
                {pilotsWithOrders.length > 0 ? 'الرجاء اختيار طيار لعرض طلباته' : 'لا توجد رحلات نشطة حالياً'}
              </div>
            )}
          </div>
        </div>
      </div>

      <section style={{ marginTop: '20px' }}>
        <h2 className="flex" style={{ fontSize: '1.2rem' }}>
          <Bike size={22} color="var(--accent)" /> نشاط الطيارين (الوردية الحالية)
        </h2>
        <div className="grid grid-2">
          {/* Active Pilots Card */}
          <div className="card" style={{ borderRight: '4px solid var(--accent)' }}>
            <h4 style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.9rem' }}>طيارين متاحين ({activePilots.length})</h4>
            <div className="grid" style={{ gap: '10px' }}>
              {activePilots.length > 0 ? activePilots.map(p => {
                const currentLoad = orders.filter(o =>
                  o.pilotId === p.id &&
                  (o.status === 'active' || o.status === 'driver_assigned')
                ).length;
                const isOut = p.state === 'out';

                return (
                  <div key={p.id} className="flex" style={{ justifyContent: 'space-between', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                    <div className="flex" style={{ gap: '12px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: isOut ? 'var(--warning)' : 'var(--success)', marginTop: '6px' }}></div>
                      <div>
                        <p style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{p.name}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {isOut ? 'خارج للتوصيل 🏍️' : 'متاح في المطعم ✅'} | {p.shift || '8:00A - 6:00P'}
                        </p>
                      </div>
                    </div>
                    <span style={{ fontSize: '0.8rem', background: currentLoad >= 7 ? 'var(--danger)' : 'var(--primary)', padding: '2px 10px', borderRadius: '6px', color: '#000', height: 'fit-content' }}>
                      {currentLoad} طلبات
                    </span>
                  </div>
                );
              }) : <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>لا يوجد طيارين متاحين</p>}
            </div>
          </div>

          {/* Closed Pilots Card */}
          <div className="card" style={{ borderRight: '4px solid var(--danger)' }}>
            <h4 style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '0.9rem' }}>شيفت مغلق ({closedPilots.length})</h4>
            <div className="flex flex-wrap" style={{ gap: '10px' }}>
              {closedPilots.map(p => (
                <span key={p.id} style={{ padding: '6px 14px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', fontSize: '0.85rem', color: 'var(--text-muted)', border: '1px solid var(--border)', display: 'inline-flex', gap: '4px' }}>
                  <strong>{p.name}</strong>
                  <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>({p.shift || '8:00A - 6:00P'})</span>
                </span>
              ))}
              {closedPilots.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>لا يوجد طيارين مسجلين</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const SIMPLE_MENU = {
  'سندوتشات': ['أسبايسي', 'بدون تومية', 'بدون شطة', 'بدون سلطة', 'بدون طحينة', 'بدون أضافات'],
  'مشويات': ['سوي زيادة'],
  'مقبلات': ['بطاطس محمرة', 'كول سلو', 'ثومية', 'طحينة', 'مخلل'],
  'مشروبات': ['بيبسي', 'سفن اب', 'مياه معدنية', 'عصير']
};

const ManualOrderForm = ({ onClose, initialData }) => {
  const { addOrder, sendToN8N } = useApp();
  const [formData, setFormData] = useState(initialData?.formData || {
    receiptNo: '', customerName: '', phone: '', area: '',
    lat: null, lng: null, zone: null, distance: 0,
    customArea: '', total: 0, deliveryFee: 20, itemsDescription: '',
    paymentMethod: 'Cash', paymentProof: null
  });
  const [selectedItems, setSelectedItems] = useState(initialData?.selectedItems || {});
  const [activeCategory, setActiveCategory] = useState('سندوتشات');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [areaSearch, setAreaSearch] = useState('');
  const [showAreaSuggestions, setShowAreaSuggestions] = useState(false);

  const isOutsideRadius = formData.distance > 15;

  const deliveryFees = Array.from({ length: 17 }, (_, i) => 20 + i * 5);

  const handleAddItem = (item) => setSelectedItems(prev => ({ ...prev, [item]: (prev[item] || 0) + 1 }));
  const handleRemoveItem = (item) => {
    setSelectedItems(prev => {
      const active = { ...prev };
      if (active[item] > 1) active[item] -= 1; else delete active[item];
      return active;
    });
  };

  const printKitchenTicket = () => {
    if (!formData.receiptNo) return alert('أدخل رقم البون للطباعة');
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    sendToN8N({
      id: formData.receiptNo, customer: formData.customerName,
      items: selectedItems, notes: formData.itemsDescription,
      type: 'KITCHEN_TICKET_PRINT'
    }, 'PRINT_JOB');

    const htmlContent = `
      <html dir="rtl"><head><style>@page { size: 80mm auto; margin: 0; } body { font-family: monospace; padding: 5mm; text-align: center; } .header { font-size: 24px; font-weight: bold; border-bottom: 2px solid #000; margin-bottom: 10px; }</style></head>
      <body><div class="header">بون مطبخ #${formData.receiptNo}</div>
      <div style="text-align:right;">${Object.entries(selectedItems).map(([n, c]) => `<div>${n} x${c}</div>`).join('')}</div>
      <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500);};</script></body></html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.receiptNo) return alert('رقم البون مطلوب');
    const itemsList = Object.entries(selectedItems).map(([name, count]) => ({ name, count }));
    addOrder({
      id: formData.receiptNo, type: 'restaurant', customerName: formData.customerName || "عميل مطعم",
      phone: formData.phone, area: formData.area || "المطرية",
      lat: formData.lat, lng: formData.lng,
      total: 0, // Removed per request
      deliveryFee: Number(formData.deliveryFee),
      source: 'manual', // 📞 طلب داخلي (كول سنتر)
      itemsDescription: itemsList.map(i => `${i.count}x ${i.name}`).join(', ') + (formData.itemsDescription ? ` (${formData.itemsDescription})` : ''),
      items: itemsList, itemsCount: itemsList.reduce((acc, curr) => acc + curr.count, 0),
      paymentMethod: formData.paymentMethod, paymentProof: formData.paymentProof
    });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', overflowY: 'auto', padding: '16px' }}>
      <div className="card" style={{ position: 'relative', width: isMenuOpen ? '1000px' : '500px', maxWidth: '100%', display: 'grid', gridTemplateColumns: isMenuOpen ? '1fr 1.8fr' : '1fr', gap: '24px', padding: '0', overflow: 'hidden' }}>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ position: 'absolute', left: '12px', top: '12px', background: 'var(--primary)', color: 'white', width: '36px', height: '36px', borderRadius: '10px', zIndex: 20 }}>
          {isMenuOpen ? <ChevronRight size={20} /> : <Menu size={20} />}
        </button>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 className="flex" style={{ fontSize: '1.2rem' }}><Monitor size={22} color="var(--primary)" /> تفاصيل الأوردر</h2>
          <div className="card" style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', textAlign: 'center' }}>
            <label style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem', display: 'block', marginBottom: '8px' }}>رقم بون الكول سنتر</label>
            <input
              type="text"
              style={{ background: 'transparent', color: 'var(--primary)', border: '2px solid var(--primary)', borderRadius: '12px', width: '100%', padding: '12px', fontSize: '1.6rem', fontWeight: '900', textAlign: 'center' }}
              value={formData.receiptNo}
              onChange={e => setFormData({ ...formData, receiptNo: e.target.value })}
              required
              autoFocus
              placeholder="000"
            />
          </div>

          {/* 🧠 Smart Area Search (Autocomplete) */}
          <div style={{ position: 'relative' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>📍 ابحث عن المنطقة</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="اكتب اسم المنطقة (مثلاً: المطرية)..."
                value={areaSearch}
                onChange={e => {
                  setAreaSearch(e.target.value);
                  setShowAreaSuggestions(true);
                }}
                onFocus={() => setShowAreaSuggestions(true)}
                style={{ background: 'var(--bg-dark)', color: 'white', padding: '14px', borderRadius: '12px', width: '100%', border: '1px solid var(--border)' }}
              />
              <MapPin size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }} />
            </div>

            {showAreaSuggestions && areaSearch && (
              <div className="glass-card" style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                maxHeight: '280px', overflowY: 'auto', marginTop: '8px',
                border: '1px solid var(--border)', background: '#111827',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
              }}>
                {[1, 2, 3, 4].map(zoneNum => {
                  const zoneAreas = AREAS_METADATA.filter(a => a.zone === zoneNum && a.name.includes(areaSearch));
                  if (zoneAreas.length === 0) return null;
                  return (
                    <div key={zoneNum}>
                      <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 16px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                        النطاق {zoneNum} (Zone {zoneNum})
                      </div>
                      {zoneAreas.map(area => {
                        const dist = calculateDistance(RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng, area.lat, area.lng);
                        return (
                          <div
                            key={area.name}
                            onClick={() => {
                              setFormData({
                                ...formData,
                                area: area.name,
                                lat: area.lat,
                                lng: area.lng,
                                zone: area.zone,
                                distance: dist,
                                deliveryFee: area.fee
                              });
                              setAreaSearch(area.name);
                              setShowAreaSuggestions(false);
                            }}
                            className="hover-scale"
                            style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}
                          >
                            <div>
                              <span style={{ fontWeight: 'bold' }}>{area.name}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '8px' }}>({dist} كم)</span>
                            </div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>{area.fee} ج.م</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Location Feedback Badges */}
          {formData.area && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(79, 70, 229, 0.1)', border: '1px solid var(--primary)', color: 'var(--primary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Ruler size={14} /> {formData.distance} كم من المطعم
              </div>
              <div style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent)', color: 'var(--accent)', fontSize: '0.75rem' }}>
                نطاق التوصيل: {formData.zone}
              </div>
              {isOutsideRadius && (
                <div style={{ width: '100%', padding: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: '8px', marginTop: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldAlert size={18} /> خارج نطاق التوصيل (أكثر من 15كم)
                </div>
              )}
            </div>
          )}

          <div className="grid" style={{ gap: '12px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '-4px' }}>💰 خدمة التوصيل (مثبتة حسب النطاق)</label>
            <input
              readOnly
              style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', cursor: 'not-allowed' }}
              value={`${formData.deliveryFee} ج.م`}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>💳 طريقة الدفع</label>
            <div className="flex" style={{ gap: '8px' }}>
              {[
                { id: 'Cash', label: 'كاش', color: '#10b981' },
                { id: 'vodafone_cash', label: 'فودافون كاش', color: '#ef4444' },
                { id: 'instapay', label: 'انستا باى', color: '#8b5cf6' }
              ].map(method => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, paymentMethod: method.id })}
                  style={{
                    flex: 1,
                    padding: '12px 8px',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    border: '2px solid',
                    borderColor: formData.paymentMethod === method.id ? method.color : 'rgba(255,255,255,0.05)',
                    background: formData.paymentMethod === method.id ? `${method.color}15` : 'rgba(255,255,255,0.05)',
                    color: formData.paymentMethod === method.id ? method.color : 'var(--text-muted)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {(formData.paymentMethod === 'vodafone_cash' || formData.paymentMethod === 'instapay') && (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px dashed var(--border)',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '0.85rem', marginBottom: '10px', color: 'var(--accent)', fontWeight: 'bold' }}>
                📸 صورة إيصال التحويل (إجباري)
              </p>
              <input
                required
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setFormData({ ...formData, paymentProof: reader.result });
                    reader.readAsDataURL(file);
                  }
                }}
                style={{ fontSize: '0.8rem', color: 'white', cursor: 'pointer' }}
              />
              {formData.paymentProof && (
                <img
                  src={formData.paymentProof}
                  alt="Success"
                  style={{ marginTop: '12px', width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '2px solid var(--accent)' }}
                />
              )}
            </div>
          )}

          <div className="flex" style={{ gap: '12px', marginTop: '20px' }}>
            <button
              onClick={handleSubmit}
              disabled={
                isOutsideRadius ||
                !formData.receiptNo ||
                !formData.area ||
                ((formData.paymentMethod === 'vodafone_cash' || formData.paymentMethod === 'instapay') && !formData.paymentProof)
              }
              className="btn-primary"
              style={{
                flex: 2, justifyContent: 'center', height: '50px', fontSize: '1.1rem',
                opacity: (isOutsideRadius || !formData.receiptNo || !formData.area || ((formData.paymentMethod === 'vodafone_cash' || formData.paymentMethod === 'instapay') && !formData.paymentProof)) ? 0.5 : 1,
                cursor: (isOutsideRadius || !formData.receiptNo || !formData.area || ((formData.paymentMethod === 'vodafone_cash' || formData.paymentMethod === 'instapay') && !formData.paymentProof)) ? 'not-allowed' : 'pointer'
              }}
            >
              حفظ الأوردر
            </button>
            <button onClick={onClose} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: 'white' }}>إلغاء</button>
          </div>
        </div>

        {isMenuOpen && (
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <header className="flex" style={{ justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1rem' }}>الأصناف للمطبخ</h3>
              <button onClick={printKitchenTicket} style={{ background: 'white', color: 'black', padding: '4px 12px', borderRadius: '8px' }}><Receipt size={16} /> طباعة</button>
            </header>
            <div className="flex" style={{ overflowX: 'auto', gap: '8px' }}>
              {Object.keys(SIMPLE_MENU).map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: '6px 12px', borderRadius: '20px', background: activeCategory === cat ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: 'white' }}>{cat}</button>
              ))}
            </div>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
              {SIMPLE_MENU[activeCategory].map(item => (
                <button key={item} onClick={() => handleAddItem(item)} style={{ padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', background: selectedItems[item] ? 'rgba(79, 70, 229, 0.2)' : 'transparent', color: 'white' }}>
                  {item} {selectedItems[item] && `x${selectedItems[item]}`}
                </button>
              ))}
            </div>
            <textarea style={{ background: 'rgba(0,0,0,0.2)', color: 'white', padding: '12px', borderRadius: '10px', resize: 'none', minHeight: '60px' }} placeholder="ملاحظات المطبخ..." value={formData.itemsDescription} onChange={e => setFormData({ ...formData, itemsDescription: e.target.value })} />
          </div>
        )}
      </div>
    </div>
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
      source: 'talabat', // 📱 طلب خارجي عبر تابلت (طلبات)
      itemsDescription: `طلب ${formData.platform}`,
      itemsCount: 1,
      paymentMethod: formData.paymentMethod,
      paymentProof: formData.paymentProof
    });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)', padding: '16px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px', border: '1px solid var(--accent)', padding: '32px' }}>
        <h3 className="flex" style={{ fontSize: '1.4rem', color: 'var(--accent)', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>
          <Globe size={24} /> أوردر تطبيقات (Talabat)
        </h3>
        <form onSubmit={handleSubmit} className="grid" style={{ gap: '20px' }}>
          <div className="card" style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', margin: 0 }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.9rem' }}>رقم الاوردر على التابلت</label>
            <input
              type="text"
              style={{ background: 'transparent', color: 'var(--accent)', border: '2px solid var(--accent)', borderRadius: '12px', width: '100%', padding: '12px', fontSize: '1.4rem', fontWeight: '900', textAlign: 'center' }}
              placeholder="#0000000"
              required
              autoFocus
              value={formData.receiptNo}
              onChange={e => setFormData({ ...formData, receiptNo: e.target.value })}
            />
          </div>

          <div className="grid-2" style={{ gap: '12px' }}>
            <div className="grid" style={{ gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>التطبيق</label>
              <select
                style={{ background: 'var(--bg-dark)', color: 'white', padding: '14px', border: '1px solid var(--border)', borderRadius: '12px', width: '100%' }}
                value={formData.platform}
                onChange={e => setFormData({ ...formData, platform: e.target.value })}
              >
                <option value="Talabat">Talabat</option>
                <option value="Noon">Noon Food</option>
                <option value="ElMenus">ElMenus</option>
                <option value="Other">أخرى</option>
              </select>
            </div>
            <div className="grid" style={{ gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>خدمة التوصيل</label>
              <input
                type="number"
                style={{ background: 'var(--bg-dark)', color: 'white', padding: '14px', border: '1px solid var(--border)', borderRadius: '12px', width: '100%' }}
                required
                value={formData.deliveryFee}
                onChange={e => setFormData({ ...formData, deliveryFee: e.target.value })}
              />
            </div>
          </div>

          <div className="flex" style={{ marginTop: '12px' }}>
            <button type="submit" className="btn-primary" style={{ flex: 2, background: 'var(--accent)', color: 'black', justifyContent: 'center' }}>إضافة</button>
            <button type="button" onClick={onClose} style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>إلغاء</button>
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
    type: 'restaurant', customerName: '', phone: '',
    date: new Date().toISOString().split('T')[0], time: '14:00',
    guests: 2, deposit: 50, notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step < 2) return setStep(2);
    addReservation(formData);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(10px)', padding: '16px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px', border: '1px solid #8b5cf6', padding: '32px' }}>
        <h3 className="flex" style={{ color: '#8b5cf6', marginBottom: '24px' }}><UtensilsCrossed size={24} /> حجز جديد</h3>
        <form onSubmit={handleSubmit} className="grid" style={{ gap: '20px' }}>
          {step === 1 ? (
            <>
              <div className="grid-2" style={{ gap: '12px' }}>
                {['restaurant', 'cafe'].map(t => (
                  <button key={t} type="button" onClick={() => setFormData({ ...formData, type: t })} className="card" style={{ padding: '16px', textAlign: 'center', border: formData.type === t ? '2px solid #8b5cf6' : '1px solid var(--border)', background: formData.type === t ? 'rgba(139, 92, 246, 0.1)' : 'transparent', color: 'white' }}>
                    {t === 'restaurant' ? 'مطعم' : 'كافيه'}
                  </button>
                ))}
              </div>
              <input required style={{ background: 'var(--bg-dark)', color: 'white', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)' }} placeholder="اسم العميل" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} />
              <input required style={{ background: 'var(--bg-dark)', color: 'white', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)' }} placeholder="رقم الهاتف" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </>
          ) : (
            <>
              <div className="grid-2" style={{ gap: '12px' }}>
                <input type="date" style={{ background: 'var(--bg-dark)', color: 'white', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }} value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                <input type="time" style={{ background: 'var(--bg-dark)', color: 'white', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }} value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })} />
              </div>
              <div className="grid-2" style={{ gap: '12px' }}>
                <input type="number" style={{ background: 'var(--bg-dark)', color: 'white', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }} placeholder="عدد الأفراد" value={formData.guests} onChange={e => setFormData({ ...formData, guests: e.target.value })} />
                <input type="number" style={{ background: 'var(--bg-dark)', color: 'white', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)' }} placeholder="العربون" value={formData.deposit} onChange={e => setFormData({ ...formData, deposit: e.target.value })} />
              </div>
            </>
          )}
          <div className="flex" style={{ gap: '12px' }}>
            <button type="submit" className="btn-primary" style={{ flex: 2, background: '#8b5cf6', justifyContent: 'center' }}>{step === 1 ? 'التالي' : 'تأكيد'}</button>
            <button type="button" onClick={onClose} style={{ flex: 1, background: 'transparent', color: 'white', border: '1px solid var(--border)' }}>إلغاء</button>
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
    <div className="grid" style={{ gap: '32px' }}>
      {showModal && <ReservationModal onClose={() => setShowModal(false)} />}
      {confirmingRes && <ConfirmPaymentModal res={confirmingRes} onClose={() => setConfirmingRes(null)} />}

      <header className="flex" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1 style={{ color: '#a78bfa' }}>الحجوزات</h1><p style={{ color: 'var(--text-muted)' }}>إدارة طاولات المطعم</p></div>
        <button onClick={() => setShowModal(true)} className="btn-primary" style={{ background: '#8b5cf6' }}><PlusCircle size={20} /> حجز جديد</button>
      </header>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {reservations.length === 0 ? (
          <div className="card" style={{ gridColumn: '1/-1', padding: '60px', textAlign: 'center' }}><p>لا يوجد حجوزات</p></div>
        ) : (
          reservations.map(res => (
            <div key={res.id} className="card" style={{ borderTop: `4px solid ${res.status === 'confirmed' ? '#10b981' : '#8b5cf6'}` }}>
              <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>#{res.id}</span>
                <span style={{ color: res.status === 'confirmed' ? '#10b981' : '#f59e0b', fontWeight: 'bold' }}>{res.status === 'confirmed' ? 'مؤكد' : 'معلق'}</span>
              </div>
              <h3 style={{ margin: '0 0 8px 0' }}>{res.customerName}</h3>
              <p style={{ color: 'var(--accent)', fontWeight: 'bold', margin: '0 0 12px 0' }}>{res.phone}</p>
              <div className="grid-2" style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '12px' }}>
                <div><label style={{ fontSize: '0.7rem', opacity: 0.6 }}>الموعد</label><div>{res.time}</div></div>
                <div><label style={{ fontSize: '0.7rem', opacity: 0.6 }}>الأفراد</label><div>{res.guests}</div></div>
              </div>
              <div className="flex" style={{ gap: '10px', marginTop: '16px' }}>
                {res.status === 'pending' && <button onClick={() => setConfirmingRes(res)} className="btn-primary" style={{ flex: 1, background: 'var(--success)' }}>تأكيد</button>}
                <button onClick={() => deleteReservation(res.id)} style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>حذف</button>
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
      source: 'external', // 🏍️ مشوار خارجي (توصيل فقط)
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
  const { isShiftOpen, deleteOrder, userRole } = useApp();

  // 🟢 حماية لضمان أن الطيار مبيشوفش غير صندوق الوارد
  useEffect(() => {
    if (userRole === 'driver' && activeTab !== 'inbox') {
      setActiveTab('inbox');
    }
  }, [userRole, activeTab]);

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
        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>☰</span>
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
        <div className="app-container">
          {/* 🔴 أزرار الإضافة - مسموحة للمدير فقط */}
          {isShiftOpen && userRole === 'admin' && (
            <div className="flex flex-wrap" style={{ marginBottom: '24px', gap: '12px' }}>
              <button
                onClick={() => setActiveModal('manual')}
                className="btn-primary"
                style={{ flex: '1 1 auto', justifyContent: 'center', color: '#000', background: '#22c55e', boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)' }}
              >
                <Plus size={18} />
                <span>أوردر المطبخ</span>
              </button>

              <button
                onClick={() => setActiveModal('external')}
                className="btn-primary"
                style={{ flex: '1 1 auto', justifyContent: 'center', color: '#000', background: '#f97316', boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)' }}
              >
                <Plus size={18} />
                <span>أوردر خارجي</span>
              </button>

              <button
                onClick={() => setActiveModal('trip')}
                className="btn-primary"
                style={{ flex: '1 1 auto', justifyContent: 'center', color: '#000', background: '#ef4444', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}
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
            {/* 🔐 تأمين الصفحات - الأدمن بس هو اللي يفتح التقارير والطيارين والداشبورد */}
            {activeTab === 'dashboard' && userRole === 'admin' && <DashboardView />}
            {activeTab === 'inbox' && <OrderInbox onReedit={handleReedit} />}
            {activeTab === 'pilots' && userRole === 'admin' && <PilotManagement />}
            {activeTab === 'reservations' && userRole === 'admin' && <ReservationView />}
            {activeTab === 'reports' && userRole === 'admin' && <ReportsView />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
