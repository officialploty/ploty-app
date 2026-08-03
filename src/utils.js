export const BANDS = [
  { max: 4000, color: '#35e0c0', label: 'VALUE BAND', bg: 'rgba(53,224,192,.16)' },
  { max: 8000, color: '#f5b43c', label: 'MID BAND', bg: 'rgba(245,180,60,.16)' },
  { max: Infinity, color: '#ff6b6b', label: 'PREMIUM BAND', bg: 'rgba(255,107,107,.16)' },
];
export const band = (v) => BANDS.find((b) => v < b.max);

const SHOTS = [
  'linear-gradient(140deg,#2f4f4a,#12141f)', 'linear-gradient(140deg,#4a3f5f,#12141f)',
  'linear-gradient(140deg,#5a4a33,#12141f)', 'linear-gradient(140deg,#31465f,#12141f)',
  'linear-gradient(140deg,#4f3340,#12141f)', 'linear-gradient(140deg,#3a4f33,#12141f)',
];
export const shot = (i) => SHOTS[Math.abs(i) % SHOTS.length];

export function inr(n) {
  if (!isFinite(n) || n <= 0) return '—';
  if (n >= 1e7) return '₹' + (n / 1e7).toFixed(n >= 1e8 ? 0 : 2) + ' Cr';
  if (n >= 1e5) return '₹' + (n / 1e5).toFixed(n >= 1e6 ? 0 : 1) + ' L';
  return '₹' + Math.round(n).toLocaleString('en-IN');
}
export const ppsfLabel = (v) => '₹' + Math.round(v).toLocaleString('en-IN');
export const kShort = (v) => (v >= 1000 ? '₹' + (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + 'k' : '₹' + v);
export const sqftRange = (a, b) => Math.round(a).toLocaleString('en-IN') + '–' + Math.round(b).toLocaleString('en-IN');
export const num = (s) => {
  const n = parseFloat(String(s).replace(/[^0-9.]/g, ''));
  return isFinite(n) ? n : 0;
};

// Deliberately tight — flags near-exact duplicate pins without nagging
// listers registering genuinely separate neighboring plots.
export const NEARBY_THRESHOLD_M = 12;

export function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function centroid(points) {
  const lat = points.reduce((s, p) => s + p[0], 0) / points.length;
  const lng = points.reduce((s, p) => s + p[1], 0) / points.length;
  return [lat, lng];
}
