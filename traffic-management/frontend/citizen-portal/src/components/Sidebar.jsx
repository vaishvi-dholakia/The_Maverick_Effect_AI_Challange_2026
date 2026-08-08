import React from 'react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'home', label: 'Commuter Home', icon: 'fa-house text-warning' },
    { id: 'routes', label: 'AI Route Planner', icon: 'fa-route text-info' },
    { id: 'greenwave', label: 'Green Wave Assistant', icon: 'fa-leaf text-success' },
    { id: 'incident', label: 'Incident Center', icon: 'fa-triangle-exclamation text-danger' },
    { id: 'trips', label: 'My Trips', icon: 'fa-car-side text-purple' },
    { id: 'parking', label: 'Parking Finder', icon: 'fa-square-p text-info' },
    { id: 'profile', label: 'Profile Account', icon: 'fa-user text-muted' },
  ];

  return (
    <aside className="sidebar" id="sidebar-nav">
      <div className="sidebar-brand">
        <i className="fa-solid fa-radar brand-icon"></i>
        <span className="brand-text">SmartTraffic AI</span>
      </div>
      <ul className="sidebar-nav">
        {/* Role Switcher back to Operator / Admin */}
        <li>
          <a 
            href="index.html" 
            className="nav-link text-info" 
            style={{ border: '1px solid rgba(56, 189, 248, 0.4)', background: 'rgba(56, 189, 248, 0.1)', marginBottom: '0.85rem' }}
          >
            <i className="fa-solid fa-user-shield text-info"></i>
            <span className="nav-text text-info fw-bold animate-pulse">Operator Portal</span>
          </a>
        </li>

        <div style={{ height: '1px', background: 'rgba(255, 176, 0, 0.12)', margin: '0.5rem 0.5rem 1rem 0.5rem' }}></div>

        {navItems.map((item) => (
          <li key={item.id}>
            <a 
              href="#" 
              className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(item.id);
              }}
            >
              <i className={`fa-solid ${item.icon}`}></i>
              <span className="nav-text">{item.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
