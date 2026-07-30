import React from 'react';
import { Car, Timer, Zap, Siren, Activity } from 'lucide-react';

export default function LiveSummary({ summaryData }) {
  const vehiclesCount = summaryData?.totalVehicles ?? 1420;
  const waitingTime = summaryData?.avgWaitingTime || "45 sec";
  const signalsOptimized = summaryData?.signalsOptimized || "18 Signals";
  const emergencyActive = summaryData?.emergencyActive || "1 Priority Vehicle";
  const congestionLevel = summaryData?.congestionLevel || "24% (Normal)";

  const cards = [
    {
      title: 'Vehicles on Road',
      value: vehiclesCount.toLocaleString(),
      icon: <Car size={16} style={{ color: '#38bdf8' }} />
    },
    {
      title: 'Average Waiting Time',
      value: waitingTime,
      icon: <Timer size={16} style={{ color: '#fbbf24' }} />
    },
    {
      title: 'Signals Optimized',
      value: signalsOptimized,
      icon: <Zap size={16} style={{ color: '#34d399' }} />
    },
    {
      title: 'Emergency Active',
      value: emergencyActive,
      icon: <Siren size={16} style={{ color: '#ef4444' }} />
    },
    {
      title: 'Congestion Level',
      value: congestionLevel,
      icon: <Activity size={16} style={{ color: '#a78bfa' }} />
    }
  ];

  return (
    <section>
      <div className="section-title mb-3">
        <span>Live Summary</span>
      </div>

      <div className="live-summary-grid">
        {cards.map((card, idx) => (
          <div key={idx} className="summary-card">
            <div className="summary-card-header">
              <span>{card.title}</span>
              {card.icon}
            </div>
            <div className="summary-card-val">{card.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
