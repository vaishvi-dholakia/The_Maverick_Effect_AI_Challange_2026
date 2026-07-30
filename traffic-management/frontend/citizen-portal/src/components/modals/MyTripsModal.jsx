import React from 'react';
import { X, BarChart3, Leaf, Award, Compass, TrendingUp } from 'lucide-react';

export default function MyTripsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const tripStats = {
    totalTrips: 24,
    totalDistance: "184 km",
    fuelSaved: "14.2 Liters",
    co2Reduced: "32.6 kg",
    ecoLevel: "Green Citizen • Tier 3"
  };

  const recentTrips = [
    { id: 1, date: 'Today, 8:30 AM', route: 'Home ➔ Tech Park', distance: '6.1 km', time: '10 mins', saved: '15% fuel' },
    { id: 2, date: 'Yesterday, 5:45 PM', route: 'Tech Park ➔ Central Mall', distance: '4.8 km', time: '12 mins', saved: '10% fuel' },
    { id: 3, date: 'July 28, 9:00 AM', route: 'Home ➔ Airport', distance: '14.2 km', time: '22 mins', saved: '18% fuel' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="d-flex align-items-center gap-2">
            <BarChart3 size={22} style={{ color: '#22d3ee' }} />
            <h2 className="modal-title">My Commute & Eco Stats</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="d-flex flex-column gap-3">
          <div style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%)', border: '1px solid rgba(6, 182, 212, 0.3)', borderRadius: '18px', padding: '16px' }}>
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="fw-bold text-light d-flex align-items-center gap-1">
                <Award size={18} style={{ color: '#34d399' }} /> {tripStats.ecoLevel}
              </span>
              <span style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.1)', color: '#22d3ee', padding: '2px 10px', borderRadius: '12px' }}>Active Eco-Rider</span>
            </div>

            <div className="d-grid gap-2" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '12px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Total Fuel Saved</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399' }}>{tripStats.fuelSaved}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>CO₂ Prevented</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8' }}>{tripStats.co2Reduced}</div>
              </div>
            </div>
          </div>

          <span className="fw-bold text-light">Recent Trips Log</span>

          {recentTrips.map((t) => (
            <div
              key={t.id}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '14px',
                padding: '12px'
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="fw-semibold text-light">{t.route}</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{t.date}</span>
              </div>
              <div className="d-flex justify-content-between" style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                <span>{t.distance} • {t.time}</span>
                <span style={{ color: '#34d399', fontWeight: 600 }}>🌱 {t.saved}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
