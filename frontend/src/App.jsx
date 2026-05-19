import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sermons from './pages/Sermons';
import Donations from './pages/Donations';
import Members from './pages/Members';
import Events from './pages/Events';
import Volunteers from './pages/Volunteers';
import Prayers from './pages/Prayers';
import Facilities from './pages/Facilities';
import Announcements from './pages/Announcements';
import Attendance from './pages/Attendance';
import SmallGroups from './pages/SmallGroups';
import Counseling from './pages/Counseling';
import Outreach from './pages/Outreach';
import AITools from './pages/AITools';
import AIResults from './pages/AIResults';
import Notifications from './pages/Notifications';
import Reports from './pages/Reports';
import Webhooks from './pages/Webhooks';
import CustomViewsPage from './pages/CustomViewsPage';
import Layout from './components/Layout';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/sermons" element={<ProtectedRoute><Sermons /></ProtectedRoute>} />
        <Route path="/donations" element={<ProtectedRoute><Donations /></ProtectedRoute>} />
        <Route path="/members" element={<ProtectedRoute><Members /></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
        <Route path="/volunteers" element={<ProtectedRoute><Volunteers /></ProtectedRoute>} />
        <Route path="/prayers" element={<ProtectedRoute><Prayers /></ProtectedRoute>} />
        <Route path="/facilities" element={<ProtectedRoute><Facilities /></ProtectedRoute>} />
        <Route path="/announcements" element={<ProtectedRoute><Announcements /></ProtectedRoute>} />
        <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
        <Route path="/small-groups" element={<ProtectedRoute><SmallGroups /></ProtectedRoute>} />
        <Route path="/counseling" element={<ProtectedRoute><Counseling /></ProtectedRoute>} />
        <Route path="/outreach" element={<ProtectedRoute><Outreach /></ProtectedRoute>} />
        <Route path="/ai-tools" element={<ProtectedRoute><AITools /></ProtectedRoute>} />
        <Route path="/ai-results" element={<ProtectedRoute><AIResults /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/webhooks" element={<ProtectedRoute><Webhooks /></ProtectedRoute>} />
        <Route path="/custom-views" element={<ProtectedRoute><CustomViewsPage /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

export default App;
