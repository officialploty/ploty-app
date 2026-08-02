import { listCardFields } from '../fields';

export default function PlotCard({ p, onClick }) {
  const f = listCardFields(p);
  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: 22, padding: 16, background: 'rgba(30,33,64,.55)', border: '1px solid rgba(255,255,255,.09)',
        cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, overflow: 'hidden', flex: 'none', background: f.thumbBg,
          backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid rgba(255,255,255,.1)', position: 'relative',
        }}>
          <div style={{ position: 'absolute', right: 4, bottom: 4, padding: '2px 5px', borderRadius: 5, background: 'rgba(10,11,18,.7)', font: '700 8px/1 Manrope', color: '#fff' }}>{f.mediaBadge}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0, flex: 1 }}>
          <div style={{ font: '700 16px/1.2 Manrope', color: '#fff', letterSpacing: '-.01em' }}>{f.locality}</div>
          <div style={{ font: '500 11.5px/1 Manrope', color: 'rgba(255,255,255,.4)', letterSpacing: '.04em' }}>{f.metaLine}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flex: 'none' }}>
          <div style={{ font: '800 17px/1 Manrope', color: f.color, letterSpacing: '-.02em' }}>{f.ppsfLabel}</div>
          <div style={{ font: '600 11px/1 Manrope', color: 'rgba(255,255,255,.45)' }}>per sqft</div>
        </div>
      </div>
      <div style={{ font: '400 12.5px/1.5 Manrope', color: 'rgba(255,255,255,.52)' }}>{f.notesShort}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ padding: '5px 9px', borderRadius: 8, background: 'rgba(255,255,255,.07)', font: '600 10.5px/1 Manrope', color: 'rgba(255,255,255,.6)', letterSpacing: '.06em' }}>{f.sizeLabel}</span>
          <span style={{ font: '700 12.5px/1 Manrope', color: '#fff' }}>{f.totalLabel}</span>
        </div>
        <span style={{ font: '600 11px/1 Manrope', color: 'rgba(255,255,255,.35)' }}>{f.age}</span>
      </div>
    </div>
  );
}
