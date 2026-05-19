// Developed & Owned by AmrMamdouh - 01038035884
import React, { useState, useEffect } from 'react';
import { supabaseService } from '../../services/supabaseService';
import { MessageSquare, Trash2, Calendar, Phone, Star, Search, Loader2, Sparkles, MessageCircle, AlertTriangle } from 'lucide-react';

const FeedbackView = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all'); // all, excellent (>=4), moderate (3), bad (<=2)

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const data = await supabaseService.fetchFeedbacks();
      setFeedbacks(data || []);
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الشكوى/المقترح نهائياً؟')) {
      try {
        const success = await supabaseService.deleteFeedback(id);
        if (success) {
          setFeedbacks(prev => prev.filter(f => f.id !== id));
        } else {
          alert('❌ حدث خطأ أثناء الحذف');
        }
      } catch (err) {
        console.error('Error deleting feedback:', err);
        alert('❌ حدث خطأ أثناء الحذف');
      }
    }
  };

  const getNormalizedFeedback = (row) => {
    return {
      id: row.id,
      name: row.customer_name || row.name || 'عميل غير معروف',
      phone: row.customer_phone || row.phone || '',
      message: row.content || row.message || row.feedback_text || row.text || 'بدون تفاصيل',
      rating: Number(row.rating || 0),
      createdAt: row.created_at || new Date().toISOString()
    };
  };

  // Filter & Search
  const filteredFeedbacks = feedbacks
    .map(row => getNormalizedFeedback(row))
    .filter(item => {
      // Search match
      const query = searchQuery.toLowerCase().trim();
      const nameMatch = item.name.toLowerCase().includes(query);
      const phoneMatch = item.phone.includes(query);
      const messageMatch = item.message.toLowerCase().includes(query);
      const matchesSearch = !query || nameMatch || phoneMatch || messageMatch;

      // Rating Filter
      let matchesRating = true;
      if (ratingFilter === 'excellent') matchesRating = item.rating >= 4;
      else if (ratingFilter === 'moderate') matchesRating = item.rating === 3;
      else if (ratingFilter === 'bad') matchesRating = item.rating > 0 && item.rating <= 2;
      else if (ratingFilter === 'no_rating') matchesRating = item.rating === 0;

      return matchesSearch && matchesRating;
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease-in-out' }}>
      
      {/* Header section */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
            <MessageSquare size={32} color="var(--primary)" />
            الشكاوى والمقترحات
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>استعراض تعليقات وشكاوى ومقترحات العملاء الواردة من موقع وتطبيق الطلبات</p>
        </div>

        <button 
          onClick={loadFeedbacks} 
          disabled={loading}
          className="btn-primary" 
          style={{ background: 'var(--primary)', padding: '10px 20px', borderRadius: '12px' }}
        >
          {loading ? <Loader2 size={18} className="spin" /> : 'تحديث القائمة 🔄'}
        </button>
      </header>

      {/* Stats Counter Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '16px', borderRight: '4px solid var(--primary)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>إجمالي الوارد</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '4px 0', color: 'white' }}>{feedbacks.length}</div>
        </div>
        <div className="glass-card" style={{ padding: '16px', borderRight: '4px solid #10b981', textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>التقييمات الإيجابية (⭐ 4-5)</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '4px 0', color: '#34d399' }}>
            {feedbacks.filter(f => Number(f.rating || 0) >= 4).length}
          </div>
        </div>
        <div className="glass-card" style={{ padding: '16px', borderRight: '4px solid var(--danger)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>الشكاوى والتقييمات المتدنية</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '4px 0', color: '#f87171' }}>
            {feedbacks.filter(f => Number(f.rating || 0) > 0 && Number(f.rating || 0) <= 2).length}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Search Input */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
          <input
            type="text"
            placeholder="بحث في محتوى الرسالة، الهاتف، أو الاسم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-card"
            style={{
              width: '100%',
              padding: '10px 38px 10px 12px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: '#131b2e',
              color: 'white',
              fontSize: '0.9rem'
            }}
          />
          <Search size={18} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>

        {/* Tab Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'الكل' },
            { id: 'excellent', label: 'إيجابي (⭐ 4-5)' },
            { id: 'moderate', label: 'متوسط (⭐ 3)' },
            { id: 'bad', label: 'سلبي/شكوى (⭐ 1-2)' },
            { id: 'no_rating', label: 'بدون تقييم نجوم' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setRatingFilter(tab.id)}
              className="glass-card"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: ratingFilter === tab.id ? '1px solid var(--primary)' : '1px solid var(--border)',
                background: ratingFilter === tab.id ? 'var(--primary)' : 'rgba(255,255,255,0.02)',
                color: ratingFilter === tab.id ? 'white' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback Feed */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px' }}>
          <Loader2 size={48} className="spin" color="var(--primary)" />
          <p style={{ color: 'var(--text-muted)' }}>جاري جلب الشكاوى والمقترحات المباشرة...</p>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <MessageCircle size={48} style={{ opacity: 0.3, color: 'var(--primary)' }} />
          <h3 style={{ color: 'white', margin: 0 }}>لا توجد أي رسائل مطابقة حالياً</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: 0, fontSize: '0.9rem' }}>
            {feedbacks.length === 0 
              ? 'صندوق الشكاوى والمقترحات فارغ! يبدو أن العملاء راضون تماماً عن الخدمة والطلب.'
              : 'قم بتغيير خيارات البحث والتصفية للوصول للنتائج المطلوبة.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {filteredFeedbacks.map(item => (
            <div 
              key={item.id} 
              className="glass-card hover-scale" 
              style={{ 
                padding: '20px', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                gap: '16px',
                borderTop: item.rating === 0 
                  ? '3px solid var(--border)' 
                  : item.rating <= 2 
                    ? '3px solid var(--danger)' 
                    : item.rating === 3 
                      ? '3px solid var(--warning)' 
                      : '3px solid #10b981'
              }}
            >
              <div>
                {/* Top Info Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', margin: '0 0 4px 0', color: 'white', fontWeight: 'bold' }}>{item.name}</h4>
                    {item.phone && (
                      <a 
                        href={`tel:${item.phone}`} 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', textDecoration: 'none', fontSize: '0.85rem' }}
                      >
                        <Phone size={12} /> {item.phone}
                      </a>
                    )}
                  </div>

                  {/* Rating Stars */}
                  {item.rating > 0 && (
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={14} 
                          fill={i < item.rating ? '#fbbf24' : 'none'} 
                          color={i < item.rating ? '#fbbf24' : 'rgba(255,255,255,0.2)'} 
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Message Body */}
                <div style={{ 
                  background: 'rgba(0,0,0,0.18)', 
                  padding: '12px', 
                  borderRadius: '10px', 
                  fontSize: '0.9rem', 
                  color: '#e2e8f0', 
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                  minHeight: '60px'
                }}>
                  {item.message}
                </div>
              </div>

              {/* Bottom Actions footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <Calendar size={12} />
                  <span>{new Date(item.createdAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#f87171',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s'
                  }}
                  title="حذف الرسالة"
                >
                  <Trash2 size={14} />
                  <span>حذف</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default FeedbackView;
