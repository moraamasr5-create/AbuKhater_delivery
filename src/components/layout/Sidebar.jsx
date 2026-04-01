import React from 'react';
import { Home, Inbox, Users, BarChart3, Settings, Play, Square, PlusCircle, UtensilsCrossed } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isAutoCloseTime } from '../../utils/shiftLogic';

const Sidebar = ({ activeTab, setActiveTab, isSidebarOpen, closeSidebar }) => {
    const { isShiftOpen, openShift, closeShift, orders, userRole, setUserRole } = useApp();

    const pendingCount = orders.filter(o => ['pending', 'pending_timer', 'waiting_driver'].includes(o.status)).length;

    // 🟢 تصفية القائمة بناءً على صلاحيات المستخدم
    // الأدمن بيشوف كل حاجة، الطيار بيشوف صندوق الوارد بس
    const allMenuItems = [
        { id: 'dashboard', label: 'الرئيسية', icon: Home, roles: ['admin'] },
        { id: 'inbox', label: 'صندوق الوارد', icon: Inbox, roles: ['admin', 'driver'] },
        { id: 'pilots', label: 'الطيارين', icon: Users, roles: ['admin'] },
        { id: 'reservations', label: 'حجز مطعم / كافيه', icon: UtensilsCrossed, roles: ['admin'], special: true },
        { id: 'reports', label: 'التقارير', icon: BarChart3, roles: ['admin'] },
    ];

    const menuItems = allMenuItems.filter(item => item.roles.includes(userRole));

    return (
        <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '30px', textAlign: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${userRole === 'admin' ? 'var(--accent)' : '#fbbf24'}`, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src="/logo.png" alt="Abu Khater" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '800' }}>إدارة طيارين أبو خاطر</h2>
                
                {/* 🛡️ زر تبديل التجربة (Demo Role Switcher) */}
                <button 
                  onClick={() => setUserRole(userRole === 'admin' ? 'driver' : 'admin')}
                  style={{ background: userRole === 'admin' ? 'rgba(78, 205, 196, 0.1)' : 'rgba(251, 191, 36, 0.1)', color: userRole === 'admin' ? 'var(--accent)' : '#fbbf24', border: '1px solid currentColor', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}
                >
                  {userRole === 'admin' ? '🔧 وضع المدير' : '🚴 وضع الطيار'}
                </button>
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

            {userRole === 'admin' && (
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
            )}
        </div>
    );
};

export default Sidebar;
