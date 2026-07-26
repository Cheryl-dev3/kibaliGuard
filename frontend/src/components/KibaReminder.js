import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { IconX, IconBell } from '../Icons';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const reminderMessages = [
  { text: "Don't forget to check your access logs. Transparency keeps you in control!", pose: 1, action: '/access-logs', actionLabel: 'View Logs' },
  { text: "Have you reviewed your active consents lately? It only takes a minute.", pose: 6, action: '/dashboard', actionLabel: 'Check Consents' },
  { text: "New jobs are posted regularly. Want to see what's available?", pose: 8, action: '/', actionLabel: 'Browse Jobs' },
  { text: "Joining the talent pool helps companies find you for matching roles!", pose: 8, action: '/talent-pool', actionLabel: 'Join Talent Pool' },
  { text: "I'm always here if you need help writing a cover letter or checking your data!", pose: 9, action: '/chat', actionLabel: 'Ask Kiba' }
];

const KibaReminder = () => {
  const { token, darkMode, user } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [reminder, setReminder] = useState(null);

  useEffect(() => {
    if (!user) return;

    const checkAndShow = async () => {
      const lastShown = localStorage.getItem('kibaReminderLastShown');
      const now = Date.now();
      const fortyFiveMin = 45 * 60 * 1000;

      if (lastShown && now - parseInt(lastShown) < fortyFiveMin) return;

      try {
        const res = await axios.get(`${API}/api/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        let chosen;
        if (res.data.count > 0) {
          chosen = {
            text: `You have ${res.data.count} new notification${res.data.count !== 1 ? 's' : ''} waiting for you!`,
            pose: 8,
            action: '/dashboard',
            actionLabel: 'View Notifications'
          };
        } else {
          chosen = reminderMessages[Math.floor(Math.random() * reminderMessages.length)];
        }

        setReminder(chosen);
        setVisible(true);
        localStorage.setItem('kibaReminderLastShown', now.toString());
      } catch (err) {
        console.error('Reminder check error:', err);
      }
    };

    const timer = setTimeout(checkAndShow, 8000);
    return () => clearTimeout(timer);
  }, [user, token]);

  const handleAction = () => {
    setVisible(false);
    if (reminder?.action) navigate(reminder.action);
  };

  if (!visible || !reminder || !user || user.role !== 'customer') return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      maxWidth: '320px',
      background: darkMode ? '#1E293B' : '#fff',
      borderRadius: '18px',
      boxShadow: '0 8px 32px rgba(30,58,95,0.25)',
      border: `1.5px solid ${darkMode ? '#334155' : '#E2E8F0'}`,
      padding: '16px',
      zIndex: 1000,
      display: 'flex',
      gap: '12px',
      alignItems: 'flex-start',
      animation: 'kibashield-bounce 0.6s ease-out'
    }}>
      <img
        src={`/images/pose${reminder.pose}.png`}
        alt="Kiba"
        style={{ width: '48px', height: '56px', objectFit: 'contain', flexShrink: 0 }}
        onError={e => { e.target.style.display = 'none'; }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '1px' }}>Kiba</span>
          <button onClick={() => setVisible(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
            <IconX color="#94A3B8" size={16} />
          </button>
        </div>
        <p style={{ fontSize: '13px', color: darkMode ? '#CBD5E1' : '#1E293B', lineHeight: 1.6, margin: '0 0 12px' }}>
          {reminder.text}
        </p>
        <button onClick={handleAction} style={{ padding: '8px 16px', background: '#1E3A5F', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconBell color="#fff" size={13} />
          {reminder.actionLabel}
        </button>
      </div>
    </div>
  );
};

export default KibaReminder;
