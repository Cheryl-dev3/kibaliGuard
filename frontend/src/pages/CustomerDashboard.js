import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import KibaShield from '../components/KibaShield';
import {
  IconBriefcaseFull,
  IconLock,
  IconEye,
  IconPeople,
  IconRobot,
  IconBell,
  IconCheck,
  IconX,
  IconAlert,
  IconClock,
  IconCheckCircle,
  IconXCircle,
  IconPrivacy,
  IconArrowRight,
  IconTimeline,
  IconShieldCheck
} from '../Icons';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const poseForType = {
  application_received: 8,
  application_under_review: 7,
  application_shortlisted: 8,
  application_hired: 2,
  application_rejected: 3,
  consent_expiring: 6,
  consent_expired: 3,
  document_accessed: 3,
  access_denied_attempt: 4,
  third_party_request: 3,
  talent_pool_match: 8,
  job_closing_soon: 6,
  weekly_summary: 8,
  new_application: 8,
  new_registration: 8
};

const CustomerDashboard = () => {
  const { user, token, darkMode } = useAuth();
  const navigate = useNavigate();
  const [consents, setConsents] = useState([]);
  const [expiring, setExpiring] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kibaPose, setKibaPose] = useState(1);
  const [kibaShield, setKibaShield] = useState('idle');
  const [withdrawing, setWithdrawing] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const [applicationsRes, notificationsRes] = await Promise.all([
        axios.get(`${API}/api/applications/my`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/notifications/my`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const apps = applicationsRes.data;
      setApplications(apps);
      setNotifications(notificationsRes.data);

      const unread = notificationsRes.data.filter(n => !n.isRead).length;
      setUnreadCount(unread);

      // ── Build consents from application consentRules ──────────────────────
      const now = new Date();
      const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const allConsents = [];

      apps.forEach(app => {
        if (app.consentRules && app.consentRules.length > 0) {
          app.consentRules.forEach(rule => {
            allConsents.push({
              _id:           rule._id,
              applicationId: app._id,
              purpose:       rule.purpose,
              allowedRole:   rule.allowedRole,
              documentName:  rule.documentName,
              dataCategories:[rule.documentName],
              status:        rule.status,
              expiresAt:     rule.expiresAt,
              grantedAt:     rule.grantedAt,
              jobTitle:      app.job?.title,
              companyName:   app.company?.name,
            });
          });
        }
      });

      setConsents(allConsents);

      const expiringSoon = allConsents.filter(c =>
        c.status === 'active' &&
        new Date(c.expiresAt) > now &&
        new Date(c.expiresAt) <= next24h
      );
      setExpiring(expiringSoon);

      // ── Set Kiba pose based on data ───────────────────────────────────────
      if (expiringSoon.length > 0) {
        setKibaPose(6);
        setKibaShield('warning');
      } else if (unread > 0) {
        const latest = notificationsRes.data.find(n => !n.isRead);
        if (latest) {
          setKibaPose(poseForType[latest.type] || 1);
          if (latest.type === 'application_hired') {
            confetti({
              particleCount: 200,
              spread: 100,
              origin: { y: 0.5 },
              colors: ['#10B981', '#00B4D8', '#FFD60A']
            });
            setKibaShield('success');
          }
        }
      } else {
        setKibaPose(1);
        setKibaShield('idle');
      }

    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Withdraw consent ──────────────────────────────────────────────────────
  const handleWithdraw = async (consentId, applicationId, documentName) => {
    if (!window.confirm('Are you sure you want to stop sharing? The company will immediately lose access to this document.')) return;
    setWithdrawing(consentId);
    try {
      await axios.put(
        `${API}/api/applications/withdraw-consent/${applicationId}/${encodeURIComponent(documentName)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setKibaPose(5);
      setKibaShield('blue');
      fetchData();
      setTimeout(() => { setKibaPose(1); setKibaShield('idle'); }, 3000);
    } catch (err) {
      console.error('Withdraw error:', err);
    } finally {
      setWithdrawing(null);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.put(`${API}/api/notifications/mark-all-read`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const markRead = async (id) => {
    try {
      await axios.put(`${API}/api/notifications/mark-read/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) { console.error(err); }
  };

  // ── Derived consent lists ─────────────────────────────────────────────────
  const now = new Date();
  const activeConsents  = consents.filter(c => c.status === 'active' && new Date(c.expiresAt) > now);
  const expiredConsents = consents.filter(c => c.status === 'expired' || (c.status === 'active' && new Date(c.expiresAt) <= now));
  const withdrawnConsents = consents.filter(c => c.status === 'withdrawn');

  const statusConfig = {
    received:     { bg: '#E0F2FE', color: '#075985',  label: 'Received',     Icon: IconCheck },
    under_review: { bg: '#FEF3C7', color: '#92400E',  label: 'Under Review', Icon: IconClock },
    shortlisted:  { bg: '#F3E8FF', color: '#6B21A8',  label: 'Shortlisted',  Icon: IconCheckCircle },
    hired:        { bg: '#D1FAE5', color: '#065F46',  label: 'Hired',        Icon: IconCheckCircle },
    rejected:     { bg: '#FEE2E2', color: '#991B1B',  label: 'Not Selected', Icon: IconXCircle }
  };

  const notifIconForType = (type) => {
    if (type === 'application_hired')       return <IconCheckCircle color="#10B981" size={20} />;
    if (type === 'application_rejected')    return <IconXCircle color="#EF4444" size={20} />;
    if (type === 'application_shortlisted') return <IconCheck color="#8B5CF6" size={20} />;
    if (type === 'consent_expiring' || type === 'job_closing_soon') return <IconClock color="#FFB703" size={20} />;
    if (type === 'document_accessed')       return <IconEye color="#FFB703" size={20} />;
    if (type === 'access_denied_attempt')   return <IconAlert color="#EF4444" size={20} />;
    if (type === 'third_party_request')     return <IconAlert color="#EF4444" size={20} />;
    if (type === 'talent_pool_match')       return <IconBriefcaseFull color="#00B4D8" size={20} />;
    return <IconBell color="#00B4D8" size={20} />;
  };

  const bg      = darkMode ? '#0F172A' : '#F8FAFC';
  const cardBg  = darkMode ? '#1E293B' : '#fff';
  const border  = darkMode ? '#334155' : '#E2E8F0';
  const text    = darkMode ? '#F1F5F9' : '#0F172A';
  const muted   = '#64748B';

  const card = {
    background:   cardBg,
    borderRadius: '16px',
    padding:      '20px',
    boxShadow:    '0 4px 24px rgba(0,0,0,0.06)',
    border:       `1px solid ${border}`
  };

  const tabStyle = (active) => ({
    padding:     '9px 18px',
    borderRadius:'10px',
    border:      'none',
    fontWeight:  700,
    fontSize:    '13px',
    cursor:      'pointer',
    fontFamily:  'Inter, sans-serif',
    background:  active ? '#0F172A' : 'transparent',
    color:       active ? '#FFD60A' : muted,
    transition:  'all 0.2s',
    whiteSpace:  'nowrap'
  });

  const quickActions = [
    { to: '/',              label: 'Browse Jobs',      Icon: IconBriefcaseFull, bg: '#0F172A',  textColor: '#FFD60A' },
    { to: '/privacy-centre',label: 'Privacy Centre',   Icon: IconPrivacy,       bg: '#8B5CF6',  textColor: '#fff'    },
    { to: '/access-logs',   label: 'Who Saw My Docs',  Icon: IconEye,           bg: '#10B981',  textColor: '#fff'    },
    { to: '/talent-pool',   label: 'Talent Pool',      Icon: IconPeople,        bg: '#FFB703',  textColor: '#0F172A' },
    { to: '/chat',          label: 'Ask Kiba',         Icon: IconRobot,         bg: '#00B4D8',  textColor: '#fff'    }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: bg }}>
      <Navbar />
      <div style={{ flex: 1, padding: '24px 16px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* Expiring soon banner */}
        {expiring.length > 0 && (
          <div className="animate-slideUp" style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '14px', padding: '12px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <IconAlert color="#92400E" size={18} />
            <span style={{ color: '#92400E', fontWeight: 600, fontSize: '13px' }}>
              {expiring.length} consent{expiring.length > 1 ? 's are' : ' is'} expiring within 24 hours. Review your Privacy Centre soon.
            </span>
            <Link to="/privacy-centre" style={{ marginLeft: 'auto', color: '#92400E', fontWeight: 800, fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View <IconArrowRight color="#92400E" size={13} />
            </Link>
          </div>
        )}

        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* LEFT — Kiba */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
            <KibaShield pose={kibaPose} shieldState={kibaShield} />
            <p style={{ color: muted, fontSize: '13px', textAlign: 'center', fontWeight: 500 }}>
              Hello, {user?.fullName?.split(' ')[0]}!
            </p>
            {user?.applicantId && (
              <div style={{ background: '#0F172A', border: '1.5px solid #00B4D8', color: '#00B4D8', padding: '7px 16px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, fontFamily: 'Roboto Mono, monospace' }}>
                {user.applicantId}
              </div>
            )}
            <Link to="/privacy-centre" style={{ textDecoration: 'none', width: '100%' }}>
              <div
                style={{ background: cardBg, borderRadius: '14px', padding: '14px', border: '1.5px solid #8B5CF620', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#8B5CF6'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#8B5CF620'}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <IconPrivacy color="#8B5CF6" size={20} />
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: '13px', color: text, margin: 0 }}>Privacy Centre</p>
                  <p style={{ fontSize: '11px', color: muted, margin: '2px 0 0' }}>View your data rights</p>
                </div>
              </div>
            </Link>
          </div>

          {/* RIGHT — Main content */}
          <div style={{ flex: 1, minWidth: '280px' }}>

            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 900, color: text, marginBottom: '2px', letterSpacing: '-0.5px' }}>My Dashboard</h1>
                <p style={{ color: muted, fontSize: '13px' }}>Manage your applications, consents and data access</p>
              </div>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ position: 'relative', background: cardBg, border: `1.5px solid ${unreadCount > 0 ? '#EF4444' : border}`, borderRadius: '12px', padding: '10px 16px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '13px', color: text }}>
                <IconBell color={unreadCount > 0 ? '#EF4444' : muted} size={18} />
                Notifications
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#EF4444', color: '#fff', borderRadius: '999px', minWidth: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, padding: '0 4px' }}>
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Notifications panel */}
            {showNotifications && (
              <div className="animate-slideUp" style={{ ...card, marginBottom: '20px', maxHeight: '420px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: text, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <IconBell color="#00B4D8" size={16} /> Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#00B4D8', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <IconCheck color="#00B4D8" size={13} /> Mark all read
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <IconBell color="#94A3B8" size={32} />
                    <p style={{ color: muted, fontSize: '14px', marginTop: '8px' }}>No notifications yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {notifications.map(notif => (
                      <div key={notif._id} onClick={() => markRead(notif._id)}
                        style={{ background: notif.isRead ? (darkMode ? '#0F172A' : '#F8FAFC') : (darkMode ? 'rgba(0,180,216,0.1)' : '#EFF6FF'), borderRadius: '12px', padding: '14px', cursor: 'pointer', border: notif.isRead ? `1px solid ${border}` : '1px solid #BFDBFE' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                          <div style={{ flexShrink: 0, marginTop: '2px' }}>{notifIconForType(notif.type)}</div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 700, fontSize: '13px', color: text, marginBottom: '3px' }}>{notif.title}</p>
                            <p style={{ fontSize: '12px', color: muted, lineHeight: 1.6 }}>{notif.message}</p>
                            <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', fontFamily: 'Roboto Mono, monospace' }}>{new Date(notif.createdAt).toLocaleString()}</p>
                          </div>
                          {!notif.isRead && (
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00B4D8', flexShrink: 0, marginTop: '4px' }} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'Applications',  value: applications.length,   color: '#0F172A', textColor: '#FFD60A', Icon: IconBriefcaseFull, onClick: () => { setActiveTab('applications'); setKibaPose(8); setKibaShield('idle'); } },
                { label: 'Active Sharing',value: activeConsents.length,  color: '#10B981', textColor: '#fff',    Icon: IconShieldCheck,   onClick: () => { setActiveTab('consents'); setKibaPose(1); setKibaShield('idle'); } },
                { label: 'Expired',       value: expiredConsents.length, color: '#EF4444', textColor: '#fff',    Icon: IconXCircle,       onClick: () => { setActiveTab('consents'); setKibaPose(3); setKibaShield('warning'); setTimeout(() => { setKibaPose(1); setKibaShield('idle'); }, 2000); } },
                { label: 'Expiring Soon', value: expiring.length,        color: '#FFB703', textColor: '#0F172A', Icon: IconClock,         onClick: () => { setActiveTab('consents'); setKibaPose(6); setKibaShield('warning'); setTimeout(() => { setKibaPose(1); setKibaShield('idle'); }, 2000); } }
              ].map(stat => (
                <button key={stat.label} onClick={stat.onClick}
                  style={{ background: stat.color, borderRadius: '16px', padding: '18px 14px', cursor: 'pointer', border: 'none', textAlign: 'center', boxShadow: `0 4px 16px ${stat.color}40`, transition: 'transform 0.15s' }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                    <stat.Icon color={stat.textColor} size={20} />
                  </div>
                  <div style={{ fontSize: '32px', fontWeight: 900, color: stat.textColor, fontFamily: 'Roboto Mono, monospace', lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: '11px', color: stat.textColor, fontWeight: 600, marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.85 }}>{stat.label}</div>
                </button>
              ))}
            </div>

            {/* Quick action buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
              {quickActions.map(btn => (
                <Link key={btn.to} to={btn.to} style={{ padding: '10px 18px', background: btn.bg, color: btn.textColor, borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '7px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', transition: 'all 0.2s' }}>
                  <btn.Icon color={btn.textColor} size={15} />
                  {btn.label}
                </Link>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap', background: cardBg, borderRadius: '12px', padding: '5px', border: `1px solid ${border}` }}>
              {['overview', 'applications', 'consents'].map(t => (
                <button key={t} style={tabStyle(activeTab === t)} onClick={() => setActiveTab(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'overview' && (
              <div style={card}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: text, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconBell color="#00B4D8" size={16} /> Recent Activity
                </h3>
                {loading ? (
                  <p style={{ color: muted, fontSize: '14px' }}>Loading your activity...</p>
                ) : notifications.length === 0 && applications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <IconRobot color="#94A3B8" size={44} />
                    <p style={{ color: muted, fontSize: '14px', marginTop: '12px', marginBottom: '20px' }}>No activity yet. Browse jobs and submit your first application to get started.</p>
                    <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', background: '#FF6B35', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontWeight: 800, fontSize: '14px' }}>
                      <IconBriefcaseFull color="#fff" size={16} /> Browse Jobs
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {notifications.slice(0, 5).map(notif => (
                      <div key={notif._id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: darkMode ? '#0F172A' : '#F8FAFC', borderRadius: '10px', padding: '12px', border: `1px solid ${border}` }}>
                        <div style={{ flexShrink: 0 }}>{notifIconForType(notif.type)}</div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '13px', color: text, marginBottom: '3px' }}>{notif.title}</p>
                          <p style={{ fontSize: '12px', color: muted, lineHeight: 1.5 }}>{notif.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── APPLICATIONS TAB ── */}
            {activeTab === 'applications' && (
              <div style={card}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: text, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconBriefcaseFull color="#00B4D8" size={16} /> My Applications ({applications.length})
                </h3>
                {applications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <IconBriefcaseFull color="#94A3B8" size={44} />
                    <p style={{ color: muted, fontSize: '14px', marginTop: '12px', marginBottom: '20px' }}>No applications yet. Browse jobs to apply.</p>
                    <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', background: '#0F172A', color: '#FFD60A', borderRadius: '12px', textDecoration: 'none', fontWeight: 800, fontSize: '14px' }}>
                      Browse Jobs
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {applications.map(app => {
                      const config = statusConfig[app.status] || statusConfig.received;
                      return (
                        <div key={app._id} style={{ background: darkMode ? '#0F172A' : '#F8FAFC', borderRadius: '14px', padding: '18px', border: `1px solid ${border}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                            <div>
                              <p style={{ fontWeight: 800, fontSize: '15px', color: text, marginBottom: '3px' }}>{app.job?.title}</p>
                              <p style={{ fontSize: '13px', color: '#00B4D8', fontWeight: 600, marginBottom: '3px' }}>{app.company?.name}</p>
                              <p style={{ fontSize: '12px', color: muted }}>Applied {new Date(app.createdAt).toLocaleDateString()}</p>
                              {app.statusMessage && (
                                <p style={{ fontSize: '12px', color: muted, marginTop: '4px', fontStyle: 'italic' }}>{app.statusMessage}</p>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '999px', background: config.bg }}>
                              <config.Icon color={config.color} size={14} />
                              <span style={{ fontSize: '12px', fontWeight: 800, color: config.color }}>{config.label}</span>
                            </div>
                          </div>

                          {/* Consent rules summary for this application */}
                          {app.consentRules && app.consentRules.length > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <p style={{ fontSize: '11px', fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                                Sharing {app.consentRules.length} document{app.consentRules.length > 1 ? 's' : ''}
                              </p>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {app.consentRules.map(rule => (
                                  <span key={rule._id} style={{
                                    padding: '3px 10px',
                                    borderRadius: '999px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    background: rule.status === 'active' && new Date(rule.expiresAt) > now
                                      ? '#D1FAE5'
                                      : rule.status === 'withdrawn'
                                      ? '#FEE2E2'
                                      : '#F3F4F6',
                                    color: rule.status === 'active' && new Date(rule.expiresAt) > now
                                      ? '#065F46'
                                      : rule.status === 'withdrawn'
                                      ? '#991B1B'
                                      : '#6B7280'
                                  }}>
                                    {rule.documentName}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => navigate(`/timeline/${app._id}`)}
                              style={{ padding: '8px 16px', background: '#E0F9FF', color: '#0369A1', border: '1px solid #BAE6FD', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <IconTimeline color="#0369A1" size={13} /> View Journey
                            </button>
                            <Link to="/access-logs"
                              style={{ padding: '8px 16px', background: '#FEF9C3', color: '#854D0E', border: '1px solid #FDE68A', borderRadius: '8px', fontWeight: 700, fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <IconEye color="#854D0E" size={13} /> Who Saw My Docs
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── CONSENTS TAB ── */}
            {activeTab === 'consents' && (
              <div>
                {/* Active consents */}
                <div style={{ ...card, marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: text, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                      <IconShieldCheck color="#10B981" size={16} /> Active Sharing ({activeConsents.length})
                    </h3>
                    <Link to="/privacy-centre" style={{ fontSize: '13px', color: '#8B5CF6', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Privacy Centre <IconArrowRight color="#8B5CF6" size={13} />
                    </Link>
                  </div>

                  {activeConsents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <IconLock color="#94A3B8" size={36} />
                      <p style={{ color: muted, fontSize: '14px', marginTop: '10px' }}>No active sharing rules. Apply for a job to create consent rules.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {activeConsents.map(c => (
                        <div key={c._id} style={{ background: darkMode ? '#0F172A' : '#F0FDF4', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', border: '1px solid #BBF7D0' }}>
                          <div>
                            <p style={{ fontWeight: 800, fontSize: '14px', color: text, marginBottom: '2px' }}>{c.documentName}</p>
                            <p style={{ fontSize: '12px', color: '#00B4D8', fontWeight: 600, marginBottom: '3px' }}>
                              {c.jobTitle} · {c.companyName}
                            </p>
                            <p style={{ fontSize: '12px', color: muted, marginBottom: '3px' }}>Purpose: {c.purpose}</p>
                            <p style={{ fontSize: '11px', color: muted, marginBottom: '4px' }}>Allowed role: {c.allowedRole}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <IconClock color="#FFB703" size={12} />
                              <p style={{ fontSize: '12px', color: muted, margin: 0 }}>
                                Expires: {new Date(c.expiresAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleWithdraw(c._id, c.applicationId, c.documentName)}
                            disabled={withdrawing === c._id}
                            style={{ padding: '9px 16px', background: 'rgba(239,68,68,0.08)', color: '#EF4444', border: '1.5px solid #EF4444', borderRadius: '10px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '6px', opacity: withdrawing === c._id ? 0.7 : 1 }}>
                            <IconX color="#EF4444" size={13} />
                            {withdrawing === c._id ? 'Stopping...' : 'Stop Sharing'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Expired consents */}
                {expiredConsents.length > 0 && (
                  <div style={{ ...card, marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: text, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IconXCircle color="#EF4444" size={16} /> Expired ({expiredConsents.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {expiredConsents.map(c => (
                        <div key={c._id} style={{ background: darkMode ? '#0F172A' : '#FEF2F2', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', border: `1px solid ${border}` }}>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: '13px', color: text, margin: 0 }}>{c.documentName}</p>
                            <p style={{ fontSize: '12px', color: '#00B4D8', fontWeight: 600, margin: '2px 0' }}>{c.jobTitle} · {c.companyName}</p>
                            <p style={{ fontSize: '11px', color: muted, margin: 0, fontFamily: 'Roboto Mono, monospace' }}>Expired: {new Date(c.expiresAt).toLocaleString()}</p>
                          </div>
                          <span style={{ padding: '3px 12px', borderRadius: '999px', background: '#FEE2E2', color: '#991B1B', fontSize: '11px', fontWeight: 700 }}>EXPIRED</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Withdrawn consents */}
                {withdrawnConsents.length > 0 && (
                  <div style={card}>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: text, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IconX color="#64748B" size={16} /> Withdrawn ({withdrawnConsents.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {withdrawnConsents.map(c => (
                        <div key={c._id} style={{ background: darkMode ? '#0F172A' : '#F8FAFC', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', border: `1px solid ${border}` }}>
                          <div>
                            <p style={{ fontWeight: 700, fontSize: '13px', color: text, margin: 0 }}>{c.documentName}</p>
                            <p style={{ fontSize: '12px', color: '#00B4D8', fontWeight: 600, margin: '2px 0' }}>{c.jobTitle} · {c.companyName}</p>
                            <p style={{ fontSize: '11px', color: muted, margin: 0 }}>Purpose: {c.purpose}</p>
                          </div>
                          <span style={{ padding: '3px 12px', borderRadius: '999px', background: '#F1F5F9', color: '#64748B', fontSize: '11px', fontWeight: 700 }}>WITHDRAWN</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CustomerDashboard;