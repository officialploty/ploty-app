import { listCardFields } from '../fields';

const BLUE = '#35c8e0';
const GREEN = '#35e0c0';
const PURPLE = '#8b7bff';

export default function PlotCard({ p, onClick, saved, onToggleSave, onShare }) {
  const f = listCardFields(p);
  const isSaved = saved && saved.includes(f.id);
  const distanceLabel = '3.2 km';
  const distanceLandmark = 'GST Road';

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 18, padding: 11, background: 'rgba(30,33,64,.55)', border: '1px solid rgba(255,255,255,.09)',
        cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      <div style={{
        position: 'relative', borderRadius: 13, overflow: 'hidden', aspectRatio: '16/7.2',
        background: f.thumbBg || 'rgba(255,255,255,.05)', backgroundSize: 'cover', backgroundPosition: 'center',
        border: '1px solid rgba(255,255,255,.09)', display: 'flex', alignItems: 'center', justifyContent: 'center',
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
          <div style={{ position: 'absolute', left: 8, bottom: 8, display: 'flex', alignItems: 'center', gap: 3, padding: '3px 7px', borderRadius: 6, background: 'rgba(10,11,18,.72)' }}>
            <PhotoIcon />
            <span style={{ font: '700 8.5px/1 Manrope', color: '#fff' }}>{f.mediaBadge} PHOTO{f.mediaBadge === '1' ? '' : 'S'}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ font: '700 14.5px/1.25 Manrope', color: '#fff', letterSpacing: '-.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.locality}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <PinIcon />
            <span style={{ font: '600 10.5px/1.3 Manrope', color: PURPLE, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.cityLine}</span>
          </div>
          <span style={{ width: 1, height: 10, background: 'rgba(255,255,255,.15)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ClockIcon />
            <span style={{ font: '600 9.5px/1.3 Manrope', color: 'rgba(255,255,255,.45)' }}>{f.age}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'stretch', gap: 0, borderRadius: 12, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden' }}>
        <div style={{ flex: '1 1 128px', minWidth: 128, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 11px' }}>
          <div style={{ width: 28, height: 28, borderRadius: 99, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid ' + f.color }}>
            <RulerIcon color={f.color} size={13} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ font: '700 7.5px/1.2 Manrope', color: 'rgba(255,255,255,.5)', letterSpacing: '.07em' }}>PER SQFT</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {f.ppsfPrefix && <span style={{ font: '700 9.5px/1.25 Manrope', color: 'rgba(255,255,255,.55)' }}>{f.ppsfPrefix} </span>}
              <span style={{ font: '800 18px/1.25 Manrope', color: f.color, letterSpacing: '-.01em' }}>{f.ppsfLabel}</span>
            </span>
          </div>
        </div>

        <div style={{ flex: '1 1 140px', minWidth: 140, display: 'flex', flexDirection: 'column', gap: 5, justifyContent: 'center', padding: '7px 10px', borderLeft: '1px solid rgba(255,255,255,.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px 3px 6px', borderRadius: 99, background: '#35e0c0' }}>
            <ShieldIcon size={9} />
            <span style={{ font: '800 8.5px/1 Manrope', color: '#08150f', whiteSpace: 'nowrap' }}>DTCP Approved</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px 3px 6px', borderRadius: 99, background: '#8b7bff' }}>
            <RosetteIcon size={9} />
            <span style={{ font: '800 8.5px/1 Manrope', color: '#12081f', whiteSpace: 'nowrap' }}>RERA Registered</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderRadius: 12, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden' }}>
        <MetaStat icon={<RulerSmallIcon color={PURPLE} />} color={PURPLE} label="PLOT SIZE" value={f.plotSizeLabel} />
        <MetaStat icon={<RupeeIcon color={PURPLE} />} color={PURPLE} label="TOTAL PRICE" value={f.totalPriceLabel} border />
        <MetaStat icon={<PlotsIcon color={BLUE} />} color={BLUE} label="PLOTS" value={f.plotsCountLabel} border />
        <MetaStat icon={<CarIcon color={GREEN} />} color={GREEN} label="DISTANCE" value={distanceLabel} sub={distanceLandmark} border />
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
        background: active ? 'rgba(255,107,107,.14)' : 'rgba(255,255,255,.05)', border: '1px solid ' + (active ? 'rgba(255,107,107,.4)' : 'rgba(255,255,255,.12)'), cursor: 'pointer',
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
      borderLeft: border ? '1px solid rgba(255,255,255,.07)' : 'none',
    }}>
      <div style={{ width: 14, height: 14, borderRadius: 99, background: hexToRgba(color, .16), flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <span style={{ font: '600 6.5px/1.15 Manrope', color: 'rgba(255,255,255,.4)', letterSpacing: '.02em', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{label}</span>
      <span style={{ font: '800 11px/1.2 Manrope', color: '#fff', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{value}</span>
      {sub && <span style={{ font: '600 7px/1.2 Manrope', color: PURPLE, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{sub}</span>}
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
      <circle cx="12" cy="12" r="8.5" stroke="rgba(255,255,255,.35)" strokeWidth="1.6" />
      <path d="M12 7.5V12l3 2" stroke="rgba(255,255,255,.35)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? '#ff6b6b' : 'none'}>
      <path d="M12 20.5s-7.5-4.6-10-9.3C.5 7.8 2.3 4 6 4c2 0 3.5 1.1 6 3.5C14.5 5.1 16 4 18 4c3.7 0 5.5 3.8 4 7.2-2.5 4.7-10 9.3-10 9.3Z" stroke="#ff3b3b" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M12 15V4M12 4l-4 4M12 4l4 4" stroke="#ff9a3c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 12v6.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V12" stroke="#ff9a3c" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z" stroke="#08150f" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4.5" stroke="#08150f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RosetteIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="9" r="6" stroke="#12081f" strokeWidth="1.8" />
      <path d="M9 14.5 7.5 21l4.5-2.5 4.5 2.5-1.5-6.5" stroke="#12081f" strokeWidth="1.8" strokeLinejoin="round" />
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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" opacity=".28">
      <rect x="3" y="4" width="18" height="16" rx="2.5" stroke="#fff" strokeWidth="1.6" />
      <circle cx="8.5" cy="9.5" r="1.6" stroke="#fff" strokeWidth="1.6" />
      <path d="M4 16.5 8.5 12l3 3 4-4.5L21 15" stroke="#fff" strokeWidth="1.6" />
    </svg>
  );
}
