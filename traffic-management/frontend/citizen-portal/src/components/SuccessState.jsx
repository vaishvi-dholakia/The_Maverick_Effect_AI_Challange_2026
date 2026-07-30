import React, { useEffect } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function SuccessState({ message = "Action completed successfully!", triggerConfetti = true, onClose }) {
  useEffect(() => {
    if (triggerConfetti) {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (e) {
        // Fallback gracefully
      }
    }
  }, [triggerConfetti]);

  return (
    <div className="glass-card success-banner-m3 mb-3" style={{ padding: '14px 18px', borderRadius: '20px', background: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.35)', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', animation: 'slideDown 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', fontWeight: 600 }}>
        <CheckCircle2 size={20} style={{ color: '#22c55e' }} />
        <span>{message}</span>
      </div>
      {onClose && (
        <button 
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', fontSize: '1.1rem' }}
        >
          &times;
        </button>
      )}
    </div>
  );
}
