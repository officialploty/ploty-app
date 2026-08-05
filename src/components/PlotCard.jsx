import { listCardFields } from '../fields';

const GREEN = '#1f9d64';
const GREEN_DARK = '#16281f';
const BLUE = '#3d7fd9';
const PURPLE = '#8355c9';
const AMBER = '#d98a1f';
const RED = '#d64545';
const INK = '#1a1e1c';
const SUB = '#6b7570';

export default function PlotCard({ p, onClick, saved, onToggleSave, onShare }) {
  const f = listCardFields(p);
  const isSaved = saved && saved.includes(f.id);

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 18, padding: 11, background: '#ffffff', border: '1px solid #e8ece9',
        boxShadow: '0 2px 10px rgba(22,40,31,.06)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      <div style={{
        position: 'relative', borderRadius: 13, overflow: 'hidden', aspectRatio: '16/7.2',
        background: f.thumbBg || '#f2f5f3', backgroundSize: 'cover', backgroundPosition: 'center',
        border: '1px solid #e8ece9', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {!f.thumbBg && <ImageIcon />}

        <div style={{ position: 'absolute', right: 8, top: 8, display: 'flex', gap: 5 }}>
          <IconButton onClick={(e) => { e.stopPropagation(); onToggleSave && onToggleSave(f.id); }} active={isSaved}>
            <HeartIcon filled={isSaved} />
          </IconButton>
          <IconButton onClick={(e) => { e.stopPropagation(); onShare && onShare(p); }}>
            <ShareIcon />
          </IconButton>
        </div>

        {f.mediaBadge && (
          <div style={{ position: 'absolute', left: 8, bottom: 8, display: 'flex', alignItems: 'center', gap: 3, padding: '3px 7px', borderRadius: 6, background: 'rgba(20,24,22,.68)' }}>
            <PhotoIcon />
            <span style={{ font: '700 8.5px/1 Manrope', color: '#fff' }}>{f.mediaBadge} PHOTO{f.mediaBadge === '1' ? '' : 'S'}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ font: '700 14.5px/1.25 Manrope', color: INK, letterSpacing: '-.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.locality}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <PinIcon />
            <span style={{ font: '600 10.5px/1.3 Manrope', color: GREEN, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.cityLine}</span>
          </div>
          <span style={{ width: 1, height: 10, background: '#e0e4e1' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ClockIcon />
            <span style={{ font: '600 9.5px/1.3 Manrope', color: SUB }}>{f.age}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', gap: 0, borderRadius: 12, background: '#f6f9f7', border: '1px solid #e8ece9', overflow: 'hidden' }}>
        <div style={{ flex: '1 1 128px', minWidth: 128, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 11px' }}>
          <div style={{ width: 28, height: 28, borderRadius: 99, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e5f5ec', border: '1.5px solid ' + GREEN }}>
            <RulerIcon color={GREEN} size={13} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ font: '700 7.5px/1.2 Manrope', color: SUB, letterSpacing: '.07em' }}>PER SQFT</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {f.ppsfPrefix && <span style={{ font: '700 9.5px/1.25 Manrope', color: SUB }}>{f.ppsfPrefix} </span>}
              <span style={{ font: '800 18px/1.25 Manrope', color: GREEN_DARK, letterSpacing: '-.01em' }}>{f.ppsfLabel}</span>
            </span>
          </div>
        </div>

        <div style={{ flex: '1 1 140px', minWidth: 140, display: 'flex', flexDirection: 'column', gap: 5, justifyContent: 'center', padding: '7px 10px', borderLeft: '1px solid #e8ece9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px 3px 6px', borderRadius: 7, background: '#e5f5ec', border: '1px solid #bfe3cf' }}>
            <ShieldIcon size={9} color={GREEN} />
            <span style={{ font: '800 8.5px/1 Manrope', color: '#146b41', whiteSpace: 'nowrap', letterSpacing: '.01em' }}>DTCP Approved</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px 3px 6px', borderRadius: 7, background: '#f1ecfa', border: '1px solid #d9caf0' }}>
            <RosetteIcon size={9} color={PURPLE} />
            <span style={{ font: '800 8.5px/1 Manrope', color: '#5c3a97', whiteSpace: 'nowrap', letterSpacing: '.01em' }}>RERA Registered</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,0.9fr) minmax(0,0.95fr) minmax(0,0.65fr) minmax(0,1.5fr)', alignItems: 'stretch', borderRadius: 12, background: '#f6f9f7', border: '1px solid #e8ece9', overflow: 'hidden' }}>
        <MetaStat icon={<RulerSmallIcon color={PURPLE} />} color={PURPLE} label="PLOT SIZE" value={f.plotSizeLabel} />
        <MetaStat icon={<RupeeIcon color={GREEN} />} color={GREEN} label="TOTAL PRICE" value={f.totalPriceLabel} border />
        <MetaStat icon={<PlotsIcon color={BLUE} />} color={BLUE} label="PLOTS" value={f.plotsCountLabel} border />
        <MetaStat icon={<CarIcon color={AMBER} />} color={AMBER} label="DISTANCE" value={f.distanceLabel} sub={f.distanceLandmark} border />
      </div>
    </div>
  );
}

function IconButton({ children, onClick, active }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 26, height: 26, borderRadius: 99, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? '#fbe9e9' : '#ffffff', border: '1px solid ' + (active ? '#f0c6c6' : '#e8ece9'),
        boxShadow: '0 1px 4px rgba(22,40,31,.12)', cursor: 'pointer',
      }}
    >
      {children}
    </div>
  );
}

function MetaStat({ icon, color, label, value, sub, border }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 3px', minWidth: 0,
      borderLeft: border ? '1px solid #e8ece9' : 'none',
    }}>
      <div style={{ width: 14, height: 14, borderRadius: 99, background: hexToRgba(color, .14), flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <span style={{ font: '600 6.5px/1.15 Manrope', color: SUB, letterSpacing: '.02em', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{label}</span>
      <span style={{
        font: '800 11px/1.2 Manrope', color: INK, textAlign: 'center', maxWidth: '100%', wordBreak: 'break-word',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>{value}</span>
      {sub && (
        <span style={{
          font: '600 7px/1.25 Manrope', color, textAlign: 'center', maxWidth: '100%', wordBreak: 'break-word',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{sub}</span>
      )}
    </div>
  );
}

function hexToRgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}

function RulerIcon({ size = 17, color = GREEN }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="9" width="19" height="6" rx="1.5" transform="rotate(-8 12 12)" stroke={color} strokeWidth="1.7" />
      <path d="M7 9.5l1 2M10.5 9l1 2M14 8.5l1 2M17.5 8l1 2" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function RulerSmallIcon({ color }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="9" width="19" height="6" rx="1.5" transform="rotate(-8 12 12)" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

function RupeeIcon({ color }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
      <path d="M6 4h12M6 9h12M6 4c4 0 7 1.8 7 5s-3 5-7 5l8 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlotsIcon({ color }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="8" height="8" rx="1.3" stroke={color} strokeWidth="1.8" />
      <rect x="13" y="3" width="8" height="8" rx="1.3" stroke={color} strokeWidth="1.8" />
      <rect x="3" y="13" width="8" height="8" rx="1.3" stroke={color} strokeWidth="1.8" />
      <rect x="13" y="13" width="8" height="8" rx="1.3" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

function AmenityIcon({ color }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="9" width="9" height="12" rx="1.5" stroke={color} strokeWidth="1.8" />
      <path d="M13 21V6.5a1.5 1.5 0 0 1 2.1-1.37l3 1.35A1.5 1.5 0 0 1 19 7.87V21" stroke={color} strokeWidth="1.8" />
      <path d="M7 13h.01M7 17h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
      <path d="M12 22s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z" stroke={GREEN} strokeWidth="1.8" />
      <circle cx="12" cy="10" r="2.4" stroke={GREEN} strokeWidth="1.8" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8.5" stroke="#a3aca6" strokeWidth="1.6" />
      <path d="M12 7.5V12l3 2" stroke="#a3aca6" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? '#d64545' : 'none'}>
      <path d="M12 20.5s-7.5-4.6-10-9.3C.5 7.8 2.3 4 6 4c2 0 3.5 1.1 6 3.5C14.5 5.1 16 4 18 4c3.7 0 5.5 3.8 4 7.2-2.5 4.7-10 9.3-10 9.3Z" stroke="#d64545" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M12 15V4M12 4l-4 4M12 4l4 4" stroke="#3d7fd9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 12v6.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V12" stroke="#3d7fd9" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon({ size = 12, color = '#d9c896' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RosetteIcon({ size = 12, color = '#d9c896' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="9" r="6" stroke={color} strokeWidth="1.8" />
      <path d="M9 14.5 7.5 21l4.5-2.5 4.5 2.5-1.5-6.5" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function CarIcon({ color }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
      <path d="M4 16v-3.5L6 7.5A2 2 0 0 1 7.9 6h8.2a2 2 0 0 1 1.9 1.5L20 12.5V16" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <rect x="3" y="14" width="18" height="4.5" rx="1.5" stroke={color} strokeWidth="1.8" />
      <circle cx="7.5" cy="18.5" r="1.5" stroke={color} strokeWidth="1.8" />
      <circle cx="16.5" cy="18.5" r="1.5" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="16" rx="2.5" stroke="#fff" strokeWidth="1.8" />
      <circle cx="8.5" cy="9.5" r="1.6" stroke="#fff" strokeWidth="1.8" />
      <path d="M4 16.5 8.5 12l3 3 4-4.5L21 15" stroke="#fff" strokeWidth="1.8" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" opacity=".45">
      <rect x="3" y="4" width="18" height="16" rx="2.5" stroke="#8a9691" strokeWidth="1.6" />
      <circle cx="8.5" cy="9.5" r="1.6" stroke="#8a9691" strokeWidth="1.6" />
      <path d="M4 16.5 8.5 12l3 3 4-4.5L21 15" stroke="#8a9691" strokeWidth="1.6" />
    </svg>
  );
}
