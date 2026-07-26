import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import KibaShield from '../components/KibaShield';
import Footer from '../components/Footer';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ForgotPassword = () => {
  const { darkMode } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [pose, setPose] = useState(1);
  const [shieldState, setShieldState] = useState('idle');

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    border: '2px solid #E2E8F0',
    borderRadius: '12px',
    fontSize: '15px',
    fontFamily: 'Inter, sans-serif',
    background: darkMode ? '#0F172A' : '#fff',
    color: darkMode ? '#F1F5F9' : '#1E293B',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);
    setPose(7);
    try {
      const res = await axios.post(`${API}/api/auth/forgot-password`, { email });
      setMessage(res.data.message);
      setPose(8);
      setShieldState('idle');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
      setPose(3);
      setShieldState('warning');
      setTimeout(() => { setPose(1); setShieldState('idle'); }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp) {
      setError('Please enter the reset code sent to your email');
      return;
    }
    setLoading(true);
    setPose(7);
    try {
      await axios.post(`${API}/api/auth/verify-otp`, { email, otp });
      setPose(2);
      setShieldState('success');
      setStep(3);
      setTimeout(() => { setShieldState('idle'); }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired code. Please try again.');
      setPose(4);
      setShieldState('danger');
      setTimeout(() => { setPose(8); setShieldState('idle'); }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    setLoading(true);
    setPose(7);
    try {
      await axios.post(`${API}/api/auth/reset-password`, { email, otp, newPassword });
      setPose(2);
      setShieldState('success');
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#10B981', '#0EA5E9'] });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
      setPose(4);
      setShieldState('danger');
      setTimeout(() => { setPose(8); setShieldState('idle'); }, 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: darkMode ? '#0F172A' : '#F8FAFC' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <div style={{ display: 'flex', gap: '56px', alignItems: 'center', width: '100%', maxWidth: '920px', flexWrap: 'wrap', justifyContent: 'center' }}>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <KibaShield pose={pose} shieldState={shieldState} customLabel={loading ? 'Processing securely...' : null} />
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: '30px', fontWeight: 800, color: darkMode ? '#F1F5F9' : '#1E3A5F', margin: 0 }}>KibaliGuard</h1>
              <p style={{ color: '#64748B', fontSize: '14px', marginTop: '6px' }}>Your data. Your rules. Your control.</p>
            </div>
          </div>

          <div style={{ background: darkMode ? '#1E293B' : '#ffffff', borderRadius: '24px', padding: '44px 40px', boxShadow: '0 8px 48px rgba(30,58,95,0.13)', width: '100%', maxWidth: '420px' }}>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
              {[1, 2, 3].map(s => (
                <div key={s} style={{ flex: 1, height: '4px', borderRadius: '999px', background: step >= s ? '#0EA5E9' : '#E2E8F0', transition: 'background 0.3s' }} />
              ))}
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: '12px', padding: '13px 16px', fontSize: '14px', fontWeight: 500, marginBottom: '20px' }}>
                {error}
              </div>
            )}
            {message && step === 2 && (
              <div style={{ background: '#F0FDF4', color: '#10B981', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '13px 16px', fontSize: '14px', fontWeight: 500, marginBottom: '20px' }}>
                {message}
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleSendCode}>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: darkMode ? '#F1F5F9' : '#1E3A5F', marginBottom: '6px' }}>Reset your password</h2>
                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '28px' }}>Enter your email and we will send you a reset code</p>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: darkMode ? '#CBD5E1' : '#1E293B', marginBottom: '8px' }}>Email address</label>
                  <input type="email" placeholder="your@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', background: loading ? '#0EA5E9' : '#1E3A5F', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  {loading ? 'Sending code...' : 'Send Reset Code'}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyOtp}>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: darkMode ? '#F1F5F9' : '#1E3A5F', marginBottom: '6px' }}>Enter reset code</h2>
                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '28px' }}>Check your email for the 6-digit code we sent you</p>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: darkMode ? '#CBD5E1' : '#1E293B', marginBottom: '8px' }}>Reset code</label>
                  <input type="text" placeholder="123456" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} style={{ ...inputStyle, letterSpacing: '6px', textAlign: 'center', fontWeight: 700, fontSize: '20px' }} />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', background: loading ? '#0EA5E9' : '#1E3A5F', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', marginBottom: '14px' }}>
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
                <button type="button" onClick={() => setStep(1)} style={{ width: '100%', padding: '10px', background: 'none', border: 'none', color: '#0EA5E9', fontWeight: 600, fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  Use a different email
                </button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleResetPassword}>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: darkMode ? '#F1F5F9' : '#1E3A5F', marginBottom: '6px' }}>Create new password</h2>
                <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '28px' }}>Choose a strong new password for your account</p>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: darkMode ? '#CBD5E1' : '#1E293B', marginBottom: '8px' }}>New password</label>
                  <input type="password" placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle} />
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '14px', color: darkMode ? '#CBD5E1' : '#1E293B', marginBottom: '8px' }}>Confirm password</label>
                  <input type="password" placeholder="Re-enter new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', background: loading ? '#0EA5E9' : '#1E3A5F', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}

            <div style={{ textAlign: 'center', fontSize: '14px', color: '#64748B', marginTop: '20px' }}>
              <Link to="/login" style={{ color: '#0EA5E9', fontWeight: 700, textDecoration: 'none' }}>
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
