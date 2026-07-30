import React from 'react';
import { X, SquareParking, MapPin, Navigation, DollarSign } from 'lucide-react';

export default function ParkingModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const parkingLots = [
    { id: 1, name: 'Central Station Multi-level', available: 42, total: 150, rate: '₹30 / hr', distance: '0.4 km', EV: true },
    { id: 2, name: 'Tech Park Underground', available: 18, total: 200, rate: '₹40 / hr', distance: '1.2 km', EV: true },
    { id: 3, name: 'Hospital Plaza Lot', available: 8, total: 80, rate: '₹20 / hr', distance: '1.8 km', EV: false },
    { id: 4, name: 'Metro Station North', available: 65, total: 120, rate: '₹25 / hr', distance: '2.5 km', EV: true }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="d-flex align-items-center gap-2">
            <SquareParking size={22} style={{ color: '#a78bfa' }} />
            <h2 className="modal-title">Smart Parking Finder</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="d-flex flex-column gap-3">
          <p style={{ fontSize: '0.88rem', color: '#94a3b8' }}>
            Real-time available parking spaces near your current location.
          </p>

          {parkingLots.map((lot) => (
            <div
              key={lot.id}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px',
                padding: '14px'
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="fw-bold text-light">{lot.name}</span>
                <span style={{
                  background: lot.available > 15 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: lot.available > 15 ? '#34d399' : '#fbbf24',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: 600
                }}>
                  {lot.available} Spots Open
                </span>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-2" style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                <span>📍 {lot.distance} away</span>
                <span>🏷️ {lot.rate}</span>
                {lot.EV && <span style={{ color: '#60a5fa' }}>⚡ EV Charging</span>}
              </div>

              <button
                onClick={() => alert(`Navigating to ${lot.name}`)}
                style={{
                  width: '100%',
                  background: 'rgba(139, 92, 246, 0.15)',
                  color: '#c4b5fd',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '10px',
                  padding: '8px',
                  marginTop: '10px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Navigation size={14} /> Navigate to Parking
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
