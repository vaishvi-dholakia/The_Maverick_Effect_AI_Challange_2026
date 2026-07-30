import React, { useState, useEffect } from 'react';
import { CloudSun, User, Settings, Bell, Sun, Moon } from 'lucide-react';

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

  const getGreeting = () => {
    const hour = time.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const formattedTime = time.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const formattedDate = time.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header className="header-wrapper" style={{ padding: '14px 18px', background: 'var(--bg-card)', backdropFilter: 'blur(16px)', borderRadius: '24px', border: '1px solid var(--border-glass)', marginBottom: '16px' }}>
      {/* Top Bar: Global Items (Profile, Settings, Notifications, Weather, Time) */}
      <div className="d-flex align-items-center justify-content-between">
        {/* Profile & Greeting */}
        <div className="d-flex align-items-center gap-3">
          <button 
            onClick={onOpenProfile}
            className="avatar-btn-m3"
            style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', border: '2px solid rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)' }}
            title="Profile Settings"
          >
            <User size={20} />
          </button>

          <div>
            <h1 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {getGreeting()}, Alex 👋
            </h1>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {cityName}
            </span>
          </div>
        </div>

        {/* Global Controls: Weather, Time, Notifications, Settings */}
        <div className="d-flex align-items-center gap-2">
          {/* Weather Widget */}
          <div className="d-none d-sm-flex align-items-center gap-1" style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-primary)', border: '1px solid var(--border-glass)' }}>
            <CloudSun size={16} style={{ color: '#fbbf24' }} />
            <span>28°C</span>
          </div>

          {/* Time & Date Widget */}
          <div className="d-none d-md-flex align-items-center gap-1" style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.775rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', border: '1px solid var(--border-glass)' }}>
            <span>{formattedTime}</span>
            <span style={{ opacity: 0.3 }}>•</span>
            <span style={{ color: 'var(--text-muted)' }}>{formattedDate}</span>
          </div>

          {/* Notifications Button */}
          <button 
            onClick={onOpenNotifications}
            className="theme-toggle-btn-m3"
            title="Notifications"
            style={{ position: 'relative' }}
          >
            <Bell size={18} style={{ color: 'var(--text-primary)' }} />
            <span style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', border: '1px solid var(--bg-dark)' }}></span>
          </button>

          {/* Settings / Theme Toggle */}
          <button 
            onClick={onToggleTheme}
            className="theme-toggle-btn-m3"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={18} className="text-warning" /> : <Moon size={18} className="text-primary" />}
          </button>
        </div>
      </div>
    </header>
  );
}
