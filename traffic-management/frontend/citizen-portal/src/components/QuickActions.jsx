import React from 'react';
import { 
  Route, Activity, TriangleAlert, SquareParking, 
  BarChart3, Ambulance, Wand2, ArrowRight 
} from 'lucide-react';

export default function QuickActions({ activePage = 'home', onSelectPage }) {
  const navigationCards = [
    {
      id: 'routes',
      title: 'Plan Route',
      subtitle: 'Fastest AI Detours',
      icon: <Route size={24} />,
      badge: 'Smart Nav',
      color: '#38bdf8',
      bgGlow: 'rgba(56, 189, 248, 0.12)',
      borderGlow: 'rgba(56, 189, 248, 0.35)',
      directUrl: 'routes'
    },
    {
      id: 'traffic',
      title: 'Live Traffic',
      subtitle: 'Interactive Grid Map',
      icon: <Activity size={24} />,
      badge: 'Live Map',
      color: '#34d399',
      bgGlow: 'rgba(52, 211, 153, 0.12)',
      borderGlow: 'rgba(52, 211, 153, 0.35)',
      directUrl: 'traffic'
    },
    {
      id: 'alerts',
      title: 'Alerts',
      subtitle: 'Accidents & Closures',
      icon: <TriangleAlert size={24} />,
      badge: 'Real-time',
      color: '#ef4444',
      bgGlow: 'rgba(239, 68, 68, 0.12)',
      borderGlow: 'rgba(239, 68, 68, 0.35)',
      externalUrl: 'alerts.html'
    },
    {
      id: 'parking',
      title: 'Smart Parking',
      subtitle: 'Occupancy Predictor',
      icon: <SquareParking size={24} />,
      badge: 'Available Spots',
      color: '#22c55e',
      bgGlow: 'rgba(34, 197, 94, 0.12)',
      borderGlow: 'rgba(34, 197, 94, 0.35)',
      externalUrl: 'parking.html'
    },
    {
      id: 'trips',
      title: 'My Trips',
      subtitle: 'Eco & Time Saved',
      icon: <BarChart3 size={24} />,
      badge: 'Stats & Badges',
      color: '#a855f7',
      bgGlow: 'rgba(168, 85, 247, 0.12)',
      borderGlow: 'rgba(168, 85, 247, 0.35)',
      externalUrl: 'trips.html'
    },
    {
      id: 'assistant',
      title: 'AI Travel Assistant',
      subtitle: 'Weather & Delay Forecast',
      icon: <Wand2 size={24} />,
      badge: 'Best Time',
      color: '#ec4899',
      bgGlow: 'rgba(236, 72, 153, 0.12)',
      borderGlow: 'rgba(236, 72, 153, 0.35)',
      externalUrl: 'travel-assistant.html'
    },
    {
      id: 'emergency',
      title: 'Emergency Awareness',
      subtitle: 'Green Corridor Alert',
      icon: <Ambulance size={24} />,
      badge: 'Priority Corridor',
      color: '#f97316',
      bgGlow: 'rgba(249, 115, 22, 0.12)',
      borderGlow: 'rgba(249, 115, 22, 0.35)',
      externalUrl: 'emergency-awareness.html'
    }
  ];

  const handleCardClick = (card) => {
    if (card.externalUrl) {
      window.location.href = card.externalUrl;
    } else if (onSelectPage) {
      onSelectPage(card.directUrl || card.id);
    }
  };

  return (
    <section className="mb-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--accent-blue)' }}>✦</span> Citizen Portal Navigation Hub
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Select feature card
        </span>
      </div>

      <div className="quick-actions-nav-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px' }}>
        {navigationCards.map((card) => {
          const isSelected = activePage === card.id || activePage === card.directUrl;
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(card)}
              className={`primary-nav-card ${isSelected ? 'active-selected' : ''}`}
              style={{
                background: isSelected ? card.bgGlow : 'var(--bg-card)',
                border: `1.5px solid ${isSelected ? card.color : 'var(--border-glass)'}`,
                borderRadius: '20px',
                padding: '16px 14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: isSelected ? `0 0 20px ${card.bgGlow}` : 'var(--shadow-card)'
              }}
            >
              {/* Top Row: Icon + Badge */}
              <div className="d-flex align-items-center justify-content-between w-100">
                <div 
                  className="card-icon-container" 
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '14px',
                    background: card.bgGlow,
                    color: card.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 0 12px ${card.bgGlow}`
                  }}
                >
                  {card.icon}
                </div>

                <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', color: card.color, fontFamily: 'var(--font-mono)' }}>
                  {card.badge}
                </span>
              </div>

              {/* Text Info */}
              <div>
                <h4 style={{ fontSize: '0.925rem', fontWeight: 800, margin: '0 0 2px 0', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {card.title}
                </h4>
                <p style={{ fontSize: '0.725rem', margin: 0, color: 'var(--text-secondary)' }}>
                  {card.subtitle}
                </p>
              </div>

              {/* Arrow Indicator on Hover */}
              <div className="d-flex align-items-center justify-content-between mt-1 pt-2" style={{ borderTop: '1px dashed var(--border-glass)', fontSize: '0.7rem', color: card.color, fontWeight: 700 }}>
                <span>Open Feature</span>
                <ArrowRight size={13} className="card-arrow" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
