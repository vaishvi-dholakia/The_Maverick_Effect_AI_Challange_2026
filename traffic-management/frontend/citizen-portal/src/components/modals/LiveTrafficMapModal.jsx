import React, { useEffect, useRef } from 'react';
import { X, Map, Video, ShieldCheck, Activity } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function LiveTrafficMapModal({ isOpen, onClose, trafficData }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (isOpen && mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([23.0225, 72.5714], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map);

      // Add Junction Markers
      const junctions = [
        { name: "Junction A - Central Ave", lat: 23.0225, lng: 72.5714, density: "Low", vehicles: "28" },
        { name: "Junction B - Ring Road", lat: 23.0300, lng: 72.5800, density: "Moderate", vehicles: "45" },
        { name: "Junction C - Tech Park Crossing", lat: 23.0150, lng: 72.5600, density: "Heavy", vehicles: "82" },
        { name: "Junction D - Airport Expressway", lat: 23.0400, lng: 72.5900, density: "Low", vehicles: "12" }
      ];

      junctions.forEach(j => {
        const color = j.density === 'Low' ? '#10b981' : j.density === 'Moderate' ? '#f59e0b' : '#ef4444';
        const circle = L.circleMarker([j.lat, j.lng], {
          radius: 12,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9
        }).addTo(map);

        circle.bindPopup(`
          <div style="font-family: sans-serif; color: #1e293b; padding: 4px;">
            <strong>${j.name}</strong><br/>
            <span>Status: <b>${j.density} Traffic</b></span><br/>
            <span>Live Count: ${j.vehicles} vehicles</span>
          </div>
        `);
      });

      // Add route polyline
      L.polyline([
        [23.0225, 72.5714],
        [23.0300, 72.5800],
        [23.0350, 72.5900]
      ], { color: '#10b981', weight: 5, opacity: 0.8 }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="d-flex align-items-center gap-2">
            <Map size={22} style={{ color: '#34d399' }} />
            <h2 className="modal-title">Live City Traffic Map</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <div className="d-flex flex-column gap-3">
          <div
            ref={mapContainerRef}
            style={{ width: '100%', height: '320px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}
          />

          <div className="d-flex justify-content-around p-2" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', fontSize: '0.85rem' }}>
            <span style={{ color: '#34d399' }}>🟢 Low Traffic (Clear)</span>
            <span style={{ color: '#fbbf24' }}>🟡 Moderate Flow</span>
            <span style={{ color: '#f87171' }}>🔴 Heavy Bottleneck</span>
          </div>

          <div className="d-flex flex-column gap-2">
            <span className="fw-bold text-light">Junction Monitoring Feed</span>
            <div className="d-grid gap-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '12px', fontSize: '0.85rem' }}>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="fw-semibold text-light">Junction A (Central)</span>
                  <Video size={14} style={{ color: '#34d399' }} />
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '4px' }}>AI Camera: Active • 28 Vehicles</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '12px', fontSize: '0.85rem' }}>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="fw-semibold text-light">Junction B (Ring Rd)</span>
                  <Video size={14} style={{ color: '#34d399' }} />
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '4px' }}>AI Camera: Active • 45 Vehicles</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
