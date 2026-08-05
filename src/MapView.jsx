import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CITIES } from './data';
import { band, kShort, ppsfLabel } from './utils';

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

function markerHtml(p, sel) {
  const b = band(p.ppsf);
  const pulse = '<div style="position:absolute;inset:0;border-radius:99px;background:' + b.color + ';animation:pmPulse 2.6s ease-out infinite"></div>';
  const isL = p.kind === 'layout';
  const inner = isL
    ? '<div style="display:flex;align-items:center;gap:7px;padding:6px 10px;border-radius:13px;background:rgba(13,16,24,.92);border:1.5px solid ' + b.color + ';box-shadow:0 6px 18px rgba(0,0,0,.6)' + (sel ? ';outline:2.5px solid #fff' : '') + '">'
      + '<span style="font:800 11.5px/1 Manrope;color:' + b.color + '">' + p.plots + '</span>'
      + '<span style="font:700 9.5px/1 Manrope;color:rgba(255,255,255,.72);letter-spacing:.06em">PLOTS</span>'
      + '<span style="font:800 10.5px/1 Manrope;color:#fff">' + kShort(p.ppsf) + '</span></div>'
    : '<div style="position:relative;padding:5px 9px;border-radius:99px;background:' + b.color + ';color:#0d1018;font:800 11px/1 Manrope;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,.55)' + (sel ? ';outline:2.5px solid #fff' : '') + '">' + ppsfLabel(p.ppsf) + '</div>';
  const w = isL ? 120 : 62, h = isL ? 28 : 24;
  return {
    w, h,
    html: '<div style="position:relative;width:' + w + 'px;height:' + h + 'px;display:flex;align-items:center;justify-content:center;transform:scale(' + (sel ? 1.18 : 1) + ');transition:transform .18s">' + pulse + inner + '</div>',
  };
}

const MapView = forwardRef(function MapView({ visible, selected, pin, mode, onMarkerClick, onMapClick, onMapDeselect, onBoundsChange }, ref) {
  const containerRef = useRef(null);
  const mapObj = useRef(null);
  const markers = useRef({});
  const pinMarker = useRef(null);
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const onBoundsChangeRef = useRef(onBoundsChange);
  onBoundsChangeRef.current = onBoundsChange;

  useImperativeHandle(ref, () => ({
    flyTo(center, zoom) { mapObj.current && mapObj.current.flyTo(center, zoom, { duration: 0.9 }); },
    flyToBounds(pts) {
      if (mapObj.current && pts.length) mapObj.current.flyToBounds(L.latLngBounds(pts).pad(0.45), { duration: 0.9 });
    },
    zoomIn() { mapObj.current && mapObj.current.zoomIn(1); },
    zoomOut() { mapObj.current && mapObj.current.zoomOut(1); },
    getMap() { return mapObj.current; },
  }));

  useEffect(() => {
    if (!containerRef.current || mapObj.current) return;
    const c = CITIES.Chennai;
    const map = L.map(containerRef.current, { zoomControl: false, attributionControl: true, zoomSnap: 0.5 }).setView(c.center, c.zoom);
    L.tileLayer(TILE_URL, { attribution: '© OpenStreetMap, © CARTO', subdomains: 'abcd', maxZoom: 19 }).addTo(map);
    mapObj.current = map;
    map.on('click', (e) => {
      if (onMapClickRef.current) onMapClickRef.current(e.latlng.lat, e.latlng.lng);
    });
    const reportBounds = () => {
      if (!onBoundsChangeRef.current) return;
      const b = map.getBounds();
      onBoundsChangeRef.current({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() });
    };
    map.on('moveend', reportBounds);
    reportBounds();
    return () => { map.remove(); mapObj.current = null; markers.current = {}; pinMarker.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapObj.current;
    if (!map) return;
    const onClickDeselect = () => { if (mode === 'browse' && onMapDeselect) onMapDeselect(); };
    map.on('click', onClickDeselect);
    return () => map.off('click', onClickDeselect);
  }, [mode, onMapDeselect]);

  useEffect(() => {
    const map = mapObj.current;
    if (!map) return;
    const show = mode === 'placing' ? [] : visible;
    const ids = {};
    show.forEach((p) => {
      ids[p.id] = 1;
      const sel = selected === p.id;
      const key = p.id + '|' + sel;
      if (markers.current[p.id] && markers.current[p.id]._key === key) return;
      if (markers.current[p.id]) { map.removeLayer(markers.current[p.id]); delete markers.current[p.id]; }
      const { w, h, html } = markerHtml(p, sel);
      const m = L.marker([p.lat, p.lng], {
        icon: L.divIcon({ className: '', iconSize: [w, h], iconAnchor: [w / 2, h / 2], html }),
        zIndexOffset: sel ? 1000 : 0,
      }).addTo(map);
      m._key = key;
      m.on('click', () => onMarkerClick && onMarkerClick(p.id));
      markers.current[p.id] = m;
    });
    Object.keys(markers.current).forEach((id) => {
      if (!ids[id]) { map.removeLayer(markers.current[id]); delete markers.current[id]; }
    });
  }, [visible, selected, mode, onMarkerClick]);

  useEffect(() => {
    const map = mapObj.current;
    if (!map) return;
    if (!pin || mode === 'browse') {
      if (pinMarker.current) { map.removeLayer(pinMarker.current); pinMarker.current = null; }
      return;
    }
    const html = '<div style="position:relative;width:34px;height:34px;display:flex;align-items:center;justify-content:center">'
      + '<div style="position:absolute;inset:6px;border-radius:99px;background:#8355c9;animation:pmPulse 2s ease-out infinite"></div>'
      + '<div style="position:relative;width:20px;height:20px;border-radius:99px;background:linear-gradient(130deg,#1f9d64,#8355c9);border:2.5px solid #fff;box-shadow:0 6px 18px rgba(0,0,0,.6)"></div></div>';
    if (pinMarker.current) pinMarker.current.setLatLng(pin);
    else pinMarker.current = L.marker(pin, { icon: L.divIcon({ className: '', iconSize: [34, 34], iconAnchor: [17, 17], html }), zIndexOffset: 2000 }).addTo(map);
  }, [pin, mode]);

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />;
});

export default MapView;
