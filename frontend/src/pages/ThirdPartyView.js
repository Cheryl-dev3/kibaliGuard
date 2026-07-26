import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ThirdPartyView = () => {
  const { applicationId, requestId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API}/api/applications/third-party/${applicationId}/${requestId}`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'This link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [applicationId, requestId]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Inter, sans-serif', color: '#0EA5E9', fontSize: 16 }}>
      Verifying secure access link...
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Inter, sans-serif', gap: '16px', padding: '32px' }}>
      <span style={{ fontSize: '64px' }}>🔒</span>
      <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1E3A5F', textAlign: 'center' }}>Access Denied</h2>
      <p style={{ color: '#64748B', textAlign: 'center', maxWidth: '400px', lineHeight: 1.7 }}>{error}</p>
      <p style={{ fontSize: '12px', color: '#94A3B8', textAlign: 'center' }}>© Cheryl Kreativ Studio</p>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}>
      <nav style={{ background: '#1E3A5F', padding: '0 32px', display: 'flex', alignItems: 'center', height: '64px' }}>
        <span style={{ color: '#0EA5E9', fontWeight: 800, fontSize: '20px' }}>🛡️ KibaliGuard</span>
        <span style={{ color: '#94A3B8', fontSize: '13px', marginLeft: '16px' }}>Secure Third Party Document View</span>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '14px', padding: '16px 20px', marginBottom: '28px', display: 'flex', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <div>
            <p style={{ fontWeight: 700, color: '#92400E', fontSize: '14px', marginBottom: '4px' }}>This is a secure time-limited view</p>
            <p style={{ color: '#92400E', fontSize: '13px', lineHeight: 1.6 }}>
              You have been granted temporary access to view specific documents. This link expires automatically. Every view is being logged and is visible to the document owner. Do not share this link with anyone.
            </p>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '16px', padding: '28px', boxShadow: '0 4px 24px rgba(30,58,95,0.08)', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1E3A5F', marginBottom: '16px' }}>Approved Documents</h2>
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>
            Access expires: {data?.expiresAt ? new Date(data.expiresAt).toLocaleString() : 'Unknown'}
          </p>

          {data?.documents?.length === 0 ? (
            <p style={{ color: '#64748B' }}>No documents are available for this access link.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {data?.documents?.map((doc, i) => (
                <div key={i} style={{ background: '#F8FAFC', borderRadius: '12px', padding: '20px' }}>
                  <p style={{ fontWeight: 700, fontSize: '15px', color: '#1E3A5F', marginBottom: '12px' }}>📄 {doc.documentName}</p>
                  {doc.fileType?.includes('image') ? (
                    <img src={doc.fileUrl} alt={doc.documentName} style={{ maxWidth: '100%', borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                  ) : doc.fileType?.includes('pdf') ? (
                    <iframe src={doc.fileUrl} title={doc.documentName} style={{ width: '100%', height: '500px', border: '1px solid #E2E8F0', borderRadius: '8px' }} />
                  ) : (
                    <p style={{ color: '#64748B', fontSize: '13px' }}>Preview not available for this file type.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: '#94A3B8' }}>
          © Cheryl Kreativ Studio · KibaliGuard Digital Recruitment and Consent System
        </p>
      </div>
    </div>
  );
};

export default ThirdPartyView;
