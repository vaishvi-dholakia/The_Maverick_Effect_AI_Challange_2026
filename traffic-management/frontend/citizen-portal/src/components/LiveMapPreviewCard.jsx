import React, { useEffect, useRef } from 'react';
import { Map, Maximize2, Crosshair } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function LiveMapPreviewCard({ onExpandMap }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([23.0225, 72.5714], 13);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(map);

      // Add sample city markers
      const junctions = [
        { lat: 23.0225, lng: 72.5714, color: '#22c55e', name: 'Junction A - Smooth' },
        { lat: 23.0300, lng: 72.5800, color: '#f59e0b', name: 'Junction B - Moderate' },
        { lat: 23.0150, lng: 72.5600, color: '#ef4444', name: 'Junction C - Congested' }
      ];

      junctions.forEach(j => {
        L.circleMarker([j.lat, j.lng], {
          radius: 8,
          fillColor: j.color,
          color: '#ffffff',
          weight: 2,
          fillOpacity: 0.9
        }).addTo(map);
      });

      mapInstanceRef.current = map;
    }
  }, []);

  return (
    <section className="glass-card mb-4" style={{ padding: '0', overflow: 'hidden', borderRadius: '24px', position: 'relative', height: '240px', border: '1px solid var(--border-glass)' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

      <div style={{ position: 'absolute', top: '12px', left: '12px', zIndex: 500, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(10px)', padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border-glass)', fontSize: '0.78rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Crosshair size={14} style={{ color: '#38bdf8' }} />
        <span>Live City Grid Preview</span>
      </div>

      {onExpandMap && (
        <button
          onClick={onExpandMap}
          style={{ position: 'absolute', bottom: '12px', right: '12px', zIndex: 500, background: 'rgba(15, 23, 42, 0.9)', color: '#fff', border: '1px solid var(--border-glass)', padding: '8px 16px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', backdropFilter: 'blur(8px)' }}
        >
          <Maximize2 size={14} /> Expand Live Map
        </button>
      )}
    </section>
  );
}
