import React, { useState, useEffect, useRef } from 'react';
import {
  Navigation, ArrowLeftRight, Search, Star, History, Sparkles,
  Clock, MapPin, Gauge, ShieldCheck, Zap, AlertTriangle, TrafficCone,
  Leaf, TrendingDown, RefreshCw, CheckCircle2, ArrowRight, ShieldAlert, Check
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function SmartRoutePlanner({ onBackToHome }) {
  // Search Inputs
  const [origin, setOrigin] = useState("Central Station");
  const [destination, setDestination] = useState("Tech Park Crossing");
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);
  const [hasSearched, setHasSearched] = useState(true);

  // Active Selected Route (1: AI Recommended, 2: Alternate 1, 3: Alternate 2)
  const [selectedRouteId, setSelectedRouteId] = useState(1);

  // Live Recalculation Notification State
  const [liveRerouteAvailable, setLiveRerouteAvailable] = useState(false);
  const [rerouteMessage, setRerouteMessage] = useState("");

  // Map Refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylinesRef = useRef({});

  // Saved locations for autocomplete
  const savedLocations = [
    { name: "Central Station", area: "Downtown", icon: "🚉" },
    { name: "Tech Park Crossing", area: "IT Corridor", icon: "🏢" },
    { name: "Hospital Road Junction", area: "Medical Hub", icon: "🏥" },
    { name: "Railway Station Plaza", area: "Central Hub", icon: "🚆" },
    { name: "Airport Expressway Terminal", area: "North City", icon: "✈️" },
    { name: "Home - Sector 5", area: "Green Valley", icon: "🏠" }
  ];

  // Route Options Data
  const [routes, setRoutes] = useState([
    {
      id: 1,
      name: "Bypass Service Corridor (AI Recommended)",
      type: "ai",
      color: "#38bdf8",
      time: "10 mins",
      distance: "6.1 km",
      trafficLevel: "🟢 Low Traffic",
      expectedStops: "1 Stop",
      avgSignalWait: "15 sec",
      fuelSaving: "15%",
      co2Saving: "22%",
      delay: "0 min",
      coords: [[23.0225, 72.5714], [23.0180, 72.5650], [23.0120, 72.5580], [23.0350, 72.5900]],
      reason: "AI selected this route because signal synchronization on Service Bypass will reduce total waiting time by 6 minutes.",
      signalSync: "88% Synchronized",
      greenLights: 4,
      redLights: 1,
      currentJunction: "Junction A - Central Avenue",
      nextJunction: "Junction B - Ring Road",
      safetyLevel: "98% High Safety",
      avgSpeed: "48 km/h"
    },
    {
      id: 2,
      name: "Main Highway Corridor",
      type: "alt-1",
      color: "#94a3b8",
      time: "18 mins",
      distance: "5.2 km",
      trafficLevel: "🟠 Heavy Delays",
      expectedStops: "3 Stops",
      avgSignalWait: "45 sec",
      fuelSaving: "0%",
      co2Saving: "0%",
      delay: "+8 mins",
      coords: [[23.0225, 72.5714], [23.0300, 72.5800], [23.0350, 72.5900]],
      reason: "High traffic density near Railway Station Plaza with 3 un-synchronized red signals causing bottlenecks.",
      signalSync: "32% Synchronized",
      greenLights: 2,
      redLights: 3,
      currentJunction: "Junction A - Central Avenue",
      nextJunction: "Railway Junction",
      safetyLevel: "84% Moderate Safety",
      avgSpeed: "28 km/h"
    },
    {
      id: 3,
      name: "Ring Expressway Bypass",
      type: "alt-2",
      color: "#f97316",
      time: "14 mins",
      distance: "5.8 km",
      trafficLevel: "🟡 Moderate Flow",
      expectedStops: "2 Stops",
      avgSignalWait: "25 sec",
      fuelSaving: "6%",
      co2Saving: "8%",
      delay: "+4 mins",
      coords: [[23.0225, 72.5714], [23.0250, 72.5600], [23.0350, 72.5900]],
      reason: "Moderate traffic flow. Slightly longer distance with 2 synchronized signals.",
      signalSync: "65% Synchronized",
      greenLights: 3,
      redLights: 2,
      currentJunction: "Junction A - Central Avenue",
      nextJunction: "Tech Park Flyover",
      safetyLevel: "92% High Safety",
      avgSpeed: "40 km/h"
    }
  ]);

  // Active Incidents along routes
  const incidents = [
    {
      id: 1,
      routeId: 2,
      type: "Accident",
      title: "🚧 Minor Vehicle Collision",
      location: "Railway Station Crossing",
      severity: "High",
      delay: "+6 mins"
    },
    {
      id: 2,
      routeId: 1,
      type: "Emergency",
      title: "🚑 Priority Ambulance Corridor",
      location: "Service Bypass Lane 2",
      severity: "Low",
      delay: "0 min (Cleared by AI)"
    }
  ];

  // Leaflet Map Initialization
  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false
      }).setView([23.0225, 72.5714], 13);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap • SmartTraffic AI'
      }).addTo(map);

      // Junction Markers
      const junctions = [
        { name: "Junction A - Central Ave", lat: 23.0225, lng: 72.5714, status: "🟢 AI Green Sync" },
        { name: "Junction B - Service Bypass", lat: 23.0180, lng: 72.5650, status: "🟢 Green Corridor" },
        { name: "Railway Station Plaza", lat: 23.0300, lng: 72.5800, status: "🔴 Heavy Bottleneck" },
        { name: "Tech Park Crossing", lat: 23.0350, lng: 72.5900, status: "🟢 Clear Arrival" }
      ];

      junctions.forEach(j => {
        const marker = L.circleMarker([j.lat, j.lng], {
          radius: 10,
          fillColor: j.status.includes('Green') ? '#10b981' : '#ef4444',
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: sans-serif; padding: 4px;">
            <strong style="color: #0f172a;">${j.name}</strong><br/>
            <span style="font-size: 0.8rem; color: #475569;">${j.status}</span>
          </div>
        `);
      });

      mapInstanceRef.current = map;
    }

    // Render / Update Polylines
    if (mapInstanceRef.current) {
      Object.values(polylinesRef.current).forEach(p => mapInstanceRef.current.removeLayer(p));
      polylinesRef.current = {};

      routes.forEach(rt => {
        const isSelected = rt.id === selectedRouteId;
        const polyline = L.polyline(rt.coords, {
          color: rt.color,
          weight: isSelected ? 7 : 4,
          opacity: isSelected ? 1 : 0.4,
          dashArray: isSelected ? null : '6, 6'
        }).addTo(mapInstanceRef.current);

        polyline.on('click', () => {
          setSelectedRouteId(rt.id);
        });

        polylinesRef.current[rt.id] = polyline;
      });
    }
  }, [routes, selectedRouteId]);

  // Simulate Live AI Traffic Recalculation Trigger
  useEffect(() => {
    const rerouteTimer = setTimeout(() => {
      setLiveRerouteAvailable(true);
      setRerouteMessage("⚡ AI detected a 4-minute delay on Railway Station route. Bypass Corridor remains 6 mins faster!");
    }, 7000);

    return () => clearTimeout(rerouteTimer);
  }, []);

  const currentRoute = routes.find(r => r.id === selectedRouteId) || routes[0];

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSearch = () => {
    setHasSearched(true);
    // Smooth scroll to results
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  return (
    <div className="route-planner-container">
      {/* Search Header */}
      <div className="d-flex align-items-center justify-content-between mb-1">
        <div className="d-flex align-items-center gap-2">
          <button
            onClick={onBackToHome}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '8px 14px', borderRadius: '12px', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            ← Home
          </button>
          <h2 className="modal-title" style={{ fontSize: '1.3rem' }}>AI Smart Route Planner</h2>
        </div>
        <div style={{ background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600 }}>
          ⚡ Signal Sync Active
        </div>
      </div>

      {/* SEARCH PANEL CARD */}
      <div className="search-panel-card">
        <div className="d-flex flex-column gap-3">
          {/* Origin Input */}
          <div style={{ position: 'relative' }}>
            <div className="search-input-group">
              <MapPin size={18} style={{ color: '#34d399' }} />
              <input
                type="text"
                className="search-input-field"
                placeholder="Enter Starting Point..."
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                onFocus={() => setShowOriginSuggestions(true)}
                onBlur={() => setTimeout(() => setShowOriginSuggestions(false), 200)}
              />
            </div>
            {showOriginSuggestions && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', zIndex: 100, marginTop: '4px', overflow: 'hidden' }}>
                {savedLocations.map((loc, i) => (
                  <div
                    key={i}
                    onClick={() => setOrigin(loc.name)}
                    style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', color: '#e2e8f0' }}
                  >
                    <span>{loc.icon} {loc.name}</span> <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>({loc.area})</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Swap Button */}
          <div className="d-flex justify-content-center my-n2">
            <button className="swap-btn" onClick={handleSwap} title="Swap Locations">
              <ArrowLeftRight size={18} />
            </button>
          </div>

          {/* Destination Input */}
          <div style={{ position: 'relative' }}>
            <div className="search-input-group">
              <Navigation size={18} style={{ color: '#38bdf8' }} />
              <input
                type="text"
                className="search-input-field"
                placeholder="Enter Destination..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                onFocus={() => setShowDestSuggestions(true)}
                onBlur={() => setTimeout(() => setShowDestSuggestions(false), 200)}
              />
            </div>
            {showDestSuggestions && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', zIndex: 100, marginTop: '4px', overflow: 'hidden' }}>
                {savedLocations.map((loc, i) => (
                  <div
                    key={i}
                    onClick={() => setDestination(loc.name)}
                    style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', color: '#e2e8f0' }}
                  >
                    <span>{loc.icon} {loc.name}</span> <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>({loc.area})</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Favorites & Recent Chips */}
          <div className="chips-row">
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>Quick:</span>
            <button className="chip-tag" onClick={() => setDestination("Tech Park Crossing")}>🏠 Home ➔ Tech Park</button>
            <button className="chip-tag" onClick={() => setDestination("Airport Terminal")}>✈️ Airport Expressway</button>
            <button className="chip-tag" onClick={() => setDestination("Hospital Road Junction")}>🏥 Hospital Corridor</button>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '16px',
              padding: '14px',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)'
            }}
          >
            <Search size={18} />
            <span>Plan AI Synchronized Route</span>
          </button>
        </div>
      </div>

      {/* LIVE REROUTE ALERT BANNER */}
      {liveRerouteAvailable && (
        <div className="reroute-banner">
          <div className="d-flex align-items-center gap-2" style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600 }}>
            <Sparkles size={18} style={{ color: '#fbbf24' }} />
            <span>{rerouteMessage}</span>
          </div>
          <button
            className="switch-route-btn"
            onClick={() => setSelectedRouteId(1)}
          >
            Switch Route
          </button>
        </div>
      )}

      {/* SMARTTRAFFIC CITY MAP */}
      <div className="glass-card p-0" style={{ overflow: 'hidden', height: '320px', position: 'relative' }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

        <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 500, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(10px)', padding: '6px 12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.78rem', color: '#fff' }}>
          <span>🗺️ SmartTraffic Live City Map</span>
        </div>
      </div>

      {/* 3 ROUTE OPTIONS */}
      <section className="d-flex flex-column gap-3">
        <div className="section-title">
          <span>AI Calculated Corridors</span>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Tap route to select</span>
        </div>

        {routes.map((rt) => {
          const isSelected = rt.id === selectedRouteId;
          const cardClass = rt.id === 1 ? 'ai-recommended' : rt.id === 2 ? 'alt-1' : 'alt-2';

          return (
            <div
              key={rt.id}
              className={`route-option-card ${cardClass} ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedRouteId(rt.id)}
            >
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold" style={{ fontSize: '1.05rem', color: isSelected ? '#fff' : '#e2e8f0' }}>
                    {rt.name}
                  </span>
                </div>

                {rt.id === 1 ? (
                  <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontSize: '0.75rem', padding: '4px 10px', borderRadius: '20px', fontWeight: 700 }}>
                    ⭐ AI Recommended
                  </span>
                ) : (
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{rt.delay}</span>
                )}
              </div>

              {/* Stats Bar */}
              <div className="d-flex flex-wrap gap-3 my-2" style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                <span>⏱️ <b>{rt.time}</b></span>
                <span>📏 <b>{rt.distance}</b></span>
                <span>{rt.trafficLevel}</span>
                <span>🛑 <b>{rt.expectedStops}</b></span>
                <span>🚦 Wait: <b>{rt.avgSignalWait}</b></span>
              </div>

              {/* Fuel & CO2 */}
              <div className="d-flex gap-3" style={{ fontSize: '0.8rem' }}>
                <span style={{ color: '#34d399', fontWeight: 600 }}>🌱 Fuel Saved: {rt.fuelSaving}</span>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>🍃 CO₂ Offset: {rt.co2Saving}</span>
              </div>

              {/* AI Reason Box */}
              {isSelected && (
                <div className="ai-reason-badge">
                  <div className="d-flex align-items-center gap-1 mb-1" style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.8rem' }}>
                    <Sparkles size={14} /> AI Optimization Insight
                  </div>
                  <p style={{ margin: 0 }}>"{rt.reason}"</p>
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* LIVE ROUTE DETAILS CARD */}
      <section className="glass-card">
        <div className="section-title mb-3">
          <span>Live Telemetry on Active Route</span>
        </div>

        <div className="city-metrics-grid">
          <div className="metric-box">
            <span className="metric-label"><Clock size={14} style={{ color: '#38bdf8' }} /> Est. Arrival Time</span>
            <span className="metric-value">8:30 AM</span>
            <span className="metric-subtext">In {currentRoute.time}</span>
          </div>

          <div className="metric-box">
            <span className="metric-label"><Navigation size={14} style={{ color: '#34d399' }} /> Distance Left</span>
            <span className="metric-value">{currentRoute.distance}</span>
            <span className="metric-subtext">Direct Corridor</span>
          </div>

          <div className="metric-box">
            <span className="metric-label"><Zap size={14} style={{ color: '#fbbf24' }} /> Green Signals</span>
            <span className="metric-value">{currentRoute.greenLights} Signals</span>
            <span className="metric-subtext">{currentRoute.redLights} Red Stop</span>
          </div>

          <div className="metric-box">
            <span className="metric-label"><ShieldCheck size={14} style={{ color: '#a78bfa' }} /> Safety Rating</span>
            <span className="metric-value">{currentRoute.safetyLevel}</span>
            <span className="metric-subtext">AI Verified</span>
          </div>
        </div>

        <div className="mt-3 p-3" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px', fontSize: '0.85rem' }}>
          <div className="d-flex justify-content-between mb-1">
            <span style={{ color: '#94a3b8' }}>Current Junction:</span>
            <span className="fw-semibold text-light">{currentRoute.currentJunction}</span>
          </div>
          <div className="d-flex justify-content-between">
            <span style={{ color: '#94a3b8' }}>Next Junction Ahead:</span>
            <span className="fw-semibold style={{ color: '#38bdf8' }}">{currentRoute.nextJunction}</span>
          </div>
        </div>
      </section>

      {/* INCIDENTS ALONG ROUTE */}
      <section className="glass-card">
        <div className="section-title mb-3">
          <span>Route Incident Reports</span>
        </div>

        <div className="d-flex flex-column gap-2">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              style={{
                background: inc.severity === 'High' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                border: inc.severity === 'High' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '14px',
                padding: '12px'
              }}
            >
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="fw-bold text-light">{inc.title}</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Delay: {inc.delay}</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                📍 Location: {inc.location}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BOTTOM ROUTE SUMMARY BAR */}
      <div className="route-summary-bar mb-4">
        <div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Travel Time</span>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>{currentRoute.time}</div>
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Distance</span>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#38bdf8' }}>{currentRoute.distance}</div>
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Fuel Saved</span>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#34d399' }}>{currentRoute.fuelSaving}</div>
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Avg Speed</span>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fbbf24' }}>{currentRoute.avgSpeed}</div>
        </div>
      </div>
    </div>
  );
}
