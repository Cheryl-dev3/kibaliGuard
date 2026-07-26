import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  IconUsers,
  IconClipboard,
  IconFlag,
  IconClockAlert,
  IconChevronDown,
  IconChevronRight,
  IconFile,
  IconMapPin,
  IconCalendar,
  IconDollar,
  IconLock
} from '../Icons';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AdminDashboard = () => {
  const { token, darkMode } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [consents, setConsents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [companyForm, setCompanyForm] = useState({
    name: '', industry: '', location: '',
    email: '', phone: '', website: '', description: ''
  });
  const [companyMsg, setCompanyMsg] = useState('');
  const [companyError, setCompanyError] = useState('');
  const [assignUserId, setAssignUserId] = useState('');
  const [assignCompanyId, setAssignCompanyId] = useState('');
  const [assignMsg, setAssignMsg] = useState('');
  const [appFilter, setAppFilter] = useState('all');
  const [logFilter, setLogFilter] = useState('all');
  const [expandedAppId, setExpandedAppId] = useState(null);
  const [expandedJobId, setExpandedJobId] = useState(null);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAll = async () => {
    try {
      const [statsRes, usersRes, logsRes, consentsRes, companiesRes, applicationsRes, jobsRes] = await Promise.all([
        axios.get(`${API}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/admin/logs`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/admin/consents`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/companies`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/admin/applications`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/admin/jobs`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setLogs(logsRes.data);
      setConsents(consentsRes.data);
      setCompanies(companiesRes.data);
      setApplications(applicationsRes.data);
      setJobs(jobsRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setCompanyMsg('');
    setCompanyError('');
    try {
      await axios.post(`${API}/api/companies`, companyForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCompanyMsg('Company created successfully');
      setCompanyForm({ name: '', industry: '', location: '', email: '', phone: '', website: '', description: '' });
      fetchAll();
    } catch (err) {
      setCompanyError(err.response?.data?.message || 'Error creating company');
    }
  };

  const handleAssignStaff = async (e) => {
    e.preventDefault();
    setAssignMsg('');
    try {
      await axios.put(
        `${API}/api/companies/assign-staff/${assignUserId}`,
        { companyId: assignCompanyId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssignMsg('Staff assigned to company successfully');
      fetchAll();
    } catch (err) {
      setAssignMsg('Error assigning staff. Please try again.');
    }
  };

  const goTo = (tab, filterSetter, filterValue) => {
    setActiveTab(tab);
    if (filterSetter) filterSetter(filterValue);
  };

  const card = {
    background: darkMode ? '#1E293B' : '#fff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 24px rgba(30,58,95,0.08)'
  };

  const tabStyle = (active) => ({
    padding: '10px 18px',
    borderRadius: '10px',
    border: 'none',
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer',
    fontFamily: 'Inter, sans-serif',
    background: active ? '#0F172A' : 'transparent',
    color: active ? '#FFD60A' : '#64748B',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap'
  });

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    border: '2px solid #E2E8F0',
    borderRadius: '10px',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
    background: darkMode ? '#0F172A' : '#fff',
    color: darkMode ? '#F1F5F9' : '#1E293B',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '12px'
  };

  const filteredApplications = appFilter === 'all'
    ? applications
    : applications.filter(a => a.status === appFilter);

  const filteredLogs = logFilter === 'all'
    ? logs
    : logFilter === 'granted'
      ? logs.filter(l => l.accessGranted)
      : logs.filter(l => !l.accessGranted);

  const statusConfig = {
    received: { bg: '#E0F2FE', color: '#075985', label: 'Received' },
    under_review: { bg: '#FEF3C7', color: '#92400E', label: 'Under Review' },
    shortlisted: { bg: '#F3E8FF', color: '#6B21A8', label: 'Shortlisted' },
    hired: { bg: '#D1FAE5', color: '#065F46', label: 'Hired' },
    rejected: { bg: '#FEE2E2', color: '#991B1B', label: 'Not Selected' }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#00B4D8', fontFamily: 'Inter, sans-serif', fontSize: 16 }}>
      Loading admin dashboard...
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: darkMode ? '#0F172A' : '#F8FAFC' }}>
      <Navbar />
      <div style={{ flex: 1, padding: '24px 16px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        <h1 style={{ fontSize: '24px', fontWeight: 800, color: darkMode ? '#F1F5F9' : '#0F172A', marginBottom: '4px' }}>
          Admin Dashboard
        </h1>
        <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '24px' }}>
          Manage companies, staff, users and view full audit logs. Click any card below to jump straight to that section.
        </p>

        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '24px' }}>
            {[
              { label: 'Total Users', value: stats.totalUsers, color: '#0F172A', textColor: '#FFD60A', onClick: () => goTo('users') },
              { label: 'Total Jobs', value: stats.totalJobs || 0, color: '#00B4D8', textColor: '#fff', onClick: () => goTo('jobs') },
              { label: 'Applications', value: stats.totalApplications || 0, color: '#7C3AED', textColor: '#fff', onClick: () => goTo('applications', setAppFilter, 'all') },
              { label: 'Hired', value: stats.hired || 0, color: '#10B981', textColor: '#fff', onClick: () => goTo('applications', setAppFilter, 'hired') },
              { label: 'Shortlisted', value: stats.shortlisted || 0, color: '#FFB703', textColor: '#0F172A', onClick: () => goTo('applications', setAppFilter, 'shortlisted') },
              { label: 'Active Consents', value: stats.activeConsents, color: '#06D6A0', textColor: '#0F172A', onClick: () => goTo('consents') },
              { label: 'Access Granted', value: stats.grantedAccess, color: '#10B981', textColor: '#fff', onClick: () => goTo('logs', setLogFilter, 'granted') },
              { label: 'Access Denied', value: stats.deniedAccess, color: '#EF4444', textColor: '#fff', onClick: () => goTo('logs', setLogFilter, 'denied') },
              { label: 'Total Requests', value: stats.totalAccess, color: '#FF6B35', textColor: '#fff', onClick: () => goTo('logs', setLogFilter, 'all') }
            ].map(s => (
              <button key={s.label} onClick={s.onClick}
                style={{ background: s.color, borderRadius: '16px', textAlign: 'center', padding: '18px 14px', cursor: 'pointer', border: 'none', transition: 'transform 0.15s', boxShadow: `0 4px 16px ${s.color}40` }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <div style={{ fontSize: '30px', fontWeight: 900, color: s.textColor, fontFamily: 'Roboto Mono, monospace', lineHeight: 1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '11px', color: s.textColor, fontWeight: 700, marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.85 }}>
                  {s.label}
                </div>
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', overflowX: 'auto' }}>
          {['overview', 'companies', 'users', 'applications', 'jobs', 'consents', 'logs'].map(t => (
            <button key={t} style={tabStyle(activeTab === t)} onClick={() => setActiveTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div style={card}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: darkMode ? '#F1F5F9' : '#0F172A', marginBottom: '12px' }}>
              System Overview
            </h3>
            <p style={{ color: '#64748B', fontSize: '14px', lineHeight: 1.8 }}>
              KibaliGuard is operating normally. All consent rules are being enforced automatically. Every access attempt is logged with full details including timestamp, role and purpose. The system currently has {stats?.totalUsers || 0} registered users, {stats?.totalJobs || 0} active job postings and {stats?.totalApplications || 0} total applications. Click any stat card above or use the tabs to explore.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '20px' }}>
              {[
                { Icon: IconFlag, color: '#10B981', bg: '#D1FAE5', label: 'Kenya Data Protection Act 2019', desc: 'All consent rules enforce purpose limitation and time-limited access in compliance with the Act.' },
                { Icon: IconLock, color: '#00B4D8', bg: '#E0F2FE', label: 'Rule Based Access Control', desc: 'Staff can only access applicant data if valid consent exists for their specific role and purpose.' },
                { Icon: IconClipboard, color: '#8B5CF6', bg: '#F3E8FF', label: 'Transparent Audit Trail', desc: 'Every access attempt whether granted or denied is logged with full details and timestamps.' },
                { Icon: IconClockAlert, color: '#F59E0B', bg: '#FEF3C7', label: 'Auto Expiry Engine', desc: 'Consent expires automatically after the applicant defined duration. No manual intervention needed.' }
              ].map(item => (
                <div key={item.label} style={{ background: darkMode ? '#0F172A' : '#F8FAFC', borderRadius: '12px', padding: '18px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                    <item.Icon color={item.color} size={22} />
                  </div>
                  <p style={{ fontWeight: 700, fontSize: '13px', color: darkMode ? '#F1F5F9' : '#0F172A', marginBottom: '6px' }}>{item.label}</p>
                  <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.6 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'companies' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={card}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: darkMode ? '#F1F5F9' : '#0F172A', marginBottom: '16px' }}>
                Add New Company
              </h3>
              {companyMsg && (
                <div style={{ background: '#F0FDF4', color: '#10B981', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '12px', fontSize: '13px', marginBottom: '12px' }}>
                  {companyMsg}
                </div>
              )}
              {companyError && (
                <div style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px', fontSize: '13px', marginBottom: '12px' }}>
                  {companyError}
                </div>
              )}
              <form onSubmit={handleCreateCompany}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <input style={inputStyle} placeholder="Company name" value={companyForm.name} onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} required />
                  <input style={inputStyle} placeholder="Industry e.g. Recruitment" value={companyForm.industry} onChange={e => setCompanyForm({ ...companyForm, industry: e.target.value })} required />
                  <input style={inputStyle} placeholder="Location e.g. Nairobi" value={companyForm.location} onChange={e => setCompanyForm({ ...companyForm, location: e.target.value })} required />
                  <input style={inputStyle} placeholder="Company email" type="email" value={companyForm.email} onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })} required />
                  <input style={inputStyle} placeholder="Phone (optional)" value={companyForm.phone} onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })} />
                  <input style={inputStyle} placeholder="Website (optional)" value={companyForm.website} onChange={e => setCompanyForm({ ...companyForm, website: e.target.value })} />
                </div>
                <textarea
                  placeholder="Company description (optional)"
                  value={companyForm.description}
                  onChange={e => setCompanyForm({ ...companyForm, description: e.target.value })}
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
                <button type="submit" style={{ padding: '12px 28px', background: '#0F172A', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  Create Company
                </button>
              </form>
            </div>

            <div style={card}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: darkMode ? '#F1F5F9' : '#0F172A', marginBottom: '16px' }}>
                Assign Staff to Company
              </h3>
              {assignMsg && (
                <div style={{ background: assignMsg.includes('Error') ? '#FEF2F2' : '#F0FDF4', color: assignMsg.includes('Error') ? '#EF4444' : '#10B981', border: `1px solid ${assignMsg.includes('Error') ? '#FECACA' : '#BBF7D0'}`, borderRadius: '10px', padding: '12px', fontSize: '13px', marginBottom: '12px' }}>
                  {assignMsg}
                </div>
              )}
              <form onSubmit={handleAssignStaff}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <select style={inputStyle} value={assignUserId} onChange={e => setAssignUserId(e.target.value)} required>
                    <option value="">Select staff member</option>
                    {users.filter(u => u.role === 'staff').map(u => (
                      <option key={u._id} value={u._id}>{u.fullName} · {u.email || u.phone}</option>
                    ))}
                  </select>
                  <select style={inputStyle} value={assignCompanyId} onChange={e => setAssignCompanyId(e.target.value)} required>
                    <option value="">Select company</option>
                    {companies.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <button type="submit" style={{ padding: '12px 28px', background: '#00B4D8', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  Assign Staff
                </button>
              </form>
            </div>

            <div style={card}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: darkMode ? '#F1F5F9' : '#0F172A', marginBottom: '16px' }}>
                All Companies ({companies.length})
              </h3>
              {companies.length === 0 ? (
                <p style={{ color: '#64748B', fontSize: '14px' }}>No companies added yet. Create your first company above.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                  {companies.map(c => (
                    <div key={c._id} style={{ background: darkMode ? '#0F172A' : '#F8FAFC', borderRadius: '12px', padding: '16px' }}>
                      <p style={{ fontWeight: 700, fontSize: '15px', color: darkMode ? '#F1F5F9' : '#0F172A', marginBottom: '4px' }}>{c.name}</p>
                      <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '2px' }}>{c.industry} · {c.location}</p>
                      <p style={{ fontSize: '12px', color: '#94A3B8' }}>{c.email}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div style={card}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: darkMode ? '#F1F5F9' : '#0F172A', marginBottom: '16px' }}>
              All Users ({users.length})
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                <thead>
                  <tr style={{ background: '#0F172A' }}>
                    {['Full Name', 'Email', 'Phone', 'Role', 'Applicant ID', 'Joined'].map(h => (
                      <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: '#fff', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u._id} style={{ background: i % 2 === 0 ? (darkMode ? '#0F172A' : '#F8FAFC') : 'transparent' }}>
                      <td style={{ padding: '11px 14px', fontSize: '13px', color: darkMode ? '#CBD5E1' : '#1E293B', fontWeight: 600 }}>{u.fullName}</td>
                      <td style={{ padding: '11px 14px', fontSize: '12px', color: '#64748B' }}>{u.email || 'N/A'}</td>
                      <td style={{ padding: '11px 14px', fontSize: '12px', color: '#64748B' }}>{u.phone || 'N/A'}</td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: u.role === 'admin' ? '#FEE2E2' : u.role === 'staff' ? '#FEF3C7' : '#E0F2FE', color: u.role === 'admin' ? '#991B1B' : u.role === 'staff' ? '#92400E' : '#075985' }}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: '12px', color: '#64748B', fontFamily: 'Roboto Mono, monospace' }}>
                        {u.applicantId || 'N/A'}
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: '12px', color: '#64748B', fontFamily: 'Roboto Mono, monospace' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'applications' && (
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: darkMode ? '#F1F5F9' : '#0F172A', margin: 0 }}>
                All Applications ({filteredApplications.length})
              </h3>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['all', 'received', 'under_review', 'shortlisted', 'hired', 'rejected'].map(f => (
                  <button key={f} onClick={() => setAppFilter(f)}
                    style={{ padding: '6px 14px', borderRadius: '999px', border: '1.5px solid', borderColor: appFilter === f ? '#00B4D8' : '#E2E8F0', background: appFilter === f ? '#E0F2FE' : 'transparent', color: appFilter === f ? '#075985' : '#64748B', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                    {f === 'all' ? 'All' : (statusConfig[f]?.label || f)}
                  </button>
                ))}
              </div>
            </div>

            {filteredApplications.length === 0 ? (
              <p style={{ color: '#64748B', fontSize: '14px' }}>No applications match this filter.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredApplications.map(app => {
                  const config = statusConfig[app.status] || statusConfig.received;
                  const isExpanded = expandedAppId === app._id;
                  return (
                    <div key={app._id} style={{ background: darkMode ? '#0F172A' : '#F8FAFC', borderRadius: '12px', border: `1px solid ${darkMode ? '#334155' : '#E2E8F0'}`, overflow: 'hidden' }}>
                      <button onClick={() => setExpandedAppId(isExpanded ? null : app._id)}
                        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontFamily: 'Inter, sans-serif', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {isExpanded ? <IconChevronDown color="#00B4D8" size={16} /> : <IconChevronRight color="#64748B" size={16} />}
                          <div>
                            <p style={{ fontWeight: 700, fontSize: '14px', color: darkMode ? '#F1F5F9' : '#1E293B', margin: 0 }}>{app.applicant?.fullName}</p>
                            <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>{app.job?.title} · {app.company?.name} · ID: {app.applicant?.applicantId || 'N/A'}</p>
                          </div>
                        </div>
                        <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: config.bg, color: config.color }}>
                          {config.label}
                        </span>
                      </button>
                      {isExpanded && (
                        <div style={{ padding: '0 16px 16px 42px', borderTop: `1px solid ${darkMode ? '#334155' : '#E2E8F0'}` }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '12px', marginBottom: '12px' }}>
                            <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Email: {app.applicant?.email || 'N/A'}</p>
                            <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Phone: {app.applicant?.phone || 'N/A'}</p>
                            <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Applied: {new Date(app.createdAt).toLocaleString()}</p>
                          </div>
                          {app.coverLetter && (
                            <div style={{ marginBottom: '12px' }}>
                              <p style={{ fontSize: '12px', fontWeight: 700, color: darkMode ? '#CBD5E1' : '#1E293B', marginBottom: '4px' }}>Cover Letter</p>
                              <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.6, background: darkMode ? '#1E293B' : '#fff', padding: '10px 14px', borderRadius: '8px' }}>{app.coverLetter}</p>
                            </div>
                          )}
                          <p style={{ fontSize: '12px', fontWeight: 700, color: darkMode ? '#CBD5E1' : '#1E293B', marginBottom: '6px' }}>Documents Submitted</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {app.documents?.length === 0 ? (
                              <p style={{ fontSize: '12px', color: '#94A3B8' }}>No documents uploaded</p>
                            ) : app.documents?.map((doc, i) => (
                              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: darkMode ? '#1E293B' : '#fff', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, color: darkMode ? '#CBD5E1' : '#1E293B', border: `1px solid ${darkMode ? '#334155' : '#E2E8F0'}` }}>
                                <IconFile color="#00B4D8" size={13} />
                                {doc.documentName}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'jobs' && (
          <div style={card}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: darkMode ? '#F1F5F9' : '#0F172A', marginBottom: '16px' }}>
              All Jobs ({jobs.length})
            </h3>
            {jobs.length === 0 ? (
              <p style={{ color: '#64748B', fontSize: '14px' }}>No jobs posted yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {jobs.map(job => {
                  const isExpanded = expandedJobId === job._id;
                  return (
                    <div key={job._id} style={{ background: darkMode ? '#0F172A' : '#F8FAFC', borderRadius: '12px', border: `1px solid ${darkMode ? '#334155' : '#E2E8F0'}`, overflow: 'hidden' }}>
                      <button onClick={() => setExpandedJobId(isExpanded ? null : job._id)}
                        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', fontFamily: 'Inter, sans-serif', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {isExpanded ? <IconChevronDown color="#00B4D8" size={16} /> : <IconChevronRight color="#64748B" size={16} />}
                          <div>
                            <p style={{ fontWeight: 700, fontSize: '14px', color: darkMode ? '#F1F5F9' : '#1E293B', margin: 0 }}>{job.title}</p>
                            <p style={{ fontSize: '12px', color: '#64748B', margin: '2px 0 0' }}>{job.company?.name} · Posted by {job.postedBy?.fullName || 'Unknown'}</p>
                          </div>
                        </div>
                        <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: job.isActive ? '#D1FAE5' : '#FEE2E2', color: job.isActive ? '#065F46' : '#991B1B' }}>
                          {job.isActive ? 'ACTIVE' : 'CLOSED'}
                        </span>
                      </button>
                      {isExpanded && (
                        <div style={{ padding: '0 16px 16px 42px', borderTop: `1px solid ${darkMode ? '#334155' : '#E2E8F0'}` }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', margin: '12px 0' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B' }}><IconMapPin size={13}/> {job.location}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B' }}><IconCalendar size={13}/> Closes {new Date(job.deadline).toLocaleDateString()}</span>
                            {job.salaryRange && <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B' }}><IconDollar size={13}/> {job.salaryRange}</span>}
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B' }}><IconUsers size={13}/> {job.applicantCount || 0} applicant{job.applicantCount !== 1 ? 's' : ''}</span>
                          </div>
                          <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.7, marginBottom: '12px' }}>{job.description}</p>
                          {job.requiredDocuments?.length > 0 && (
                            <>
                              <p style={{ fontSize: '12px', fontWeight: 700, color: darkMode ? '#CBD5E1' : '#1E293B', marginBottom: '6px' }}>Required Documents</p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {job.requiredDocuments.map((doc, i) => (
                                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: darkMode ? '#1E293B' : '#fff', padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, color: darkMode ? '#CBD5E1' : '#1E293B', border: `1px solid ${darkMode ? '#334155' : '#E2E8F0'}` }}>
                                    <IconFile color="#00B4D8" size={13} />
                                    {doc.name}
                                  </span>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'consents' && (
          <div style={card}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: darkMode ? '#F1F5F9' : '#0F172A', marginBottom: '16px' }}>
              All Consents ({consents.length})
            </h3>
            {consents.length === 0 ? (
              <p style={{ color: '#64748B', fontSize: '14px' }}>No consents recorded yet. Consents are created when applicants apply for jobs or use the Give Consent feature.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                  <thead>
                    <tr style={{ background: '#0F172A' }}>
                      {['Customer', 'Purpose', 'Allowed Role', 'Status', 'Expires'].map(h => (
                        <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: '#fff', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {consents.map((c, i) => (
                      <tr key={c._id} style={{ background: i % 2 === 0 ? (darkMode ? '#0F172A' : '#F8FAFC') : 'transparent' }}>
                        <td style={{ padding: '11px 14px', fontSize: '13px', color: darkMode ? '#CBD5E1' : '#1E293B', fontWeight: 500 }}>{c.customer?.fullName}</td>
                        <td style={{ padding: '11px 14px', fontSize: '13px', color: '#64748B' }}>{c.purpose}</td>
                        <td style={{ padding: '11px 14px', fontSize: '13px', color: '#64748B' }}>{c.allowedRole}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: c.status === 'active' ? '#D1FAE5' : c.status === 'expired' ? '#FEE2E2' : '#E0F2FE', color: c.status === 'active' ? '#065F46' : c.status === 'expired' ? '#991B1B' : '#075985' }}>
                            {c.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px', fontSize: '12px', color: '#64748B', fontFamily: 'Roboto Mono, monospace' }}>
                          {new Date(c.expiresAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: darkMode ? '#F1F5F9' : '#0F172A', margin: 0 }}>
                Full Audit Logs ({filteredLogs.length})
              </h3>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { key: 'all', label: 'All' },
                  { key: 'granted', label: 'Granted' },
                  { key: 'denied', label: 'Denied' }
                ].map(f => (
                  <button key={f.key} onClick={() => setLogFilter(f.key)}
                    style={{ padding: '6px 14px', borderRadius: '999px', border: '1.5px solid', borderColor: logFilter === f.key ? '#00B4D8' : '#E2E8F0', background: logFilter === f.key ? '#E0F2FE' : 'transparent', color: logFilter === f.key ? '#075985' : '#64748B', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            {filteredLogs.length === 0 ? (
              <p style={{ color: '#64748B', fontSize: '14px' }}>No access attempts match this filter.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ background: '#0F172A' }}>
                      {['Customer', 'Accessed By', 'Role', 'Purpose', 'Result', 'Date'].map(h => (
                        <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: '#fff', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log, i) => (
                      <tr key={log._id} style={{ background: i % 2 === 0 ? (darkMode ? '#0F172A' : '#F8FAFC') : 'transparent' }}>
                        <td style={{ padding: '11px 14px', fontSize: '13px', color: darkMode ? '#CBD5E1' : '#1E293B', fontWeight: 500 }}>{log.customer?.fullName}</td>
                        <td style={{ padding: '11px 14px', fontSize: '13px', color: '#64748B' }}>{log.accessedBy?.fullName}</td>
                        <td style={{ padding: '11px 14px', fontSize: '13px', color: '#64748B' }}>{log.role}</td>
                        <td style={{ padding: '11px 14px', fontSize: '13px', color: '#64748B' }}>{log.purpose}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: log.accessGranted ? '#D1FAE5' : '#FEE2E2', color: log.accessGranted ? '#065F46' : '#991B1B' }}>
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
        )}

      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;