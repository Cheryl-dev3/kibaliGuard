import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import KibaShield from '../components/KibaShield';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const talentCategories = [
  {
    skill: 'Security and Guard Services',
    char: '/images/char-gojo-idle.png',
    celebrate: '/images/char-gojo-celebrate.png',
    color: '#00B4D8',
    bg: '#E0F9FF',
    quote: 'The strongest protect others. Your strength is exactly what companies need right now.'
  },
  {
    skill: 'IT Support and Technology',
    char: '/images/char-megumi-idle.png',
    celebrate: '/images/char-megumi-celebrate.png',
    color: '#7C3AED',
    bg: '#F5F3FF',
    quote: 'Every system has a solution waiting. Your skills can find it before anyone else.'
  },
  {
    skill: 'Teaching and Education',
    char: '/images/char-nanami-idle.png',
    celebrate: '/images/char-nanami-celebrate.png',
    color: '#FFB703',
    bg: '#FFFBEB',
    quote: 'The next generation needs great educators. Your calling could not be clearer.'
  },
  {
    skill: 'Cooking and Catering',
    char: '/images/char-senshi-idle.png',
    celebrate: '/images/char-senshi-celebrate.png',
    color: '#FF6B35',
    bg: '#FFF0EB',
    quote: 'Good food requires passion and mastery. I can see from here that you have both.'
  },
  {
    skill: 'Customer Service and Retail',
    char: '/images/char-nobara-idle.png',
    celebrate: '/images/char-nobara-celebrate.png',
    color: '#EC4899',
    bg: '#FDF2F8',
    quote: 'Walk in like you own the place. Because with your energy, you practically will.'
  },
  {
    skill: 'Construction and Engineering',
    char: '/images/char-todo-idle.png',
    celebrate: '/images/char-todo-celebrate.png',
    color: '#78716C',
    bg: '#FAFAF9',
    quote: 'You build the world others live in. That kind of work deserves the right recognition.'
  },
  {
    skill: 'Accounting and Finance',
    char: '/images/char-yuki-idle.png',
    celebrate: '/images/char-yuki-celebrate.png',
    color: '#7C3AED',
    bg: '#F5F3FF',
    quote: 'Numbers are power. A sharp financial mind like yours can genuinely change everything.'
  },
  {
    skill: 'Driving and Transport',
    char: '/images/char-panda-idle.png',
    celebrate: '/images/char-panda-celebrate.png',
    color: '#06D6A0',
    bg: '#ECFDF5',
    quote: 'Reliable, strong, always on time. The road ahead is yours to claim.'
  },
  {
    skill: 'Administration and Office',
    char: '/images/char-yaga-idle.png',
    celebrate: '/images/char-yaga-celebrate.png',
    color: '#0F172A',
    bg: '#F8FAFC',
    quote: 'Every great organisation runs on great administration. Step up and take the lead.'
  },
  {
    skill: 'Healthcare and Nursing',
    char: '/images/char-shoko-idle.png',
    celebrate: '/images/char-shoko-celebrate.png',
    color: '#06D6A0',
    bg: '#ECFDF5',
    quote: 'Healing people is the most human of all work. You are needed more than you know.'
  },
  {
    skill: 'Cleaning and Hygiene',
    char: '/images/char-mirio-idle.png',
    celebrate: '/images/char-mirio-idle.png',
    color: '#00B4D8',
    bg: '#E0F9FF',
    quote: 'A clean environment is a productive environment. Your work matters more than most realise.'
  },
  {
    skill: 'Sales and Marketing',
    char: '/images/char-nobara-idle.png',
    celebrate: '/images/char-nobara-celebrate.png',
    color: '#FF6B35',
    bg: '#FFF0EB',
    quote: 'Great salespeople do not push products. They solve problems. Just like you.'
  },
  {
    skill: 'Hospitality and Tourism',
    char: '/images/char-senshi-idle.png',
    celebrate: '/images/char-senshi-celebrate.png',
    color: '#06D6A0',
    bg: '#ECFDF5',
    quote: 'Kenya is beautiful. You help the world experience it. That is something to be proud of.'
  },
  {
    skill: 'Agriculture and Farming',
    char: '/images/char-farmer-idle.png',
    celebrate: '/images/char-farmer-idle.png',
    color: '#FFB703',
    bg: '#FFFBEB',
    quote: 'You feed the nation. There is honestly no more important work than this.'
  },
  {
    skill: 'Plumbing and Electrical',
    char: '/images/char-plumber-idle.png',
    celebrate: '/images/char-plumber-idle.png',
    color: '#78716C',
    bg: '#FAFAF9',
    quote: 'The infrastructure of modern life runs through your hands. Own that power.'
  },
];

const TalentPool = () => {
  const { token, darkMode } = useAuth();
  const [talent, setTalent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [activeChar, setActiveChar] = useState(null);
  const [pose, setPose] = useState(1);
  const [shieldState, setShieldState] = useState('idle');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [justJoined, setJustJoined] = useState(false);

  useEffect(() => {
    fetchTalent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTalent = async () => {
    try {
      const res = await axios.get(`${API}/api/talent/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTalent(res.data);
      if (res.data?.status === 'active') {
        setPose(8);
        setShieldState('idle');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
    const cat = talentCategories.find(c => c.skill === skill);
    if (cat && !selectedSkills.includes(skill)) {
      setActiveChar(cat);
    } else if (selectedSkills.length <= 1) {
      setActiveChar(null);
    }
  };

  const handleJoin = async () => {
    if (selectedSkills.length === 0) {
      setError('Please select at least one skill category');
      setPose(3);
      setShieldState('warning');
      setTimeout(() => { setPose(1); setShieldState('idle'); }, 2000);
      return;
    }
    setJoining(true);
    setPose(7);
    setError('');
    try {
      await axios.post(
        `${API}/api/talent/join`,
        { skillCategories: selectedSkills },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('You have joined the Talent Pool! Companies will be notified when jobs match your skills.');
      setPose(2);
      setShieldState('success');
      setJustJoined(true);
      fetchTalent();
      setTimeout(() => {
        setPose(8);
        setShieldState('idle');
        setJustJoined(false);
      }, 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
      setPose(4);
      setShieldState('danger');
      setTimeout(() => { setPose(1); setShieldState('idle'); }, 2000);
    } finally {
      setJoining(false);
    }
  };

  const handleWithdraw = async () => {
    if (!window.confirm('Are you sure you want to leave the Talent Pool? Companies will no longer be able to find you. You can rejoin anytime.')) return;
    setWithdrawing(true);
    setPose(7);
    try {
      await axios.put(
        `${API}/api/talent/withdraw`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('You have been removed from the Talent Pool. Companies can no longer access your profile.');
      setPose(5);
      setShieldState('blue');
      fetchTalent();
      setTimeout(() => { setPose(1); setShieldState('idle'); }, 3000);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setWithdrawing(false);
    }
  };

  const cardBg = darkMode ? '#1E293B' : '#fff';
  const text = darkMode ? '#F1F5F9' : '#0F172A';
  const muted = '#64748B';
  const border = darkMode ? '#334155' : '#E2E8F0';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: darkMode ? '#0F172A' : '#F0F9FF' }}>
      <Navbar />
      <div style={{ flex: 1, padding: '32px 24px', maxWidth: '1100px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ background: '#DBEAFE', color: '#1E40AF', fontSize: '12px', fontWeight: 700, padding: '4px 14px', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '1px', display: 'inline-block', marginBottom: '12px' }}>
            Talent Pool
          </span>
          <h1 style={{ fontSize: '36px', fontWeight: 900, color: text, marginBottom: '8px', letterSpacing: '-1px' }}>
            Let the right job find you
          </h1>
          <p style={{ color: muted, fontSize: '16px', maxWidth: '500px', margin: '0 auto', lineHeight: 1.7 }}>
            Select your skills. Get matched with companies. Your 6 month consent is fully in your hands.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* LEFT — Kiba and active character */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', minWidth: '220px' }}>
            <KibaShield pose={pose} shieldState={shieldState} />

            {activeChar && (
              <div className="animate-characterIn" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  background: '#fff',
                  border: `2px solid ${activeChar.color}`,
                  borderRadius: '14px',
                  padding: '10px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#0F172A',
                  maxWidth: '180px',
                  textAlign: 'center',
                  lineHeight: 1.5,
                  position: 'relative',
                  marginBottom: '8px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                  animation: 'bubblePop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards'
                }}>
                  {activeChar.quote}
                  <div style={{
                    position: 'absolute',
                    bottom: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderTop: `10px solid ${activeChar.color}`
                  }} />
                </div>
                <img
                  src={justJoined ? activeChar.celebrate : activeChar.char}
                  alt=""
                  style={{
                    width: '120px',
                    height: '160px',
                    objectFit: 'contain',
                    filter: `drop-shadow(0 8px 20px ${activeChar.color}40)`,
                    animation: 'characterEntrance 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards'
                  }}
                  onError={e => e.target.style.display = 'none'}
                />
                <span style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: activeChar.color,
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  {activeChar.skill.split(' ')[0]}
                </span>
              </div>
            )}
          </div>

          {/* RIGHT — main content */}
          <div style={{ flex: 1, minWidth: '280px' }}>

            {message && (
              <div className="animate-slideUp" style={{ background: '#F0FDF4', color: '#065F46', border: '1px solid #BBF7D0', borderRadius: '14px', padding: '14px 18px', fontSize: '14px', marginBottom: '20px', fontWeight: 500 }}>
                {message}
              </div>
            )}

            {error && (
              <div style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', borderRadius: '14px', padding: '14px 18px', fontSize: '14px', marginBottom: '20px' }}>
                {error}
              </div>
            )}

            {loading ? (
              <p style={{ color: muted }}>Loading your talent pool status...</p>

            ) : talent?.status === 'active' ? (

              /* ACTIVE IN TALENT POOL */
              <div style={{ background: cardBg, borderRadius: '20px', padding: '28px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1.5px solid #DBEAFE' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: text, marginBottom: '4px' }}>
                      You are in the Talent Pool
                    </h3>
                    <p style={{ fontSize: '13px', color: muted }}>
                      Your consent expires: {new Date(talent.consentExpiry).toLocaleDateString()}
                    </p>
                  </div>
                  <span style={{ padding: '6px 16px', borderRadius: '999px', background: '#DCFCE7', color: '#166534', fontSize: '13px', fontWeight: 800 }}>
                    Active
                  </span>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: text, marginBottom: '14px' }}>
                    Your registered skills
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {talent.skillCategories?.map(skill => {
                      const cat = talentCategories.find(c => c.skill === skill);
                      return (
                        <span key={skill} style={{
                          background: cat?.bg || '#F0F9FF',
                          color: cat?.color || '#00B4D8',
                          padding: '8px 16px',
                          borderRadius: '999px',
                          fontSize: '13px',
                          fontWeight: 700,
                          border: `1.5px solid ${cat?.color || '#00B4D8'}30`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          {cat && (
                            <img
                              src={cat.char}
                              alt=""
                              style={{ width: '24px', height: '28px', objectFit: 'contain' }}
                              onError={e => e.target.style.display = 'none'}
                            />
                          )}
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div style={{ background: '#F0FDF4', borderRadius: '14px', padding: '16px 20px', marginBottom: '24px', border: '1px solid #BBF7D0' }}>
                  <p style={{ fontSize: '13px', color: '#065F46', lineHeight: 1.7, margin: 0 }}>
                    You will receive a notification whenever a matching job is posted. If you get a job elsewhere and are no longer looking, click below to remove yourself instantly. Companies will immediately lose access to your profile.
                  </p>
                </div>

                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: darkMode ? '#1E293B' : '#FEF2F2',
                    color: '#EF233C',
                    border: '2px solid #EF233C',
                    borderRadius: '14px',
                    fontWeight: 700,
                    fontSize: '15px',
                    cursor: withdrawing ? 'not-allowed' : 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'all 0.2s'
                  }}>
                  {withdrawing ? 'Removing you from Talent Pool...' : 'Leave Talent Pool and Stop Sharing My Profile'}
                </button>
              </div>

            ) : (

              /* JOIN TALENT POOL */
              <div style={{ background: cardBg, borderRadius: '20px', padding: '28px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: `1.5px solid ${border}` }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: text, marginBottom: '8px' }}>
                  Join the Talent Pool
                </h3>
                <p style={{ fontSize: '14px', color: muted, marginBottom: '24px', lineHeight: 1.7 }}>
                  Select your skill categories below. Click any skill to meet the character who represents that field. Your consent to be in the pool lasts 6 months and you can leave at any time.
                </p>

                {/* Skill grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '12px', marginBottom: '28px' }}>
                  {talentCategories.map(cat => {
                    const isSelected = selectedSkills.includes(cat.skill);
                    return (
                      <button
                        key={cat.skill}
                        type="button"
                        onClick={() => toggleSkill(cat.skill)}
                        style={{
                          padding: '14px 12px',
                          border: `2px solid ${isSelected ? cat.color : border}`,
                          background: isSelected ? cat.bg : (darkMode ? '#0F172A' : '#F8FAFC'),
                          borderRadius: '14px',
                          cursor: 'pointer',
                          fontFamily: 'Inter, sans-serif',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          textAlign: 'left',
                          transition: 'all 0.2s',
                          boxShadow: isSelected ? `0 4px 14px ${cat.color}30` : 'none'
                        }}>
                        <img
                          src={cat.char}
                          alt=""
                          style={{ width: '36px', height: '44px', objectFit: 'contain', flexShrink: 0 }}
                          onError={e => e.target.style.display = 'none'}
                        />
                        <div>
                          <p style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: isSelected ? cat.color : text,
                            margin: 0,
                            lineHeight: 1.3
                          }}>
                            {cat.skill}
                          </p>
                          {isSelected && (
                            <p style={{ fontSize: '10px', color: cat.color, margin: '2px 0 0', fontWeight: 600 }}>
                              Selected
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {selectedSkills.length > 0 && (
                  <div className="animate-slideUp" style={{ background: '#F0F9FF', borderRadius: '14px', padding: '14px 18px', marginBottom: '20px', border: '1px solid #DBEAFE' }}>
                    <p style={{ fontSize: '13px', color: '#1E40AF', fontWeight: 600, margin: 0 }}>
                      {selectedSkills.length} skill{selectedSkills.length !== 1 ? 's' : ''} selected. Companies will be able to find you for these roles.
                    </p>
                  </div>
                )}

                <div style={{ background: '#EFF6FF', borderRadius: '14px', padding: '14px 18px', marginBottom: '24px', border: '1px solid #BFDBFE' }}>
                  <p style={{ fontSize: '13px', color: '#1E40AF', lineHeight: 1.7, margin: 0 }}>
                    By joining you give KibaliGuard consent to match your profile with open positions for 6 months. You can leave at any time and companies will immediately lose access to your profile.
                  </p>
                </div>

                <button
                  onClick={handleJoin}
                  disabled={joining || selectedSkills.length === 0}
                  style={{
                    width: '100%',
                    padding: '15px',
                    background: joining || selectedSkills.length === 0 ? '#94A3B8' : '#FF6B35',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '14px',
                    fontWeight: 800,
                    fontSize: '16px',
                    cursor: joining || selectedSkills.length === 0 ? 'not-allowed' : 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: selectedSkills.length > 0 ? '0 8px 24px rgba(255,107,53,0.35)' : 'none',
                    transition: 'all 0.2s'
                  }}>
                  {joining ? (
                    <>
                      <span style={{
                        width: '18px',
                        height: '18px',
                        border: '3px solid rgba(255,255,255,0.3)',
                        borderTop: '3px solid #fff',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'kibashield-spin 0.8s linear infinite'
                      }} />
                      Joining Talent Pool...
                    </>
                  ) : selectedSkills.length > 0
                    ? `Join Talent Pool with ${selectedSkills.length} skill${selectedSkills.length !== 1 ? 's' : ''}`
                    : 'Select a skill to continue'
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TalentPool;