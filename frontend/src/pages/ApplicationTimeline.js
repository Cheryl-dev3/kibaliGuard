import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import KibaShield from '../components/KibaShield';
import {
  IconCheckCircle, IconClock, IconEye, IconXCircle, IconArrowLeft,
  IconBriefcase, IconFile, IconUser, IconCheck, IconAlert, IconMail, IconStar
} from '../Icons';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const milestoneConfig = {
  application_submitted: { label: 'Application Submitted', color: '#10B981', bg: '#DCFCE7', Icon: IconCheck, kibaMsg: 'Your application is in! I have got your documents protected and the hiring team has been notified.' },
  consent_granted: { label: 'Consent Rules Set', color: '#00B4D8', bg: '#E0F9FF', Icon: IconCheckCircle, kibaMsg: 'Great. Your consent rules are active. Companies can only access your documents within the rules you set.' },
  hr_access_requested: { label: 'HR Requested Access', color: '#FFB703', bg: '#FFFBEB', Icon: IconEye, kibaMsg: 'An HR officer requested access to your documents. I checked your consent rules automatically before allowing anything.' },
  hr_viewed_cv: { label: 'HR Viewed Your CV', color: '#FFB703', bg: '#FFFBEB', Icon: IconFile, kibaMsg: 'Your CV was viewed. This was logged and you can see full details in your Access Logs.' },
  shortlisted: { label: 'You Were Shortlisted', color: '#8B5CF6', bg: '#F5F3FF', Icon: IconStar, kibaMsg: 'Excellent news! The hiring team has shortlisted you. This means they are seriously interested. Keep going!' },
  interview_invited: { label: 'Interview Invitation Sent', color: '#00B4D8', bg: '#E0F9FF', Icon: IconMail, kibaMsg: 'You have been invited to an interview. This is a major milestone. Make sure you prepare thoroughly.' },
  hired: { label: 'Offer Accepted — Hired', color: '#10B981', bg: '#DCFCE7', Icon: IconCheckCircle, kibaMsg: 'Congratulations! You got the job! This is a moment to celebrate. I am genuinely happy for you.' },
  rejected: { label: 'Application Not Selected', color: '#EF4444', bg: '#FEE2E2', Icon: IconXCircle, kibaMsg: 'This one did not work out, but your journey is not over. Every application teaches you something. Keep going.' },
  under_review: { label: 'Under Review', color: '#00B4D8', bg: '#E0F9FF', Icon: IconClock, kibaMsg: 'The hiring team is reviewing your application. This is a good sign — they are taking time to consider you carefully.' },
  received: { label: 'Application Received', color: '#10B981', bg: '#DCFCE7', Icon: IconCheck, kibaMsg: 'Your application has been received and is in the queue. I will update you on every step from here.' },
};

const ApplicationTimeline = () => {
  const { applicationId } = useParams();
  const { token, darkMode } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pose, setPose] = useState(1);
  const [shieldState, setShieldState] = useState('idle');
  const [activeMsg, setActiveMsg] = useState('');

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, []);

  const fetchData = async () => {
    try {
      const [appRes, logsRes] = await Promise.all([
        axios.get(`${API}/api/applications/my`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/access/my-logs`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const app = appRes.data.find(a => a._id === applicationId);
      if (app) {
        setApplication(app);
        const config = milestoneConfig[app.status] || milestoneConfig.received;
        setActiveMsg(config.kibaMsg);
        if (app.status === 'hired') { setPose(2); setShieldState('success'); }
        else if (app.status === 'rejected') { setPose(4); setShieldState('danger'); }
        else if (app.status === 'shortlisted') { setPose(8); setShieldState('idle'); }
        else { setPose(1); setShieldState('idle'); }
      }
      setLogs(logsRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const buildTimeline = () => {
    if (!application) return [];
    const events = [];
    events.push({ key: 'received', date: application.createdAt, done: true });
    events.push({ key: 'consent_granted', date: application.createdAt, done: true });
    const appLogs = logs.filter(l => l.accessGranted);
    if (appLogs.length > 0) {
      events.push({ key: 'hr_access_requested', date: appLogs[0]?.createdAt, done: true });
      events.push({ key: 'hr_viewed_cv', date: appLogs[0]?.createdAt, done: true });
    }
    const statusOrder = ['received', 'under_review', 'shortlisted', 'hired', 'rejected'];
    const currentIdx = statusOrder.indexOf(application.status);
    if (currentIdx >= 1) events.push({ key: 'under_review', date: null, done: true });
    if (currentIdx >= 2) events.push({ key: 'shortlisted', date: null, done: true });
    if (application.status === 'hired') events.push({ key: 'hired', date: null, done: true });
    if (application.status === 'rejected') events.push({ key: 'rejected', date: null, done: true });
    return events;
  };

  const timeline = buildTimeline();
  const bg = darkMode ? '#0F172A' : '#F8FAFC';
  const cardBg = darkMode ? '#1E293B' : '#fff';
  const border = darkMode ? '#334155' : '#E2E8F0';
  const text = darkMode ? '#F1F5F9' : '#0F172A';

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#00B4D8', fontFamily: 'Inter, sans-serif' }}>Loading timeline...</div>;

  if (!application) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif', gap: '16px' }}>
      <IconBriefcase color="#64748B" size={48} />
      <p style={{ color: '#64748B' }}>Application not found.</p>
      <button onClick={() => navigate('/dashboard')} style={{ padding: '10px 24px', background: '#0F172A', color: '#FFD60A', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Back to Dashboard</button>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: bg }}>
      <Navbar />
      <div style={{ flex: 1, padding: '32px 20px', maxWidth: '1100px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: '#00B4D8', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginBottom: '24px', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconArrowLeft color="#00B4D8" size={16} />
          Back to Dashboard
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: text, margin: 0, letterSpacing: '-0.5px' }}>Application Journey</h1>
            <p style={{ color: '#64748B', fontSize: '14px', margin: '6px 0 0' }}>{application.job?.title} at {application.company?.name}</p>
          </div>
          <span style={{ padding: '8px 20px', borderRadius: '999px', fontSize: '13px', fontWeight: 800, background: (milestoneConfig[application.status] || milestoneConfig.received).bg, color: (milestoneConfig[application.status] || milestoneConfig.received).color }}>
            {(milestoneConfig[application.status] || milestoneConfig.received).label}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* LEFT — Kiba */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', minWidth: '200px' }}>
            <KibaShield pose={pose} shieldState={shieldState} />
            {activeMsg && (
              <div className="animate-bubblePop" style={{ background: cardBg, border: '2px solid #00B4D8', borderRadius: '14px', padding: '14px 16px', maxWidth: '200px', textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', position: 'relative' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: text, lineHeight: 1.6, margin: 0 }}>{activeMsg}</p>
                <div style={{ position: 'absolute', bottom: '-10px', left: '50%', transform: 'translateX(-50%)', borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '10px solid #00B4D8' }} />
              </div>
            )}
          </div>

          {/* RIGHT — timeline */}
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ background: cardBg, borderRadius: '20px', padding: '28px', border: `1px solid ${border}`, marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 800, fontSize: '16px', color: text, marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Your Journey Timeline
              </h3>

              <div style={{ position: 'relative' }}>
                {/* Vertical line */}
                <div style={{ position: 'absolute', left: '19px', top: '24px', bottom: '24px', width: '2px', background: `linear-gradient(to bottom, #10B981, #00B4D8, ${application.status === 'rejected' ? '#EF4444' : '#E2E8F0'})`, borderRadius: '2px' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {timeline.map((event, i) => {
                    const config = milestoneConfig[event.key] || milestoneConfig.received;
                    return (
                      <div key={event.key} className={`animate-slideUp delay-${Math.min((i + 1) * 100, 500)}`}
                        style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', paddingBottom: i < timeline.length - 1 ? '24px' : '0', cursor: 'pointer' }}
                        onClick={() => setActiveMsg(config.kibaMsg)}>

                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: event.done ? config.bg : '#F1F5F9', border: `3px solid ${event.done ? config.color : '#E2E8F0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, boxShadow: event.done ? `0 0 12px ${config.color}40` : 'none', transition: 'all 0.3s' }}>
                          <config.Icon color={event.done ? config.color : '#94A3B8'} size={18} />
                        </div>

                        <div style={{ flex: 1, paddingTop: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <p style={{ fontWeight: 700, fontSize: '14px', color: event.done ? text : '#94A3B8', margin: 0 }}>{config.label}</p>
                            {event.date && (
                              <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'Roboto Mono, monospace' }}>
                                {new Date(event.date).toLocaleDateString('en-KE')}
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '12px', color: '#64748B', margin: '4px 0 0', lineHeight: 1.5 }}>
                            {event.done ? `Click to hear Kiba explain this milestone` : 'Pending'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Documents submitted */}
            <div style={{ background: cardBg, borderRadius: '20px', padding: '24px', border: `1px solid ${border}` }}>
              <h3 style={{ fontWeight: 800, fontSize: '15px', color: text, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconFile color="#00B4D8" size={16} />
                Documents Submitted ({application.documents?.length || 0})
              </h3>
              {application.documents?.length === 0 ? (
                <p style={{ color: '#64748B', fontSize: '14px' }}>No documents submitted.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {application.documents?.map((doc, i) => (
                    <span key={i} style={{ background: '#E0F9FF', color: '#0369A1', padding: '7px 14px', borderRadius: '999px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <IconFile color="#0369A1" size={13} />
                      {doc.documentName}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ApplicationTimeline;