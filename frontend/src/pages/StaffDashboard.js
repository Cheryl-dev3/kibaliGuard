import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import KibaShield from '../components/KibaShield';
import {
  IconBriefcaseFull, IconUsers, IconEye, IconCheck,
  IconCheckCircle, IconXCircle, IconClock, IconBuilding,
  IconFile, IconUser, IconAlert, IconMapPin, IconCalendar,
  IconUpload, IconActivity, IconShieldCheck, IconEdit, IconTrash
} from '../Icons';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const dataOptions = [
  'National ID', 'CV or Resume', 'Certificate of Good Conduct',
  'Academic Certificate', 'Passport Photo', 'Work Permit', 'References Letter'
];

const StaffDashboard = () => {
  const { token, user, darkMode } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [customerId, setCustomerId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [dataCategories, setDataCategories] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [editingJobId, setEditingJobId] = useState(null);
  const [pose, setPose] = useState(1);
  const [shieldState, setShieldState] = useState('idle');
  const [jobMsg, setJobMsg] = useState('');
  const [jobError, setJobError] = useState('');
  const [jobForm, setJobForm] = useState({
    title: '', location: '', description: '', salaryRange: '',
    jobType: 'full_time', positions: 1, deadline: '',
    requirements: [''],
    requiredDocuments: [{ name: '', description: '' }],
    companyId: ''
  });
  const [stats, setStats] = useState({
    totalJobs: 0, totalApplications: 0,
    shortlisted: 0, hired: 0, accessGranted: 0, accessDenied: 0
  });

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, []);

  const fetchAll = async () => {
    try {
      const [logsRes, customersRes, jobsRes, companiesRes] = await Promise.all([
        axios.get(`${API}/api/access/staff-logs`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/access/customers`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/jobs/staff/my-jobs`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/api/companies`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setLogs(logsRes.data);
      setCustomers(customersRes.data);
      setJobs(jobsRes.data);
      setCompanies(companiesRes.data);
      const totalApps = jobsRes.data.reduce((sum, j) => sum + (j.applicantCount || 0), 0);
      setStats({
        totalJobs: jobsRes.data.length, totalApplications: totalApps,
        shortlisted: 0, hired: 0,
        accessGranted: logsRes.data.filter(l => l.accessGranted).length,
        accessDenied: logsRes.data.filter(l => !l.accessGranted).length
      });
    } catch (err) { console.error(err); }
  };

  const fetchApplications = async (jobId) => {
    try {
      const res = await axios.get(`${API}/api/applications/job/${jobId}`, { headers: { Authorization: `Bearer ${token}` } });
      setApplications(res.data);
    } catch (err) { console.error(err); }
  };

  const toggleCategory = (cat) => {
    setDataCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    setJobMsg(''); setJobError('');
    setLoading(true);
    try {
      const payload = {
        ...jobForm,
        requirements: jobForm.requirements.filter(r => r.trim()),
        requiredDocuments: jobForm.requiredDocuments.filter(d => d.name.trim())
      };
      if (editingJobId) {
        await axios.put(`${API}/api/jobs/${editingJobId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        setJobMsg('Job updated successfully.');
        setEditingJobId(null);
      } else {
        await axios.post(`${API}/api/jobs`, payload, { headers: { Authorization: `Bearer ${token}` } });
        setJobMsg('Job posted successfully. Applicants can now see and apply.');
      }
      setPose(2); setShieldState('success');
      setJobForm({ title: '', location: '', description: '', salaryRange: '', jobType: 'full_time', positions: 1, deadline: '', requirements: [''], requiredDocuments: [{ name: '', description: '' }], companyId: '' });
      fetchAll();
      setTimeout(() => { setPose(1); setShieldState('idle'); }, 3000);
    } catch (err) {
      setJobError(err.response?.data?.message || 'Error saving job. Make sure your account is linked to a company.');
      setPose(3); setShieldState('warning');
      setTimeout(() => { setPose(1); setShieldState('idle'); }, 2000);
    } finally { setLoading(false); }
  };

  const startEditJob = (job) => {
    setEditingJobId(job._id);
    setJobForm({
      title: job.title || '',
      location: job.location || '',
      description: job.description || '',
      salaryRange: job.salaryRange || '',
      jobType: job.jobType || 'full_time',
      positions: job.positions || 1,
      deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : '',
      requirements: job.requirements?.length ? job.requirements : [''],
      requiredDocuments: job.requiredDocuments?.length ? job.requiredDocuments : [{ name: '', description: '' }],
      companyId: job.company?._id || job.company || ''
    });
    setActiveTab('post-job');
    setJobMsg(''); setJobError('');
  };

  const cancelEdit = () => {
    setEditingJobId(null);
    setJobForm({ title: '', location: '', description: '', salaryRange: '', jobType: 'full_time', positions: 1, deadline: '', requirements: [''], requiredDocuments: [{ name: '', description: '' }], companyId: '' });
  };

  const handleDeleteJob = async (jobId, jobTitle) => {
    if (!window.confirm(`Delete "${jobTitle}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/api/jobs/${jobId}`, { headers: { Authorization: `Bearer ${token}` } });
      setJobMsg('Job deleted.');
      fetchAll();
      setTimeout(() => setJobMsg(''), 3000);
    } catch (err) {
      setJobError(err.response?.data?.message || 'Error deleting job.');
      setTimeout(() => setJobError(''), 3000);
    }
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!customerId || !purpose || dataCategories.length === 0) {
      setResult({ error: 'Please select a customer, enter a purpose and select at least one data category' });
      setPose(3); setShieldState('warning');
      return;
    }
    setLoading(true); setPose(7); setShieldState('idle'); setResult(null);
    try {
      const res = await axios.post(`${API}/api/access/request`, { customerId, purpose, dataCategories }, { headers: { Authorization: `Bearer ${token}` } });
      setResult({ success: true, data: res.data });
      setPose(2); setShieldState('success');
      fetchAll();
      setTimeout(() => { setPose(1); setShieldState('idle'); }, 3000);
    } catch (err) {
      setResult({ success: false, data: err.response?.data });
      setPose(4); setShieldState('danger');
      setTimeout(() => { setPose(1); setShieldState('idle'); }, 3000);
    } finally { setLoading(false); }
  };

  const updateStatus = async (applicationId, status) => {
    try {
      await axios.put(`${API}/api/applications/status/${applicationId}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      fetchApplications(selectedJob);
      fetchAll();
    } catch (err) { console.error(err); }
  };

  const bg = darkMode ? '#0F172A' : '#F8FAFC';
  const cardBg = darkMode ? '#1E293B' : '#fff';
  const border = darkMode ? '#334155' : '#E2E8F0';
  const text = darkMode ? '#F1F5F9' : '#0F172A';
  const muted = '#64748B';

  const inputStyle = {
    width: '100%', padding: '11px 14px', border: `2px solid ${border}`,
    borderRadius: '10px', fontSize: '14px', fontFamily: 'Inter, sans-serif',
    background: darkMode ? '#0F172A' : '#fff', color: text,
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s'
  };

  const tabStyle = (t) => ({
    padding: '10px 18px', borderRadius: '10px', border: 'none',
    fontWeight: 700, fontSize: '13px', cursor: 'pointer',
    fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
    background: activeTab === t ? '#0F172A' : 'transparent',
    color: activeTab === t ? '#FFD60A' : muted,
    transition: 'all 0.2s'
  });

  const statCards = [
    { label: 'Jobs Posted', value: stats.totalJobs, color: '#0F172A', textColor: '#FFD60A', tab: 'post-job' },
    { label: 'Total Applicants', value: stats.totalApplications, color: '#7C3AED', textColor: '#fff', tab: 'applications' },
    { label: 'Access Granted', value: stats.accessGranted, color: '#10B981', textColor: '#fff', tab: 'access-history' },
    { label: 'Access Denied', value: stats.accessDenied, color: '#EF4444', textColor: '#fff', tab: 'access-history' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: bg }}>
      <Navbar />
      <div style={{ flex: 1, padding: '24px 16px', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '28px' }}>

          {/* LEFT — Kiba */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', minWidth: '180px' }}>
            <KibaShield pose={pose} shieldState={shieldState} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#FFD60A', fontWeight: 800, fontSize: '13px', margin: 0, background: '#0F172A', padding: '6px 14px', borderRadius: '999px' }}>HR Officer</p>
              <p style={{ color: muted, fontSize: '12px', marginTop: '6px' }}>{user?.fullName}</p>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ flex: 1, minWidth: '280px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 900, color: text, marginBottom: '4px', letterSpacing: '-0.5px' }}>Staff Dashboard</h1>
            <p style={{ color: muted, fontSize: '14px', marginBottom: '20px' }}>Post jobs, review applications and request document access with consent verification</p>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              {statCards.map(s => (
                <button key={s.label} onClick={() => setActiveTab(s.tab)}
                  style={{ background: s.color, borderRadius: '16px', padding: '16px 14px', cursor: 'pointer', border: 'none', textAlign: 'center', boxShadow: `0 4px 16px ${s.color}40`, transition: 'transform 0.15s' }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.96)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: s.textColor, fontFamily: 'Roboto Mono, monospace', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '11px', color: s.textColor, fontWeight: 600, marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.85 }}>{s.label}</div>
                </button>
              ))}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', background: cardBg, borderRadius: '12px', padding: '5px', border: `1px solid ${border}`, marginBottom: '20px' }}>
              {[
                { key: 'overview', label: 'Overview' },
                { key: 'post-job', label: editingJobId ? 'Edit Job' : 'Post a Job' },
                { key: 'applications', label: 'Applications' },
                { key: 'request-access', label: 'Request Access' },
                { key: 'access-history', label: 'Access History' },
              ].map(t => (
                <button key={t.key} style={tabStyle(t.key)} onClick={() => setActiveTab(t.key)}>{t.label}</button>
              ))}
            </div>

            {/* OVERVIEW */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {jobMsg && <div style={{ background: '#F0FDF4', color: '#065F46', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', fontWeight: 500 }}>{jobMsg}</div>}
                {jobError && <div style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px 16px', fontSize: '13px' }}>{jobError}</div>}

                {/* Quick Actions */}
                <div style={{ background: cardBg, borderRadius: '16px', padding: '24px', border: `1px solid ${border}` }}>
                  <h3 style={{ fontWeight: 800, fontSize: '16px', color: text, marginBottom: '16px' }}>Quick Actions</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                    {[
                      { label: 'Post a New Job', color: '#0F172A', textColor: '#FFD60A', tab: 'post-job' },
                      { label: 'Review Applications', color: '#7C3AED', textColor: '#fff', tab: 'applications' },
                      { label: 'Request Access', color: '#00B4D8', textColor: '#fff', tab: 'request-access' },
                      { label: 'Access History', color: '#10B981', textColor: '#fff', tab: 'access-history' },
                    ].map(a => (
                      <button key={a.label} onClick={() => setActiveTab(a.tab)}
                        style={{ background: a.color, borderRadius: '14px', padding: '18px', border: 'none', cursor: 'pointer', textAlign: 'left', color: a.textColor, fontWeight: 800, fontSize: '14px', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s', boxShadow: `0 4px 12px ${a.color}30` }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Posted jobs */}
                <div style={{ background: cardBg, borderRadius: '16px', padding: '24px', border: `1px solid ${border}` }}>
                  <h3 style={{ fontWeight: 800, fontSize: '16px', color: text, marginBottom: '16px' }}>Your Posted Jobs ({jobs.length})</h3>
                  {jobs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0' }}>
                      <p style={{ color: muted, fontSize: '14px', marginBottom: '16px' }}>No jobs posted yet.</p>
                      <button onClick={() => setActiveTab('post-job')}
                        style={{ padding: '10px 24px', background: '#FF6B35', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                        Post Your First Job
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {jobs.map(job => (
                        <div key={job._id} style={{ background: darkMode ? '#0F172A' : '#F8FAFC', borderRadius: '12px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', border: `1px solid ${border}` }}>
                          <div>
                            <p style={{ fontWeight: 800, fontSize: '14px', color: text, margin: 0 }}>{job.title}</p>
                            <p style={{ fontSize: '12px', color: '#00B4D8', fontWeight: 600, margin: '2px 0' }}>{job.company?.name}</p>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '12px', color: muted }}>{job.location}</span>
                              <span style={{ fontSize: '12px', color: muted }}>{job.applicantCount || 0} applicants</span>
                              <span style={{ fontSize: '12px', color: muted }}>Closes {new Date(job.deadline).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: job.isActive ? '#DCFCE7' : '#FEE2E2', color: job.isActive ? '#065F46' : '#991B1B' }}>
                              {job.isActive ? 'Active' : 'Closed'}
                            </span>
                            <button onClick={() => { setSelectedJob(job._id); fetchApplications(job._id); setActiveTab('applications'); }}
                              style={{ padding: '7px 14px', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                              Applicants
                            </button>
                            <button onClick={() => startEditJob(job)}
                              style={{ padding: '7px 14px', background: '#00B4D8', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                              Edit
                            </button>
                            <button onClick={() => handleDeleteJob(job._id, job.title)}
                              style={{ padding: '7px 14px', background: 'transparent', color: '#EF4444', border: '1.5px solid #EF4444', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* POST / EDIT JOB */}
            {activeTab === 'post-job' && (
              <div style={{ background: cardBg, borderRadius: '16px', padding: '24px', border: `1px solid ${border}` }}>
                <h3 style={{ fontWeight: 800, fontSize: '16px', color: text, marginBottom: '6px' }}>
                  {editingJobId ? 'Edit Job' : 'Post a New Job'}
                </h3>
                {!editingJobId && (
                  <div style={{ background: '#EFF6FF', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', border: '1px solid #BFDBFE' }}>
                    <p style={{ fontSize: '13px', color: '#1E40AF', lineHeight: 1.6, margin: 0 }}>
                      Your account must be linked to a company by the administrator before posting jobs.
                    </p>
                  </div>
                )}

                {jobMsg && <div style={{ background: '#F0FDF4', color: '#065F46', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '12px', fontSize: '13px', marginBottom: '12px', fontWeight: 500 }}>{jobMsg}</div>}
                {jobError && <div style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px', fontSize: '13px', marginBottom: '12px' }}>{jobError}</div>}

                <form onSubmit={handlePostJob}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: muted, marginBottom: '6px', textTransform: 'uppercase' }}>Job Title</label>
                      <input style={inputStyle} placeholder="e.g. Security Guard" value={jobForm.title}
                        onChange={e => setJobForm({ ...jobForm, title: e.target.value })} required
                        onFocus={e => e.target.style.borderColor = '#FFD60A'} onBlur={e => e.target.style.borderColor = border} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: muted, marginBottom: '6px', textTransform: 'uppercase' }}>Location</label>
                      <input style={inputStyle} placeholder="e.g. Nairobi CBD" value={jobForm.location}
                        onChange={e => setJobForm({ ...jobForm, location: e.target.value })} required
                        onFocus={e => e.target.style.borderColor = '#FFD60A'} onBlur={e => e.target.style.borderColor = border} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: muted, marginBottom: '6px', textTransform: 'uppercase' }}>Salary Range</label>
                      <input style={inputStyle} placeholder="e.g. KES 30,000 to 50,000" value={jobForm.salaryRange}
                        onChange={e => setJobForm({ ...jobForm, salaryRange: e.target.value })}
                        onFocus={e => e.target.style.borderColor = '#FFD60A'} onBlur={e => e.target.style.borderColor = border} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: muted, marginBottom: '6px', textTransform: 'uppercase' }}>Job Type</label>
                      <select style={inputStyle} value={jobForm.jobType} onChange={e => setJobForm({ ...jobForm, jobType: e.target.value })}>
                        <option value="full_time">Full Time</option>
                        <option value="part_time">Part Time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: muted, marginBottom: '6px', textTransform: 'uppercase' }}>Positions</label>
                      <input style={inputStyle} type="number" min="1" value={jobForm.positions}
                        onChange={e => setJobForm({ ...jobForm, positions: Number(e.target.value) })} required
                        onFocus={e => e.target.style.borderColor = '#FFD60A'} onBlur={e => e.target.style.borderColor = border} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: muted, marginBottom: '6px', textTransform: 'uppercase' }}>Deadline</label>
                      <input style={inputStyle} type="date" value={jobForm.deadline}
                        onChange={e => setJobForm({ ...jobForm, deadline: e.target.value })} required
                        onFocus={e => e.target.style.borderColor = '#FFD60A'} onBlur={e => e.target.style.borderColor = border} />
                    </div>
                  </div>

                  {/* Company reassign — shows when editing */}
                  {editingJobId && companies.length > 0 && (
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: muted, marginBottom: '6px', textTransform: 'uppercase' }}>
                        Reassign to Company
                      </label>
                      <select style={inputStyle} value={jobForm.companyId} onChange={e => setJobForm({ ...jobForm, companyId: e.target.value })}>
                        <option value="">Keep current company</option>
                        {companies.map(c => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                      <p style={{ fontSize: '12px', color: muted, marginTop: '4px' }}>
                        Use this to fix a job posted under the wrong company.
                      </p>
                    </div>
                  )}

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: muted, marginBottom: '6px', textTransform: 'uppercase' }}>Job Description</label>
                    <textarea style={{ ...inputStyle, resize: 'vertical' }} rows={4}
                      placeholder="Describe the role, responsibilities and what you are looking for..."
                      value={jobForm.description}
                      onChange={e => setJobForm({ ...jobForm, description: e.target.value })} required
                      onFocus={e => e.target.style.borderColor = '#FFD60A'} onBlur={e => e.target.style.borderColor = border} />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: muted, marginBottom: '10px', textTransform: 'uppercase' }}>Required Documents</label>
                    {jobForm.requiredDocuments.map((doc, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <input style={{ ...inputStyle, flex: 2, minWidth: '140px' }}
                          placeholder="Document name e.g. National ID" value={doc.name}
                          onChange={e => { const docs = [...jobForm.requiredDocuments]; docs[i].name = e.target.value; setJobForm({ ...jobForm, requiredDocuments: docs }); }}
                          onFocus={e => e.target.style.borderColor = '#FFD60A'} onBlur={e => e.target.style.borderColor = border} />
                        <input style={{ ...inputStyle, flex: 3, minWidth: '160px' }}
                          placeholder="Description (optional)" value={doc.description}
                          onChange={e => { const docs = [...jobForm.requiredDocuments]; docs[i].description = e.target.value; setJobForm({ ...jobForm, requiredDocuments: docs }); }}
                          onFocus={e => e.target.style.borderColor = '#FFD60A'} onBlur={e => e.target.style.borderColor = border} />
                        {jobForm.requiredDocuments.length > 1 && (
                          <button type="button" onClick={() => setJobForm({ ...jobForm, requiredDocuments: jobForm.requiredDocuments.filter((_, idx) => idx !== i) })}
                            style={{ padding: '10px 14px', background: '#FEE2E2', color: '#EF4444', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={() => setJobForm({ ...jobForm, requiredDocuments: [...jobForm.requiredDocuments, { name: '', description: '' }] })}
                      style={{ padding: '8px 18px', background: '#E0F9FF', color: '#0369A1', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                      Add Document
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    {editingJobId && (
                      <button type="button" onClick={cancelEdit}
                        style={{ flex: 1, padding: '14px', background: 'transparent', color: muted, border: `2px solid ${border}`, borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                        Cancel
                      </button>
                    )}
                    <button type="submit" disabled={loading}
                      style={{ flex: 2, padding: '14px', background: loading ? '#94A3B8' : '#0F172A', color: '#FFD60A', border: 'none', borderRadius: '12px', fontWeight: 900, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      {loading ? (
                        <>
                          <span style={{ width: '16px', height: '16px', border: '3px solid rgba(255,214,10,0.3)', borderTop: '3px solid #FFD60A', borderRadius: '50%', display: 'inline-block', animation: 'kibashield-spin 0.8s linear infinite' }} />
                          {editingJobId ? 'Saving...' : 'Posting...'}
                        </>
                      ) : (editingJobId ? 'Save Changes' : 'Post Job')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* APPLICATIONS */}
            {activeTab === 'applications' && (
              <div style={{ background: cardBg, borderRadius: '16px', padding: '24px', border: `1px solid ${border}` }}>
                <h3 style={{ fontWeight: 800, fontSize: '16px', color: text, marginBottom: '16px' }}>Applications</h3>
                {!selectedJob ? (
                  <div>
                    <p style={{ color: muted, fontSize: '14px', marginBottom: '16px' }}>Select a job to view its applications:</p>
                    {jobs.length === 0 ? (
                      <p style={{ color: muted }}>No jobs posted yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {jobs.map(job => (
                          <div key={job._id} style={{ background: darkMode ? '#0F172A' : '#F8FAFC', borderRadius: '12px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', border: `1px solid ${border}` }}>
                            <div>
                              <p style={{ fontWeight: 700, fontSize: '14px', color: text, margin: 0 }}>{job.title}</p>
                              <p style={{ fontSize: '12px', color: muted, margin: '3px 0 0' }}>{job.applicantCount || 0} applicants</p>
                            </div>
                            <button onClick={() => { setSelectedJob(job._id); fetchApplications(job._id); }}
                              style={{ padding: '8px 18px', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                              View
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <button onClick={() => { setSelectedJob(null); setApplications([]); }}
                      style={{ background: 'none', border: 'none', color: '#00B4D8', fontWeight: 700, fontSize: '13px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginBottom: '16px', padding: 0 }}>
                      Back to jobs
                    </button>
                    {applications.length === 0 ? (
                      <p style={{ color: muted, fontSize: '14px' }}>No applications yet for this job.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {applications.map(app => (
                          <div key={app._id} style={{ background: darkMode ? '#0F172A' : '#F8FAFC', borderRadius: '14px', padding: '18px', border: `1px solid ${border}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                              <div>
                                <p style={{ fontWeight: 800, fontSize: '15px', color: text, margin: 0 }}>{app.applicant?.fullName}</p>
                                <p style={{ fontSize: '12px', color: muted, margin: '3px 0' }}>ID: {app.applicant?.applicantId} · {app.applicant?.email || app.applicant?.phone}</p>
                                <p style={{ fontSize: '12px', color: muted }}>Applied {new Date(app.createdAt).toLocaleDateString()}</p>
                              </div>
                              <span style={{ padding: '5px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, height: 'fit-content', background: app.status === 'hired' ? '#DCFCE7' : app.status === 'rejected' ? '#FEE2E2' : app.status === 'shortlisted' ? '#F3E8FF' : '#E0F9FF', color: app.status === 'hired' ? '#065F46' : app.status === 'rejected' ? '#991B1B' : app.status === 'shortlisted' ? '#6B21A8' : '#0369A1' }}>
                                {app.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {[
                                { s: 'under_review', label: 'Under Review', color: '#00B4D8' },
                                { s: 'shortlisted', label: 'Shortlist', color: '#7C3AED' },
                                { s: 'hired', label: 'Hire', color: '#10B981' },
                                { s: 'rejected', label: 'Reject', color: '#EF4444' }
                              ].map(btn => (
                                <button key={btn.s} onClick={() => updateStatus(app._id, btn.s)} disabled={app.status === btn.s}
                                  style={{ padding: '7px 16px', background: app.status === btn.s ? '#E2E8F0' : btn.color, color: app.status === btn.s ? '#94A3B8' : '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '12px', cursor: app.status === btn.s ? 'default' : 'pointer', fontFamily: 'Inter, sans-serif' }}>
                                  {btn.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* REQUEST ACCESS */}
            {activeTab === 'request-access' && (
              <div style={{ background: cardBg, borderRadius: '16px', padding: '24px', border: `1px solid ${border}` }}>
                <h3 style={{ fontWeight: 800, fontSize: '16px', color: text, marginBottom: '6px' }}>Request Document Access</h3>
                <p style={{ fontSize: '13px', color: muted, marginBottom: '20px', lineHeight: 1.6 }}>
                  Access is only granted if the applicant has approved your exact role and purpose.
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                  <KibaShield pose={pose} shieldState={shieldState} />
                </div>

                {result && (
                  <div className="animate-slideUp" style={{ background: result.success ? '#F0FDF4' : '#FEF2F2', color: result.success ? '#065F46' : '#991B1B', border: `1px solid ${result.success ? '#BBF7D0' : '#FECACA'}`, borderRadius: '12px', padding: '14px 18px', marginBottom: '20px', fontSize: '14px', fontWeight: 600 }}>
                    {result.error || result.data?.message}
                  </div>
                )}

                <form onSubmit={handleRequest}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: muted, marginBottom: '10px', textTransform: 'uppercase' }}>
                      Select Applicant ({customers.length} registered)
                    </label>
                    {customers.length === 0 ? (
                      <p style={{ color: muted, fontSize: '13px' }}>No applicants registered yet.</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto', border: `1.5px solid ${border}`, borderRadius: '12px', padding: '8px' }}>
                        {customers.map(c => (
                          <button key={c._id} type="button" onClick={() => setCustomerId(c._id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid', borderColor: customerId === c._id ? '#00B4D8' : 'transparent', background: customerId === c._id ? (darkMode ? 'rgba(0,180,216,0.12)' : '#E0F9FF') : (darkMode ? '#0F172A' : '#F8FAFC'), cursor: 'pointer', fontFamily: 'Inter, sans-serif', textAlign: 'left' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#00B4D8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>{c.fullName?.charAt(0)}</span>
                            </div>
                            <div>
                              <p style={{ fontWeight: 700, fontSize: '13px', color: text, margin: 0 }}>{c.fullName}</p>
                              <p style={{ fontSize: '11px', color: muted, margin: '2px 0 0', fontFamily: 'Roboto Mono, monospace' }}>{c.applicantId || c.email || c.phone}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: muted, marginBottom: '6px', textTransform: 'uppercase' }}>Purpose of Access</label>
                    <input style={inputStyle} type="text" placeholder="e.g. Job application review"
                      value={purpose} onChange={e => setPurpose(e.target.value)}
                      onFocus={e => e.target.style.borderColor = '#FFD60A'} onBlur={e => e.target.style.borderColor = border} />
                    <p style={{ fontSize: '12px', color: muted, marginTop: '4px' }}>Must match exactly what the applicant approved.</p>
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: muted, marginBottom: '10px', textTransform: 'uppercase' }}>Data Categories</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {dataOptions.map(opt => (
                        <button key={opt} type="button" onClick={() => toggleCategory(opt)}
                          style={{ padding: '8px 14px', borderRadius: '999px', border: '2px solid', borderColor: dataCategories.includes(opt) ? '#00B4D8' : border, background: dataCategories.includes(opt) ? '#E0F9FF' : 'transparent', color: dataCategories.includes(opt) ? '#0369A1' : muted, fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                          {dataCategories.includes(opt) ? '✓ ' : ''}{opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button type="submit" disabled={loading}
                    style={{ width: '100%', padding: '14px', background: loading ? '#94A3B8' : '#0F172A', color: '#FFD60A', border: 'none', borderRadius: '12px', fontWeight: 900, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif' }}>
                    {loading ? 'Checking consent rules...' : 'Request Access'}
                  </button>
                </form>
              </div>
            )}

            {/* ACCESS HISTORY */}
            {activeTab === 'access-history' && (
              <div style={{ background: cardBg, borderRadius: '16px', padding: '24px', border: `1px solid ${border}` }}>
                <h3 style={{ fontWeight: 800, fontSize: '16px', color: text, marginBottom: '16px' }}>My Access History ({logs.length})</h3>
                {logs.length === 0 ? (
                  <p style={{ color: muted, fontSize: '14px' }}>No access requests made yet.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                      <thead>
                        <tr style={{ background: '#0F172A' }}>
                          {['Applicant', 'Purpose', 'Result', 'Date'].map(h => (
                            <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: '#FFD60A', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log, i) => (
                          <tr key={log._id} style={{ background: i % 2 === 0 ? (darkMode ? '#0F172A' : '#F8FAFC') : 'transparent' }}>
                            <td style={{ padding: '11px 14px', fontSize: '13px', color: text, fontWeight: 500 }}>{log.customer?.fullName}</td>
                            <td style={{ padding: '11px 14px', fontSize: '13px', color: muted }}>{log.purpose}</td>
                            <td style={{ padding: '11px 14px' }}>
                              <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: log.accessGranted ? '#DCFCE7' : '#FEE2E2', color: log.accessGranted ? '#065F46' : '#991B1B' }}>
                                {log.accessGranted ? 'GRANTED' : 'DENIED'}
                              </span>
                            </td>
                            <td style={{ padding: '11px 14px', fontSize: '12px', color: muted, fontFamily: 'Roboto Mono, monospace' }}>{new Date(log.createdAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default StaffDashboard;