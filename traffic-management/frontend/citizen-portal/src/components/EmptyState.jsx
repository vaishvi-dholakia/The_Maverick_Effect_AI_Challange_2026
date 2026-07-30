import React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';

export default function EmptyState({ 
  icon = <SearchX size={44} style={{ color: 'var(--text-muted)' }} />, 
  title = "No Results Found", 
  description = "We couldn't find any matching records. Try adjusting your search query or filters.",
  actionText = "Reset Filters",
  onAction
}) {
  return (
    <div className="glass-card empty-state-container" style={{ padding: '36px 20px', textAlign: 'center', borderRadius: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div className="tonal-icon-badge mb-1" style={{ width: '72px', height: '72px', borderRadius: '24px', background: 'rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{title}</h4>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '320px', margin: 0, lineHeight: 1.4 }}>{description}</p>
      {onAction && (
        <button 
          onClick={onAction}
          className="btn-m3-tonal mt-2"
          style={{ padding: '8px 18px', borderRadius: '20px', fontSize: '0.825rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
        >
          <RotateCcw size={15} />
          {actionText}
        </button>
      )}
    </div>
  );
}
