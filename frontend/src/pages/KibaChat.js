import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import KibaShield from '../components/KibaShield';
import {
  IconEye,
  IconBriefcaseFull,
  IconClock,
  IconShield,
  IconEdit,
  IconLock,
  IconSend,
  IconRobot,
  IconShieldFilled
} from '../Icons';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getLoadingMessage = (question) => {
  const q = question.toLowerCase();
  if (q.includes('access') || q.includes('who') || q.includes('viewed') || q.includes('opened')) return 'Checking who accessed your data...';
  if (q.includes('consent') || q.includes('expire')) return 'Checking your consent rules...';
  if (q.includes('application') || q.includes('status') || q.includes('job')) return 'Checking your application status...';
  if (q.includes('safe') || q.includes('secure') || q.includes('protected')) return 'Reviewing your security status...';
  if (q.includes('cover letter') || q.includes('write')) return 'Writing your cover letter...';
  if (q.includes('withdraw') || q.includes('remove')) return 'Looking up your consent settings...';
  if (q.includes('week') || q.includes('today') || q.includes('recent')) return 'Pulling your recent activity...';
  return 'Processing your request...';
};

const suggestions = [
  { text: 'Who accessed my data today?', Icon: IconEye, color: '#0EA5E9' },
  { text: 'What is my application status?', Icon: IconBriefcaseFull, color: '#10B981' },
  { text: 'When does my consent expire?', Icon: IconClock, color: '#F59E0B' },
  { text: 'Is my data safe?', Icon: IconShield, color: '#1E3A5F' },
  { text: 'Help me write a cover letter', Icon: IconEdit, color: '#8B5CF6' },
  { text: 'How do I withdraw consent?', Icon: IconLock, color: '#EF4444' }
];

const KibaChat = () => {
  const { token, user, darkMode } = useAuth();
  const [messages, setMessages] = useState([
    {
      from: 'kiba',
      text: `Hello ${user?.fullName?.split(' ')[0]}! I am Kiba, your personal data consent assistant. I can tell you who accessed your data today, check your application status, help you write a cover letter and much more. What would you like to know?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Processing your request...');
  const [pose, setPose] = useState(8);
  const [shieldState, setShieldState] = useState('idle');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (messageText) => {
    const text = messageText || input.trim();
    if (!text) return;
    setInput('');
    setMessages(prev => [...prev, { from: 'user', text }]);
    setLoading(true);
    setLoadingMsg(getLoadingMessage(text));
    setPose(7);
    setShieldState('blue');

    try {
      const res = await axios.post(`${API}/api/chat`, { message: text }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(prev => [...prev, { from: 'kiba', text: res.data.reply }]);
      setPose(8);
      setShieldState('idle');

      if (res.data.reply.toLowerCase().includes('congratulations') || res.data.reply.toLowerCase().includes('hired')) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 }, colors: ['#10B981', '#0EA5E9'] });
        setPose(2);
        setShieldState('success');
        setTimeout(() => { setPose(8); setShieldState('idle'); }, 3000);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'I am having a little trouble right now. Please try again in a moment.';
      setMessages(prev => [...prev, { from: 'kiba', text: errMsg }]);
      setPose(3);
      setShieldState('warning');
      setTimeout(() => { setPose(8); setShieldState('idle'); }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const card = {
    background: darkMode ? '#1E293B' : '#ffffff',
    borderRadius: '20px',
    boxShadow: '0 4px 24px rgba(30,58,95,0.08)'
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: darkMode ? '#0F172A' : '#F8FAFC' }}>
      <Navbar />
      <div style={{ flex: 1, padding: '24px 16px', maxWidth: '1040px', margin: '0 auto', width: '100%', display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap', boxSizing: 'border-box' }}>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', minWidth: '200px' }}>
          <KibaShield
            pose={pose}
            shieldState={shieldState}
            customLabel={loading ? loadingMsg : null}
          />
          <div style={{ background: darkMode ? '#1E293B' : '#fff', borderRadius: '12px', padding: '12px 16px', maxWidth: '220px', boxShadow: '0 2px 12px rgba(30,58,95,0.06)', border: `1px solid ${darkMode ? '#334155' : '#E2E8F0'}` }}>
            <p style={{ color: '#64748B', fontSize: '12px', textAlign: 'center', lineHeight: 1.6, margin: 0 }}>
              Ask me anything about your data, applications or consent
            </p>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: darkMode ? '#F1F5F9' : '#1E3A5F', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <IconRobot color="#0EA5E9" size={24} />
              Ask Kiba
            </h1>
            <p style={{ color: '#64748B', fontSize: '14px' }}>Your AI powered data consent assistant</p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {suggestions.map(s => (
              <button
                key={s.text}
                onClick={() => handleSend(s.text)}
                disabled={loading}
                style={{
                  padding: '8px 14px',
                  background: darkMode ? '#1E293B' : '#fff',
                  color: darkMode ? '#CBD5E1' : '#1E293B',
                  border: `1.5px solid ${darkMode ? '#334155' : '#E2E8F0'}`,
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  transition: 'all 0.2s',
                  opacity: loading ? 0.6 : 1,
                  boxShadow: '0 1px 4px rgba(30,58,95,0.06)'
                }}
              >
                <s.Icon color={s.color} size={14} />
                {s.text}
              </button>
            ))}
          </div>

          <div style={{ ...card, display: 'flex', flexDirection: 'column', height: '460px' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '80%',
                    padding: '13px 18px',
                    borderRadius: msg.from === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: msg.from === 'user' ? '#1E3A5F' : (darkMode ? '#0F172A' : '#F1F5F9'),
                    color: msg.from === 'user' ? '#fff' : (darkMode ? '#CBD5E1' : '#1E293B'),
                    fontSize: '14px',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                    border: msg.from === 'user' ? 'none' : `1px solid ${darkMode ? '#334155' : '#E2E8F0'}`
                  }}>
                    {msg.from === 'kiba' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <IconShieldFilled color="#0EA5E9" size={14} />
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#0EA5E9', textTransform: 'uppercase', letterSpacing: '1px' }}>Kiba</span>
                      </div>
                    )}
                    {msg.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ background: darkMode ? '#0F172A' : '#F1F5F9', padding: '13px 18px', borderRadius: '18px 18px 18px 4px', display: 'flex', alignItems: 'center', gap: '10px', border: `1px solid ${darkMode ? '#334155' : '#E2E8F0'}` }}>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#0EA5E9', animation: `kibashield-bounce ${0.5 + i * 0.15}s ease-in-out infinite alternate` }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '13px', color: '#0EA5E9', fontWeight: 600 }}>{loadingMsg}</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div style={{ padding: '14px 16px', borderTop: `1px solid ${darkMode ? '#334155' : '#E2E8F0'}`, display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask Kiba anything..."
                disabled={loading}
                style={{ flex: 1, padding: '12px 16px', border: `2px solid ${darkMode ? '#334155' : '#E2E8F0'}`, borderRadius: '12px', fontSize: '14px', fontFamily: 'Inter, sans-serif', background: darkMode ? '#0F172A' : '#fff', color: darkMode ? '#F1F5F9' : '#1E293B', outline: 'none' }}
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                style={{ padding: '12px 20px', background: loading || !input.trim() ? '#64748B' : '#1E3A5F', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '14px', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '7px', transition: 'all 0.2s', minWidth: '80px', justifyContent: 'center' }}>
                <IconSend color="#fff" size={15} />
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default KibaChat;
