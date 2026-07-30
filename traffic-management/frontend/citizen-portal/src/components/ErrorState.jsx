import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorState({ title = "Something went wrong", message = "Unable to connect to live telemetry service. Please check your connection and try again.", onRetry }) {
  return (
    <div className="glass-card error-banner-m3" style={{ padding: '20px', borderRadius: '24px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171', fontWeight: 700, fontSize: '0.95rem' }}>
        <AlertCircle size={20} />
        <span>{title}</span>
      </div>
      <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          style={{ alignSelf: 'flex-start', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '6px 14px', borderRadius: '16px', fontSize: '0.775rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}
        >
          <RefreshCw size={14} />
          Retry Connection
        </button>
      )}
    </div>
  );
}
