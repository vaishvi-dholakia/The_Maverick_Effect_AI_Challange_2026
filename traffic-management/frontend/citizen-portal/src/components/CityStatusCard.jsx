import React from 'react';
import { Clock, Gauge, AlertTriangle, Cpu, Activity } from 'lucide-react';

export default function CityStatusCard({ trafficData }) {
  // Derive status from live traffic density or props
  const density = (trafficData?.density || "Moderate").toLowerCase();

  const getStatusBadge = () => {
    switch (density) {
      case 'low':
        return { text: '🟢 Low Traffic', class: 'low', desc: 'Smooth city-wide flow' };
      case 'high':
      case 'heavy':
        return { text: '🟠 Heavy Traffic', class: 'heavy', desc: 'Expect minor delays' };
      case 'severe':
      case 'critical':
        return { text: '🔴 Critical Congestion', class: 'critical', desc: 'Heavy delays reported' };
      case 'medium':
      case 'moderate':
      default:
        return { text: '🟡 Moderate Traffic', class: 'moderate', desc: 'Normal travel conditions' };
    }
  };

  const status = getStatusBadge();

  // Metrics derived cleanly from data or citizen friendly defaults
  const avgTravelTime = trafficData?.avgTravelTime || "14 min";
  const avgSpeed = trafficData?.avgSpeed || "42 km/h";
  const activeIncidents = trafficData?.activeIncidents ?? 2;
  const aiStatus = trafficData?.aiStatus || "⚡ AI Optimizing Signals";

  return (
    <div className="glass-card city-status-card">
      <div className="city-status-header">
        <span className="status-title">City Traffic Status</span>
        <div className={`traffic-pill ${status.class}`}>
          {status.text}
        </div>
      </div>

      <div className="city-metrics-grid">
        <div className="metric-box">
          <span className="metric-label">
            <Clock size={14} style={{ color: '#38bdf8' }} /> Average Travel Time
          </span>
          <span className="metric-value">{avgTravelTime}</span>
          <span className="metric-subtext">Across major routes</span>
        </div>

        <div className="metric-box">
          <span className="metric-label">
            <Gauge size={14} style={{ color: '#34d399' }} /> Average Speed
          </span>
          <span className="metric-value">{avgSpeed}</span>
          <span className="metric-subtext">Optimal flow speed</span>
        </div>

        <div className="metric-box">
          <span className="metric-label">
            <AlertTriangle size={14} style={{ color: '#fbbf24' }} /> Active Incidents
          </span>
          <span className="metric-value">{activeIncidents}</span>
          <span className="metric-subtext">{activeIncidents === 0 ? "All clear" : "Minor delays reported"}</span>
        </div>

        <div className="metric-box">
          <span className="metric-label">
            <Cpu size={14} style={{ color: '#a78bfa' }} /> AI System Status
          </span>
          <span className="metric-value" style={{ fontSize: '0.95rem', color: '#60a5fa' }}>
            {aiStatus}
          </span>
          <span className="metric-subtext" style={{ color: '#34d399' }}>Live Adaptive Grid</span>
        </div>
      </div>
    </div>
  );
}
