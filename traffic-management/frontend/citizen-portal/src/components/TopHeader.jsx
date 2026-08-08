import React, { useState, useEffect } from 'react';

export default function TopHeader({ 
  cityName = "Ahmedabad Smart City", 
  theme = 'dark', 
  onToggleTheme,
  onOpenProfile,
  onOpenSettings,
  onOpenNotifications
}) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const formattedDate = time.toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  const handleToggleSidebar = () => {
    document.body.classList.toggle('sidebar-collapsed');
  };

  return (
    <header className="top-navbar">
      <div className="d-flex align-items-center gap-3">
        <button 
          id="btn-toggle-sidebar" 
          className="btn btn-outline-warning btn-sm"
          onClick={handleToggleSidebar}
        >
          <i className="fa-solid fa-bars"></i>
        </button>
        <i className="fa-solid fa-users text-warning fs-5"></i>
        <h2 className="navbar-title m-0">Citizen Commuter Portal</h2>
      </div>

      <div className="navbar-right">
        {/* Quick Link back to Operator Portal */}
        <a 
          href="index.html" 
          className="btn btn-info btn-sm font-mono text-dark fw-bold me-2" 
          style={{ boxShadow: '0 0 10px rgba(56, 189, 248, 0.4)' }}
        >
          <i className="fa-solid fa-user-shield me-1"></i> Operator Portal
        </a>

        {/* Live Weather Widget */}
        <div className="d-none d-sm-flex align-items-center gap-1 font-mono text-muted me-2" style={{ fontSize: '0.8rem' }}>
          <i className="fa-solid fa-cloud-sun text-warning me-1"></i>
          <span>28°C</span>
        </div>

        {/* Live Time Display */}
        <div className="time-display d-none d-md-block me-3">
          <span>{formattedDate}</span> | <span className="text-warning fw-bold">{formattedTime}</span>
        </div>

        {/* User Dropdown */}
        <div className="dropdown">
          <a 
            href="#" 
            className="text-warning text-decoration-none" 
            onClick={(e) => {
              e.preventDefault();
              onOpenProfile();
            }}
          >
            <i className="fa-solid fa-circle-user fs-5 text-warning"></i>
          </a>
        </div>
      </div>
    </header>
  );
}
