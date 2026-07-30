import React, { useState, useEffect, useRef } from 'react';
import {
  Zap, Clock, ArrowRight, ShieldCheck, Sparkles, CheckCircle2,
  AlertCircle, Bell, Navigation, Leaf, Timer, Heart, Activity, Car
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function AiGreenWaveAssistant({ onBackToHome }) {
  // Decision State
  const [shouldLeaveNow, setShouldLeaveNow] = useState(false);
  const [recommendedTime, setRecommendedTime] = useState("8:25 AM");
  const [waitTimeMins, setWaitTimeMins] = useState(3);
  const [timeSavedMins, setTimeSavedMins] = useState(6);
  const [probabilityScore, setProbabilityScore] = useState(92);

  // Live countdown timers for signals (seconds left in current phase)
  const [signals, setSignals] = useState([
    { id: 1, name: "Junction A - Central Ave", state: "green", timeSec: 18 },
    { id: 2, name: "Junction B - Ring Road", state: "green", timeSec: 42 },
    { id: 3, name: "Junction C - Tech Park Crossing", state: "yellow", timeSec: 5 },
    { id: 4, name: "Junction D - Airport Expressway", state: "green", timeSec: 30 }
  ]);

  // Live Recalculation Banner
  const [liveUpdateNotice, setLiveUpdateNotice] = useState("");

  // Notification Toggles
  const [notifications, setNotifications] = useState({
    bestDeparture: true,
    greenWaveActive: true,
    emergencyCorridor: true,
    accidentAdvisory: true
  });

  // Map Ref
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Ticking signal countdown effect
  useEffect(() => {
    const timer = setInterval(() => {
      setSignals(prevSignals =>
        prevSignals.map(sig => {
          if (sig.timeSec <= 1) {
            // Cycle signal states: green -> yellow -> red -> green
            const nextState = sig.state === 'green' ? 'yellow' : sig.state === 'yellow' ? 'red' : 'green';
            const nextTime = nextState === 'green' ? 35 : nextState === 'yellow' ? 5 : 20;
            return { ...sig, state: nextState, timeSec: nextTime };
          }
          return { ...sig, timeSec: sig.timeSec - 1 };
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Live traffic condition recalculation trigger
  useEffect(() => {
    const recalcTimer = setTimeout(() => {
      setLiveUpdateNotice("⚡ AI updated prediction: Signal Sync on Hospital Corridor improved. A better departure time is now available!");
    }, 6000);

    return () => clearTimeout(recalcTimer);
  }, []);

  // Leaflet Map Initialization
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false
      }).setView([23.0225, 72.5714], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap • Green Wave AI'
      }).addTo(map);

      // Signal Nodes
      const nodes = [
        { name: "Junction A", lat: 23.0225, lng: 72.5714, state: 'green' },
        { name: "Junction B", lat: 23.0300, lng: 72.5800, state: 'green' },
        { name: "Junction C", lat: 23.0150, lng: 72.5600, state: 'yellow' },
        { name: "Junction D", lat: 23.0400, lng: 72.5900, state: 'green' }
      ];

      nodes.forEach(n => {
        const color = n.state === 'green' ? '#10b981' : n.state === 'yellow' ? '#f59e0b' : '#ef4444';
        L.circleMarker([n.lat, n.lng], {
          radius: 12,
          fillColor: color,
          color: '#ffffff',
          weight: 3,
          opacity: 1,
          fillOpacity: 0.95
        }).addTo(map).bindPopup(`<b>${n.name}</b><br/>Status: Synchronized Green Wave`);
      });

      // Synchronized Polyline Path
      L.polyline([
        [23.0225, 72.5714],
        [23.0300, 72.5800],
        [23.0350, 72.5900]
      ], { color: '#10b981', weight: 6, opacity: 0.95 }).addTo(map);

      mapInstanceRef.current = map;
    }
  }, []);

  const toggleNotification = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="route-planner-container">
      {/* Header Bar */}
      <div className="d-flex align-items-center justify-content-between mb-1">
        <div className="d-flex align-items-center gap-2">
          <button
            onClick={onBackToHome}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 14px', borderRadius: '12px', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            ← Home
          </button>
          <h2 className="modal-title" style={{ fontSize: '1.3rem' }}>🚦 AI Green Wave Assistant</h2>
        </div>
        <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700 }}>
          🟢 Sync Engine Active
        </div>
      </div>

      {/* HOME FEATURED CARD - "Should I Leave Now?" */}
      <div className="green-wave-card">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>
              AI Departure Decision
            </span>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '1.6rem', color: '#ffffff', fontFamily: 'Outfit, sans-serif' }}>
              Should I Leave Now?
            </h3>
          </div>

          {/* Green Wave Score Badge */}
          <div className="score-badge">
            <span className="score-num">{probabilityScore}%</span>
            <span className="score-label">Green Wave</span>
          </div>
        </div>

        {/* DECISION PILL */}
        <div className="d-flex align-items-center justify-content-between my-3 flex-wrap gap-2">
          <div className={`green-wave-decision-pill ${shouldLeaveNow ? 'yes-leave' : 'no-wait'}`}>
            <span>{shouldLeaveNow ? "YES — LEAVE NOW" : "NO — WAIT 3 MINS"}</span>
          </div>

          {!shouldLeaveNow && (
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Recommended Departure</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8' }}>{recommendedTime}</div>
            </div>
          )}
        </div>

        {/* REASON & TIME SAVED SUMMARY */}
        <div className="d-flex flex-column gap-2 mt-3" style={{ background: 'rgba(255,255,255,0.04)', padding: '14px 18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="d-flex align-items-center gap-2" style={{ color: '#e2e8f0', fontSize: '0.92rem' }}>
            <Sparkles size={18} style={{ color: '#38bdf8' }} />
            <span><b>Reason:</b> Traffic signals will synchronize in {waitTimeMins} minutes.</span>
          </div>
          <div className="d-flex align-items-center gap-2" style={{ color: '#34d399', fontSize: '0.9rem', fontWeight: 600 }}>
            <Clock size={16} />
            <span>Expected Time Saved: <b>{timeSavedMins} Minutes</b></span>
          </div>
        </div>
      </div>

      {/* LIVE RECALCULATION NOTICE */}
      {liveUpdateNotice && (
        <div className="reroute-banner">
          <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
            <Sparkles size={18} style={{ color: '#fbbf24' }} />
            <span>{liveUpdateNotice}</span>
          </div>
          <button className="switch-route-btn" onClick={() => setShouldLeaveNow(true)}>
            Refresh Sync
          </button>
        </div>
      )}

      {/* TRAVEL COMPARISON (Leave Now vs Leave After 3 Mins) */}
      <section className="glass-card">
        <div className="section-title mb-3">
          <span>Travel Comparison</span>
          <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>★ AI Optimized</span>
        </div>

        <div className="d-grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          {/* LEAVE NOW */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '16px' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold text-light" style={{ fontSize: '1rem' }}>Leave Now</span>
              <span style={{ fontSize: '0.75rem', color: '#f87171', background: 'rgba(239, 68, 68, 0.15)', padding: '2px 10px', borderRadius: '12px', fontWeight: 600 }}>
                Un-synchronized
              </span>
            </div>

            <div className="d-flex flex-column gap-2" style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>
              <div className="d-flex justify-content-between">
                <span>Travel Time:</span>
                <span className="fw-bold text-light">26 Minutes</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Expected Stops:</span>
                <span className="fw-bold text-danger">7 Stops</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Red Signals:</span>
                <span className="fw-bold text-danger">5 Lights</span>
              </div>
            </div>
          </div>

          {/* LEAVE AFTER 3 MINS (RECOMMENDED) */}
          <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)', border: '1px solid rgba(16, 185, 129, 0.5)', borderRadius: '18px', padding: '16px', boxShadow: '0 0 25px rgba(16, 185, 129, 0.15)' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-bold text-light" style={{ fontSize: '1rem' }}>Leave After 3 Mins</span>
              <span style={{ fontSize: '0.75rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.2)', padding: '2px 10px', borderRadius: '12px', fontWeight: 700 }}>
                ★ Recommended
              </span>
            </div>

            <div className="d-flex flex-column gap-2" style={{ fontSize: '0.88rem', color: '#e2e8f0' }}>
              <div className="d-flex justify-content-between">
                <span>Travel Time:</span>
                <span className="fw-bold style={{ color: '#34d399' }}">18 Minutes (-8m)</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Expected Stops:</span>
                <span className="fw-bold text-success">2 Stops</span>
              </div>
              <div className="d-flex justify-content-between">
                <span>Red Signals:</span>
                <span className="fw-bold text-success">1 Light</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SIGNAL TIMELINE SEQUENCE */}
      <section className="glass-card">
        <div className="section-title">
          <span>Live Signal Timeline Sequence</span>
          <span style={{ fontSize: '0.78rem', color: '#38bdf8' }}>Countdown Active</span>
        </div>

        <div className="signal-chain">
          {signals.map((sig) => (
            <div key={sig.id} className="signal-chain-item">
              <div className="d-flex align-items-center gap-2">
                <span className={`signal-node ${sig.state}`}>
                  {sig.state === 'green' ? '🟢 Green' : sig.state === 'yellow' ? '🟡 Yellow' : '🔴 Red'}
                </span>
                <span className="fw-semibold text-light" style={{ fontSize: '0.9rem' }}>{sig.name}</span>
              </div>
              <div className="d-flex align-items-center gap-1" style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, color: sig.state === 'green' ? '#34d399' : '#fbbf24' }}>
                <Timer size={14} />
                <span>{sig.timeSec} sec</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI EXPLANATION CARD */}
      <section className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(30, 41, 70, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
        <div className="d-flex align-items-center gap-2 mb-2" style={{ color: '#38bdf8', fontWeight: 700, fontSize: '1rem' }}>
          <Sparkles size={18} />
          <span>AI Traffic Intelligence Explanation</span>
        </div>
        <p style={{ margin: 0, fontSize: '0.92rem', color: '#e2e8f0', lineHeight: 1.6 }}>
          "If you leave in approximately 3 minutes, the AI predicts that six traffic signals along your route will be synchronized, reducing waiting time and fuel consumption."
        </p>
      </section>

      {/* GREEN WAVE VISUALIZATION MAP */}
      <div className="glass-card p-0" style={{ overflow: 'hidden', height: '300px', position: 'relative' }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
        <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 500, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(10px)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.4)', fontSize: '0.8rem', color: '#34d399', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="pulse-dot"></span>
          <span>Green Wave Active</span>
        </div>
      </div>

      {/* BENEFITS PANEL */}
      <section className="glass-card">
        <div className="section-title mb-3">
          <span>Green Wave Commuter Benefits</span>
        </div>

        <div className="city-metrics-grid">
          <div className="metric-box">
            <span className="metric-label"><Clock size={14} style={{ color: '#38bdf8' }} /> Time Saved</span>
            <span className="metric-value">6 Minutes</span>
            <span className="metric-subtext">25% Faster Trip</span>
          </div>

          <div className="metric-box">
            <span className="metric-label"><Leaf size={14} style={{ color: '#34d399' }} /> Fuel Saved</span>
            <span className="metric-value">16% (0.4L)</span>
            <span className="metric-subtext">Less Stop & Go</span>
          </div>

          <div className="metric-box">
            <span className="metric-label"><Heart size={14} style={{ color: '#f87171' }} /> Driving Comfort</span>
            <span className="metric-value">95% Smooth</span>
            <span className="metric-subtext">Stress-free Commute</span>
          </div>

          <div className="metric-box">
            <span className="metric-label"><Activity size={14} style={{ color: '#a78bfa' }} /> CO₂ Reduced</span>
            <span className="metric-value">22% Offset</span>
            <span className="metric-subtext">Green Citizen Impact</span>
          </div>
        </div>
      </section>

      {/* AI RECOMMENDATION HISTORY */}
      <section className="glass-card">
        <div className="section-title mb-3">
          <span>AI Recommendation History</span>
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Real-time Evolution</span>
        </div>

        <div className="history-timeline">
          <div className="history-item">
            <span style={{ color: '#38bdf8', fontWeight: 700 }}>08:15 AM</span>
            <span style={{ color: '#e2e8f0' }}>Leave in 2 Minutes</span>
            <span style={{ color: '#34d399', fontSize: '0.78rem' }}>Sync Progressing</span>
          </div>
          <div className="history-item">
            <span style={{ color: '#38bdf8', fontWeight: 700 }}>08:20 AM</span>
            <span style={{ color: '#34d399', fontWeight: 700 }}>Leave Now</span>
            <span style={{ color: '#34d399', fontSize: '0.78rem' }}>Green Wave Peak</span>
          </div>
          <div className="history-item">
            <span style={{ color: '#38bdf8', fontWeight: 700 }}>08:25 AM</span>
            <span style={{ color: '#fbbf24' }}>Heavy Traffic Detected</span>
            <span style={{ color: '#fbbf24', fontSize: '0.78rem' }}>Wait 3 Mins</span>
          </div>
        </div>
      </section>

      {/* PUSH NOTIFICATIONS TOGGLES */}
      <section className="glass-card mb-4">
        <div className="section-title mb-3">
          <span>Green Wave Notification Preferences</span>
        </div>

        <div className="d-flex flex-column gap-2">
          <div className="d-flex align-items-center justify-content-between p-3" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px' }}>
            <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.88rem', color: '#e2e8f0' }}>
              <Bell size={16} style={{ color: '#34d399' }} />
              <span>Best time to leave in 5 minutes</span>
            </div>
            <input type="checkbox" checked={notifications.bestDeparture} onChange={() => toggleNotification('bestDeparture')} style={{ accentColor: '#10b981', width: '18px', height: '18px' }} />
          </div>

          <div className="d-flex align-items-center justify-content-between p-3" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px' }}>
            <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.88rem', color: '#e2e8f0' }}>
              <Car size={16} style={{ color: '#38bdf8' }} />
              <span>Green Wave is active on your frequent route</span>
            </div>
            <input type="checkbox" checked={notifications.greenWaveActive} onChange={() => toggleNotification('greenWaveActive')} style={{ accentColor: '#10b981', width: '18px', height: '18px' }} />
          </div>

          <div className="d-flex align-items-center justify-content-between p-3" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px' }}>
            <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.88rem', color: '#e2e8f0' }}>
              <Zap size={16} style={{ color: '#fbbf24' }} />
              <span>Emergency corridor detected on route</span>
            </div>
            <input type="checkbox" checked={notifications.emergencyCorridor} onChange={() => toggleNotification('emergencyCorridor')} style={{ accentColor: '#10b981', width: '18px', height: '18px' }} />
          </div>

          <div className="d-flex align-items-center justify-content-between p-3" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px' }}>
            <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.88rem', color: '#e2e8f0' }}>
              <AlertCircle size={16} style={{ color: '#f87171' }} />
              <span>Accident reported near destination</span>
            </div>
            <input type="checkbox" checked={notifications.accidentAdvisory} onChange={() => toggleNotification('accidentAdvisory')} style={{ accentColor: '#10b981', width: '18px', height: '18px' }} />
          </div>
        </div>
      </section>
    </div>
  );
}
