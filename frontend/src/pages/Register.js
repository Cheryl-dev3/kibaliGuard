import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import KibaShield from '../components/KibaShield';
import Footer from '../components/Footer';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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

const getStrength = (pwd) => {
  if (!pwd) return null;
  if (pwd.length < 6) return { label: 'Too short', color: '#EF233C', pct: 20 };
  if (pwd.length < 8) return { label: 'Weak', color: '#FFB703', pct: 45 };
  if (!/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd)) return { label: 'Fair', color: '#FFB703', pct: 65 };
  return { label: 'Strong 💪', color: '#06D6A0', pct: 100 };
};

const Register = () => {
  const { login, darkMode } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pose, setPose] = useState(1);
  const [shieldState, setShieldState] = useState('idle');

  const strength = getStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!fullName || !identifier || !password) {
      setError('Please fill in all fields');
      setPose(3); setShieldState('warning');
      setTimeout(() => { setPose(1); setShieldState('idle'); }, 2000);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setPose(3); setShieldState('warning');
      setTimeout(() => { setPose(1); setShieldState('idle'); }, 2000);
      return;
    }
    setLoading(true); setPose(7);
    try {
      const res = await axios.post(`${API}/api/auth/register`, { fullName, identifier, password, role });
      setPose(2); setShieldState('success');
      confetti({ particleCount: 300, spread: 130, origin: { y: 0.5 }, colors: ['#FFD60A', '#FF6B35', '#06D6A0', '#00B4D8', '#EC4899'] });
      setTimeout(() => {
        login(res.data.user, res.data.token);
        const r = res.data.user.role;
        navigate(r === 'admin' ? '/admin' : r === 'staff' ? '/staff' : '/dashboard');
      }, 1800);
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

          {/* LEFT — Kiba only, clean */}
          <div className="animate-slideInLeft" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <KibaShield pose={pose} shieldState={shieldState} customLabel={loading ? 'Creating your account...' : null} />
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: '30px', fontWeight: 900, color: darkMode ? '#F1F5F9' : '#0F172A', margin: 0, letterSpacing: '-0.5px' }}>
                Kibali<span style={{ color: '#00B4D8' }}>Guard</span>
              </h1>
              <p style={{ color: '#64748B', fontSize: '14px', marginTop: '6px' }}>Your data. Your rules. Your control.</p>
            </div>
            <div style={{ background: darkMode ? '#1E293B' : '#fff', borderRadius: '16px', padding: '16px 20px', maxWidth: '220px', border: `1.5px solid ${darkMode ? '#334155' : '#E2E8F0'}`, textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.6, margin: 0 }}>
                🛡️ Your documents stay under your control. You decide who sees what and for how long.
              </p>
            </div>
          </div>

          {/* RIGHT — form */}
          <div className="animate-slideInRight" style={{ background: darkMode ? '#1E293B' : '#fff', borderRadius: '28px', padding: '48px 44px', boxShadow: '0 8px 48px rgba(0,0,0,0.1)', width: '100%', maxWidth: '440px', border: `1.5px solid ${darkMode ? '#334155' : '#E2E8F0'}` }}>
            <h2 style={{ fontSize: '30px', fontWeight: 900, color: darkMode ? '#F1F5F9' : '#0F172A', marginBottom: '6px', letterSpacing: '-0.5px' }}>Create account</h2>
            <p style={{ color: '#64748B', fontSize: '15px', marginBottom: '32px' }}>Join KibaliGuard — your data stays yours</p>

            {error && (
              <div className="animate-slideUp" style={{ background: '#FEF2F2', color: '#EF233C', border: '1.5px solid #FECACA', borderRadius: '12px', padding: '13px 16px', fontSize: '14px', marginBottom: '24px', fontWeight: 500 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {[
                { label: 'Full name', value: fullName, onChange: e => { setFullName(e.target.value); if (e.target.value.length > 0) setPose(8); else setPose(1); }, type: 'text', placeholder: 'Enter your full name' },
                { label: 'Email or phone number', value: identifier, onChange: e => { setIdentifier(e.target.value); if (e.target.value.length > 0) setPose(8); else setPose(1); }, type: 'text', placeholder: 'your@email.com or 07XXXXXXXX' },
              ].map(field => (
                <div key={field.label} style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: 800, fontSize: '12px', color: darkMode ? '#CBD5E1' : '#0F172A', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{field.label}</label>
                  <input type={field.type} placeholder={field.placeholder} value={field.value} onChange={field.onChange} style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#FFD60A'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                </div>
              ))}

              <div style={{ marginBottom: '8px' }}>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '12px', color: darkMode ? '#CBD5E1' : '#0F172A', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} placeholder="Create a strong password" value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setPose(9)}
                    onBlur={() => setPose(identifier.length > 0 ? 8 : 1)}
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

              {strength && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#64748B' }}>Password strength</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: strength.color }}>{strength.label}</span>
                  </div>
                  <div style={{ height: '5px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${strength.pct}%`, background: strength.color, borderRadius: '999px', transition: 'all 0.3s' }} />
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '28px' }}>
                <label style={{ display: 'block', fontWeight: 800, fontSize: '12px', color: darkMode ? '#CBD5E1' : '#0F172A', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Account type</label>
                <select value={role} onChange={e => setRole(e.target.value)} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#FFD60A'} onBlur={e => e.target.style.borderColor = '#E2E8F0'}>
                  <option value="customer">🎯 Job Applicant / Customer</option>
                  <option value="staff">👔 HR Staff / Recruiter</option>
                  <option value="admin">⚙️ Administrator</option>
                </select>
              </div>

              <button type="submit" disabled={loading}
                style={{ width: '100%', padding: '16px', background: loading ? '#94A3B8' : '#0F172A', color: '#FFD60A', border: 'none', borderRadius: '14px', fontWeight: 900, fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s' }}>
                {loading ? (
                  <>
                    <span style={{ width: '18px', height: '18px', border: '3px solid rgba(255,214,10,0.3)', borderTop: '3px solid #FFD60A', borderRadius: '50%', display: 'inline-block', animation: 'kibashield-spin 0.8s linear infinite' }} />
                    Creating your account...
                  </>
                ) : 'Create Account →'}
              </button>
            </form>

            <div style={{ textAlign: 'center', fontSize: '14px', color: '#64748B' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#FF6B35', fontWeight: 900, textDecoration: 'none' }}>Sign in →</Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Register;