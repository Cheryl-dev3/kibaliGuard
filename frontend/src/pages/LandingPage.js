import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ── SVG Icon Library ──────────────────────────────────────────────────────────
const Icon = ({ name, size = 20, color = 'currentColor', style = {} }) => {
  const icons = {
    shield: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />,
    lock: <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />,
    upload: <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />,
    eye: <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />,
    clock: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />,
    check: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    xmark: <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    bolt: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />,
    user: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />,
    users: <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />,
    document: <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />,
    target: <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />,
    sparkles: <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />,
    robot: <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z" />,
    briefcase: <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />,
    location: <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />,
    currency: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
    calendar: <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />,
    arrowRight: <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />,
    pool: <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />,
    filter: <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />,
    search: <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />,
    plus: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />,
    question: <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />,
  };

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={1.8} style={style}>
      {icons[name] || icons.shield}
    </svg>
  );
};

const JOB_COLORS = [
  { bg: '#FFD60A', text: '#0F172A', btn: '#0F172A', btnText: '#FFD60A' },
  { bg: '#7C3AED', text: '#fff', btn: '#fff', btnText: '#7C3AED' },
  { bg: '#06D6A0', text: '#0F172A', btn: '#0F172A', btnText: '#06D6A0' },
  { bg: '#FF6B35', text: '#fff', btn: '#fff', btnText: '#FF6B35' },
  { bg: '#0F172A', text: '#fff', btn: '#FFD60A', btnText: '#0F172A' },
  { bg: '#EC4899', text: '#fff', btn: '#fff', btnText: '#EC4899' },
  { bg: '#00B4D8', text: '#fff', btn: '#fff', btnText: '#00B4D8' },
  { bg: '#FFB703', text: '#0F172A', btn: '#0F172A', btnText: '#FFB703' },
];

const jobCategoryCharacters = {
  security: { char: '/images/char-gojo-idle.png', color: '#00B4D8' },
  it: { char: '/images/char-megumi-idle.png', color: '#7C3AED' },
  teaching: { char: '/images/char-nanami-idle.png', color: '#FFB703' },
  cooking: { char: '/images/char-senshi-idle.png', color: '#FF6B35' },
  customer: { char: '/images/char-nobara-idle.png', color: '#EC4899' },
  construction: { char: '/images/char-todo-idle.png', color: '#78716C' },
  accounting: { char: '/images/char-yuki-idle.png', color: '#7C3AED' },
  driving: { char: '/images/char-panda-idle.png', color: '#06D6A0' },
  admin: { char: '/images/char-yaga-idle.png', color: '#0F172A' },
  healthcare: { char: '/images/char-shoko-idle.png', color: '#06D6A0' },
  default: { char: '/images/pose8.png', color: '#00B4D8' }
};

const getJobChar = (title = '') => {
  const t = title.toLowerCase();
  if (t.includes('security') || t.includes('guard')) return jobCategoryCharacters.security;
  if (t.includes('it') || t.includes('tech') || t.includes('software')) return jobCategoryCharacters.it;
  if (t.includes('teach') || t.includes('tutor')) return jobCategoryCharacters.teaching;
  if (t.includes('cook') || t.includes('chef') || t.includes('cater')) return jobCategoryCharacters.cooking;
  if (t.includes('customer') || t.includes('service') || t.includes('retail')) return jobCategoryCharacters.customer;
  if (t.includes('construct') || t.includes('build')) return jobCategoryCharacters.construction;
  if (t.includes('account') || t.includes('finance')) return jobCategoryCharacters.accounting;
  if (t.includes('driv') || t.includes('transport')) return jobCategoryCharacters.driving;
  if (t.includes('admin') || t.includes('office') || t.includes('clerk')) return jobCategoryCharacters.admin;
  if (t.includes('nurse') || t.includes('health') || t.includes('medical')) return jobCategoryCharacters.healthcare;
  return jobCategoryCharacters.default;
};

const CountUp = ({ target }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let c = 0;
        const step = target / 60;
        const timer = setInterval(() => {
          c += step;
          if (c >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(c));
        }, 16);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{count}</span>;
};

const LandingPage = () => {
  const { user, darkMode, toggleDark } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeQ, setActiveQ] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    axios.get(`${API}/api/jobs`).then(r => setJobs(r.data)).catch(console.error).finally(() => setLoading(false));
    setTimeout(() => setVisible(true), 100);
  }, []);

  const filtered = jobs.filter(j =>
    j.title?.toLowerCase().includes(search.toLowerCase()) ||
    j.company?.name?.toLowerCase().includes(search.toLowerCase()) ||
    j.location?.toLowerCase().includes(search.toLowerCase())
  );

  const jobTypeLabel = { full_time: 'Full Time', part_time: 'Part Time', contract: 'Contract', internship: 'Internship' };

  const faqs = [
    { q: 'Is KibaliGuard free for job seekers?', a: 'Yes, completely free. Creating an account, browsing jobs and applying costs nothing. Companies pay to post jobs.' },
    { q: 'What happens to my CV after I apply?', a: 'Your CV stays under your control. You set how long the company can keep it. When that time is up, they automatically lose access. You can also revoke access at any time before that.' },
    { q: 'Can I update my CV after sending it?', a: 'Yes. You can update your documents from your dashboard at any time. When you upload a new version, the HR officer will see the updated document next time they request access.' },
    { q: 'What if I get a job elsewhere?', a: 'Go to your dashboard, find the company and click Stop Sharing My Data. They immediately lose access to all your documents. No delay.' },
    { q: 'Can a company share my CV with another company?', a: 'Only if you approve it. Any third-party sharing requires a new request from you. Without your approval, your data stays exactly where you put it.' },
    { q: 'What is the Talent Pool?', a: 'The Talent Pool lets companies find you for roles that match your skills. You sign up once, stay visible for 6 months, and get notified when matching jobs are posted. Leave anytime.' },
    { q: 'How do I know if someone accessed my documents?', a: 'Check your Who Saw My Documents page. Every single access attempt is logged including who tried, when they tried, what they said their reason was, and whether they were allowed or denied.' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#FAFAFA', fontFamily: 'Inter, sans-serif' }}>

      {/* ── NAVBAR ── */}
      <nav style={{ background: '#0F172A', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 20px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/images/pose1.png" alt="Kiba" style={{ width: '38px', height: '38px', objectFit: 'contain', animation: 'floatCharacter 3s ease-in-out infinite' }} onError={e => e.target.style.display = 'none'} />
          <span style={{ color: '#FFD60A', fontWeight: 900, fontSize: '22px', letterSpacing: '-0.5px' }}>Kibali<span style={{ color: '#00B4D8' }}>Guard</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {[['#how', 'How It Works'], ['#characters', 'Our Team'], ['#jobs', 'Jobs'], ['#talent', 'Talent Pool']].map(([href, label]) => (
            <a key={href} href={href} style={{ color: '#CBD5E1', textDecoration: 'none', fontWeight: 600, fontSize: '14px', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#FFD60A'} onMouseLeave={e => e.target.style.color = '#CBD5E1'}>
              {label}
            </a>
          ))}
          <button onClick={toggleDark} style={{ background: 'rgba(255,214,10,0.15)', border: '1.5px solid #FFD60A', borderRadius: '8px', padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {darkMode
              ? <Icon name="bolt" size={16} color="#FFD60A" />
              : <Icon name="sparkles" size={16} color="#FFD60A" />}
          </button>
          {user ? (
            <button onClick={() => navigate(user.role === 'admin' ? '/admin' : user.role === 'staff' ? '/staff' : '/dashboard')}
              style={{ padding: '10px 24px', background: '#FFD60A', color: '#0F172A', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              My Dashboard <Icon name="arrowRight" size={14} color="#0F172A" />
            </button>
          ) : (
            <>
              <Link to="/login" style={{ color: '#CBD5E1', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>Sign In</Link>
              <Link to="/register" style={{ padding: '10px 24px', background: '#FF6B35', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontWeight: 800, fontSize: '14px', boxShadow: '0 4px 16px rgba(255,107,53,0.4)' }}>
                Get Started Free
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0F172A 100%)', padding: '80px 40px 60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,214,10,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 30%, rgba(0,180,216,0.1) 0%, transparent 50%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '60px', flexWrap: 'wrap', justifyContent: 'center', position: 'relative', zIndex: 1 }}>

          <div style={{ flex: 1, minWidth: '300px', maxWidth: '580px' }}>
            <div className={visible ? 'animate-slideInLeft' : ''} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(6,214,160,0.15)', border: '1px solid rgba(6,214,160,0.4)', borderRadius: '999px', padding: '6px 18px', marginBottom: '28px' }}>
              <Icon name="shield" size={14} color="#06D6A0" />
              <span style={{ color: '#06D6A0', fontSize: '13px', fontWeight: 700 }}>Kenya Data Protection Act 2019 Compliant</span>
            </div>

            <h1 className={visible ? 'animate-slideInLeft delay-100' : ''} style={{ fontSize: '56px', fontWeight: 900, color: '#fff', lineHeight: 1.1, letterSpacing: '-2px', marginBottom: '8px' }}>
              Find your next job.
            </h1>
            <h1 style={{ fontSize: '56px', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-2px', marginBottom: '24px' }}>
              <span style={{ color: '#FF6B35' }}>Keep your</span> <span style={{ color: '#FFD60A' }}>data yours.</span>
            </h1>

            <p className={visible ? 'animate-slideInLeft delay-200' : ''} style={{ fontSize: '18px', color: '#BAE6FD', lineHeight: 1.8, marginBottom: '36px', maxWidth: '500px' }}>
              Most job sites take your CV and never tell you what happens to it. KibaliGuard is different. You decide who sees your documents, why they see them, and for how long. Take it all back anytime.
            </p>

            <div className={visible ? 'animate-slideInLeft delay-300' : ''} style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '52px' }}>
              <Link to="/register" style={{ padding: '16px 40px', background: '#FFD60A', color: '#0F172A', borderRadius: '14px', textDecoration: 'none', fontWeight: 900, fontSize: '17px', boxShadow: '0 8px 24px rgba(255,214,10,0.35)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Start for Free <Icon name="arrowRight" size={18} color="#0F172A" />
              </Link>
              <a href="#how" style={{ padding: '16px 40px', background: 'rgba(255,255,255,0.08)', color: '#fff', borderRadius: '14px', textDecoration: 'none', fontWeight: 700, fontSize: '17px', border: '1.5px solid rgba(255,255,255,0.2)' }}>
                See How It Works
              </a>
            </div>

            <div className={visible ? 'animate-slideInLeft delay-400' : ''} style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
              {[{ val: 100, suffix: '%', label: 'Data Control' }, { val: 0, suffix: '', label: 'Unauthorized Access' }, { val: jobs.length || 10, suffix: '+', label: 'Jobs Available' }].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: '36px', fontWeight: 900, color: '#FFD60A', fontFamily: 'Roboto Mono, monospace' }}><CountUp target={s.val} />{s.suffix}</div>
                  <div style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 600, marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── HERO RIGHT ── */}
          <div className={visible ? 'animate-slideInRight delay-200' : ''} style={{ display: 'flex', alignItems: 'flex-end', gap: '0px', position: 'relative' }}>
            {/* Gojo left */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginRight: '-20px', zIndex: 1 }}>
              <div style={{ background: '#00B4D8', color: '#fff', borderRadius: '12px', padding: '8px 12px', fontSize: '11px', fontWeight: 700, maxWidth: '130px', textAlign: 'center', lineHeight: 1.4 }}>
                I protect everyone. That includes your data.
              </div>
              <img src="/images/char-gojo-idle.png" alt="Gojo" style={{ width: '160px', height: '220px', objectFit: 'contain', animation: 'floatCharacter 3s ease-in-out infinite', filter: 'drop-shadow(0 8px 24px rgba(0,180,216,0.4))' }} onError={e => e.target.style.display = 'none'} />
            </div>

            {/* Kiba shield center */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 2 }}>
              <div style={{ width: '300px', height: '360px', clipPath: 'polygon(50% 0%, 100% 18%, 100% 62%, 50% 100%, 0% 62%, 0% 18%)', background: 'linear-gradient(180deg, #1E3A5F 0%, #0F172A 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', animation: 'kibashield-pulse-blue 3s ease-in-out infinite', boxShadow: '0 0 40px 10px rgba(0,180,216,0.3)' }}>
                <div style={{ position: 'absolute', top: '16px', left: '50%', transform: 'translateX(-50%)' }}>
                  <Icon name="lock" size={22} color="#00B4D8" />
                </div>
                <div style={{ position: 'absolute', top: '34px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#06D6A0', boxShadow: '0 0 12px #06D6A0', animation: 'kibashield-pulse-blue 2s infinite' }} />
                  <div style={{ width: '3px', height: '24px', background: '#475569', borderRadius: '2px' }} />
                </div>
                <div style={{ marginTop: '40px', animation: 'kibashield-bounce 2.5s ease-in-out infinite' }}>
                  <img src="/images/pose8.png" alt="Kiba" style={{ width: '200px', height: '235px', objectFit: 'contain', filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.5))' }} onError={e => e.target.style.display = 'none'} />
                </div>
              </div>
              <div style={{ background: 'rgba(0,180,216,0.15)', borderRadius: '12px', padding: '10px 20px', textAlign: 'center', border: '1px solid rgba(0,180,216,0.3)', backdropFilter: 'blur(8px)' }}>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: '13px', margin: 0 }}>Kiba is protecting your data</p>
                <p style={{ color: '#94A3B8', fontSize: '11px', margin: '3px 0 0' }}>Your personal data consent assistant</p>
              </div>
            </div>

            {/* Nobara right */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginLeft: '-20px', zIndex: 1 }}>
              <div style={{ background: '#EC4899', color: '#fff', borderRadius: '12px', padding: '8px 12px', fontSize: '11px', fontWeight: 700, maxWidth: '130px', textAlign: 'center', lineHeight: 1.4 }}>
                Walk in like you own the place!
              </div>
              <img src="/images/char-nobara-idle.png" alt="Nobara" style={{ width: '150px', height: '210px', objectFit: 'contain', animation: 'floatCharacter 3.5s ease-in-out 0.5s infinite', filter: 'drop-shadow(0 8px 24px rgba(236,72,153,0.4))' }} onError={e => e.target.style.display = 'none'} />
            </div>
          </div>
        </div>
      </div>

      {/* ── TRUSTED BY ── */}
      <div style={{ background: '#0F172A', padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
        <span style={{ color: '#64748B', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Trusted by</span>
        {['KibaliGuard Digital Services', 'Nairobi Security Ltd', 'TechHire Kenya', 'BuildRight Kenya', 'Savanna Restaurant'].map(c => (
          <span key={c} style={{ color: '#475569', fontSize: '13px', fontWeight: 700 }}>{c}</span>
        ))}
      </div>

      {/* ── CHARACTER SHOWCASE ── */}
      <div id="characters" style={{ padding: '80px 40px', background: '#fff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{ background: '#FEF9C3', color: '#854D0E', fontSize: '12px', fontWeight: 800, padding: '5px 16px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '16px' }}>Meet The Team</span>
          <h2 style={{ fontSize: '44px', fontWeight: 900, color: '#0F172A', marginBottom: '12px', letterSpacing: '-1.5px' }}>Real roles. Real characters.</h2>
          <p style={{ color: '#64748B', fontSize: '17px', marginBottom: '56px', maxWidth: '500px', margin: '0 auto 56px', lineHeight: 1.7 }}>
            Every job category has a character who knows that world inside out. They are here to guide you to your next opportunity.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
            {[
              { char: '/images/char-gojo-idle.png', name: 'Gojo', role: 'Security', color: '#00B4D8', bg: '#E0F9FF', quote: 'The strongest protect others.' },
              { char: '/images/char-senshi-idle.png', name: 'Senshi', role: 'Catering', color: '#FF6B35', bg: '#FFF0EB', quote: 'Passion makes the difference.' },
              { char: '/images/char-nobara-idle.png', name: 'Nobara', role: 'Customer Service', color: '#EC4899', bg: '#FDF2F8', quote: 'Walk in like you own it.' },
              { char: '/images/char-nanami-idle.png', name: 'Nanami', role: 'Teaching', color: '#854D0E', bg: '#FEF9C3', quote: 'Prepare and deliver your best.' },
              { char: '/images/char-megumi-idle.png', name: 'Megumi', role: 'IT Support', color: '#7C3AED', bg: '#F5F3FF', quote: 'Every problem has a solution.' },
              { char: '/images/char-shoko-idle.png', name: 'Shoko', role: 'Healthcare', color: '#065F46', bg: '#ECFDF5', quote: 'Healing takes courage.' },
              { char: '/images/char-todo-idle.png', name: 'Todo', role: 'Construction', color: '#44403C', bg: '#FAFAF9', quote: 'Build the world others live in.' },
              { char: '/images/char-yuki-idle.png', name: 'Yuki', role: 'Accounting', color: '#6D28D9', bg: '#EDE9FE', quote: 'Numbers tell powerful stories.' },
              { char: '/images/char-panda-idle.png', name: 'Panda', role: 'Driving', color: '#065F46', bg: '#D1FAE5', quote: 'Every journey needs a great driver.' },
              { char: '/images/char-yaga-idle.png', name: 'Yaga', role: 'Administration', color: '#1E293B', bg: '#F1F5F9', quote: 'Great orgs run on great admins.' },
            ].map((c, i) => (
              <div key={c.name} className="hover-lift"
                style={{ background: c.bg, borderRadius: '24px', padding: '24px 16px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '2px solid transparent', transition: 'all 0.25s', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = c.color}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: c.color, background: '#fff', borderRadius: '8px', padding: '4px 10px', marginBottom: '12px', maxWidth: '150px', textAlign: 'center', lineHeight: 1.4 }}>
                  {c.quote}
                </div>
                <img src={c.char} alt={c.name} style={{ width: '110px', height: '150px', objectFit: 'contain', animation: `floatCharacter ${3 + i * 0.2}s ease-in-out infinite`, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.12))' }}
                  onError={e => { e.target.style.display = 'none'; }} />
                <p style={{ fontWeight: 900, fontSize: '16px', color: '#0F172A', margin: '14px 0 4px' }}>{c.name}</p>
                <p style={{ fontSize: '12px', color: c.color, fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{c.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div id="how" style={{ padding: '80px 40px', background: '#0F172A' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{ background: 'rgba(0,180,216,0.15)', color: '#00B4D8', fontSize: '12px', fontWeight: 800, padding: '5px 16px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '16px' }}>Simple Process</span>
          <h2 style={{ fontSize: '44px', fontWeight: 900, color: '#fff', marginBottom: '56px', letterSpacing: '-1.5px' }}>Three steps. Full control.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {[
              { num: '01', icon: 'upload', title: 'Apply with your documents', desc: 'Browse jobs and apply in minutes. Upload your CV, National ID, certificates and any other required documents securely.', color: '#FFD60A', bg: 'rgba(255,214,10,0.08)', border: 'rgba(255,214,10,0.2)' },
              { num: '02', icon: 'lock', title: 'You set the rules', desc: 'For each document you choose exactly who can access it, what reason they must give, and how many days they can keep it. Your rules. Your choice.', color: '#FF6B35', bg: 'rgba(255,107,53,0.08)', border: 'rgba(255,107,53,0.2)' },
              { num: '03', icon: 'eye', title: 'See everything in real time', desc: 'Check Who Saw My Documents at any time. Every access attempt — granted or denied — is logged permanently with the exact time and reason.', color: '#06D6A0', bg: 'rgba(6,214,160,0.08)', border: 'rgba(6,214,160,0.2)' }
            ].map((step) => (
              <div key={step.num} className="hover-lift"
                style={{ background: step.bg, borderRadius: '24px', padding: '36px 28px', textAlign: 'left', border: `1.5px solid ${step.border}`, position: 'relative' }}>
                <div style={{ position: 'absolute', top: '20px', right: '24px', fontSize: '56px', fontWeight: 900, color: step.border, fontFamily: 'Roboto Mono, monospace', lineHeight: 1 }}>{step.num}</div>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: step.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                  <Icon name={step.icon} size={26} color={step.num === '01' ? '#0F172A' : '#fff'} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', marginBottom: '12px' }}>{step.title}</h3>
                <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.8 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── WHAT MAKES US DIFFERENT ── */}
      <div style={{ padding: '80px 40px', background: '#fff' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span style={{ background: '#FEE2E2', color: '#991B1B', fontSize: '12px', fontWeight: 800, padding: '5px 16px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '16px' }}>What Makes Us Different</span>
            <h2 style={{ fontSize: '44px', fontWeight: 900, color: '#0F172A', letterSpacing: '-1.5px' }}>You are always in control.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            {[
              { color: '#FFD60A', icon: 'document', title: 'Update your CV anytime', desc: 'Changed jobs or gained new skills? Update your CV from your dashboard. Recruiters who have access will automatically see the new version.' },
              { color: '#FF6B35', icon: 'xmark', title: 'Withdraw access instantly', desc: 'Got a job elsewhere? Not interested anymore? Click Stop Sharing on any company and they immediately lose access to all your documents. No delay.' },
              { color: '#06D6A0', icon: 'target', title: 'Purpose-specific consent', desc: 'When HR says they need your CV for job verification that is all they can use it for. If they try to use it for something else, the system blocks them automatically.' },
              { color: '#00B4D8', icon: 'eye', title: 'Full audit trail', desc: 'See a permanent record of every time anyone tried to access your documents — whether you allowed it or not. No secrets, no surprises.' },
              { color: '#7C3AED', icon: 'pool', title: 'Talent Pool — 6 months', desc: 'Join the pool, stay visible to companies for 6 months. Get matched to new jobs automatically. Leave any time if you land a role elsewhere.' },
              { color: '#EC4899', icon: 'robot', title: 'Ask Kiba anything', desc: 'Your AI assistant Kiba can tell you who saw your data today, help you write a cover letter, explain your consent rights, or show your application status in real time.' },
            ].map(f => (
              <div key={f.title} className="hover-lift" style={{ background: '#F8FAFC', borderRadius: '20px', padding: '28px', border: '1.5px solid #E2E8F0' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <Icon name={f.icon} size={26} color={f.color === '#FFD60A' || f.color === '#06D6A0' ? '#0F172A' : '#fff'} />
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', marginBottom: '10px' }}>{f.title}</h3>
                <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TALENT POOL ── */}
      <div id="talent" style={{ padding: '80px 40px', background: '#FFD60A' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '60px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
            <img src="/images/char-chilchuck-idle.png" alt="Chilchuck" style={{ width: '140px', height: '190px', objectFit: 'contain', animation: 'floatCharacter 3s ease-in-out infinite', filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.2))' }} onError={e => e.target.style.display = 'none'} />
            <img src="/images/pose2.png" alt="Kiba" style={{ width: '160px', height: '200px', objectFit: 'contain', animation: 'floatCharacter 3.5s ease-in-out 0.5s infinite', filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.2))' }} onError={e => e.target.style.display = 'none'} />
          </div>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <span style={{ background: '#0F172A', color: '#FFD60A', fontSize: '12px', fontWeight: 800, padding: '5px 16px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '16px' }}>Talent Pool</span>
            <h2 style={{ fontSize: '44px', fontWeight: 900, color: '#0F172A', marginBottom: '16px', letterSpacing: '-1.5px', lineHeight: 1.1 }}>
              Not actively applying?<br />Let jobs find you.
            </h2>
            <p style={{ color: '#44403C', fontSize: '16px', lineHeight: 1.8, marginBottom: '28px', maxWidth: '500px' }}>
              Select your skills. Stay visible to companies for 6 months. Get notified automatically when a matching job is posted. If you land a job elsewhere, click once and every company loses access to your profile immediately.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '28px' }}>
              {['6-month consent', 'Skill-based matching', 'Instant job alerts', 'Withdraw anytime'].map(f => (
                <span key={f} style={{ background: '#0F172A', color: '#FFD60A', padding: '7px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon name="check" size={14} color="#FFD60A" /> {f}
                </span>
              ))}
            </div>
            <Link to={user ? '/talent-pool' : '/register'} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '15px 36px', background: '#0F172A', color: '#FFD60A', borderRadius: '14px', textDecoration: 'none', fontWeight: 900, fontSize: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
              Join the Talent Pool <Icon name="arrowRight" size={18} color="#FFD60A" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── JOBS ── */}
      <div id="jobs" style={{ padding: '80px 40px', background: '#FAFAFA' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '40px' }}>
            <div>
              <span style={{ background: '#DBEAFE', color: '#1E40AF', fontSize: '12px', fontWeight: 800, padding: '5px 16px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '12px' }}>Open Positions</span>
              <h2 style={{ fontSize: '36px', fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-1px' }}>Explore Vacancies</h2>
              <p style={{ color: '#64748B', fontSize: '14px', marginTop: '6px' }}>{jobs.length} positions · Apply with full data protection</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <Icon name="search" size={16} color="#94A3B8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="text" placeholder="Search jobs or companies..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{ padding: '13px 20px 13px 42px', border: '2px solid #E2E8F0', borderRadius: '12px', fontSize: '14px', fontFamily: 'Inter, sans-serif', outline: 'none', width: '260px', background: '#fff' }} />
              </div>
              <button style={{ padding: '13px 20px', background: '#0F172A', color: '#FFD60A', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon name="filter" size={16} color="#FFD60A" /> Filters
              </button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>Loading positions...</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <img src="/images/pose3.png" alt="Kiba" style={{ width: '80px', marginBottom: '16px' }} onError={e => e.target.style.display = 'none'} />
              <p style={{ color: '#64748B', fontSize: '16px' }}>No jobs found. Try a different search.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filtered.map((job, i) => {
                const scheme = JOB_COLORS[i % JOB_COLORS.length];
                const charData = getJobChar(job.title);
                return (
                  <div key={job._id} className="hover-lift"
                    style={{ background: scheme.bg, borderRadius: '20px', padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', cursor: 'pointer' }}
                    onClick={() => navigate(`/jobs/${job._id}`)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
                      <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '16px', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <img src={charData.char} alt="" style={{ width: '48px', height: '56px', objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: '20px', fontWeight: 900, color: scheme.text, margin: 0 }}>{job.title}</h3>
                          <span style={{ background: 'rgba(0,0,0,0.15)', color: scheme.text, fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px' }}>
                            {jobTypeLabel[job.jobType] || job.jobType}
                          </span>
                        </div>
                        <p style={{ fontSize: '15px', fontWeight: 700, color: scheme.text, opacity: 0.85, margin: 0 }}>{job.company?.name}</p>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '6px' }}>
                          <span style={{ fontSize: '13px', color: scheme.text, opacity: 0.75, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Icon name="location" size={13} color={scheme.text} /> {job.location}
                          </span>
                          {job.salaryRange && (
                            <span style={{ fontSize: '13px', color: scheme.text, opacity: 0.75, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Icon name="currency" size={13} color={scheme.text} /> {job.salaryRange}
                            </span>
                          )}
                          <span style={{ fontSize: '13px', color: scheme.text, opacity: 0.75, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Icon name="calendar" size={13} color={scheme.text} /> Closes {new Date(job.deadline).toLocaleDateString()}
                          </span>
                          <span style={{ fontSize: '13px', color: scheme.text, opacity: 0.75, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Icon name="users" size={13} color={scheme.text} /> {job.applicantCount || 0} applicants
                          </span>
                        </div>
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); navigate(user ? `/apply/${job._id}` : '/register'); }}
                      style={{ padding: '12px 28px', background: scheme.btn, color: scheme.btnText, border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '15px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                      {user ? 'Apply Now' : 'Register to Apply'}
                      <Icon name="arrowRight" size={16} color={scheme.btnText} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── FAQ ── */}
      <div style={{ padding: '80px 40px', background: '#0F172A' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span style={{ background: 'rgba(255,214,10,0.15)', color: '#FFD60A', fontSize: '12px', fontWeight: 800, padding: '5px 16px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '16px' }}>Got Questions?</span>
            <h2 style={{ fontSize: '40px', fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>We have answers</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                <button onClick={() => setActiveQ(activeQ === i ? null : i)}
                  style={{ width: '100%', padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', fontFamily: 'Inter, sans-serif' }}>
                  <span style={{ fontWeight: 700, fontSize: '15px', color: '#fff', textAlign: 'left' }}>{faq.q}</span>
                  <div style={{ transform: activeQ === i ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }}>
                    <Icon name="plus" size={20} color="#FFD60A" />
                  </div>
                </button>
                {activeQ === i && (
                  <div style={{ padding: '0 24px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.8, margin: '16px 0 0' }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FINAL CTA ── */}
      <div style={{ padding: '80px 40px', background: '#FF6B35', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '20px', marginBottom: '32px', flexWrap: 'wrap' }}>
          <img src="/images/char-todo-idle.png" alt="" style={{ width: '120px', height: '160px', objectFit: 'contain', animation: 'floatCharacter 3s ease-in-out infinite', filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.3))' }} onError={e => e.target.style.display = 'none'} />
          <img src="/images/pose2.png" alt="Kiba" style={{ width: '140px', height: '175px', objectFit: 'contain', animation: 'floatCharacter 3.5s ease-in-out 0.3s infinite', filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.3))' }} onError={e => e.target.style.display = 'none'} />
          <img src="/images/char-senshi-idle.png" alt="" style={{ width: '120px', height: '160px', objectFit: 'contain', animation: 'floatCharacter 4s ease-in-out 0.6s infinite', filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.3))' }} onError={e => e.target.style.display = 'none'} />
        </div>
        <h2 style={{ fontSize: '48px', fontWeight: 900, color: '#fff', marginBottom: '16px', letterSpacing: '-1.5px' }}>
          Ready to take control?
        </h2>
        <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.85)', marginBottom: '40px', maxWidth: '480px', margin: '0 auto 40px', lineHeight: 1.7 }}>
          Register for free in 2 minutes. Your documents stay yours.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register" style={{ padding: '18px 52px', background: '#0F172A', color: '#FFD60A', borderRadius: '14px', textDecoration: 'none', fontWeight: 900, fontSize: '18px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
            Get Started Free <Icon name="arrowRight" size={20} color="#FFD60A" />
          </Link>
          <Link to="/login" style={{ padding: '18px 52px', background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: '14px', textDecoration: 'none', fontWeight: 700, fontSize: '18px', border: '2px solid rgba(255,255,255,0.4)' }}>
            Sign In
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default LandingPage;