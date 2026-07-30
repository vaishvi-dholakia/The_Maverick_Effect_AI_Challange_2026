import React from 'react';
import { X, User, Shield, Bell, MapPin, Moon, Smartphone } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="d-flex align-items-center gap-2">
            <User size={22} style={{ color: '#60a5fa' }} />
            <h2 className="modal-title">Citizen Profile & Settings</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="d-flex flex-column gap-3">
          <div className="d-flex align-items-center gap-3" style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '18px' }}>
            <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: '#fff', fontWeight: 700 }}>
              U
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>Citizen Commuter</h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>Ahmedabad Smart City ID #88492</p>
              <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>Verified Eco Commuter</span>
            </div>
          </div>

          <span className="fw-bold text-light">Preferences</span>

          <div className="d-flex flex-column gap-2">
            <div className="d-flex align-items-center justify-content-between p-3" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
              <div className="d-flex align-items-center gap-2">
                <Bell size={18} style={{ color: '#fbbf24' }} />
                <span style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>Emergency Traffic Alerts</span>
              </div>
              <input type="checkbox" defaultChecked style={{ accentColor: '#3b82f6', width: '18px', height: '18px' }} />
            </div>

            <div className="d-flex align-items-center justify-content-between p-3" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
              <div className="d-flex align-items-center gap-2">
                <MapPin size={18} style={{ color: '#38bdf8' }} />
                <span style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>Live AI Route Suggestions</span>
              </div>
              <input type="checkbox" defaultChecked style={{ accentColor: '#3b82f6', width: '18px', height: '18px' }} />
            </div>

            <div className="d-flex align-items-center justify-content-between p-3" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
              <div className="d-flex align-items-center gap-2">
                <Moon size={18} style={{ color: '#a78bfa' }} />
                <span style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>Dark Glassmorphism Theme</span>
              </div>
              <input type="checkbox" defaultChecked style={{ accentColor: '#3b82f6', width: '18px', height: '18px' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
