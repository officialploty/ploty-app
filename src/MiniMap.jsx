import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { band } from './utils';

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

export default function MiniMap({ lat, lng, ppsf, style }) {
  const containerRef = useRef(null);
  const mapObj = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const m = L.map(containerRef.current, {
      zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false,
      doubleClickZoom: false, touchZoom: false, keyboard: false,
    }).setView([lat, lng], 14);
    L.tileLayer(TILE_URL, { subdomains: 'abcd' }).addTo(m);
    L.circleMarker([lat, lng], { radius: 5, color: '#fff', weight: 2, fillColor: band(ppsf).color, fillOpacity: 1 }).addTo(m);
    mapObj.current = m;
    const t = setTimeout(() => m.invalidateSize(), 60);
    return () => { clearTimeout(t); m.remove(); mapObj.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);

  return <div ref={containerRef} style={{ background: '#12141f', ...style }} />;
}
