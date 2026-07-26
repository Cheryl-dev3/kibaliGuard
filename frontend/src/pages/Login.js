import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import KibaShield from '../components/KibaShield';
import Footer from '../components/Footer';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const demoAccounts = [
  { label: 'Administrator', color: '#EF233C', bg: '#FEE2E2', identifier: 'admin@kibalitest.com', password: 'Admin1234', icon: '⚙️' },
  { label: 'HR Staff', color: '#FFB703', bg: '#FFFBEB', identifier: 'staff@kibalitest.com', password: 'Staff1234', icon: '👔' },
  { label: 'Job Applicant', color: '#00B4D8', bg: '#E0F9FF', identifier: '0712345678', password: 'Customer1234', icon: '🎯' }
];

const EyeIcon = ({ show }) => show ? (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5Z" stroke="#00B4D8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12.5" r="3.5" stroke="#00B4D8" strokeWidth="2"/>
  </svg>
) : (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M2 2L22 22" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"/>
    <path d="M6.71 6.71C4.56 8.08 2.9 10.11 2 12.5C3.73 16.89 8 20 13 20" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"/>
    <path d="M9.88 4.13C10.57 4.05 11.28 4 12 4C17 4 21.27 7.11 23 11.5" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const Login = () => {
  const { login, darkMode } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pose, setPose] = useState(1);
  const [shieldState, setShieldState] = useState('idle');
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    const r = localStorage.getItem('kibaliRememberMe');
    if (r) { setIdentifier(r); setRememberMe(true); setPose(8); }
  }, []);

  const handleDemoSelect = (account) => {
    setIdentifier(account.identifier);
    setPassword(account.password);
    setShowDemo(false);
    setPose(8);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!identifier || !password) {
      setError('Please fill in all fields');
      setPose(3); setShieldState('warning');
      setTimeout(() => { setPose(1); setShieldState('idle'); }, 2000);
      return;
    }
    setLoading(true); setPose(7);
    try {
      const res = await axios.post(`${API}/api/auth/login`, { identifier, password });
      setPose(2); setShieldState('success');
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 }, colors: ['#FFD60A', '#FF6B35', '#06D6A0', '#00B4D8'] });
      if (rememberMe) localStorage.setItem('kibaliRememberMe', identifier);
      else localStorage.removeItem('kibaliRememberMe');
      setTimeout(() => {
        login(res.data.user, res.data.token);
        const role = res.data.user.role;
        navigate(role === 'admin' ? '/admin' : role === 'staff' ? '/staff' : '/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
      setPose(4); setShieldState('danger');
      setTimeout(() => { setPose(1); setShieldState('idle'); }, 2000);
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width: '100%', padding: '14px 16px', border: '2px solid #E2E8F0', borderRadius: '12px',
    fontSize: '15px', fontFamily: 'Inter, sans-serif',
    background: darkMode ? '#0F172A' : '#F8FAFC',
    color: darkMode ? '#F1F5F9' : '#0F172A',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s'
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: darkMode ? '#0F172A' : '#F8FAFC' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div style={{ display: 'flex', gap: '64px', alignItems: 'center', width: '100%', maxWidth: '900px', flexWrap: 'wrap', justifyContent: 'center' }}>

          {/* LEFT — Kiba only */}
          <div className="animate-slideInLeft" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <KibaShield pose={pose} shieldState={shieldState} customLabel={loading ? 'Verifying securely...' : null} />
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: '30px', fontWeight: 900, color: darkMode ? '#F1F5F9' : '#0F172A', margin: 0, letterSpacing: '-0.5px' }}>
                Kibali<span style={{ color: '#00B4D8' }}>Guard</span>
              </h1>
              <p style={{ color: '#64748B', fontSize: '14px', marginTop: '6px' }}>Your data. Your rules. Your control.</p>
            </div>
          </div>

          {/* RIGHT — form */}
          <div className="animate-slideInRight" style={{ background: darkMode ? '#1E293B' : '#fff', borderRadius: '28px', padding: '48px 44px', boxShadow: '0 8px 48px rgba(0,0,0,0.1)', width: '100%', maxWidth: '440px', border: `1.5px solid ${darkMode ? '#334155' : '#E2E8F0'}` }}>
            <h2 style={{ fontSize: '30px', fontWeight: 900, color: darkMode ? '#F1F5F9' : '#0F172A', marginBottom: '6px', letterSpacing: '-0.5px' }}>Welcome back</h2>
            <p style={{ color: '#64748B', fontSize: '15px', marginBottom: '32px' }}>Sign in to your KibaliGuard account</p>

            {error && (
              <div className="animate-slideUp" style={{ background: '#FEF2F2', color: '#EF233C', border: '1.5px solid #FECACA', borderRadius: '12px', padding: '13px 16px', fontSize: '14px', marginBottom: '24px', fontWeight: 500 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '12px', color: darkMode ? '#CBD5E1' : '#0F172A', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Email or phone number
                </label>
                <input type="text" placeholder="your@email.com or 07XXXXXXXX" value={identifier}
                  onChange={e => { setIdentifier(e.target.value); setPose(e.target.value.length > 0 ? 8 : 1); }}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#FFD60A'}
                  onBlur={e => e.target.style.borderColor = '#E2E8F0'}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '12px', color: darkMode ? '#CBD5E1' : '#0F172A', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => { setPose(9); }}
                    onBlur={() => { setPose(identifier.length > 0 ? 8 : 1); }}
                    style={{ ...inputStyle, paddingRight: '48px' }}
                    onFocusCapture={e => e.target.style.borderColor = '#FFD60A'}
                    onBlurCapture={e => e.target.style.borderColor = '#E2E8F0'}
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)}
                    style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '4px' }}>
                    <EyeIcon show={showPassword} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#FFD60A', cursor: 'pointer' }} />
                  <span style={{ fontSize: '14px', color: '#64748B', fontWeight: 500 }}>Remember me</span>
                </label>
                <Link to="/forgot-password" style={{ color: '#00B4D8', fontSize: '14px', textDecoration: 'none', fontWeight: 700 }}>Forgot password?</Link>
              </div>

              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '16px', background: loading ? '#94A3B8' : '#0F172A', color: '#FFD60A', border: 'none', borderRadius: '14px', fontWeight: 900, fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s', letterSpacing: '0.3px' }}>
                {loading ? (
                  <>
                    <span style={{ width: '18px', height: '18px', border: '3px solid rgba(255,214,10,0.3)', borderTop: '3px solid #FFD60A', borderRadius: '50%', display: 'inline-block', animation: 'kibashield-spin 0.8s linear infinite' }} />
                    Signing you in...
                  </>
                ) : 'Sign In →'}
              </button>
            </form>

            {/* Demo selector */}
            <div style={{ borderTop: `1px solid ${darkMode ? '#334155' : '#E2E8F0'}`, paddingTop: '16px', marginBottom: '16px', position: 'relative' }}>
              <button type="button" onClick={() => setShowDemo(!showDemo)}
                style={{ width: '100%', padding: '12px 16px', background: darkMode ? '#0F172A' : '#F8FAFC', border: `1.5px solid ${darkMode ? '#334155' : '#E2E8F0'}`, borderRadius: '12px', fontWeight: 700, fontSize: '13px', color: '#64748B', cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#FFD60A'}
                onMouseLeave={e => e.currentTarget.style.borderColor = darkMode ? '#334155' : '#E2E8F0'}>
                <span>🎮 Try a demo account</span>
                <span style={{ transform: showDemo ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', fontSize: '12px' }}>▾</span>
              </button>

              {showDemo && (
                <div className="animate-slideUp" style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, background: darkMode ? '#1E293B' : '#fff', border: `1.5px solid ${darkMode ? '#334155' : '#E2E8F0'}`, borderRadius: '16px', padding: '10px', marginBottom: '6px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', zIndex: 10 }}>
                  <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 8px 8px', margin: 0 }}>Select role to auto-fill credentials</p>
                  {demoAccounts.map(a => (
                    <button key={a.label} type="button" onClick={() => handleDemoSelect(a)}
                      style={{ width: '100%', padding: '11px 14px', background: 'transparent', border: 'none', borderRadius: '10px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = a.bg}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{a.icon}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 800, fontSize: '13px', color: darkMode ? '#F1F5F9' : '#0F172A', margin: 0 }}>{a.label}</p>
                        <p style={{ fontSize: '11px', color: '#94A3B8', margin: '2px 0 0', fontFamily: 'Roboto Mono, monospace' }}>{a.identifier}</p>
                      </div>
                      <span style={{ color: a.color, fontWeight: 800, fontSize: '18px' }}>→</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', fontSize: '14px', color: '#64748B' }}>
              No account?{' '}
              <Link to="/register" style={{ color: '#FF6B35', fontWeight: 900, textDecoration: 'none' }}>Register here →</Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;