import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import KibaShield from '../components/KibaShield';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AccessLogs = () => {
  const { token, darkMode } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pose, setPose] = useState(1);
  const [shieldState, setShieldState] = useState('idle');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await axios.get(`${API}/api/access/my-logs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLogs(res.data);
        if (res.data.length > 0) {
          const hasGranted = res.data.some(l => l.accessGranted);
          const hasDenied = res.data.some(l => !l.accessGranted);
          if (hasDenied && !hasGranted) {
            setPose(4);
            setShieldState('danger');
          } else if (hasGranted) {
            setPose(3);
            setShieldState('warning');
          }
        }
      } catch (err) {
        console.error('Error fetching logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [token]);

  const card = {
    background: darkMode ? '#1E293B' : '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 24px rgba(30,58,95,0.08)'
  };

  const grantedCount = logs.filter(l => l.accessGranted).length;
  const deniedCount = logs.filter(l => !l.accessGranted).length;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: darkMode ? '#0F172A' : '#F8FAFC' }}>
      <Navbar />
      <div style={{ flex: 1, padding: '24px 16px', maxWidth: '1100px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        <h1 style={{ fontSize: '24px', fontWeight: 800, color: darkMode ? '#F1F5F9' : '#1E3A5F', marginBottom: '4px' }}>
          Access Logs
        </h1>
        <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>
          A full transparent history of every access attempt on your data
        </p>

        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <KibaShield pose={pose} shieldState={shieldState} />
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', background: '#D1FAE5', borderRadius: '12px', padding: '12px 20px' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#065F46', fontFamily: 'Roboto Mono, monospace' }}>{grantedCount}</div>
                <div style={{ fontSize: '11px', color: '#065F46', fontWeight: 600, textTransform: 'uppercase' }}>Granted</div>
              </div>
              <div style={{ textAlign: 'center', background: '#FEE2E2', borderRadius: '12px', padding: '12px 20px' }}>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#991B1B', fontFamily: 'Roboto Mono, monospace' }}>{deniedCount}</div>
                <div style={{ fontSize: '11px', color: '#991B1B', fontWeight: 600, textTransform: 'uppercase' }}>Denied</div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={card}>
              {loading ? (
                <p style={{ color: '#64748B', fontSize: '14px' }}>Loading your access logs...</p>
              ) : logs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <span style={{ fontSize: '52px' }}>📋</span>
                  <p style={{ color: '#64748B', marginTop: '16px', fontSize: '15px', fontWeight: 500 }}>
                    No access attempts recorded yet.
                  </p>
                  <p style={{ color: '#94A3B8', fontSize: '13px', marginTop: '8px', lineHeight: 1.6 }}>
                    When someone tries to access your documents the attempt will appear here whether it was granted or denied.
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                    <thead>
                      <tr style={{ background: '#1E3A5F' }}>
                        {['Who Accessed', 'Role', 'Purpose', 'Data Categories', 'Result', 'Date and Time'].map(h => (
                          <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: '#fff', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log, i) => (
                        <tr key={log._id} style={{ background: i % 2 === 0 ? (darkMode ? '#0F172A' : '#F8FAFC') : (darkMode ? '#1E293B' : '#fff') }}>
                          <td style={{ padding: '11px 14px', fontSize: '13px', color: darkMode ? '#CBD5E1' : '#1E293B', fontWeight: 600 }}>
                            {log.accessedBy?.fullName || 'Unknown'}
                          </td>
                          <td style={{ padding: '11px 14px', fontSize: '12px', color: '#64748B' }}>
                            {log.role}
                          </td>
                          <td style={{ padding: '11px 14px', fontSize: '13px', color: darkMode ? '#CBD5E1' : '#1E293B' }}>
                            {log.purpose}
                          </td>
                          <td style={{ padding: '11px 14px', fontSize: '12px', color: '#64748B' }}>
                            {log.dataCategories?.join(', ') || 'N/A'}
                          </td>
                          <td style={{ padding: '11px 14px' }}>
                            <span style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: log.accessGranted ? '#D1FAE5' : '#FEE2E2', color: log.accessGranted ? '#065F46' : '#991B1B' }}>
                              {log.accessGranted ? 'GRANTED' : 'DENIED'}
                            </span>
                          </td>
                          <td style={{ padding: '11px 14px', fontSize: '12px', color: '#64748B', fontFamily: 'Roboto Mono, monospace' }}>
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

export default AccessLogs;
