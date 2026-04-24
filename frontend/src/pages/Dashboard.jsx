import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, DollarSign, Calendar, Heart, BookOpen, Star,
  Building, Bell, TrendingUp, TrendingDown,
  BarChart3, UsersRound, HeartHandshake, Globe
} from 'lucide-react';

const features = [
  { path: '/sermons', title: 'Sermon Management', desc: 'Create, manage, and get AI-powered sermon summaries and topic suggestions.', icon: BookOpen, color: 'gold' },
  { path: '/donations', title: 'Donation Management', desc: 'Track donations, generate tax receipts, and AI thank-you letters.', icon: DollarSign, color: 'green' },
  { path: '/members', title: 'Member Management', desc: 'Manage congregation members with AI engagement analysis.', icon: Users, color: 'blue' },
  { path: '/events', title: 'Event Coordination', desc: 'Plan and coordinate events with AI-generated descriptions.', icon: Calendar, color: 'teal' },
  { path: '/volunteers', title: 'Volunteer Scheduling', desc: 'Schedule volunteers and use AI to match skills to ministries.', icon: Heart, color: 'pink' },
  { path: '/prayers', title: 'Prayer Requests', desc: 'Manage prayer requests and receive AI spiritual guidance.', icon: Star, color: 'purple' },
  { path: '/facilities', title: 'Facility Management', desc: 'Manage facilities, bookings, and AI schedule optimization.', icon: Building, color: 'orange' },
  { path: '/announcements', title: 'Announcements', desc: 'Create and manage announcements with AI drafting.', icon: Bell, color: 'red' },
  { path: '/attendance', title: 'Attendance Tracking', desc: 'Monitor service attendance trends with AI growth insights.', icon: BarChart3, color: 'blue' },
  { path: '/small-groups', title: 'Small Groups', desc: 'Manage fellowship groups with AI curriculum suggestions.', icon: UsersRound, color: 'teal' },
  { path: '/counseling', title: 'Counseling', desc: 'Schedule pastoral counseling with AI session preparation.', icon: HeartHandshake, color: 'purple' },
  { path: '/outreach', title: 'Outreach Programs', desc: 'Track community outreach with AI impact analysis.', icon: Globe, color: 'green' },
];

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ members: 0, donations: 0, events: 0, volunteers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const apiFetch = async (url) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) return await res.json();
      return null;
    } catch {
      return null;
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    const [membersData, donationsData, eventsData, volunteersData] = await Promise.all([
      apiFetch('/api/members'),
      apiFetch('/api/donations'),
      apiFetch('/api/events'),
      apiFetch('/api/volunteers'),
    ]);

    const membersList = Array.isArray(membersData) ? membersData : (membersData?.members || membersData?.data || []);
    const donationsList = Array.isArray(donationsData) ? donationsData : (donationsData?.donations || donationsData?.data || []);
    const eventsList = Array.isArray(eventsData) ? eventsData : (eventsData?.events || eventsData?.data || []);
    const volunteersList = Array.isArray(volunteersData) ? volunteersData : (volunteersData?.volunteers || volunteersData?.data || []);

    const totalDonations = donationsList.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

    setStats({
      members: membersList.length,
      donations: totalDonations,
      events: eventsList.length,
      volunteers: volunteersList.length,
    });
    setLoading(false);
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div>
      <div className="dashboard-welcome">
        <h1>Welcome back!</h1>
        <p className="date">{today}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon blue"><Users size={22} /></div>
            <span className="card-trend up"><TrendingUp size={14} /></span>
          </div>
          <div className="stat-value">{loading ? '...' : stats.members}</div>
          <div className="stat-label">Total Members</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon gold"><DollarSign size={22} /></div>
            <span className="card-trend up"><TrendingUp size={14} /></span>
          </div>
          <div className="stat-value">{loading ? '...' : `$${stats.donations.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</div>
          <div className="stat-label">Monthly Donations</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon teal"><Calendar size={22} /></div>
            <span className="card-trend up"><TrendingUp size={14} /></span>
          </div>
          <div className="stat-value">{loading ? '...' : stats.events}</div>
          <div className="stat-label">Upcoming Events</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon green"><Heart size={22} /></div>
            <span className="card-trend up"><TrendingUp size={14} /></span>
          </div>
          <div className="stat-value">{loading ? '...' : stats.volunteers}</div>
          <div className="stat-label">Active Volunteers</div>
        </div>
      </div>

      <h2 style={{ marginBottom: 20, fontSize: '1.25rem', fontWeight: 600 }}>Management Features</h2>
      <div className="feature-grid">
        {features.map((f) => (
          <div key={f.path} className="feature-card" onClick={() => navigate(f.path)}>
            <div className={`feature-icon ${f.color}`}>
              <f.icon size={24} />
            </div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
