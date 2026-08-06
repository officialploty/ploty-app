import { useState } from 'react';
import { detailFields } from '../fields';
import MiniMap from '../MiniMap';
import MediaLightbox from './MediaLightbox';

const GREEN = '#1f9d64';
const PURPLE = '#8355c9';
const BLUE = '#3d7fd9';
const INK = '#1a1e1c';
const SUB = '#6b7570';

// recreation and civic are deliberately excluded — sync_listing_landmarks
// (supabase/sql/landmarks.sql) no longer selects them, though old rows may
// still exist until a listing is re-synced. groupLandmarksByCategory falls
// back to an uppercased raw label for any category not listed here, so
// stale rows still render fine rather than breaking.
const CATEGORY_ORDER = ['connectivity', 'employment', 'education', 'healthcare', 'worship', 'shopping'];
const CATEGORY_LABELS = {
  connectivity: 'CONNECTIVITY', employment: 'EMPLOYMENT', education: 'EDUCATION', healthcare: 'HEALTHCARE',
  worship: 'PLACES OF WORSHIP', shopping: 'SHOPPING',
};

// d.landmarks arrives sorted by rank (score-based — weight/priority/decay
// mixed, not pure distance). Group into sections, sort each section by
// distance ascending (nearest first reads better than score order once
// you're already looking at a single category), and order the sections
// themselves consistently listing to listing rather than by whichever
// category happened to rank highest this time.
function groupLandmarksByCategory(landmarks) {
  const byCategory = new Map();
  for (const l of landmarks) {
    const list = byCategory.get(l.category) || [];
    list.push(l);
    byCategory.set(l.category, list);
  }
  for (const list of byCategory.values()) {
    list.sort((a, b) => a.distanceKm - b.distanceKm);
  }
  const ordered = CATEGORY_ORDER.filter((c) => byCategory.has(c));
  for (const c of byCategory.keys()) {
    if (!ordered.includes(c)) ordered.push(c);
  }
  return ordered.map((c) => [c, byCategory.get(c)]);
}

export default function DetailContent({ sel, saved, onToggleSave, onContact }) {
  const d = detailFields(sel);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  if (!d) return null;
  const isSaved = saved.includes(sel.id);

  return (
    <div style={{ padding: '6px 20px 42px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
          {d.isPlot && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
              <span style={{ font: '800 40px/1 Manrope', letterSpacing: '-.035em', color: d.color }}>{d.ppsf}</span>
              <span style={{ font: '700 13px/1 Manrope', color: '#6b7570' }}>/ sqft</span>
            </div>
          )}
          {d.isLayout && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ font: '800 30px/1 Manrope', letterSpacing: '-.03em', color: d.color }}>{d.range}</span>
              <span style={{ font: '700 11px/1 Manrope', color: '#6b7570', letterSpacing: '.1em' }}>PER SQFT RANGE</span>
            </div>
          )}
          <div style={{ font: '700 19px/1.2 Manrope', color: INK, letterSpacing: '-.02em' }}>{d.locality}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, font: '500 12px/1 Manrope', color: '#6b7570', letterSpacing: '.04em' }}>
            <PinIcon />{d.cityLine}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
          <div onClick={onContact} title={d.contactLabel} style={{
            width: 40, height: 40, borderRadius: 99, flex: 'none',
            background: '#e5f5ec', border: '1px solid #a8dcbf',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <PhoneIcon />
          </div>
          <div onClick={onToggleSave} style={{
            width: 40, height: 40, borderRadius: 99, flex: 'none',
            background: isSaved ? '#fbe9e9' : '#f6f9f7',
            border: '1px solid ' + (isSaved ? '#f0c6c6' : '#e8ece9'),
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <HeartIcon filled={isSaved} />
          </div>
        </div>
      </div>

      {d.media.length > 0 && (
        <div onClick={() => setLightboxIndex(0)} style={{
          position: 'relative', width: '100%', height: 190, borderRadius: 18, overflow: 'hidden', cursor: 'pointer',
          background: d.media[0].bg, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid #e8ece9',
        }}>
          <div style={{ position: 'absolute', left: 12, bottom: 12, display: 'flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 10, background: 'rgba(10,11,18,.72)' }}>
            <GalleryIcon />
            <span style={{ font: '700 11px/1 Manrope', color: '#fff', letterSpacing: '.04em' }}>{d.media.length} PHOTO{d.media.length === 1 ? '' : 'S'}</span>
          </div>
        </div>
      )}
      {d.noMedia && (
        <div style={{ height: 100, borderRadius: 18, border: '1px dashed #dfe5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 11.5px/1 Manrope', color: '#8a958f' }}>No photos uploaded for this plot</div>
      )}

      {d.isLayout ? (
        <div style={{ display: 'flex', borderRadius: 16, background: '#f6f9f7', border: '1px solid #e8ece9', overflow: 'hidden' }}>
          <StatCell icon={<PlotsIcon color={BLUE} />} color={BLUE} label="PLOTS" value={d.plotCount} />
          <StatCell icon={<SqftIcon color={PURPLE} />} color={PURPLE} label="PLOT SIZES" value={d.sizeRange} border />
          <StatCell icon={<GalleryIconSmall color={GREEN} />} color={GREEN} label="MEDIA" value={d.mediaCount} border />
        </div>
      ) : (
        <div style={{ display: 'flex', borderRadius: 16, background: '#f6f9f7', border: '1px solid #e8ece9', overflow: 'hidden' }}>
          <StatCell icon={<SqftIcon color={GREEN} />} color={GREEN} label="PLOT SIZE" value={d.size} />
          <StatCell icon={<RupeeIcon color={PURPLE} />} color={PURPLE} label="TOTAL PRICE" value={d.total} border />
          <StatCell icon={<GalleryIconSmall color={BLUE} />} color={BLUE} label="MEDIA" value={d.mediaCount} border />
        </div>
      )}

      {d.isLayout && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 15px', borderRadius: 16, background: '#f6f9f7', border: '1px solid #e8ece9' }}>
          <span style={{ font: '600 9.5px/1 Manrope', color: '#6b7570', letterSpacing: '.12em' }}>APPROVAL</span>
          <span style={{ font: '700 12px/1 Manrope', color: INK }}>{d.approval}</span>
        </div>
      )}

      {d.amenities.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <div style={{ font: '700 11px/1 Manrope', color: '#6b7570', letterSpacing: '.12em' }}>AMENITIES ({d.amenities.length})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {d.amenities.map((a) => (
              <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 99, background: '#f6f9f7', border: '1px solid #e8ece9', font: '600 11.5px/1 Manrope', color: '#1a1e1c' }}>
                <AmenityIcon name={a} />
                {a}
              </div>
            ))}
          </div>
        </div>
      )}

      {d.landmarks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ font: '700 11px/1 Manrope', color: '#6b7570', letterSpacing: '.12em' }}>📍 NEARBY PLACES</div>
          {groupLandmarksByCategory(d.landmarks).map(([category, items]) => (
            <div key={category} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ font: '700 10px/1 Manrope', color: '#8a958f', letterSpacing: '.1em' }}>{CATEGORY_LABELS[category] || category.toUpperCase()}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {items.map((l) => (
                  <div key={l.name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 13px', borderRadius: 99, background: '#f6f9f7', border: '1px solid #e8ece9', font: '600 11.5px/1 Manrope', color: '#1a1e1c' }}>
                    <span style={{ fontSize: 12 }}>{l.icon}</span>
                    {l.name}
                    <span style={{ color: '#8a958f', fontWeight: 500 }}>· {l.distanceKm} km · {l.driveTimeMin} min</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: '13px 15px', borderRadius: 16, background: '#f6f9f7', border: '1px solid #e8ece9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <NotesIcon />
          <span style={{ font: '700 10.5px/1 Manrope', color: '#6b7570', letterSpacing: '.1em' }}>NOTES</span>
        </div>
        <div style={{ font: '400 13.5px/1.6 Manrope', color: '#495650' }}>{d.notes}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', borderRadius: 16, background: '#f6f9f7', border: '1px solid #e8ece9' }}>
        <MiniMap lat={sel.lat} lng={sel.lng} ppsf={sel.ppsf} style={{ width: 74, height: 74, borderRadius: 12, overflow: 'hidden', flex: 'none' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, flex: 1 }}>
          <span style={{ font: '600 10px/1 Manrope', color: '#6b7570', letterSpacing: '.12em' }}>EXACT LOCATION</span>
          <span style={{ font: '600 12px/1.4 ui-monospace,Menlo,monospace', color: '#1a1e1c' }}>{d.coords}</span>
          <span style={{ font: '500 11.5px/1 Manrope', color: '#1f9d64' }}>{d.landmark}</span>
        </div>
        <a
          href={'https://www.google.com/maps?q=' + sel.lat + ',' + sel.lng} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
          style={{ width: 34, height: 34, borderRadius: 10, background: '#f6f9f7', border: '1px solid #e8ece9', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}
        >
          <LinkIcon />
        </a>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14, background: d.trustBg, border: '1px solid ' + d.trustBorder }}>
        <span style={{ width: 16, height: 16, borderRadius: 99, border: '1.5px solid ' + d.trustMark, color: d.trustColor, font: '800 9px/13px Manrope', textAlign: 'center', flex: 'none' }}>i</span>
        <span style={{ font: '600 11.5px/1.45 Manrope', color: d.trustColor }}>{d.trustText}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ font: '600 10px/1 Manrope', color: '#6b7570', letterSpacing: '.12em' }}>{d.ownerLabel}</span>
            <span style={{ font: '700 13.5px/1 Manrope', color: INK }}>{d.owner}</span>
          </div>
          <span style={{ font: '500 11.5px/1 Manrope', color: '#8a958f' }}>{d.age}</span>
        </div>
        <div style={{ display: 'flex', gap: 9 }}>
          <div onClick={onContact} style={{
            flex: 1, height: 54, borderRadius: 18, background: 'linear-gradient(110deg,#1f9d64,#8355c9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 16px 32px -14px rgba(31,157,100,.45)',
          }}>
            <ChatIcon />
            <span style={{ font: '800 15px/1 Manrope', color: '#ffffff', letterSpacing: '-.01em' }}>{d.contactLabel}</span>
          </div>
          <div onClick={onContact} style={{
            width: 54, height: 54, borderRadius: 18, background: '#f6f9f7', border: '1px solid #e8ece9',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <span style={{ font: '700 17px/1 Manrope', color: '#1f9d64' }}>☎</span>
          </div>
        </div>
      </div>

      {lightboxIndex !== null && (
        <MediaLightbox media={sel.media} index={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </div>
  );
}

function StatCell({ icon, color, label, value, border }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '13px 8px', borderLeft: border ? '1px solid #e8ece9' : 'none' }}>
      <div style={{ width: 32, height: 32, borderRadius: 10, background: hexToRgba(color, .16), flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <span style={{ font: '600 8.5px/1 Manrope', color: '#6b7570', letterSpacing: '.05em', textAlign: 'center' }}>{label}</span>
      <span style={{ font: '800 13.5px/1.2 Manrope', color: INK, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{value}</span>
    </div>
  );
}

function hexToRgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}

const AMENITY_ICONS = {
  'water connection': () => <DropIcon />,
  'eb connection': () => <BoltIcon />,
  'drainage': () => <DrainIcon />,
  'tar road': () => <RoadIcon />,
  'sewage line': () => <DrainIcon />,
};

function AmenityIcon({ name }) {
  const Icon = AMENITY_ICONS[name.toLowerCase()];
  return Icon ? <Icon /> : <TagIcon />;
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M6.5 3h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2C10.5 17.5 6.5 13.5 4.5 6.2A2 2 0 0 1 6.5 3Z" stroke="#146b41" strokeWidth="1.8" strokeLinejoin="round" />
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

function SqftIcon({ color }) {
  return <div style={{ width: 13, height: 13, border: '1.6px dashed ' + color, borderRadius: 3 }} />;
}

function RupeeIcon({ color }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M6 4h12M6 9h12M6 4c4 0 7 1.8 7 5s-3 5-7 5l8 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlotsIcon({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="8" height="8" rx="1.3" stroke={color} strokeWidth="1.8" />
      <rect x="13" y="3" width="8" height="8" rx="1.3" stroke={color} strokeWidth="1.8" />
      <rect x="3" y="13" width="8" height="8" rx="1.3" stroke={color} strokeWidth="1.8" />
      <rect x="13" y="13" width="8" height="8" rx="1.3" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

function GalleryIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="16" rx="2.5" stroke="#fff" strokeWidth="1.6" />
      <circle cx="8.5" cy="9.5" r="1.4" stroke="#fff" strokeWidth="1.6" />
      <path d="M4 16.5 8.5 12l3 3 4-4.5L21 15" stroke="#fff" strokeWidth="1.6" />
    </svg>
  );
}

function GalleryIconSmall({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="16" rx="2.5" stroke={color} strokeWidth="1.8" />
      <circle cx="8.5" cy="9.5" r="1.4" stroke={color} strokeWidth="1.8" />
      <path d="M4 16.5 8.5 12l3 3 4-4.5L21 15" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

function NotesIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M6 2.5h9l5 5V20a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 5 20V4A1.5 1.5 0 0 1 6 2.5Z" stroke="#1f9d64" strokeWidth="1.6" />
      <path d="M15 2.5V8h5" stroke="#1f9d64" strokeWidth="1.6" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M9 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" stroke="#1f9d64" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M14 4h6v6M20 4l-9 9" stroke="#1f9d64" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v9a2.5 2.5 0 0 1-2.5 2.5H9l-4 3.5v-3.5h-.5A2.5 2.5 0 0 1 2 14.5v-9A2.5 2.5 0 0 1 4.5 3" stroke="#ffffff" strokeWidth="1.8" />
    </svg>
  );
}

function DropIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M12 2.5s7 8 7 12.5a7 7 0 1 1-14 0c0-4.5 7-12.5 7-12.5Z" stroke="#3d7fd9" strokeWidth="1.7" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" stroke="#f5b43c" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function DrainIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="3" stroke="#1f9d64" strokeWidth="1.6" />
      <path d="M8 8v8M12 8v8M16 8v8" stroke="#1f9d64" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function RoadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M8 3 4 21M16 3l4 18" stroke="#8a958f" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 4v3M12 10.5v3M12 17v3" stroke="#8a958f" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M12.5 3H5a2 2 0 0 0-2 2v7.5a1 1 0 0 0 .3.7l9 9a1 1 0 0 0 1.4 0l7.5-7.5a1 1 0 0 0 0-1.4l-9-9a1 1 0 0 0-.7-.3Z" stroke="#8a958f" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="1.3" stroke="#8a958f" strokeWidth="1.6" />
    </svg>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? '#d64545' : 'none'}>
      <path d="M12 20.5s-7.5-4.6-10-9.3C.5 7.8 2.3 4 6 4c2 0 3.5 1.1 6 3.5C14.5 5.1 16 4 18 4c3.7 0 5.5 3.8 4 7.2-2.5 4.7-10 9.3-10 9.3Z" stroke={filled ? '#d64545' : '#8a958f'} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
