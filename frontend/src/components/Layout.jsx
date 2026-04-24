import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, DollarSign, Users, Calendar,
  Heart, Star, Building, Bell, LogOut, Sparkles,
  BarChart3, UsersRound, HeartHandshake, Globe
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/sermons', label: 'Sermons', icon: BookOpen },
  { path: '/donations', label: 'Donations', icon: DollarSign },
  { path: '/members', label: 'Members', icon: Users },
  { path: '/events', label: 'Events', icon: Calendar },
  { path: '/volunteers', label: 'Volunteers', icon: Heart },
  { path: '/prayers', label: 'Prayers', icon: Star },
  { path: '/facilities', label: 'Facilities', icon: Building },
  { path: '/announcements', label: 'Announcements', icon: Bell },
  { path: '/attendance', label: 'Attendance', icon: BarChart3 },
  { path: '/small-groups', label: 'Small Groups', icon: UsersRound },
  { path: '/counseling', label: 'Counseling', icon: HeartHandshake },
  { path: '/outreach', label: 'Outreach', icon: Globe },
];

function Layout({ children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Sparkles size={20} />
          </div>
          <span className="sidebar-brand">Sacred Grounds</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-avatar">A</div>
          <div className="user-info">
            <div className="user-name">Admin</div>
            <div className="user-role">Administrator</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;
