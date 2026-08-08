import React from 'react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: 'fa-house' },
    { id: 'routes', label: 'Routes', icon: 'fa-route' },
    { id: 'incident', label: 'Incidents', icon: 'fa-triangle-exclamation' },
    { id: 'trips', label: 'Trips', icon: 'fa-car-side' },
    { id: 'profile', label: 'Profile', icon: 'fa-user' }
  ];

  return (
    <nav className="tactical-bottom-nav" aria-label="Bottom Navigation">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
          onClick={() => setActiveTab(item.id)}
          aria-label={item.label}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <i className={`fa-solid ${item.icon}`}></i>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
