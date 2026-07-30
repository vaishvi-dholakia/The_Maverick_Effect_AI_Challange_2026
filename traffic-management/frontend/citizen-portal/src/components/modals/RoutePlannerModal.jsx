import React, { useState } from 'react';
import { X, Navigation, CheckCircle2, Clock, Leaf, ArrowRight, ShieldCheck } from 'lucide-react';

export default function RoutePlannerModal({ isOpen, onClose }) {
  const [origin, setOrigin] = useState("Central Station");
  const [destination, setDestination] = useState("Tech Park Crossing");
  const [selectedRoute, setSelectedRoute] = useState(1);

  if (!isOpen) return null;

  const routes = [
    {
      id: 1,
      name: "Bypass Service Corridor (AI Recommended)",
      distance: "6.1 km",
      time: "10 mins",
      traffic: "🟢 Low Traffic",
      fuelSaving: "15%",
      recommended: true,
      steps: ["Head North on Central Expressway", "Take Exit 4B onto Service Bypass", "Arrive at Tech Park Crossing"]
    },
    {
      id: 2,
      name: "Main Highway Corridor",
      distance: "5.2 km",
      time: "18 mins",
      traffic: "🟠 Heavy Delays",
      fuelSaving: "0%",
      recommended: false,
      steps: ["Head North on Central Expressway", "Continue straight through Junction A", "Expect 8 min bottleneck near Railway Crossing"]
    },
    {
      id: 3,
      name: "Ring Expressway",
      distance: "5.8 km",
      time: "14 mins",
      traffic: "🟡 Moderate Flow",
      fuelSaving: "6%",
      recommended: false,
      steps: ["Take Ring Expressway West", "Merge on Tech Park Flyover", "Arrive at destination"]
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="d-flex align-items-center gap-2">
            <Navigation size={22} style={{ color: '#38bdf8' }} />
            <h2 className="modal-title">Smart Route Planner</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="d-flex flex-column gap-3">
          <div className="d-flex flex-column gap-2" style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', width: '80px' }}>From:</span>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 12px', borderRadius: '8px', width: '100%' }}
              />
            </div>
            <div className="d-flex align-items-center gap-2">
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', width: '80px' }}>To:</span>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 12px', borderRadius: '8px', width: '100%' }}
              />
            </div>
          </div>

          <span className="fw-bold text-light mt-1">Available Corridors</span>

          {routes.map((rt) => (
            <div
              key={rt.id}
              onClick={() => setSelectedRoute(rt.id)}
              style={{
                background: selectedRoute === rt.id ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255,255,255,0.03)',
                border: selectedRoute === rt.id ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px',
                padding: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="fw-bold" style={{ color: selectedRoute === rt.id ? '#38bdf8' : '#fff' }}>
                  {rt.name}
                </span>
                {rt.recommended && (
                  <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '20px', fontWeight: 600 }}>
                    ★ AI Best Pick
                  </span>
                )}
              </div>

              <div className="d-flex gap-3 my-2" style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                <span>📏 {rt.distance}</span>
                <span>⏱️ {rt.time}</span>
                <span>{rt.traffic}</span>
                {rt.fuelSaving !== "0%" && (
                  <span style={{ color: '#34d399', fontWeight: 600 }}>🌱 Save {rt.fuelSaving} Fuel</span>
                )}
              </div>

              {selectedRoute === rt.id && (
                <div className="mt-2 pt-2" style={{ borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Turn-by-Turn Guidance:</span>
                  <ul className="m-0 pl-3 mt-1" style={{ fontSize: '0.82rem', color: '#e2e8f0', paddingLeft: '18px' }}>
                    {rt.steps.map((st, i) => (
                      <li key={i}>{st}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}

          <button
            onClick={() => {
              alert(`Starting Smart Navigation to ${destination} via ${routes.find(r => r.id === selectedRoute)?.name}`);
              onClose();
            }}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#fff',
              border: 'none',
              padding: '14px',
              borderRadius: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '8px'
            }}
          >
            <span>Start Smart Navigation</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
