// Developed & Owned by AmrMamdouh - 01038035884
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Utensils, CheckCircle, XCircle, RefreshCw, AlertTriangle, AlertCircle } from 'lucide-react';

const SIMPLE_MENU = {
  'سندوتشات': ['أسبايسي', 'بدون تومية', 'بدون شطة', 'بدون سلطة', 'بدون طحينة', 'بدون أضافات'],
  'مشويات': ['سوي زيادة'],
  'مقبلات': ['بطاطس محمرة', 'كول سلو', 'ثومية', 'طحينة', 'مخلل'],
  'مشروبات': ['بيبسي', 'سفن اب', 'مياه معدنية', 'عصير']
};

const KitchenView = () => {
  const { menuAvailability, toggleMenuItemAvailability } = useApp();
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [isUpdating, setIsUpdating] = useState(null); // Keeps track of which item is loading/saving

  const handleToggle = async (itemName, isAvailable) => {
    setIsUpdating(itemName);
    try {
      await toggleMenuItemAvailability(itemName, isAvailable);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(null);
    }
  };

  // List categories
  const categories = ['الكل', ...Object.keys(SIMPLE_MENU)];

  // Get items list based on filter
  const getItems = () => {
    if (activeCategory === 'الكل') {
      const allItems = [];
      Object.entries(SIMPLE_MENU).forEach(([category, items]) => {
        items.forEach(item => {
          allItems.push({ name: item, category });
        });
      });
      return allItems;
    } else {
      return SIMPLE_MENU[activeCategory].map(item => ({ name: item, category: activeCategory }));
    }
  };

  const filteredItems = getItems();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease-in-out' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
            <Utensils size={32} color="var(--primary)" />
            شاشة التحكم في المطبخ
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>إدارة وتحديث توفر العناصر والكميات في المطبخ بشكل فوري في شاشات الكاشير وأخذ الطلبات</p>
        </div>
      </header>

      {/* Warning Box */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '4px solid var(--warning)', background: 'rgba(245, 158, 11, 0.05)' }}>
        <AlertCircle size={24} color="var(--warning)" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '0.88rem', color: '#fcd34d', lineHeight: '1.4' }}>
          <strong>تنبيه للمطبخ:</strong> العناصر التي يتم الإشارة إليها بـ "نفذت الكمية" سيتم تعطيلها فوراً في شاشة أخذ الطلبات (الفرونت إند) ولن يتمكن الكاشير من اختيارها لحين إعادة إتاحتها مجدداً.
        </div>
      </div>

      {/* Stats Counter Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '20px', textAlign: 'center', borderRight: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>العناصر المتاحة حالياً</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 'bold', margin: '4px 0', color: '#34d399' }}>
            {filteredItems.filter(item => menuAvailability[item.name] !== false).length}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '20px', textAlign: 'center', borderRight: '4px solid var(--danger)' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>عناصر غير متاحة (نفذت الكمية)</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 'bold', margin: '4px 0', color: '#f87171' }}>
            {filteredItems.filter(item => menuAvailability[item.name] === false).length}
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="glass-card" style={{ padding: '12px', display: 'flex', gap: '8px', overflowX: 'auto', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className="glass-card"
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: activeCategory === cat ? '1px solid var(--primary)' : '1px solid var(--border)',
              background: activeCategory === cat ? 'var(--primary)' : 'rgba(255,255,255,0.02)',
              color: activeCategory === cat ? 'white' : 'var(--text-muted)',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.2s',
              fontSize: '0.9rem'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {filteredItems.map(item => {
          const isAvailable = menuAvailability[item.name] !== false; // Default is available
          return (
            <div 
              key={item.name} 
              className="glass-card hover-scale" 
              style={{ 
                padding: '20px', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                gap: '16px',
                borderTop: isAvailable ? '3px solid #10b981' : '3px solid var(--danger)',
                background: isAvailable ? 'rgba(16, 185, 129, 0.02)' : 'rgba(239, 68, 68, 0.02)'
              }}
            >
              {/* Header Info */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px', color: 'var(--text-muted)' }}>
                    {item.category}
                  </span>
                  
                  {/* Availability Badge */}
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    color: isAvailable ? '#34d399' : '#f87171',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {isAvailable ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {isAvailable ? 'متاح للطلب' : 'نفذت الكمية'}
                  </span>
                </div>
                
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '8px 0 4px 0', color: 'white' }}>
                  {item.name}
                </h3>
              </div>

              {/* Action Toggle Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                
                {/* Mark as Available */}
                <button
                  disabled={isUpdating === item.name}
                  onClick={() => handleToggle(item.name, true)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #10b981',
                    background: isAvailable ? '#10b981' : 'transparent',
                    color: isAvailable ? 'white' : '#34d399',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    opacity: isUpdating === item.name ? 0.6 : 1
                  }}
                >
                  <CheckCircle size={16} />
                  <span>متاح</span>
                </button>

                {/* Mark as Unavailable */}
                <button
                  disabled={isUpdating === item.name}
                  onClick={() => handleToggle(item.name, false)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--danger)',
                    background: !isAvailable ? 'var(--danger)' : 'transparent',
                    color: !isAvailable ? 'white' : '#f87171',
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    opacity: isUpdating === item.name ? 0.6 : 1
                  }}
                >
                  <XCircle size={16} />
                  <span>نفذ</span>
                </button>
                
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};

export default KitchenView;
