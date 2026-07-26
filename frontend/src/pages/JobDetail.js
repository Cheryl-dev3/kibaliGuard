import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const JobDetail = () => {
  const { id } = useParams();
  const { user, darkMode } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await axios.get(`${API}/api/jobs/${id}`);
        setJob(res.data);
      } catch (err) {
        console.error('Error fetching job:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const jobTypeLabel = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    contract: 'Contract',
    internship: 'Internship'
  };

  const card = { background: darkMode ? '#1E293B' : '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 4px 24px rgba(30,58,95,0.08)', marginBottom: '20px' };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#0EA5E9', fontFamily: 'Inter, sans-serif' }}>
      Loading job details...
    </div>
  );

  if (!job) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#EF4444', fontFamily: 'Inter, sans-serif' }}>
      Job not found
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: darkMode ? '#0F172A' : '#F8FAFC' }}>
      {user ? <Navbar /> : (
        <nav style={{ background: darkMode ? '#1E293B' : '#1E3A5F', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
          <Link to="/" style={{ color: '#0EA5E9', fontWeight: 800, fontSize: '20px', textDecoration: 'none' }}>🛡️ KibaliGuard</Link>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/login" style={{ color: '#CBD5E1', textDecoration: 'none', fontWeight: 600, fontSize: '14px' }}>Sign In</Link>
            <Link to="/register" style={{ padding: '8px 20px', background: '#0EA5E9', color: '#fff', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}>Register</Link>
          </div>
        </nav>
      )}

      <div style={{ flex: 1, padding: '32px 24px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#0EA5E9', fontWeight: 600, fontSize: '14px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginBottom: '24px', padding: 0 }}>
          ← Back to jobs
        </button>

        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: darkMode ? '#F1F5F9' : '#1E3A5F', marginBottom: '6px' }}>{job.title}</h1>
              <p style={{ fontSize: '16px', color: '#0EA5E9', fontWeight: 600, marginBottom: '8px' }}>{job.company?.name}</p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', color: '#64748B' }}>📍 {job.location}</span>
                <span style={{ fontSize: '14px', color: '#64748B' }}>👥 {job.positions} position{job.positions > 1 ? 's' : ''}</span>
                <span style={{ fontSize: '14px', color: '#64748B' }}>📅 Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                {job.salaryRange && <span style={{ fontSize: '14px', color: '#64748B' }}>💰 {job.salaryRange}</span>}
                <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, background: '#E0F2FE', color: '#075985' }}>
                  {jobTypeLabel[job.jobType] || job.jobType}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate(user ? `/apply/${job._id}` : '/register')}
              style={{ padding: '14px 32px', background: '#1E3A5F', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '16px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}>
              {user ? 'Apply Now' : 'Register to Apply'}
            </button>
          </div>
        </div>

        <div style={card}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: darkMode ? '#F1F5F9' : '#1E3A5F', marginBottom: '14px' }}>About this role</h3>
          <p style={{ fontSize: '15px', color: '#64748B', lineHeight: 1.8 }}>{job.description}</p>
        </div>

        {job.requirements?.length > 0 && (
          <div style={card}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: darkMode ? '#F1F5F9' : '#1E3A5F', marginBottom: '14px' }}>Requirements</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {job.requirements.map((req, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#10B981', fontWeight: 700, marginTop: '2px' }}>•</span>
                  <span style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.6 }}>{req}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {job.requiredDocuments?.length > 0 && (
          <div style={card}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: darkMode ? '#F1F5F9' : '#1E3A5F', marginBottom: '14px' }}>Required Documents</h3>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '14px' }}>You will need to upload these documents when applying. You control who can access each one.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {job.requiredDocuments.map((doc, i) => (
                <div key={i} style={{ background: darkMode ? '#0F172A' : '#F8FAFC', borderRadius: '10px', padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '20px' }}>📄</span>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '14px', color: darkMode ? '#F1F5F9' : '#1E293B', marginBottom: '2px' }}>{doc.name}</p>
                    {doc.description && <p style={{ fontSize: '12px', color: '#64748B' }}>{doc.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ background: 'linear-gradient(135deg, #1E3A5F, #0EA5E9)', borderRadius: '16px', padding: '28px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Ready to apply?</h3>
          <p style={{ fontSize: '14px', color: '#BAE6FD', marginBottom: '20px' }}>You will set your own consent rules during the application. Your documents stay under your control at all times.</p>
          <button
            onClick={() => navigate(user ? `/apply/${job._id}` : '/register')}
            style={{ padding: '14px 40px', background: '#fff', color: '#1E3A5F', border: 'none', borderRadius: '12px', fontWeight: 800, fontSize: '16px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            {user ? 'Apply Now' : 'Register to Apply'}
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default JobDetail;
