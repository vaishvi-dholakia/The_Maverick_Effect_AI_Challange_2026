import React, { useState, useEffect, useRef } from 'react';
import {
  Activity, Map, AlertTriangle, Siren, ShieldAlert, Video, Gauge, Clock,
  Car, TrafficCone, CloudRain, Navigation, CheckCircle2, ArrowRight, Filter,
  Sparkles, RefreshCw, Zap
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function LiveTrafficIncidentCenter({ onBackToHome, onOpenRoutePlanner }) {
  // Active Filter: 'all' | 'accident' | 'construction' | 'emergency' | 'congestion' | 'closure' | 'weather'
  const [activeFilter, setActiveFilter] = useState('all');

  // Selected Junction ID for Details Card
  const [selectedJunctionId, setSelectedJunctionId] = useState('J101');

  // Ticking AI update counter (seconds ago)
  const [secondsAgo, setSecondsAgo] = useState(2);

  // Map Ref
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  // Junction Data
  const junctions = [
    {
      id: 'J101',
      name: 'Junction A - Central Avenue',
      density: 'Moderate',
      color: '#f59e0b',
      speed: '42 km/h',
      vehicles: 38,
      signal: '🟢 Green (18s left)',
      delay: '2 mins',
      aiRec: 'AI extended green signal by 15s to clear northbound queue.',
      status: 'Open & AI Monitored',
      lat: 23.0225,
      lng: 72.5714
    },
    {
      id: 'J102',
      name: 'Junction B - Ring Road Flyover',
      density: 'Low',
      color: '#10b981',
      speed: '58 km/h',
      vehicles: 18,
      signal: '🟢 Green (42s left)',
      delay: '0 mins',
      aiRec: 'Optimal green wave synchronization active.',
      status: 'Smooth Flow',
      lat: 23.0300,
      lng: 72.5800
    },
    {
      id: 'J103',
      name: 'Junction C - Tech Park Crossing',
      density: 'Heavy',
      color: '#f97316',
      speed: '28 km/h',
      vehicles: 82,
      signal: '🟡 Yellow (5s left)',
      delay: '8 mins',
      aiRec: 'AI recommending Service Bypass corridor to avoid 8-minute bottleneck.',
      status: 'Congested',
      lat: 23.0150,
      lng: 72.5600
    },
    {
      id: 'J104',
      name: 'Junction D - Railway Station Plaza',
      density: 'Critical',
      color: '#ef4444',
      speed: '0 km/h',
      vehicles: 110,
      signal: '🔴 Red (Closed Lane)',
      delay: '18 mins',
      aiRec: 'Accident clearance in progress. Diversion active via Hospital Road.',
      status: 'Road Closed',
      lat: 23.0400,
      lng: 72.5900
    }
  ];

  // Incidents Master Data covering all 7 mandatory alert types
  const allIncidents = [
    {
      id: 1,
      category: 'closure',
      type: 'Road Closure',
      icon: <TrafficCone size={18} style={{ color: '#ef4444' }} />,
      title: '🛑 Road Closure — Railway Station Plaza',
      location: 'Railway Station Road (Northbound)',
      time: '12 mins ago',
      severity: 'High',
      delay: '+18 mins',
      affected: 'Railway Plaza, Central Market',
      alternate: 'Hospital Road Bypass',
      recommendedAction: 'Take Hospital Road Bypass corridor. Avoid Railway Station Plaza till 11:30 AM.'
    },
    {
      id: 2,
      category: 'emergency',
      type: 'Emergency Corridor',
      icon: <Siren size={18} style={{ color: '#ef4444' }} />,
      title: '🚑 Priority Emergency Corridor Active',
      location: 'Central Avenue — Junction A',
      time: 'Just now',
      severity: 'Critical',
      delay: '0 min (Yield Right Lane)',
      affected: 'Central Avenue Lanes 1 & 2',
      alternate: 'Keep Right Lane Clear',
      recommendedAction: 'Ambulance in transit. Pull over to left lane immediately and yield right of way.'
    },
    {
      id: 3,
      category: 'accident',
      type: 'Accidents',
      icon: <AlertTriangle size={18} style={{ color: '#f97316' }} />,
      title: '🚗 Accident Collision Reported',
      location: 'Tech Park Crossing Ramp B',
      time: '8 mins ago',
      severity: 'High',
      delay: '+12 mins',
      affected: 'Tech Park Flyover Exit',
      alternate: 'Ring Road Expressway',
      recommendedAction: 'Reroute via Ring Road Expressway Exit 4 to bypass collision site.'
    },
    {
      id: 4,
      category: 'construction',
      type: 'Road Work',
      icon: <TrafficCone size={18} style={{ color: '#eab308' }} />,
      title: '🚧 Scheduled Road Work & Resurfacing',
      location: 'Airport Expressway Lane 3',
      time: '25 mins ago',
      severity: 'Medium',
      delay: '+5 mins',
      affected: 'Expressway Northbound',
      alternate: 'Service Lane 1',
      recommendedAction: 'Reduce speed to 30 km/h and merge into left active lane.'
    },
    {
      id: 5,
      category: 'congestion',
      type: 'Heavy Traffic',
      icon: <Car size={18} style={{ color: '#f59e0b' }} />,
      title: '🚗 Heavy Traffic Congestion Backlog',
      location: 'City Center Flyover',
      time: '15 mins ago',
      severity: 'Medium',
      delay: '+8 mins',
      affected: 'Downtown Hub',
      alternate: 'Hospital Road Corridor',
      recommendedAction: 'AI signal extension active. Use Hospital Bypass for 10 min faster travel.'
    },
    {
      id: 6,
      category: 'flood',
      type: 'Flood',
      icon: <CloudRain size={18} style={{ color: '#38bdf8' }} />,
      title: '🌊 Waterlogging & Flood Advisory',
      location: 'Underpass Exit 4 Lowland Crossing',
      time: '18 mins ago',
      severity: 'High',
      delay: '+22 mins',
      affected: 'Lowland Service Road',
      alternate: 'Elevated Flyover Ramp',
      recommendedAction: 'Avoid Underpass Exit 4 due to 1.2 ft water accumulation. Take Elevated Ramp.'
    },
    {
      id: 7,
      category: 'vip',
      type: 'VIP Movement',
      icon: <ShieldAlert size={18} style={{ color: '#a855f7' }} />,
      title: '🚔 VIP Convoy Escort Movement',
      location: 'State Highway 12 Diplomatic Avenue',
      time: '5 mins ago',
      severity: 'Medium',
      delay: '+15 mins',
      affected: 'Diplomatic Enclave',
      alternate: 'Outer Ring Road',
      recommendedAction: 'Intermittent signal holds active for official escort convoy.'
    }
  ];

  // Smart AI Alerts Data
  const smartAlerts = [
    {
      id: 1,
      priority: 'high',
      title: 'Heavy traffic detected near Railway Station Plaza.',
      rec: 'Avoid Railway Station Road. Hospital Road is currently 14 mins faster.',
      time: '2 mins ago'
    },
    {
      id: 2,
      priority: 'high',
      title: 'Road closed near City Mall due to accident clearance.',
      rec: 'Traffic diverted via Service Bypass Lane. Reopening expected in 20 min.',
      time: '5 mins ago'
    },
    {
      id: 3,
      priority: 'medium',
      title: 'Hospital Road is currently the fastest city route.',
      rec: 'AI green wave signals synchronized for 52 km/h smooth flow.',
      time: '10 mins ago'
    },
    {
      id: 4,
      priority: 'low',
      title: 'Accident cleared on Ring Road Flyover.',
      rec: 'Traffic returning to normal speed (58 km/h).',
      time: '14 mins ago'
    }
  ];

  // Major City Roads Status
  const cityRoads = [
    {
      name: 'Hospital Road Corridor',
      status: 'open',
      statusText: '🟢 Open & Smooth',
      speed: '52 km/h',
      delay: '0 min',
      reason: 'AI Green Wave Synchronized'
    },
    {
      name: 'City Center Expressway',
      status: 'heavy',
      statusText: '🟠 Heavy Flow',
      speed: '28 km/h',
      delay: '8 min',
      reason: 'Peak Hour Merge Traffic'
    },
    {
      name: 'Railway Station Road',
      status: 'closed',
      statusText: '🔴 Closed (Accident)',
      speed: '0 km/h',
      delay: '18 min',
      reason: 'Accident Clearance • Expected Reopening: 20 min'
    }
  ];

  // AI Insights
  const aiInsights = [
    "Traffic flow is improving near City Center following AI signal timing adjustment.",
    "Hospital Road currently has the lowest congestion across the metropolitan area.",
    "Heavy evening peak traffic is predicted after 5:00 PM along Tech Park Crossing.",
    "Road repaving work on Airport Expressway may cause minor 3-minute delays for the next 30 minutes."
  ];

  // Chronological Timeline Events
  const timelineEvents = [
    { time: '09:12', text: '🚗 Accident Reported near Railway Station Plaza' },
    { time: '09:15', text: '🚦 AI Increased Green Signal Duration by 20s on Hospital Bypass' },
    { time: '09:18', text: '🚑 Emergency Corridor Activated for Ambulance EMS-102' },
    { time: '09:24', text: '🚧 Minor Fender Bender Cleared on Tech Park Flyover' },
    { time: '09:30', text: 'Traffic Flow Returned to Normal on Ring Road' }
  ];

  // Heartbeat ticker effect
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(prev => (prev >= 5 ? 1 : prev + 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Leaflet Map Initialization
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false
      }).setView([23.0225, 72.5714], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap • SmartTraffic AI'
      }).addTo(map);

      junctions.forEach(j => {
        const marker = L.circleMarker([j.lat, j.lng], {
          radius: 12,
          fillColor: j.color,
          color: '#ffffff',
          weight: 3,
          opacity: 1,
          fillOpacity: 0.95
        }).addTo(map);

        marker.on('click', () => setSelectedJunctionId(j.id));
        marker.bindPopup(`<b>${j.name}</b><br/>Density: <b>${j.density}</b><br/>Speed: ${j.speed}`);
      });

      mapInstanceRef.current = map;
    }
  }, []);

  const filteredIncidents = activeFilter === 'all'
    ? allIncidents
    : allIncidents.filter(i => i.category === activeFilter);

  const selectedJunction = junctions.find(j => j.id === selectedJunctionId) || junctions[0];

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
          <h2 className="modal-title" style={{ fontSize: '1.3rem' }}>Live Traffic & Incident Center</h2>
        </div>
        <div style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="pulse-dot"></span>
          <span>Live Ticker</span>
        </div>
      </div>

      {/* CITY OVERVIEW CARD */}
      <div className="glass-card city-status-card">
        <div className="city-status-header">
          <span className="status-title">City-Wide Traffic Overview</span>
          <span style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: 600 }}>
            ⚡ AI Updated {secondsAgo} sec ago
          </span>
        </div>

        <div className="city-metrics-grid">
          <div className="metric-box">
            <span className="metric-label"><Activity size={14} style={{ color: '#fbbf24' }} /> Traffic Level</span>
            <span className="metric-value" style={{ color: '#fbbf24' }}>🟡 Moderate</span>
            <span className="metric-subtext">Normal Flow</span>
          </div>

          <div className="metric-box">
            <span className="metric-label"><Gauge size={14} style={{ color: '#34d399' }} /> Avg City Speed</span>
            <span className="metric-value">42 km/h</span>
            <span className="metric-subtext">Optimal Pace</span>
          </div>

          <div className="metric-box">
            <span className="metric-label"><AlertTriangle size={14} style={{ color: '#f97316' }} /> Active Incidents</span>
            <span className="metric-value">5 Reported</span>
            <span className="metric-subtext">AI Monitoring</span>
          </div>

          <div className="metric-box">
            <span className="metric-label"><TrafficCone size={14} style={{ color: '#ef4444' }} /> Closures & Corridors</span>
            <span className="metric-value">1 Closed • 2 EMS</span>
            <span className="metric-subtext">Diversions Active</span>
          </div>
        </div>
      </div>

      {/* LIVE CITY MAP */}
      <div className="glass-card p-0" style={{ overflow: 'hidden', height: '320px', position: 'relative' }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
        <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 500, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(10px)', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.78rem', color: '#fff' }}>
          <span>📍 Click any junction marker to view live telemetry</span>
        </div>
      </div>

      {/* SELECTED JUNCTION DETAILS CARD */}
      <section className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(20, 30, 50, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <Video size={20} style={{ color: '#38bdf8' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>{selectedJunction.name}</h3>
          </div>
          <span style={{ background: 'rgba(255,255,255,0.06)', color: selectedJunction.color, padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>
            {selectedJunction.density} Density
          </span>
        </div>

        <div className="city-metrics-grid mb-3">
          <div className="metric-box">
            <span className="metric-label">Vehicle Count</span>
            <span className="metric-value">{selectedJunction.vehicles}</span>
            <span className="metric-subtext">Live AI Camera</span>
          </div>

          <div className="metric-box">
            <span className="metric-label">Average Speed</span>
            <span className="metric-value">{selectedJunction.speed}</span>
            <span className="metric-subtext">Flow Rate</span>
          </div>

          <div className="metric-box">
            <span className="metric-label">Current Signal</span>
            <span className="metric-value" style={{ fontSize: '0.95rem', color: '#34d399' }}>{selectedJunction.signal}</span>
            <span className="metric-subtext">Adaptive Timing</span>
          </div>

          <div className="metric-box">
            <span className="metric-label">Expected Delay</span>
            <span className="metric-value">{selectedJunction.delay}</span>
            <span className="metric-subtext">{selectedJunction.status}</span>
          </div>
        </div>

        <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '14px', padding: '12px', fontSize: '0.88rem', color: '#e2e8f0' }}>
          <span style={{ color: '#38bdf8', fontWeight: 700 }}>AI Recommendation: </span>
          {selectedJunction.aiRec}
        </div>
      </section>

      {/* LIVE CATEGORY FILTERS & INCIDENTS FEED */}
      <section className="glass-card">
        <div className="section-title mb-3">
          <span>Live City Incidents & Feed</span>
        </div>

        {/* Category Filter Chips for all 7 alert categories */}
        <div className="chips-row mb-3" style={{ flexWrap: 'wrap', gap: '6px' }}>
          <button className={`incident-filter-chip ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>All ({allIncidents.length})</button>
          <button className={`incident-filter-chip ${activeFilter === 'accident' ? 'active' : ''}`} onClick={() => setActiveFilter('accident')}>💥 Accidents ({allIncidents.filter(i => i.category === 'accident').length})</button>
          <button className={`incident-filter-chip ${activeFilter === 'closure' ? 'active' : ''}`} onClick={() => setActiveFilter('closure')}>🛑 Closures ({allIncidents.filter(i => i.category === 'closure').length})</button>
          <button className={`incident-filter-chip ${activeFilter === 'construction' ? 'active' : ''}`} onClick={() => setActiveFilter('construction')}>🚧 Work ({allIncidents.filter(i => i.category === 'construction').length})</button>
          <button className={`incident-filter-chip ${activeFilter === 'congestion' ? 'active' : ''}`} onClick={() => setActiveFilter('congestion')}>🚗 Heavy ({allIncidents.filter(i => i.category === 'congestion').length})</button>
          <button className={`incident-filter-chip ${activeFilter === 'flood' ? 'active' : ''}`} onClick={() => setActiveFilter('flood')}>🌊 Flood ({allIncidents.filter(i => i.category === 'flood').length})</button>
          <button className={`incident-filter-chip ${activeFilter === 'vip' ? 'active' : ''}`} onClick={() => setActiveFilter('vip')}>🚔 VIP ({allIncidents.filter(i => i.category === 'vip').length})</button>
          <button className={`incident-filter-chip ${activeFilter === 'emergency' ? 'active' : ''}`} onClick={() => setActiveFilter('emergency')}>🚑 Emergency ({allIncidents.filter(i => i.category === 'emergency').length})</button>
        </div>

        {/* Incident Items */}
        <div className="d-flex flex-column gap-3">
          {filteredIncidents.map((inc) => (
            <div
              key={inc.id}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderLeft: inc.severity === 'Critical' ? '4px solid #ef4444' : inc.severity === 'High' ? '4px solid #f97316' : '4px solid #f59e0b',
                borderRadius: '16px',
                padding: '16px'
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center gap-2">
                  {inc.icon}
                  <span className="fw-bold text-light" style={{ fontSize: '0.95rem' }}>{inc.title}</span>
                </div>
                <span className={`priority-tag ${inc.severity.toLowerCase()}`}>
                  {inc.severity} Severity
                </span>
              </div>

              {/* Required 5 attributes: Location, Time, Severity, Estimated Delay, Recommended Action */}
              <div style={{ fontSize: '0.82rem', color: '#38bdf8', marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <span>📍 <b>Location:</b> {inc.location}</span>
                <span>⏰ <b>Time:</b> {inc.time}</span>
              </div>

              <div className="d-flex justify-content-between mt-2" style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                <span>⏱️ <b>Estimated Delay:</b> <b style={{ color: '#f87171' }}>{inc.delay}</b></span>
                <span>Zone: {inc.affected}</span>
              </div>

              {inc.recommendedAction && (
                <div className="mt-2 pt-2" style={{ background: 'rgba(255, 176, 0, 0.08)', border: '1px dashed rgba(255, 176, 0, 0.3)', borderRadius: '8px', padding: '8px 12px', fontSize: '0.82rem', color: '#fde68a' }}>
                  💡 <b>Recommended Action:</b> {inc.recommendedAction}
                </div>
              )}

              {inc.alternate && (
                <div className="mt-2 pt-2 d-flex justify-content-between align-items-center" style={{ borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>
                    Alternate Route: {inc.alternate}
                  </span>
                  {onOpenRoutePlanner && (
                    <button
                      onClick={onOpenRoutePlanner}
                      style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Plan Route →
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SMART ALERTS NOTIFICATIONS WITH PRIORITY */}
      <section className="glass-card">
        <div className="section-title mb-3">
          <span>AI Smart City Alerts & Direct Recommendations</span>
        </div>

        <div className="d-flex flex-column gap-2">
          {smartAlerts.map((alt) => (
            <div
              key={alt.id}
              style={{
                background: alt.priority === 'high' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.03)',
                border: alt.priority === 'high' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: '14px',
                padding: '12px 16px'
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="fw-bold text-light" style={{ fontSize: '0.9rem' }}>{alt.title}</span>
                <span className={`priority-tag ${alt.priority}`}>{alt.priority} Priority</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#34d399', fontWeight: 500 }}>
                💡 Recommendation: {alt.rec}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ROAD STATUS DIRECTORY */}
      <section className="glass-card">
        <div className="section-title mb-3">
          <span>Metropolitan Road Status Directory</span>
        </div>

        <div className="d-flex flex-column gap-2">
          {cityRoads.map((rd, i) => (
            <div key={i} className={`road-status-item ${rd.status}`}>
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-bold text-light" style={{ fontSize: '0.95rem' }}>{rd.name}</span>
                <span className="fw-bold">{rd.statusText}</span>
              </div>
              <div className="d-flex justify-content-between" style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                <span>Avg Speed: <b>{rd.speed}</b></span>
                <span>Expected Delay: <b>{rd.delay}</b></span>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Status Info: {rd.reason}</span>
            </div>
          ))}
        </div>
      </section>

      {/* AI PLAIN ENGLISH INSIGHTS */}
      <section className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(30, 41, 70, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
        <div className="d-flex align-items-center gap-2 mb-2" style={{ color: '#38bdf8', fontWeight: 700, fontSize: '1rem' }}>
          <Sparkles size={18} />
          <span>AI Plain English Traffic Insights</span>
        </div>
        <ul className="m-0 pl-3" style={{ fontSize: '0.88rem', color: '#e2e8f0', lineHeight: 1.6, paddingLeft: '18px' }}>
          {aiInsights.map((ins, idx) => (
            <li key={idx} className="mb-1">{ins}</li>
          ))}
        </ul>
      </section>

      {/* CHRONOLOGICAL INCIDENT TIMELINE */}
      <section className="glass-card mb-4">
        <div className="section-title mb-3">
          <span>Recent Incident Timeline Log</span>
        </div>

        <div className="history-timeline">
          {timelineEvents.map((item, idx) => (
            <div key={idx} className="history-item">
              <span style={{ color: '#38bdf8', fontWeight: 700, width: '70px' }}>{item.time}</span>
              <span style={{ color: '#e2e8f0', width: '100%' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
