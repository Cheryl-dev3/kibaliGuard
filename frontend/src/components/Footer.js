import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  IconShield,
  IconMail,
  IconPhone,
  IconMapPin,
  IconBriefcaseFull,
  IconPeople,
  IconEye,
  IconLock,
  IconRobot,
  IconPrivacy,
  IconShieldCheck,
  IconFlag
} from '../Icons';

const Footer = () => {
  const { darkMode } = useAuth();
  const border = '#1E293B';
  const muted = '#64748B';
  const light = '#94A3B8';

  return (
    <footer style={{ background: '#0F172A', borderTop: `1px solid ${border}`, padding: '56px 40px 28px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '48px', marginBottom: '48px' }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <img src="/images/pose1.png" alt="Kiba" style={{ width: '34px', height: '34px', objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
              <span style={{ color: '#FFD60A', fontWeight: 900, fontSize: '20px', letterSpacing: '-0.5px' }}>
                Kibali<span style={{ color: '#00B4D8' }}>Guard</span>
              </span>
            </div>
            <p style={{ fontSize: '13px', color: light, lineHeight: 1.9, marginBottom: '20px', maxWidth: '240px' }}>
              A privacy first recruitment platform where applicants stay in full control of their personal documents throughout the hiring process.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { Icon: IconShieldCheck, color: '#00B4D8', label: 'Secure' },
                { Icon: IconLock, color: '#10B981', label: 'Private' },
                { Icon: IconEye, color: '#FFB703', label: 'Transparent' }
              ].map(item => (
                <div key={item.label} title={item.label} style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #334155' }}>
                  <item.Icon color={item.color} size={17} />
                </div>
              ))}
            </div>
          </div>

          {/* For Job Seekers */}
          <div>
            <h4 style={{ color: '#fff', fontWeight: 800, fontSize: '13px', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '1px' }}>For Job Seekers</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { to: '/', label: 'Browse open positions', Icon: IconBriefcaseFull },
                { to: '/register', label: 'Create a free account', Icon: IconPeople },
                { to: '/talent-pool', label: 'Join the Talent Pool', Icon: IconPeople },
                { to: '/privacy-centre', label: 'Manage your privacy', Icon: IconPrivacy },
                { to: '/access-logs', label: 'See who viewed your data', Icon: IconEye },
                { to: '/chat', label: 'Ask Kiba anything', Icon: IconRobot },
              ].map(item => (
                <Link key={item.label} to={item.to}
                  style={{ display: 'flex', alignItems: 'center', gap: '9px', color: light, textDecoration: 'none', fontSize: '13px', fontWeight: 500, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#FFD60A'}
                  onMouseLeave={e => e.currentTarget.style.color = light}>
                  <item.Icon color={muted} size={14} />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* For Employers */}
          <div>
            <h4 style={{ color: '#fff', fontWeight: 800, fontSize: '13px', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '1px' }}>For Employers</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { to: '/register', label: 'Register as an HR Officer', Icon: IconPeople },
                { to: '/staff', label: 'Post a job vacancy', Icon: IconBriefcaseFull },
                { to: '/staff', label: 'Review applications', Icon: IconEye },
                { to: '/staff', label: 'Request document access', Icon: IconLock },
                { to: '/staff', label: 'Manage your talent pipeline', Icon: IconShield },
              ].map((item, i) => (
                <Link key={i} to={item.to}
                  style={{ display: 'flex', alignItems: 'center', gap: '9px', color: light, textDecoration: 'none', fontSize: '13px', fontWeight: 500, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#FFD60A'}
                  onMouseLeave={e => e.currentTarget.style.color = light}>
                  <item.Icon color={muted} size={14} />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ color: '#fff', fontWeight: 800, fontSize: '13px', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '1px' }}>Get in Touch</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              {[
                { Icon: IconMail, text: 'support@kibaliguard.co.ke' },
                { Icon: IconPhone, text: '0794108262' },
                { Icon: IconMapPin, text: 'Nairobi, Kenya' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ flexShrink: 0, marginTop: '2px' }}>
                    <item.Icon color="#00B4D8" size={15} />
                  </div>
                  <span style={{ fontSize: '13px', color: light, lineHeight: 1.5 }}>{item.text}</span>
                </div>
              ))}
            </div>
            <div style={{ background: '#1E293B', borderRadius: '14px', padding: '16px', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <IconFlag color="#06D6A0" size={15} />
                <span style={{ color: '#06D6A0', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>KDPA 2019 Compliant</span>
              </div>
              <p style={{ fontSize: '12px', color: '#94A3B8', lineHeight: 1.7, margin: 0 }}>
                All data processing on KibaliGuard is governed by the Kenya Data Protection Act 2019. Your rights are technically enforced, not just written in a policy.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: `1px solid ${border}`, paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <p style={{ fontSize: '13px', color: muted, margin: 0, fontWeight: 500 }}>
              KibaliGuard Digital Services. All rights reserved.
            </p>
            <p style={{ fontSize: '12px', color: '#475569', margin: '4px 0 0' }}>
              Cheryl Kreativ Studio · Nairobi, Kenya
            </p>
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {['Privacy Policy', 'Terms of Use', 'Data Rights', 'Contact Us'].map((label, i) => (
              <Link key={i} to="/register"
                style={{ fontSize: '13px', color: muted, textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#00B4D8'}
                onMouseLeave={e => e.currentTarget.style.color = muted}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;