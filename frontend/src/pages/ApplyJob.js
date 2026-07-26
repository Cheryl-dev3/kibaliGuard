import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import KibaShield from '../components/KibaShield';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const DocumentUploader = ({ docName, docDescription, onUpload, darkMode }) => {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(null);
  const [error, setError] = useState('');

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileData = {
          documentName: docName,
          fileName: file.name,
          fileUrl: e.target.result,
          publicId: Date.now().toString(),
          fileType: file.type
        };
        setUploaded(fileData);
        onUpload(fileData);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Upload failed. Please try again.');
      setUploading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docName, onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'application/pdf': [] },
    maxSize: 2 * 1024 * 1024,
    multiple: false
  });

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontWeight: 700, fontSize: '14px', color: darkMode ? '#CBD5E1' : '#1E293B', marginBottom: '6px' }}>
        {docName}
      </label>
      {docDescription && <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>{docDescription}</p>}

      {uploaded ? (
        <div style={{ background: '#F0FDF4', border: '2px solid #10B981', borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '20px' }}>✅</span>
            <div>
              <p style={{ fontWeight: 600, fontSize: '13px', color: '#065F46' }}>{uploaded.fileName}</p>
              <p style={{ fontSize: '11px', color: '#10B981' }}>Uploaded successfully</p>
            </div>
          </div>
          <button onClick={() => { setUploaded(null); onUpload(null); }}
            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
            Remove
          </button>
        </div>
      ) : (
        <div {...getRootProps()} style={{
          border: `2px dashed ${isDragActive ? '#0EA5E9' : '#E2E8F0'}`,
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragActive ? '#E0F2FE' : (darkMode ? '#0F172A' : '#F8FAFC'),
          transition: 'all 0.2s'
        }}>
          <input {...getInputProps()} />
          {uploading ? (
            <p style={{ color: '#0EA5E9', fontSize: '14px', fontWeight: 500 }}>Uploading...</p>
          ) : (
            <>
              <span style={{ fontSize: '32px' }}>📁</span>
              <p style={{ color: '#64748B', fontSize: '13px', marginTop: '8px' }}>
                {isDragActive ? 'Drop your file here' : 'Drag and drop or click to upload'}
              </p>
              <p style={{ color: '#94A3B8', fontSize: '11px', marginTop: '4px' }}>JPG, PNG or PDF · Max 2MB</p>
            </>
          )}
        </div>
      )}
      {error && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px' }}>{error}</p>}
    </div>
  );
};

const ApplyJob = () => {
  const { jobId } = useParams();
  const { token, darkMode } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [consentRules, setConsentRules] = useState({});
  const [step, setStep] = useState(1);
  const [pose, setPose] = useState(1);
  const [shieldState, setShieldState] = useState('idle');

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await axios.get(`${API}/api/jobs/${jobId}`);
        setJob(res.data);
        const initialConsent = {};
        res.data.requiredDocuments?.forEach(doc => {
          initialConsent[doc.name] = {
            documentName: doc.name,
            allowedRole: 'staff',
            purpose: 'Job application review',
            duration: 7,
            durationUnit: 'days'
          };
        });
        setConsentRules(initialConsent);
      } catch (err) {
        console.error('Error fetching job:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [jobId]);

  const handleDocUpload = (docName, fileData) => {
    setUploadedDocs(prev => {
      const updated = { ...prev };
      if (fileData) {
        updated[docName] = fileData;
      } else {
        delete updated[docName];
      }
      return updated;
    });
  };

  const handleConsentChange = (docName, field, value) => {
    setConsentRules(prev => ({
      ...prev,
      [docName]: { ...prev[docName], [field]: value }
    }));
  };

  const handleSubmit = async () => {
    setError('');
    const requiredDocs = job.requiredDocuments?.map(d => d.name) || [];
    const missingDocs = requiredDocs.filter(name => !uploadedDocs[name]);

    if (missingDocs.length > 0) {
      setError(`Please upload all required documents. Missing: ${missingDocs.join(', ')}`);
      setPose(3);
      setShieldState('warning');
      setTimeout(() => { setPose(1); setShieldState('idle'); }, 2000);
      return;
    }

    setSubmitting(true);
    setPose(7);
    setShieldState('idle');

    try {
      const documents = Object.values(uploadedDocs);
      const consent = Object.values(consentRules);

      await axios.post(`${API}/api/applications/apply`, {
        jobId,
        coverLetter,
        documents,
        consentRules: consent
      }, { headers: { Authorization: `Bearer ${token}` } });

      setPose(2);
      setShieldState('success');
      confetti({ particleCount: 180, spread: 90, origin: { y: 0.5 }, colors: ['#10B981', '#0EA5E9', '#1E3A5F'] });
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
      setPose(4);
      setShieldState('danger');
      setTimeout(() => { setPose(1); setShieldState('idle'); }, 2000);
    } finally {
      setSubmitting(false);
    }
  };

  const card = { background: darkMode ? '#1E293B' : '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 4px 24px rgba(30,58,95,0.08)', marginBottom: '20px' };
  const inputStyle = { width: '100%', padding: '11px 14px', border: '2px solid #E2E8F0', borderRadius: '10px', fontSize: '14px', fontFamily: 'Inter, sans-serif', background: darkMode ? '#0F172A' : '#fff', color: darkMode ? '#F1F5F9' : '#1E293B', outline: 'none', boxSizing: 'border-box' };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#0EA5E9', fontFamily: 'Inter, sans-serif' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: darkMode ? '#0F172A' : '#F8FAFC' }}>
      <Navbar />
      <div style={{ flex: 1, padding: '32px 24px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: darkMode ? '#F1F5F9' : '#1E3A5F', marginBottom: '4px' }}>
          Apply for {job?.title}
        </h1>
        <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '28px' }}>
          {job?.company?.name} · {job?.location}
        </p>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
          {['Upload Documents', 'Set Consent Rules', 'Review and Submit'].map((label, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: step > i + 1 ? '#10B981' : step === i + 1 ? '#1E3A5F' : '#E2E8F0', color: step >= i + 1 ? '#fff' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700 }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: step === i + 1 ? (darkMode ? '#F1F5F9' : '#1E3A5F') : '#64748B' }}>{label}</span>
              {i < 2 && <span style={{ color: '#E2E8F0', margin: '0 4px' }}>›</span>}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <KibaShield pose={pose} shieldState={shieldState} />
          </div>

          <div style={{ flex: 1, minWidth: '280px' }}>
            {error && <div style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: '12px', padding: '13px 16px', fontSize: '14px', marginBottom: '20px' }}>{error}</div>}

            {step === 1 && (
              <div style={card}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: darkMode ? '#F1F5F9' : '#1E3A5F', marginBottom: '6px' }}>Upload your documents</h3>
                <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>Upload each required document. You will set consent rules in the next step.</p>

                {job?.requiredDocuments?.map(doc => (
                  <DocumentUploader
                    key={doc.name}
                    docName={doc.name}
                    docDescription={doc.description}
                    onUpload={(fileData) => handleDocUpload(doc.name, fileData)}
                    darkMode={darkMode}
                  />
                ))}

                <div style={{ marginTop: '20px' }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '14px', color: darkMode ? '#CBD5E1' : '#1E293B', marginBottom: '8px' }}>Cover letter (optional)</label>
                  <textarea
                    placeholder="Tell us why you are the right person for this role..."
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical' }}
                  />
                </div>

                <button onClick={() => setStep(2)}
                  style={{ width: '100%', padding: '14px', background: '#1E3A5F', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginTop: '16px' }}>
                  Continue to Consent Settings →
                </button>
              </div>
            )}

            {step === 2 && (
              <div style={card}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: darkMode ? '#F1F5F9' : '#1E3A5F', marginBottom: '6px' }}>Set your consent rules</h3>
                <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>For each document decide who can access it, for what purpose and for how long. You can change or withdraw these at any time.</p>

                {job?.requiredDocuments?.map(doc => (
                  <div key={doc.name} style={{ background: darkMode ? '#0F172A' : '#F8FAFC', borderRadius: '12px', padding: '18px', marginBottom: '16px' }}>
                    <p style={{ fontWeight: 700, fontSize: '14px', color: darkMode ? '#F1F5F9' : '#1E293B', marginBottom: '14px' }}>📄 {doc.name}</p>

                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Who can access this document</label>
                      <select style={inputStyle} value={consentRules[doc.name]?.allowedRole || 'staff'} onChange={(e) => handleConsentChange(doc.name, 'allowedRole', e.target.value)}>
                        <option value="staff">HR Officer</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Purpose</label>
                      <input style={inputStyle} type="text" value={consentRules[doc.name]?.purpose || ''} onChange={(e) => handleConsentChange(doc.name, 'purpose', e.target.value)} placeholder="e.g. Job application review" />
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Duration</label>
                        <input style={inputStyle} type="number" min="1" value={consentRules[doc.name]?.duration || 7} onChange={(e) => handleConsentChange(doc.name, 'duration', Number(e.target.value))} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Unit</label>
                        <select style={inputStyle} value={consentRules[doc.name]?.durationUnit || 'days'} onChange={(e) => handleConsentChange(doc.name, 'durationUnit', e.target.value)}>
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                          <option value="weeks">Weeks</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button onClick={() => setStep(1)} style={{ flex: 1, padding: '14px', background: 'transparent', color: '#64748B', border: '2px solid #E2E8F0', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                    ← Back
                  </button>
                  <button onClick={() => setStep(3)} style={{ flex: 2, padding: '14px', background: '#1E3A5F', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                    Review Application →
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div style={card}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: darkMode ? '#F1F5F9' : '#1E3A5F', marginBottom: '6px' }}>Review your application</h3>
                <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>Please review everything before submitting. You can go back to make changes.</p>

                <div style={{ background: darkMode ? '#0F172A' : '#F8FAFC', borderRadius: '12px', padding: '18px', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: darkMode ? '#F1F5F9' : '#1E3A5F', marginBottom: '12px' }}>Documents and consent summary</h4>
                  {job?.requiredDocuments?.map(doc => (
                    <div key={doc.name} style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '12px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div>
                          <p style={{ fontWeight: 600, fontSize: '13px', color: darkMode ? '#F1F5F9' : '#1E293B' }}>📄 {doc.name}</p>
                          <p style={{ fontSize: '12px', color: '#64748B' }}>
                            {uploadedDocs[doc.name] ? `✅ ${uploadedDocs[doc.name].fileName}` : '❌ Not uploaded'}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '12px', color: '#64748B' }}>Accessible by: {consentRules[doc.name]?.allowedRole}</p>
                          <p style={{ fontSize: '12px', color: '#64748B' }}>For: {consentRules[doc.name]?.purpose}</p>
                          <p style={{ fontSize: '12px', color: '#64748B' }}>Duration: {consentRules[doc.name]?.duration} {consentRules[doc.name]?.durationUnit}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: '#FEF3C7', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', display: 'flex', gap: '10px' }}>
                  <span>⚠️</span>
                  <p style={{ fontSize: '13px', color: '#92400E', lineHeight: 1.6 }}>
                    By submitting you confirm that all documents belong to you and that you consent to KibaliGuard processing your application. You can withdraw consent for any document at any time from your dashboard.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setStep(2)} style={{ flex: 1, padding: '14px', background: 'transparent', color: '#64748B', border: '2px solid #E2E8F0', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                    ← Back
                  </button>
                  <button onClick={handleSubmit} disabled={submitting}
                    style={{ flex: 2, padding: '14px', background: submitting ? '#0EA5E9' : '#1E3A5F', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '15px', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {submitting ? (
                      <>
                        <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'kibashield-spin 0.8s linear infinite' }} />
                        Submitting...
                      </>
                    ) : 'Submit Application'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ApplyJob;
