import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  IconBriefcaseFull,
  IconEye,
  IconPeople,
  IconRobot,
  IconLogOut,
  IconSun,
  IconMoon,
  IconMenu,
  IconX,
  IconPrivacy,
  IconShieldCheck,
  IconSettings,
  IconBuilding,
  IconBriefcase,
  IconTimeline
} from '../Icons';

const Navbar = () => {
  const { user, logout, darkMode, toggleDark } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const linkStyle = (path) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    padding: '8px 14px',
    borderRadius: '10px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '13px',
    transition: 'all 0.2s',
    background: isActive(path) ? 'rgba(255,214,10,0.15)' : 'transparent',
    color: isActive(path) ? '#FFD60A' : '#CBD5E1',
    fontFamily: 'Inter, sans-serif',
    whiteSpace: 'nowrap'
  });

  const customerLinks = [
    { to: '/', label: 'Browse Jobs', Icon: IconBriefcaseFull },
    { to: '/dashboard', label: 'Dashboard', Icon: IconShieldCheck },
    { to: '/privacy-centre', label: 'Privacy Centre', Icon: IconPrivacy },
    { to: '/access-logs', label: 'Who Saw My Docs', Icon: IconEye },
    { to: '/talent-pool', label: 'Talent Pool', Icon: IconPeople },
    { to: '/chat', label: 'Ask Kiba', Icon: IconRobot },
  ];

  const staffLinks = [
    { to: '/staff', label: 'Dashboard', Icon: IconShieldCheck },
    { to: '/staff', label: 'Post a Job', Icon: IconBriefcaseFull },
    { to: '/staff', label: 'Applications', Icon: IconBriefcase },
    { to: '/staff', label: 'Request Access', Icon: IconEye },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', Icon: IconSettings },
    { to: '/', label: 'View Platform', Icon: IconBuilding },
  ];

  const navLinks = user?.role === 'customer' ? customerLinks
    : user?.role === 'staff' ? staffLinks
    : user?.role === 'admin' ? adminLinks
    : [];

  return (
    <>
      <nav style={{
        background: '#0F172A',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 20px rgba(0,0,0,0.4)'
      }}>

        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}>
          <img
            src="/images/pose1.png"
            alt="Kiba"
            style={{ width: '34px', height: '34px', objectFit: 'contain', animation: 'floatCharacter 3s ease-in-out infinite' }}
            onError={e => e.target.style.display = 'none'}
          />
          <span style={{ color: '#FFD60A', fontWeight: 900, fontSize: '20px', letterSpacing: '-0.5px' }}>
            Kibali<span style={{ color: '#00B4D8' }}>Guard</span>
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', overflowX: 'auto', flex: 1, padding: '0 16px', scrollbarWidth: 'none' }}>
          {navLinks.map(link => (
            <Link
              key={link.to + link.label}
              to={link.to}
              style={linkStyle(link.to)}
              onMouseEnter={e => {
                if (!isActive(link.to)) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={e => {
                if (!isActive(link.to)) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#CBD5E1';
                }
              }}>
              <link.Icon color={isActive(link.to) ? '#FFD60A' : '#CBD5E1'} size={15} />
              {link.label}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>

          <button
            onClick={toggleDark}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              background: 'rgba(255,214,10,0.1)',
              border: '1px solid rgba(255,214,10,0.3)',
              borderRadius: '8px',
              padding: '7px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.2s'
            }}>
            {darkMode
              ? <IconSun color="#FFD60A" size={17} />
              : <IconMoon color="#FFD60A" size={17} />
            }
          </button>

          {user ? (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '10px',
                padding: '6px 12px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: user.role === 'admin' ? '#EF4444' : user.role === 'staff' ? '#FFB703' : '#00B4D8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <span style={{ fontSize: '13px', fontWeight: 900, color: '#fff' }}>
                    {user.fullName?.charAt(0)}
                  </span>
                </div>
                <div style={{ lineHeight: 1 }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#fff', margin: 0 }}>
                    {user.fullName?.split(' ')[0]}
                  </p>
                  <p style={{ fontSize: '10px', color: '#94A3B8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {user.role}
                  </p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#EF4444',
                  fontSize: '13px',
                  fontWeight: 600,
                  fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}>
                <IconLogOut color="#EF4444" size={15} />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                style={{ color: '#CBD5E1', textDecoration: 'none', fontWeight: 600, fontSize: '13px', padding: '8px 12px' }}>
                Sign In
              </Link>
              <Link
                to="/register"
                style={{
                  padding: '9px 20px',
                  background: '#FF6B35',
                  color: '#fff',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  fontWeight: 800,
                  fontSize: '13px',
                  boxShadow: '0 4px 12px rgba(255,107,53,0.4)'
                }}>
                Get Started
              </Link>
            </>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center'
            }}>
            {menuOpen ? <IconX color="#fff" size={22} /> : <IconMenu color="#fff" size={22} />}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div
          className="animate-slideUp"
          style={{
            background: '#0F172A',
            borderBottom: '1px solid #334155',
            padding: '12px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            position: 'sticky',
            top: '64px',
            zIndex: 99
          }}>
          {navLinks.map(link => (
            <Link
              key={link.to + link.label}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '14px',
                color: isActive(link.to) ? '#FFD60A' : '#CBD5E1',
                background: isActive(link.to) ? 'rgba(255,214,10,0.1)' : 'transparent'
              }}>
              <link.Icon color={isActive(link.to) ? '#FFD60A' : '#CBD5E1'} size={17} />
              {link.label}
            </Link>
          ))}
          {user && (
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(239,68,68,0.1)',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                color: '#EF4444',
                fontFamily: 'Inter, sans-serif',
                marginTop: '8px'
              }}>
              <IconLogOut color="#EF4444" size={17} />
              Sign Out
            </button>
          )}
        </div>
      )}
    </>
  );
};

export default Navbar;