import React from 'react';
import { Home, Inbox, Users, BarChart3, Settings, Play, Square, PlusCircle, UtensilsCrossed } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isAutoCloseTime } from '../../utils/shiftLogic';

const Sidebar = ({ activeTab, setActiveTab, isSidebarOpen, closeSidebar }) => {
    const { isShiftOpen, openShift, closeShift, orders } = useApp();

    const pendingCount = orders.filter(o => ['pending', 'pending_timer', 'waiting_driver'].includes(o.status)).length;

    const menuItems = [
        { id: 'dashboard', label: 'الرئيسية', icon: Home },
        { id: 'inbox', label: 'صندوق الوارد', icon: Inbox },
        { id: 'pilots', label: 'الطيارين', icon: Users },
        { id: 'reservations', label: 'حجز مطعم / كافيه', icon: UtensilsCrossed, special: true },
        { id: 'reports', label: 'التقارير', icon: BarChart3 },
    ];

    return (
        <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '30px', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src="/logo.png" alt="Abu Khater" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '800' }}>إدارة طيارين أبو خاطر</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => {
                            setActiveTab(item.id);
                            closeSidebar();
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: 'none',
                            background: activeTab === item.id
                                ? (item.special ? '#8b5cf6' : 'var(--primary)')
                                : 'transparent',
                            color: activeTab === item.id ? 'white' : 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: '0.2s',
                            textAlign: 'right',
                        }}
                    >
                        <item.icon size={20} />
                        <span style={{ fontWeight: '600' }}>{item.label}</span>
                        {item.id === 'inbox' && pendingCount > 0 && (
                            <div style={{
                                background: 'var(--danger)',
                                color: 'white',
                                fontSize: '0.7rem',
                                fontWeight: 'bold',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                marginRight: 'auto',
                                boxShadow: '0 2px 5px rgba(239, 68, 68, 0.3)'
                            }}>
                                {pendingCount}
                            </div>
                        )}
                        {item.special && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff', marginRight: item.id === 'inbox' ? '8px' : 'auto' }}></div>}
                    </button>
                ))}
            </div>

            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                {!isShiftOpen ? (
                    <button
                        onClick={() => {
                            const pwd = prompt('أدخل كلمة مرور المشرف لفتح الوردية:');
                            if (pwd === '8080') {
                                openShift();
                                closeSidebar();
                            }
                            else alert('كلمة مرور خاطئة');
                        }}
                        className="btn-primary"
                        style={{ width: '100%', background: 'var(--accent)' }}
                    >
                        <Play size={18} />
                        <span>فتح وردية جديدة</span>
                    </button>
                ) : (
                    <button
                        onClick={() => {
                            if (isAutoCloseTime()) {
                                closeShift(true);
                                closeSidebar();
                            } else {
                                const pwd = prompt('أدخل كلمة مرور المشرف لإغلاق الوردية:');
                                if (pwd === '8080') {
                                    closeShift(false);
                                    closeSidebar();
                                }
                                else if (pwd !== null) alert('كلمة مرور خاطئة');
                            }
                        }}
                        className="btn-primary"
                        style={{ width: '100%', background: 'var(--danger)' }}
                    >
                        <Square size={18} />
                        <span>إغلاق الوردية اليومية</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
