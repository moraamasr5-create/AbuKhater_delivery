import React, { useState, useEffect } from 'react';
import { Shield, KeyRound, User, Delete, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const Login = ({ onLoginSuccess }) => {
  const { setUserRole } = useApp();
  const [selectedUser, setSelectedUser] = useState('casher'); // Default selection
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  // Clear error when user changes selection
  useEffect(() => {
    setError('');
    setPin('');
  }, [selectedUser]);

  const handleKeyPress = (num) => {
    if (pin.length < 8) {
      setError('');
      setPin(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!pin) return;

    // Get correct password from localStorage, fallback to '8080'
    const storageKey = `b_delivery_password_${selectedUser}`;
    const correctPassword = localStorage.getItem(storageKey) || '8080';

    if (pin === correctPassword) {
      // Save session in sessionStorage
      sessionStorage.setItem('b_delivery_session_user', selectedUser);
      // Update global context state
      setUserRole(selectedUser);
      if (onLoginSuccess) onLoginSuccess(selectedUser);
    } else {
      // Trigger shake animation and error
      setError('⚠️ كلمة المرور غير صحيحة، حاول مرة أخرى');
      setIsShaking(true);
      setPin('');
      // Trigger haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
      setTimeout(() => {
        setIsShaking(false);
      }, 500);
    }
  };

  return (
    <div className="login-viewport" dir="rtl">
      {/* Background decoration */}
      <div className="login-bg-glow login-glow-1"></div>
      <div className="login-bg-glow login-glow-2"></div>

      <div className="login-container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="login-logo-container">
            <img src="/logo.png" alt="Abu Khater Logo" className="login-logo" onError={(e) => { e.target.style.display = 'none'; }} />
            <Shield size={36} color="var(--accent)" />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: '12px 0 4px 0', color: 'white' }}>نظام توصيل أبو خاطر</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>الرجاء تسجيل الدخول لمتابعة العمل</p>
        </div>

        {/* User Selection */}
        <div className="login-user-select">
          <button
            type="button"
            className={`login-user-btn ${selectedUser === 'admin' ? 'active admin' : ''}`}
            onClick={() => setSelectedUser('admin')}
          >
            <Shield size={24} />
            <span>مدير النظام (Admin)</span>
          </button>
          <button
            type="button"
            className={`login-user-btn ${selectedUser === 'casher' ? 'active casher' : ''}`}
            onClick={() => setSelectedUser('casher')}
          >
            <User size={24} />
            <span>الكاشير (Casher)</span>
          </button>
        </div>

        {/* PIN Display Dots */}
        <div className={`login-pin-display ${isShaking ? 'shake' : ''}`}>
          <div className="login-dots-container">
            {[...Array(4)].map((_, i) => (
              <span 
                key={i} 
                className={`login-dot ${pin.length > i ? 'active' : ''}`}
              />
            ))}
            {pin.length > 4 && [...Array(pin.length - 4)].map((_, i) => (
              <span 
                key={i + 4} 
                className="login-dot active"
              />
            ))}
          </div>
          
          {error && <p className="login-error-msg">{error}</p>}
        </div>

        {/* Custom Numpad */}
        <div className="login-numpad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              type="button"
              className="login-num-btn"
              onClick={() => handleKeyPress(num)}
            >
              {num}
            </button>
          ))}
          
          {/* Action Row */}
          <button
            type="button"
            className="login-num-btn clear-btn"
            style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--danger)' }}
            onClick={handleClear}
          >
            تصفير
          </button>
          
          <button
            type="button"
            className="login-num-btn"
            onClick={() => handleKeyPress(0)}
          >
            0
          </button>
          
          <button
            type="button"
            className="login-num-btn delete-btn"
            onClick={handleDelete}
            title="حذف رقم"
          >
            <Delete size={20} />
          </button>
        </div>

        {/* Action Button */}
        <button
          type="button"
          className="login-submit-btn"
          disabled={pin.length === 0}
          onClick={() => handleSubmit()}
        >
          <Check size={20} />
          <span>تأكيد الدخول</span>
        </button>
      </div>

      {/* Embedded Styles for Login Screen */}
      <style dangerouslySetInnerHTML={{__html: `
        .login-viewport {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: #090d16;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          font-family: 'Outfit', 'Cairo', sans-serif;
          overflow: hidden;
        }

        .login-bg-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.15;
          z-index: 1;
        }

        .login-glow-1 {
          width: 300px;
          height: 300px;
          background: var(--primary, #3b82f6);
          top: -50px;
          right: -50px;
        }

        .login-glow-2 {
          width: 400px;
          height: 400px;
          background: var(--accent, #10b981);
          bottom: -100px;
          left: -100px;
        }

        .login-container {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 400px;
          padding: 32px 24px;
          background: rgba(17, 24, 39, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(20px);
          margin: 16px;
        }

        .login-logo-container {
          width: 70px;
          height: 70px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.03);
          border: 1.5px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.05);
        }

        .login-logo {
          width: 80%;
          height: 80%;
          object-fit: contain;
        }

        .login-user-select {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }

        .login-user-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px 8px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          color: var(--text-muted, #94a3b8);
          font-weight: bold;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .login-user-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
          transform: translateY(-2px);
        }

        .login-user-btn.active.admin {
          background: rgba(59, 130, 246, 0.1);
          border-color: #3b82f6;
          color: #60a5fa;
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.15);
        }

        .login-user-btn.active.casher {
          background: rgba(16, 185, 129, 0.1);
          border-color: #10b981;
          color: #34d399;
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.15);
        }

        .login-pin-display {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 16px;
          text-align: center;
          margin-bottom: 24px;
          min-height: 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .login-dots-container {
          display: flex;
          justify-content: center;
          gap: 16px;
          height: 16px;
        }

        .login-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          transition: all 0.15s ease;
        }

        .login-dot.active {
          background: white;
          transform: scale(1.2);
          box-shadow: 0 0 10px white;
        }

        .login-error-msg {
          color: #ef4444;
          font-size: 0.8rem;
          margin-top: 10px;
          font-weight: bold;
        }

        .login-numpad {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .login-num-btn {
          height: 52px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          color: white;
          font-size: 1.4rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
        }

        .login-num-btn:active {
          background: rgba(255, 255, 255, 0.12);
          transform: scale(0.95);
        }

        .login-num-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
        }

        .login-num-btn.clear-btn:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .login-num-btn.delete-btn {
          color: #94a3b8;
        }

        .login-num-btn.delete-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: white;
        }

        .login-submit-btn {
          width: 100%;
          height: 50px;
          background: var(--primary, #3b82f6);
          color: white;
          border: none;
          border-radius: 16px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
          transition: all 0.2s;
        }

        .login-submit-btn:hover:not(:disabled) {
          background: #2563eb;
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
          transform: translateY(-1px);
        }

        .login-submit-btn:disabled {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.2);
          box-shadow: none;
          cursor: not-allowed;
        }

        /* Animations */
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }

        .login-pin-display.shake {
          animation: shake 0.4s ease-in-out;
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.05);
        }
      `}} />
    </div>
  );
};

export default Login;
