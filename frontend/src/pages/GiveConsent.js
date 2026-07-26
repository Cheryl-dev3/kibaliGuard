import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import KibaShield from '../components/KibaShield';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const dataOptions = [
  'National ID', 'CV or Resume', 'Certificate of Good Conduct',
  'Academic Certificate', 'Passport Photo', 'Work Permit', 'References Letter'
];

const GiveConsent = () => {
  const { token, darkMode } = useAuth();
  const [allowedRole, setAllowedRole] = useState('staff');
  const [purpose, setPurpose] = useState('');
  const [dataCategories, setDataCategories] = useState([]);
  const [duration, setDuration] = useState(7);
  const [durationUnit, setDurationUnit] = useState('days');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pose, setPose] = useState(1);
  const [shieldState, setShieldState] = useState('idle');

  const toggleCategory = (cat) => {
    setDataCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!purpose || dataCategories.length === 0) {
      setError('Please enter a purpose and select at least one data category');
      setPose(3);
      setShieldState('warning');
      setTimeout(() => { setPose(1); setShieldState('idle'); }, 2000);
      return;
    }
    setLoading(true);
    setPose(7);
    try {
      await axios.post(`${API}/api/consents`, {
        allowedRole, purpose, dataCategories, duration, durationUnit
      }, { headers: { Authorization: `Bearer ${token}` } });

      setMessage('Consent created successfully. You can withdraw it at any time from your dashboard.');
      setPose(2);
      setShieldState('success');
      setPurpose('');
      setDataCategories([]);
      setDuration(7);
      setTimeout(() => { setPose(1); setShieldState('idle'); }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
      setPose(4);
      setShieldState('danger');
      setTimeout(() => { setPose(1); setShieldState('idle'); }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '12px 14px', border: '2px solid #E2E8F0', borderRadius: '10px', fontSize: '14px', fontFamily: 'Inter, sans-serif', background: darkMode ? '#0F172A' : '#fff', color: darkMode ? '#F1F5F9' : '#1E293B', outline: 'none', boxSizing: 'border-box' };
  const card = { background: darkMode ? '#1E293B' : '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 4px 24px rgba(30,58,95,0.08)' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: darkMode ? '#0F172A' : '#F8FAFC' }}>
      <Navbar />
      <div style={{ flex: 1, padding: '32px 24px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: darkMode ? '#F1F5F9' : '#1E3A5F', marginBottom: '4px' }}>Give Consent</h1>
        <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '28px' }}>Create a custom consent rule for specific data categories outside of a job application</p>

        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <KibaShield pose={pose} shieldState={shieldState} />
          </div>

          <div style={{ flex: 1, minWidth: '280px' }}>
            {message && <div style={{ background: '#F0FDF4', color: '#10B981', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '13px 16px', fontSize: '14px', marginBottom: '20px' }}>{message}</div>}
            {error && <div style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: '12px', padding: '13px 16px', fontSize: '14px', marginBottom: '20px' }}>{error}</div>}

            <div style={card}>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>Who can access this data</label>
                  <select style={inputStyle} value={allowedRole} onChange={(e) => setAllowedRole(e.target.value)}>
                    <option value="staff">HR Officer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>Purpose</label>
                  <input style={inputStyle} type="text" placeholder="e.g. Background verification" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '10px', textTransform: 'uppercase' }}>Data categories</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {dataOptions.map(opt => (
                      <button key={opt} type="button" onClick={() => toggleCategory(opt)}
                        style={{ padding: '8px 14px', borderRadius: '999px', border: '2px solid', borderColor: dataCategories.includes(opt) ? '#0EA5E9' : '#E2E8F0', background: dataCategories.includes(opt) ? '#E0F2FE' : 'transparent', color: dataCategories.includes(opt) ? '#075985' : '#64748B', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                        {dataCategories.includes(opt) ? '✓ ' : ''}{opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>Duration</label>
                    <input style={inputStyle} type="number" min="1" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '8px', textTransform: 'uppercase' }}>Unit</label>
                    <select style={inputStyle} value={durationUnit} onChange={(e) => setDurationUnit(e.target.value)}>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                    </select>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  style={{ width: '100%', padding: '14px', background: loading ? '#0EA5E9' : '#1E3A5F', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  {loading ? 'Creating consent...' : 'Create Consent'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default GiveConsent;
