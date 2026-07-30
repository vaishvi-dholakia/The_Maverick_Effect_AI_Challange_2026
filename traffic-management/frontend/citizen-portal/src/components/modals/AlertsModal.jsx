import React from 'react';
import { X, Bell, AlertTriangle, Siren, ShieldAlert, Check } from 'lucide-react';

export default function AlertsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const alerts = [
    {
      id: 1,
      type: 'emergency',
      title: '🚨 Emergency Corridor Active',
      location: 'Central Avenue — Junction A',
      message: 'Ambulance EMS-102 passing. All commuters please yield right lane.',
      time: 'Just now',
      severity: 'high'
    },
    {
      id: 2,
      type: 'construction',
      title: '🚧 Scheduled Maintenance',
      location: 'Flyover Ramp B',
      message: 'Single lane restricted due to surface repaving until 4:00 PM.',
      time: '15 mins ago',
      severity: 'medium'
    },
    {
      id: 3,
      type: 'weather',
      title: '🌧 Weather Advisory',
      location: 'City-wide',
      message: 'Light rain expected around 3:30 PM. Drive safely with headlights on.',
      time: '1 hour ago',
      severity: 'low'
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="d-flex align-items-center gap-2">
            <Bell size={22} style={{ color: '#fbbf24' }} />
            <h2 className="modal-title">Live Traffic Alerts</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="d-flex flex-column gap-3">
          {alerts.map((alt) => (
            <div
              key={alt.id}
              style={{
                background: alt.severity === 'high' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255,255,255,0.03)',
                border: alt.severity === 'high' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px',
                padding: '14px'
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="fw-bold text-light">{alt.title}</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{alt.time}</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#38bdf8', fontWeight: 500, marginBottom: '6px' }}>
                📍 {alt.location}
              </div>
              <p style={{ fontSize: '0.88rem', color: '#e2e8f0', margin: 0 }}>
                {alt.message}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
