import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  IconBell, IconBellFilled, IconCheck, IconCheckCircle, IconXCircle,
  IconClock, IconEye, IconAlert, IconBriefcaseFull, IconUsers
} from '../Icons';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const iconForType = (type) => {
  if (type === 'application_hired') return <IconCheckCircle color="#10B981" size={18} />;
  if (type === 'application_rejected') return <IconXCircle color="#EF4444" size={18} />;
  if (type === 'application_shortlisted') return <IconCheck color="#8B5CF6" size={18} />;
  if (type === 'consent_expiring' || type === 'job_closing_soon') return <IconClock color="#F59E0B" size={18} />;
  if (type === 'document_accessed') return <IconEye color="#F59E0B" size={18} />;
  if (type === 'third_party_request') return <IconAlert color="#EF4444" size={18} />;
  if (type === 'new_application') return <IconBriefcaseFull color="#0EA5E9" size={18} />;
  if (type === 'new_registration') return <IconUsers color="#10B981" size={18} />;
  return <IconBell color="#0EA5E9" size={18} />;
};

const NotificationBell = () => {
  const { token, darkMode } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);

  const fetchData = async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        axios.get(`${API}/api/notifications/my`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/notifications/unread-count`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setNotifications(listRes.data);
      setUnreadCount(countRes.data.count);
    } catch (err) {
      console.error('Notification fetch error:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markRead = async (id) => {
    try {
      await axios.put(`${API}/api/notifications/mark-read/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const markAllRead = async () => {
    try {
      await axios.put(`${API}/api/notifications/mark-all-read`, {}, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleNotifClick = (notif) => {
    markRead(notif._id);
    setOpen(false);
    if (notif.actionUrl) navigate(notif.actionUrl);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: unreadCount > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.08)',
          border: `1.5px solid ${unreadCount > 0 ? '#EF4444' : 'rgba(255,255,255,0.15)'}`,
          borderRadius: '8px',
          padding: '6px 10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          position: 'relative'
        }}
        title="Notifications"
      >
        {unreadCount > 0 ? <IconBellFilled size={16} /> : <IconBell color="#CBD5E1" size={16} />}
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#EF4444', color: '#fff', borderRadius: '999px', minWidth: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, padding: '0 3px' }}>
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: '44px',
          right: 0,
          width: '320px',
          maxHeight: '400px',
          overflowY: 'auto',
          background: darkMode ? '#1E293B' : '#fff',
          borderRadius: '14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          border: `1px solid ${darkMode ? '#334155' : '#E2E8F0'}`,
          zIndex: 200,
          padding: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: darkMode ? '#F1F5F9' : '#1E3A5F' }}>Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#0EA5E9', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No notifications yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notifications.map(notif => (
                <button key={notif._id} onClick={() => handleNotifClick(notif)}
                  style={{
                    display: 'flex', gap: '10px', alignItems: 'flex-start', textAlign: 'left',
                    background: notif.isRead ? (darkMode ? '#0F172A' : '#F8FAFC') : (darkMode ? 'rgba(14,165,233,0.1)' : '#EFF6FF'),
                    border: notif.isRead ? `1px solid ${darkMode ? '#334155' : '#E2E8F0'}` : '1px solid #BFDBFE',
                    borderRadius: '10px', padding: '10px', cursor: 'pointer', fontFamily: 'Inter, sans-serif'
                  }}>
                  <div style={{ flexShrink: 0, marginTop: '2px' }}>{iconForType(notif.type)}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: '12px', color: darkMode ? '#F1F5F9' : '#1E293B', margin: 0 }}>{notif.title}</p>
                    <p style={{ fontSize: '11px', color: '#64748B', margin: '3px 0 0', lineHeight: 1.5 }}>{notif.message}</p>
                    <p style={{ fontSize: '10px', color: '#94A3B8', margin: '4px 0 0', fontFamily: 'Roboto Mono, monospace' }}>{new Date(notif.createdAt).toLocaleString()}</p>
                  </div>
                  {!notif.isRead && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#0EA5E9', flexShrink: 0, marginTop: '4px' }} />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
