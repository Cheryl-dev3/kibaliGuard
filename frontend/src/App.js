import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import CustomerDashboard from './pages/CustomerDashboard';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';
import KibaChat from './pages/KibaChat';
import GiveConsent from './pages/GiveConsent';
import AccessLogs from './pages/AccessLogs';
import ApplyJob from './pages/ApplyJob';
import TalentPool from './pages/TalentPool';
import JobDetail from './pages/JobDetail';
import ThirdPartyView from './pages/ThirdPartyView';
import PrivacyCentre from './pages/PrivacyCentre';
import ApplicationTimeline from './pages/ApplicationTimeline';

const PrivateRoute = ({ children, roles }) => {
  const { user, token } = useAuth();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={
      user.role === 'admin' ? '/admin' :
      user.role === 'staff' ? '/staff' : '/dashboard'
    } replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, token } = useAuth();
  if (token && user) {
    return <Navigate to={
      user.role === 'admin' ? '/admin' :
      user.role === 'staff' ? '/staff' : '/dashboard'
    } replace />;
  }
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/jobs/:id" element={<JobDetail />} />
      <Route path="/third-party/:applicationId/:requestId" element={<ThirdPartyView />} />

      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

      <Route path="/dashboard" element={<PrivateRoute roles={['customer']}><CustomerDashboard /></PrivateRoute>} />
      <Route path="/apply/:jobId" element={<PrivateRoute roles={['customer']}><ApplyJob /></PrivateRoute>} />
      <Route path="/give-consent" element={<PrivateRoute roles={['customer']}><GiveConsent /></PrivateRoute>} />
      <Route path="/access-logs" element={<PrivateRoute roles={['customer']}><AccessLogs /></PrivateRoute>} />
      <Route path="/talent-pool" element={<PrivateRoute roles={['customer']}><TalentPool /></PrivateRoute>} />
      <Route path="/chat" element={<PrivateRoute roles={['customer']}><KibaChat /></PrivateRoute>} />
      <Route path="/privacy-centre" element={<PrivateRoute roles={['customer']}><PrivacyCentre /></PrivateRoute>} />
      <Route path="/timeline/:applicationId" element={<PrivateRoute roles={['customer']}><ApplicationTimeline /></PrivateRoute>} />

      <Route path="/staff" element={<PrivateRoute roles={['staff']}><StaffDashboard /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;