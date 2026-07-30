import React from 'react';
import { Route, Clock, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export default function RecommendedRouteCard({ onOpenRoutePlanner }) {
  return (
    <section className="glass-card mb-4" style={{ padding: '20px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(18, 26, 43, 0.8) 100%)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Route size={20} style={{ color: '#38bdf8' }} />
          <span>Today's Recommended Route</span>
        </div>
        <span style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', padding: '3px 10px', borderRadius: '20px', fontSize: '0.725rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
          <Zap size={12} className="me-1" /> 6 mins faster
        </span>
      </div>

      <div className="d-flex flex-column gap-2 mb-3">
        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
          Hospital Road Express Corridor
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Home (Westside Area) → Tech Park Central Hub
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between p-3 mb-3" style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', border: '1px solid var(--border-glass)' }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Estimated Time</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>14 mins</div>
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Distance</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>8.2 km</div>
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Speed</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#4ade80', fontFamily: 'var(--font-mono)' }}>52 km/h</div>
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between">
        <span style={{ fontSize: '0.775rem', color: '#4ade80', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={16} /> AI Green Wave Synchronized
        </span>

        {onOpenRoutePlanner && (
          <button 
            onClick={onOpenRoutePlanner}
            className="btn-m3-tonal"
            style={{ padding: '8px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            Start Route <ArrowRight size={14} />
          </button>
        )}
      </div>
    </section>
  );
}
