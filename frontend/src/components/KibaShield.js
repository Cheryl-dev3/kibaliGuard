import React, { useEffect, useState } from 'react';

const KibaShield = ({ pose = 1, shieldState = 'idle', customLabel = null, size = 'normal' }) => {
  const [displayPose, setDisplayPose] = useState(pose);

  useEffect(() => {
    setDisplayPose(pose);
  }, [pose]);

  const antennaColor = {
    1: '#10B981', 2: '#10B981', 3: '#F59E0B',
    4: '#EF4444', 5: '#0EA5E9', 6: '#F59E0B',
    7: '#0EA5E9', 8: '#10B981', 9: '#10B981',
  };

  const shieldStyles = {
    idle: { borderColor: '#0EA5E9', boxShadow: '0 0 24px 6px rgba(14,165,233,0.35)', animation: 'kibashield-pulse-blue 3s ease-in-out infinite' },
    success: { borderColor: '#10B981', boxShadow: '0 0 48px 16px rgba(16,185,129,0.75)', animation: 'kibashield-flash-green 0.5s ease-in-out 4' },
    danger: { borderColor: '#EF4444', boxShadow: '0 0 48px 16px rgba(239,68,68,0.75)', animation: 'kibashield-flash-red 0.4s ease-in-out 4' },
    warning: { borderColor: '#F59E0B', boxShadow: '0 0 40px 12px rgba(245,158,11,0.6)', animation: 'kibashield-shimmer-orange 1.5s ease-in-out infinite' },
    blue: { borderColor: '#0EA5E9', boxShadow: '0 0 40px 12px rgba(14,165,233,0.6)', animation: 'kibashield-pulse-blue 2s ease-in-out infinite' },
  };

  const antennaAnimations = {
    1: 'none', 2: 'kibashield-flash-green 0.5s ease-in-out infinite',
    3: 'none', 4: 'kibashield-flash-red 0.4s ease-in-out infinite',
    5: 'none', 6: 'none', 7: 'kibashield-spin 1s linear infinite',
    8: 'none', 9: 'none',
  };

  const poseLabels = {
    1: 'Kiba is ready', 2: 'Great success!', 3: 'Heads up!',
    4: 'Access denied!', 5: 'Consent withdrawn', 6: 'Expiring soon!',
    7: 'Processing securely...', 8: 'Hello there!', 9: 'Your secret is safe with us',
  };

  const shieldWidth = size === 'small' ? 180 : size === 'large' ? 300 : 240;
  const shieldHeight = size === 'small' ? 215 : size === 'large' ? 358 : 286;
  const imgWidth = size === 'small' ? 110 : size === 'large' ? 185 : 150;
  const imgHeight = size === 'small' ? 130 : size === 'large' ? 220 : 175;
  const padlockTop = size === 'small' ? 10 : 14;
  const antennaTop = size === 'small' ? 22 : 30;
  const antennaDot = size === 'small' ? 10 : 13;
  const antennaStem = size === 'small' ? 16 : 22;
  const imgMarginTop = size === 'small' ? 28 : 40;

  const currentShield = shieldStyles[shieldState] || shieldStyles.idle;
  const currentAntennaColor = antennaColor[displayPose] || '#10B981';
  const currentAntennaAnimation = antennaAnimations[displayPose] || 'none';

  return (
    <>
      <style>{`
        @keyframes kibashield-pulse-blue {
          0%, 100% { box-shadow: 0 0 24px 6px rgba(14,165,233,0.35); }
          50% { box-shadow: 0 0 40px 14px rgba(14,165,233,0.6); }
        }
        @keyframes kibashield-flash-green {
          0%, 100% { box-shadow: 0 0 24px 6px rgba(16,185,129,0.3); }
          50% { box-shadow: 0 0 64px 24px rgba(16,185,129,0.9); }
        }
        @keyframes kibashield-flash-red {
          0%, 100% { box-shadow: 0 0 24px 6px rgba(239,68,68,0.3); }
          50% { box-shadow: 0 0 64px 24px rgba(239,68,68,0.9); }
        }
        @keyframes kibashield-shimmer-orange {
          0%, 100% { box-shadow: 0 0 24px 6px rgba(245,158,11,0.3); }
          50% { box-shadow: 0 0 48px 18px rgba(245,158,11,0.7); }
        }
        @keyframes kibashield-bounce {
          0%, 100% { transform: translateY(0px); }
          25% { transform: translateY(-5px); }
          50% { transform: translateY(-10px); }
          75% { transform: translateY(-5px); }
        }
        @keyframes kibashield-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 600px) {
          .kiba-shield-wrapper { transform: scale(0.65); transform-origin: top center; margin: -20px 0; }
        }
        @media (max-width: 420px) {
          .kiba-shield-wrapper { transform: scale(0.5); transform-origin: top center; margin: -40px 0; }
        }
        @media (max-width: 360px) {
          .kiba-shield-wrapper { transform: scale(0.42); transform-origin: top center; margin: -50px 0; }
        }
      `}</style>

      <div className="kiba-shield-wrapper" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        width: '100%',
        maxWidth: `min(${shieldWidth + 40}px, 90vw)`,
        margin: '0 auto',
      }}>
        <div style={{
          width: `${shieldWidth}px`,
          height: `${shieldHeight}px`,
          position: 'relative',
          animation: currentShield.animation,
          boxShadow: currentShield.boxShadow,
          transition: 'box-shadow 0.4s ease',
          clipPath: 'polygon(50% 0%, 100% 18%, 100% 62%, 50% 100%, 0% 62%, 0% 18%)',
          background: '#1E3A5F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            clipPath: 'polygon(50% 0%, 100% 18%, 100% 62%, 50% 100%, 0% 62%, 0% 18%)',
            border: `3px solid ${currentShield.borderColor}`,
            zIndex: 1, transition: 'border-color 0.4s ease', pointerEvents: 'none',
          }} />

          <div style={{ position: 'absolute', top: `${padlockTop}px`, left: '50%', transform: 'translateX(-50%)', fontSize: size === 'small' ? '13px' : '16px', zIndex: 4, filter: 'drop-shadow(0 0 6px #0EA5E9)', userSelect: 'none' }}>
            🔒
          </div>

          <div style={{ position: 'absolute', top: `${antennaTop}px`, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 4 }}>
            <div style={{ width: `${antennaDot}px`, height: `${antennaDot}px`, borderRadius: '50%', background: currentAntennaColor, boxShadow: `0 0 10px 4px ${currentAntennaColor}`, animation: currentAntennaAnimation, transition: 'background 0.3s ease' }} />
            <div style={{ width: '3px', height: `${antennaStem}px`, background: 'linear-gradient(to bottom, #94A3B8, #475569)', borderRadius: '2px' }} />
          </div>

          <div style={{ position: 'relative', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: `${imgMarginTop}px`, animation: 'kibashield-bounce 2.5s ease-in-out infinite' }}>
            <img
              src={`/images/pose${displayPose}.png`}
              alt={poseLabels[displayPose]}
              style={{ width: `${imgWidth}px`, height: `${imgHeight}px`, objectFit: 'contain', objectPosition: 'center', filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.4))', transition: 'all 0.35s ease', userSelect: 'none', pointerEvents: 'none', display: 'block', margin: '0 auto' }}
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div style={{ display: 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: `${imgWidth}px`, height: `${imgHeight}px`, gap: '6px' }}>
              <span style={{ fontSize: size === 'small' ? '48px' : '64px', lineHeight: 1 }}>🤖</span>
              <span style={{ color: '#0EA5E9', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Pose {displayPose}</span>
            </div>
          </div>
        </div>

        <div style={{ fontSize: '11px', color: currentAntennaColor, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', textShadow: `0 0 8px ${currentAntennaColor}88`, transition: 'color 0.3s ease', userSelect: 'none', textAlign: 'center' }}>
          {customLabel || poseLabels[displayPose]}
        </div>
      </div>
    </>
  );
};

export default KibaShield;
