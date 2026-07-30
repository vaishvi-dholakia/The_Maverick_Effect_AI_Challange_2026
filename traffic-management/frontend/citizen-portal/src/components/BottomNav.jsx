import React from 'react';
import { Home, Route, Bell, BarChart2, User } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: <Home size={20} className="nav-icon" /> },
    { id: 'routes', label: 'Routes', icon: <Route size={20} className="nav-icon" /> },
    { id: 'alerts', label: 'Alerts', icon: <Bell size={20} className="nav-icon" /> },
    { id: 'trips', label: 'Trips', icon: <BarChart2 size={20} className="nav-icon" /> },
    { id: 'profile', label: 'Profile', icon: <User size={20} className="nav-icon" /> }
  ];

  return (
    <nav className="bottom-nav" aria-label="Bottom Navigation">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
          onClick={() => setActiveTab(item.id)}
          aria-label={item.label}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
