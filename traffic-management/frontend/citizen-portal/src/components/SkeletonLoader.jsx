import React from 'react';

export default function SkeletonLoader({ type = 'card' }) {
  if (type === 'city-status') {
    return (
      <div className="glass-card skeleton-container" style={{ padding: '24px', borderRadius: '24px' }}>
        <div className="d-flex justify-content-between mb-3">
          <div className="skeleton-bar" style={{ width: '160px', height: '24px', borderRadius: '12px' }}></div>
          <div className="skeleton-bar" style={{ width: '120px', height: '24px', borderRadius: '20px' }}></div>
        </div>
        <div className="city-metrics-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-bar" style={{ height: '70px', borderRadius: '16px' }}></div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="d-flex flex-column gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card skeleton-container" style={{ padding: '16px', borderRadius: '20px', display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div className="skeleton-bar" style={{ width: '48px', height: '48px', borderRadius: '16px', flexShrink: 0 }}></div>
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="skeleton-bar" style={{ width: '60%', height: '18px', borderRadius: '8px' }}></div>
              <div className="skeleton-bar" style={{ width: '85%', height: '14px', borderRadius: '6px' }}></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="glass-card skeleton-container" style={{ padding: '20px', borderRadius: '24px' }}>
      <div className="skeleton-bar mb-2" style={{ width: '40%', height: '20px', borderRadius: '8px' }}></div>
      <div className="skeleton-bar mb-3" style={{ width: '80%', height: '14px', borderRadius: '6px' }}></div>
      <div className="skeleton-bar" style={{ width: '100%', height: '120px', borderRadius: '16px' }}></div>
    </div>
  );
}
