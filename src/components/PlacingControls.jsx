import { NEARBY_THRESHOLD_M } from '../utils';

export function NearbyWarning({ pm }) {
  const list = pm.nearbyDuplicates;
  if (!list.length) return null;
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 16, background: 'rgba(245,180,60,.1)', border: '1px solid rgba(245,180,60,.3)' }}>
      <span style={{ width: 16, height: 16, borderRadius: 99, border: '1.5px solid #f5b43c', color: '#f5b43c', font: '800 10px/13px Manrope', textAlign: 'center', flex: 'none' }}>!</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ font: '700 12.5px/1.4 Manrope', color: '#f0cf9a' }}>
          {list.length} listing{list.length === 1 ? '' : 's'} already within {NEARBY_THRESHOLD_M}m — {list[0].locality}{list.length > 1 ? ' + more' : ''}
        </span>
        <span style={{ font: '500 11.5px/1.4 Manrope', color: 'rgba(240,207,154,.75)' }}>Double-check this isn't a repeat listing before continuing.</span>
      </div>
    </div>
  );
}

export function PinControls({ pm }) {
  return (
    <>
      <div style={{ padding: '12px 16px', borderRadius: 16, background: 'rgba(23,26,44,.8)', backdropFilter: 'blur(22px)', border: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ font: '600 11.5px/1 Manrope', color: 'rgba(255,255,255,.45)', letterSpacing: '.08em' }}>COORDINATES</span>
        <span style={{ font: '700 12.5px/1 ui-monospace,Menlo,monospace', color: pm.pin ? '#35e0c0' : 'rgba(255,255,255,.4)' }}>{pm.pin ? pm.pin[0].toFixed(5) + ', ' + pm.pin[1].toFixed(5) : 'tap the map to drop a pin'}</span>
      </div>
      <div onClick={pm.confirmLocation} style={{ height: 56, borderRadius: 20, background: pm.pin ? 'linear-gradient(110deg,#35e0c0,#8b7bff)' : 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 16px 34px -14px rgba(53,224,192,.6)' }}>
        <span style={{ font: '800 15.5px/1 Manrope', color: pm.pin ? '#0d1018' : 'rgba(255,255,255,.35)', letterSpacing: '-.01em' }}>{pm.pin ? 'Confirm this location' : 'Drop a pin to continue'}</span>
      </div>
    </>
  );
}
