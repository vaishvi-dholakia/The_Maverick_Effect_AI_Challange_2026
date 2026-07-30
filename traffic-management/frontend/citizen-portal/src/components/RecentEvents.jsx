import React from 'react';
import { AlertCircle, Ambulance, Zap, Navigation2, ArrowRight } from 'lucide-react';

export default function RecentEvents({ eventsList, onViewAllAlerts }) {
  const defaultEvents = [
    {
      id: 1,
      type: 'accident',
      title: '🚧 Accident Clearance',
      subtitle: 'Minor fender bender near Ring Road, lane cleared by traffic patrol.',
      time: '5 mins ago',
      icon: <AlertCircle size={20} />,
      class: 'event-accident'
    },
    {
      id: 2,
      type: 'ambulance',
      title: '🚑 Ambulance Priority Active',
      subtitle: 'Green corridor cleared for EMS-102 near Junction A.',
      time: '12 mins ago',
      icon: <Ambulance size={20} />,
      class: 'event-ambulance'
    },
    {
      id: 3,
      type: 'signal',
      title: '🚦 Signal Duration Adjusted',
      subtitle: 'AI automatically extended green signal by 15s to ease Hospital Road flow.',
      time: '24 mins ago',
      icon: <Zap size={20} />,
      class: 'event-signal'
    },
    {
      id: 4,
      type: 'opened',
      title: '🛣 Bypass Lane Opened',
      subtitle: 'Service lane opened near Tech Park crossing to prevent bottleneck.',
      time: '38 mins ago',
      icon: <Navigation2 size={20} />,
      class: 'event-opened'
    }
  ];

  const events = eventsList && eventsList.length > 0 ? eventsList : defaultEvents;

  return (
    <section className="glass-card recent-events-card mb-4" style={{ borderRadius: '24px' }}>
      <div className="section-title d-flex align-items-center justify-content-between mb-3">
        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} style={{ color: 'var(--accent-amber)' }} />
          <span>Recent Alerts & Incident Stream</span>
        </div>
        
        {onViewAllAlerts && (
          <button 
            onClick={onViewAllAlerts}
            style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            View All <ArrowRight size={13} />
          </button>
        )}
      </div>

      <div className="events-list">
        {events.map((evt) => (
          <div key={evt.id} className="event-item" style={{ borderRadius: '16px' }}>
            <div className="event-left">
              <div className={`event-icon-badge ${evt.class}`}>
                {evt.icon}
              </div>
              <div className="event-info">
                <span className="event-title">{evt.title}</span>
                <span className="event-subtitle">{evt.subtitle}</span>
              </div>
            </div>
            <span className="event-time">{evt.time}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
