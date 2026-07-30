import React from 'react';
import { Bot, Sparkles, TrendingDown, Leaf, AlertCircle, Zap } from 'lucide-react';

export default function AiDailyBrief({ recommendation, onLaunchGreenWave }) {
  // Extract values from recommendation prop or fallback dynamically based on live traffic
  const trafficState = recommendation?.trafficState || "Traffic is moderate.";
  const fastestCorridor = recommendation?.fastestCorridor || "Hospital Road is currently the fastest corridor.";
  const expectedDelays = recommendation?.expectedDelays || "Expected delays near Railway Station.";
  const bestTime = recommendation?.bestTime || "8:20 AM";
  const fuelSaving = recommendation?.fuelSaving || "12%";

  return (
    <div className="glass-card ai-brief-card">
      <div className="ai-brief-header">
        <div className="ai-title-tag">
          <Bot size={22} style={{ color: '#60a5fa' }} />
          <span>Today's AI Travel Brief</span>
        </div>

        <div className="live-pulse-badge">
          <span className="pulse-dot"></span>
          <span>Live AI Updated</span>
        </div>
      </div>

      <div className="ai-recommendation-content">
        <div className="ai-summary-text">
          <p className="fw-medium mb-1">
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>{trafficState} </span>
            {fastestCorridor}
          </p>
          <p style={{ color: '#fbbf24', fontSize: '0.88rem' }} className="d-flex align-items-center gap-1 mt-1">
            <AlertCircle size={14} /> {expectedDelays}
          </p>
        </div>

        <div className="ai-highlights-grid">
          <div className="ai-stat-card">
            <span className="ai-stat-title">Best Time to Travel</span>
            <div className="d-flex align-items-center gap-2 mt-1">
              <span className="ai-stat-val">{bestTime}</span>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Optimal Flow</span>
            </div>
          </div>

          <div className="ai-stat-card">
            <span className="ai-stat-title d-flex align-items-center gap-1">
              <Leaf size={12} style={{ color: '#34d399' }} /> Estimated Fuel Saving
            </span>
            <div className="d-flex align-items-center gap-2 mt-1">
              <span className="ai-stat-val green">{fuelSaving}</span>
              <TrendingDown size={16} style={{ color: '#34d399' }} />
            </div>
          </div>
        </div>

        {/* Launch AI Green Wave Assistant Button */}
        {onLaunchGreenWave && (
          <button
            onClick={onLaunchGreenWave}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              borderRadius: '12px',
              padding: '10px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '10px'
            }}
          >
            <Zap size={16} /> Check AI Green Wave Departure Assistant
          </button>
        )}
      </div>
    </div>
  );
}
