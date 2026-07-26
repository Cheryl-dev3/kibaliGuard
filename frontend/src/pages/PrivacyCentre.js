import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import KibaShield from '../components/KibaShield';
import {
  IconShieldCheck, IconLock, IconEye, IconXCircle, IconCheckCircle,
  IconClock, IconDownload, IconTrash, IconBuilding, IconPrivacy,
  IconScore, IconAlert, IconArrowRight, IconRefresh
} from '../Icons';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const PrivacyScoreRing = ({ score }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (score / 100) * circumference;
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#FFB703' : '#EF4444';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Attention';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div style={{ position: 'relative', width: '140px', height: '140px' }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="12" />
          <circle cx="70" cy="70" r={radius} fill="none" stroke={color} strokeWidth="12"
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeDashoffset={circumference * 0.25}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1.5s ease-out', filter: `drop-shadow(0 0 8px ${color})` }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '32px', fontWeight: 900, color, fontFamily: 'Roboto Mono, monospace' }}>{score}</span>
          <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>/ 100</span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontWeight: 800, fontSize: '16px', color, margin: 0 }}>{label}</p>
        <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0' }}>Privacy Score</p>
      </div>
    </div>
  );
};

const PrivacyCentre = () => {
  const { token, user, darkMode } = useAuth();
  const [consents, setConsents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pose, setPose] = useState(1);
  const [shieldState, setShieldState] = useState('idle');
  const [activeTab, setActiveTab] = useState('overview');
  const [withdrawing, setWithdrawing] = useState(null);
  const [downloadMsg, setDownloadMsg] = useState('');

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, []);

  const fetchData = async () => {
    try {
      const [cRes, lRes] = await Promise.all([
        axios.get(`${API}/api/consents/my`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/access/my-logs`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setConsents(cRes.data);
      setLogs(lRes.data);
      const activeCount = cRes.data.filter(c => c.status === 'active').length;
      if (activeCount > 0) { setPose(1); setShieldState('idle'); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const active = consents.filter(c => c.status === 'active');
  const expired = consents.filter(c => c.status === 'expired');
  const withdrawn = consents.filter(c => c.status === 'withdrawn');
  const recentViews = logs.filter(l => l.accessGranted).slice(0, 10);
  const uniqueCompanies = [...new Set(recentViews.map(l => l.accessedBy?.fullName).filter(Boolean))];

  // Privacy score calculation
  const calcScore = () => {
    let score = 100;
    if (active.length > 5) score -= 10;
    const soonExpiring = active.filter(c => {
      const days = Math.ceil((new Date(c.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
      return days <= 1;
    });
    score -= soonExpiring.length * 8;
    if (logs.filter(l => !l.accessGranted).length > 3) score -= 5;
    return Math.max(0, Math.min(100, score));
  };

  const privacyScore = calcScore();

  const handleWithdraw = async (id) => {
    if (!window.confirm('Withdraw this consent? The company will immediately lose access to your documents.')) return;
    setWithdrawing(id);
    try {
      await axios.put(`${API}/api/consents/withdraw/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setPose(5); setShieldState('blue');
      fetchData();
      setTimeout(() => { setPose(1); setShieldState('idle'); }, 3000);
    } catch (err) { console.error(err); }
    finally { setWithdrawing(null); }
  };

  const handleDownload = () => {
  const now = new Date().toLocaleString('en-KE');
  const lines = [
    '================================================',
    '         KIBALIGUARD — MY PERSONAL DATA REPORT',
    '================================================',
    `Generated on: ${now}`,
    '',
    'YOUR PROFILE',
    '------------',
    `Full Name   : ${user?.fullName || 'N/A'}`,
    `Email       : ${user?.email || 'N/A'}`,
    `Phone       : ${user?.phone || 'N/A'}`,
    `Applicant ID: ${user?.applicantId || 'Not yet assigned'}`,
    '',
    '================================================',
    `ACTIVE CONSENTS (${active.length})`,
    '================================================',
    ...(active.length === 0
      ? ['No active consents at this time.']
      : active.flatMap((c, i) => [
          `${i + 1}. Purpose    : ${c.purpose}`,
          `   Allowed    : ${c.allowedRole}`,
          `   Documents  : ${c.dataCategories?.join(', ')}`,
          `   Expires    : ${new Date(c.expiresAt).toLocaleString('en-KE')}`,
          ''
        ])),
    '',
    '================================================',
    `EXPIRED CONSENTS (${expired.length})`,
    '================================================',
    ...(expired.length === 0
      ? ['No expired consents.']
      : expired.flatMap((c, i) => [
          `${i + 1}. Purpose  : ${c.purpose}`,
          `   Expired   : ${new Date(c.expiresAt).toLocaleString('en-KE')}`,
          ''
        ])),
    '',
    '================================================',
    `ACCESS HISTORY (${logs.length} total attempts)`,
    '================================================',
    `Granted : ${logs.filter(l => l.accessGranted).length}`,
    `Denied  : ${logs.filter(l => !l.accessGranted).length}`,
    '',
    ...(logs.length === 0
      ? ['No access attempts recorded yet.']
      : logs.flatMap((l, i) => [
          `${i + 1}. Person  : ${l.accessedBy?.fullName || 'Unknown'}`,
          `   Purpose : ${l.purpose}`,
          `   Result  : ${l.accessGranted ? 'GRANTED' : 'DENIED'}`,
          `   Date    : ${new Date(l.createdAt).toLocaleString('en-KE')}`,
          ''
        ])),
    '',
    '================================================',
    'KibaliGuard — Your data. Your rules. Your control.',
    'Kenya Data Protection Act 2019 Compliant',
    'Cheryl Kreativ Studio — Nairobi, Kenya',
    '================================================',
  ];

  const content = lines.join('\n');
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `KibaliGuard_DataReport_${user?.fullName?.replace(/\s+/g, '_')}_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  setDownloadMsg('Your data report has been downloaded. You can open it on any phone or computer.');
  setTimeout(() => setDownloadMsg(''), 5000);
};

  const bg = darkMode ? '#0F172A' : '#F8FAFC';
  const cardBg = darkMode ? '#1E293B' : '#fff';
  const border = darkMode ? '#334155' : '#E2E8F0';
  const text = darkMode ? '#F1F5F9' : '#0F172A';
  const muted = '#64748B';

  const tabStyle = (t) => ({
    padding: '10px 20px', borderRadius: '10px', border: 'none', fontWeight: 700, fontSize: '13px',
    cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s', whiteSpace: 'nowrap',
    background: activeTab === t ? '#0F172A' : 'transparent',
    color: activeTab === t ? '#FFD60A' : muted
  });

  const privacyRecommendations = [];
  if (active.length > 3) privacyRecommendations.push({ icon: IconAlert, color: '#FFB703', title: 'Review your active consents', desc: `You have ${active.length} active consents. Review any that are no longer needed and withdraw them to improve your privacy score.` });
  const expiring = active.filter(c => Math.ceil((new Date(c.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) <= 2);
  if (expiring.length > 0) privacyRecommendations.push({ icon: IconClock, color: '#EF4444', title: 'Consents expiring soon', desc: `${expiring.length} consent${expiring.length > 1 ? 's are' : ' is'} expiring within 48 hours. Decide whether to renew or let them expire.` });
  if (privacyRecommendations.length === 0) privacyRecommendations.push({ icon: IconCheckCircle, color: '#10B981', title: 'Your privacy looks great', desc: 'No immediate action needed. Keep checking your access logs regularly to stay informed.' });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: bg }}>
      <Navbar />
      <div style={{ flex: 1, padding: '32px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <IconPrivacy color="#8B5CF6" size={28} />
              <h1 style={{ fontSize: '28px', fontWeight: 900, color: text, margin: 0, letterSpacing: '-0.5px' }}>Privacy Centre</h1>
            </div>
            <p style={{ color: muted, fontSize: '15px', margin: 0 }}>Full transparency over your personal data — who has it, for how long, and why</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={fetchData} style={{ padding: '10px 16px', background: darkMode ? '#1E293B' : '#fff', border: `1.5px solid ${border}`, borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px', color: text }}>
              <IconRefresh color={muted} size={15} />
              Refresh
            </button>
            <button onClick={handleDownload} style={{ padding: '10px 18px', background: '#8B5CF6', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '13px' }}>
              <IconDownload color="#fff" size={15} />
              Download My Data
            </button>
          </div>
        </div>

        {downloadMsg && (
          <div className="animate-slideUp" style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #6EE7B7', borderRadius: '12px', padding: '12px 18px', marginBottom: '20px', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconCheckCircle color="#10B981" size={18} /> {downloadMsg}
          </div>
        )}

        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* LEFT — Kiba + Score */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', minWidth: '200px' }}>
            <KibaShield pose={pose} shieldState={shieldState} />
            {!loading && <PrivacyScoreRing score={privacyScore} />}

            {/* Stat pills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              {[
                { label: 'Active Consents', val: active.length, color: '#10B981', Icon: IconCheckCircle },
                { label: 'Expired', val: expired.length, color: '#EF4444', Icon: IconXCircle },
                { label: 'Withdrawn', val: withdrawn.length, color: '#8B5CF6', Icon: IconLock },
                { label: 'Companies with Access', val: uniqueCompanies.length, color: '#00B4D8', Icon: IconBuilding },
              ].map(s => (
                <div key={s.label} style={{ background: cardBg, borderRadius: '12px', padding: '10px 14px', border: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <s.Icon color={s.color} size={15} />
                    <span style={{ fontSize: '12px', color: muted, fontWeight: 600 }}>{s.label}</span>
                  </div>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: s.color, fontFamily: 'Roboto Mono, monospace' }}>{s.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — tabs */}
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap', background: cardBg, borderRadius: '14px', padding: '6px', border: `1px solid ${border}` }}>
              {[
                ['overview', 'Overview'],
                ['active', `Active (${active.length})`],
                ['expired', `Expired (${expired.length})`],
                ['withdrawn', `Withdrawn (${withdrawn.length})`],
                ['companies', 'Companies'],
                ['recommendations', 'Recommendations']
              ].map(([key, label]) => (
                <button key={key} style={tabStyle(key)} onClick={() => setActiveTab(key)}>{label}</button>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px', color: muted }}>Loading your privacy data...</div>
            ) : (
              <>
                {activeTab === 'overview' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Privacy summary card */}
                    <div style={{ background: cardBg, borderRadius: '16px', padding: '24px', border: `1px solid ${border}` }}>
                      <h3 style={{ fontWeight: 800, fontSize: '16px', color: text, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IconScore color="#8B5CF6" size={18} />
                        Your Privacy Overview
                      </h3>
                      <p style={{ fontSize: '14px', color: muted, lineHeight: 1.8, marginBottom: '16px' }}>
                        KibaliGuard gives you complete transparency over your personal data. Every consent you give is time-limited and purpose-specific. You can withdraw any consent at any time and the company will immediately lose access to your documents.
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                        {[
                          { icon: IconShieldCheck, color: '#10B981', bg: '#ECFDF5', title: 'Purpose Limitation', desc: 'Companies can only use your data for the exact reason you approved.' },
                          { icon: IconClock, color: '#00B4D8', bg: '#E0F9FF', title: 'Time-Limited Access', desc: 'All consents expire automatically. No permanent data retention.' },
                          { icon: IconEye, color: '#FFB703', bg: '#FFFBEB', title: 'Full Visibility', desc: 'Every access attempt is logged. Nothing happens without you knowing.' },
                          { icon: IconLock, color: '#8B5CF6', bg: '#F5F3FF', title: 'Instant Withdrawal', desc: 'Withdraw any consent and the company loses access immediately.' },
                        ].map(f => (
                          <div key={f.title} style={{ background: f.bg, borderRadius: '12px', padding: '16px' }}>
                            <f.icon color={f.color} size={20} />
                            <p style={{ fontWeight: 700, fontSize: '13px', color: text, margin: '10px 0 6px' }}>{f.title}</p>
                            <p style={{ fontSize: '12px', color: muted, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent views */}
                    <div style={{ background: cardBg, borderRadius: '16px', padding: '24px', border: `1px solid ${border}` }}>
                      <h3 style={{ fontWeight: 800, fontSize: '16px', color: text, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IconEye color="#FFB703" size={18} />
                        Recent Document Views
                      </h3>
                      {recentViews.length === 0 ? (
                        <p style={{ color: muted, fontSize: '14px' }}>No documents have been accessed yet. This is a good sign.</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {recentViews.slice(0, 5).map((l, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: darkMode ? '#0F172A' : '#F8FAFC', borderRadius: '10px', gap: '12px', flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <IconEye color="#FFB703" size={15} />
                                <div>
                                  <p style={{ fontWeight: 700, fontSize: '13px', color: text, margin: 0 }}>{l.accessedBy?.fullName}</p>
                                  <p style={{ fontSize: '11px', color: muted, margin: '2px 0 0' }}>{l.purpose}</p>
                                </div>
                              </div>
                              <span style={{ fontSize: '11px', color: muted, fontFamily: 'Roboto Mono, monospace' }}>{new Date(l.createdAt).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'active' && (
                  <div style={{ background: cardBg, borderRadius: '16px', padding: '24px', border: `1px solid ${border}` }}>
                    <h3 style={{ fontWeight: 800, fontSize: '16px', color: text, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IconCheckCircle color="#10B981" size={18} />
                      Active Consents ({active.length})
                    </h3>
                    {active.length === 0 ? (
                      <p style={{ color: muted, fontSize: '14px' }}>No active consents. When you apply for jobs and set consent rules, they will appear here.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {active.map(c => {
                          const days = Math.ceil((new Date(c.expiresAt) - new Date()) / (1000 * 60 * 60 * 24));
                          const urgent = days <= 1;
                          return (
                            <div key={c._id} style={{ background: darkMode ? '#0F172A' : '#F8FAFC', borderRadius: '12px', padding: '16px', border: `1.5px solid ${urgent ? '#EF4444' : border}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                                <div>
                                  <p style={{ fontWeight: 800, fontSize: '14px', color: text, margin: 0 }}>{c.purpose}</p>
                                  <p style={{ fontSize: '12px', color: muted, margin: '4px 0 0' }}>Accessible by: {c.allowedRole}</p>
                                </div>
                                <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: urgent ? '#FEE2E2' : '#DCFCE7', color: urgent ? '#991B1B' : '#065F46' }}>
                                  {urgent ? 'Expiring today' : `${days} day${days !== 1 ? 's' : ''} left`}
                                </span>
                              </div>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                {c.dataCategories?.map(d => (
                                  <span key={d} style={{ background: '#E0F9FF', color: '#0369A1', fontSize: '11px', fontWeight: 600, padding: '3px 9px', borderRadius: '999px' }}>{d}</span>
                                ))}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                <span style={{ fontSize: '11px', color: muted, fontFamily: 'Roboto Mono, monospace' }}>Expires: {new Date(c.expiresAt).toLocaleString()}</span>
                                <button onClick={() => handleWithdraw(c._id)} disabled={withdrawing === c._id}
                                  style={{ padding: '8px 16px', background: '#FEF2F2', color: '#EF4444', border: '1.5px solid #EF4444', borderRadius: '10px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <IconXCircle color="#EF4444" size={13} />
                                  {withdrawing === c._id ? 'Withdrawing...' : 'Stop Sharing'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'expired' && (
                  <div style={{ background: cardBg, borderRadius: '16px', padding: '24px', border: `1px solid ${border}` }}>
                    <h3 style={{ fontWeight: 800, fontSize: '16px', color: text, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IconXCircle color="#EF4444" size={18} />
                      Expired Consents ({expired.length})
                    </h3>
                    <p style={{ fontSize: '13px', color: muted, marginBottom: '16px' }}>These consents have passed their time limit. Companies can no longer access these documents.</p>
                    {expired.length === 0 ? (
                      <p style={{ color: muted, fontSize: '14px' }}>No expired consents yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {expired.map(c => (
                          <div key={c._id} style={{ background: darkMode ? '#0F172A' : '#FEF2F2', borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <div>
                              <p style={{ fontWeight: 700, fontSize: '13px', color: text, margin: 0 }}>{c.purpose}</p>
                              <p style={{ fontSize: '11px', color: muted, margin: '3px 0 0', fontFamily: 'Roboto Mono, monospace' }}>Expired: {new Date(c.expiresAt).toLocaleDateString()}</p>
                            </div>
                            <span style={{ padding: '3px 12px', borderRadius: '999px', background: '#FEE2E2', color: '#991B1B', fontSize: '11px', fontWeight: 700 }}>EXPIRED</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'withdrawn' && (
                  <div style={{ background: cardBg, borderRadius: '16px', padding: '24px', border: `1px solid ${border}` }}>
                    <h3 style={{ fontWeight: 800, fontSize: '16px', color: text, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IconLock color="#8B5CF6" size={18} />
                      Withdrawn Consents ({withdrawn.length})
                    </h3>
                    <p style={{ fontSize: '13px', color: muted, marginBottom: '16px' }}>You manually withdrew these. Companies lost access immediately when you withdrew.</p>
                    {withdrawn.length === 0 ? (
                      <p style={{ color: muted, fontSize: '14px' }}>No withdrawn consents. Use the Stop Sharing button on any active consent to withdraw it.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {withdrawn.map(c => (
                          <div key={c._id} style={{ background: darkMode ? '#0F172A' : '#F5F3FF', borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <div>
                              <p style={{ fontWeight: 700, fontSize: '13px', color: text, margin: 0 }}>{c.purpose}</p>
                              <p style={{ fontSize: '11px', color: muted, margin: '3px 0 0' }}>Role: {c.allowedRole}</p>
                            </div>
                            <span style={{ padding: '3px 12px', borderRadius: '999px', background: '#EDE9FE', color: '#6D28D9', fontSize: '11px', fontWeight: 700 }}>WITHDRAWN</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'companies' && (
                  <div style={{ background: cardBg, borderRadius: '16px', padding: '24px', border: `1px solid ${border}` }}>
                    <h3 style={{ fontWeight: 800, fontSize: '16px', color: text, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IconBuilding color="#00B4D8" size={18} />
                      Companies Currently Holding Access ({uniqueCompanies.length})
                    </h3>
                    <p style={{ fontSize: '13px', color: muted, marginBottom: '20px' }}>
                      These are the people who have been granted access to at least one of your documents. Every access they made is logged below.
                    </p>
                    {uniqueCompanies.length === 0 ? (
                      <p style={{ color: muted, fontSize: '14px' }}>No companies have accessed your documents yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {uniqueCompanies.map(name => {
                          const compLogs = recentViews.filter(l => l.accessedBy?.fullName === name);
                          return (
                            <div key={name} style={{ background: darkMode ? '#0F172A' : '#F0F9FF', borderRadius: '12px', padding: '16px', border: `1px solid ${border}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#00B4D8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <IconBuilding color="#fff" size={18} />
                                  </div>
                                  <div>
                                    <p style={{ fontWeight: 800, fontSize: '14px', color: text, margin: 0 }}>{name}</p>
                                    <p style={{ fontSize: '12px', color: muted, margin: '2px 0 0' }}>{compLogs.length} access{compLogs.length !== 1 ? 'es' : ''} on record</p>
                                  </div>
                                </div>
                                <button onClick={() => {
                                  const consentToWithdraw = active.find(c => c.allowedRole === 'staff');
                                  if (consentToWithdraw) handleWithdraw(consentToWithdraw._id);
                                }}
                                  style={{ padding: '7px 14px', background: 'transparent', color: '#EF4444', border: '1.5px solid #EF4444', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                                  Stop Sharing
                                </button>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {compLogs.slice(0, 3).map((l, i) => (
                                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: muted, padding: '4px 0', borderTop: `1px solid ${border}` }}>
                                    <span>Accessed for: {l.purpose}</span>
                                    <span style={{ fontFamily: 'Roboto Mono, monospace' }}>{new Date(l.createdAt).toLocaleDateString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'recommendations' && (
                  <div style={{ background: cardBg, borderRadius: '16px', padding: '24px', border: `1px solid ${border}` }}>
                    <h3 style={{ fontWeight: 800, fontSize: '16px', color: text, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IconScore color="#8B5CF6" size={18} />
                      Privacy Recommendations
                    </h3>
                    <p style={{ fontSize: '13px', color: muted, marginBottom: '20px' }}>
                      Based on your current consent settings and access history, here is what Kiba recommends.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {privacyRecommendations.map((r, i) => (
                        <div key={i} style={{ background: darkMode ? '#0F172A' : '#F8FAFC', borderRadius: '12px', padding: '16px', border: `1.5px solid ${r.color}30`, display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${r.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <r.icon color={r.color} size={20} />
                          </div>
                          <div>
                            <p style={{ fontWeight: 800, fontSize: '14px', color: text, margin: 0 }}>{r.title}</p>
                            <p style={{ fontSize: '13px', color: muted, margin: '6px 0 0', lineHeight: 1.6 }}>{r.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: '24px', background: '#FEF9C3', borderRadius: '14px', padding: '18px', border: '1px solid #FDE68A' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <IconTrash color="#92400E" size={18} />
                        <p style={{ fontWeight: 800, fontSize: '14px', color: '#92400E', margin: 0 }}>Delete My Account</p>
                      </div>
                      <p style={{ fontSize: '13px', color: '#78350F', lineHeight: 1.6, marginBottom: '14px' }}>
                        Deleting your account will permanently remove all your data from KibaliGuard including your profile, applications, documents and consent records. This cannot be undone.
                      </p>
                      <button style={{ padding: '10px 20px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '8px' }}
                        onClick={() => alert('Please contact KibaliGuard support to delete your account. This is a safety measure to prevent accidental deletion.')}>
                        <IconTrash color="#fff" size={14} />
                        Request Account Deletion
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyCentre;