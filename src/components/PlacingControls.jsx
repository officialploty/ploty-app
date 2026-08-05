import { NEARBY_THRESHOLD_M } from '../utils';

export function NearbyWarning({ pm }) {
  const list = pm.nearbyDuplicates;
  if (!list.length) return null;
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 16, background: '#fdf3e2', border: '1px solid #f0d9a8' }}>
      <span style={{ width: 16, height: 16, borderRadius: 99, border: '1.5px solid #d98a1f', color: '#d98a1f', font: '800 10px/13px Manrope', textAlign: 'center', flex: 'none' }}>!</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ font: '700 12.5px/1.4 Manrope', color: '#8a651c' }}>
          {list.length} listing{list.length === 1 ? '' : 's'} already within {NEARBY_THRESHOLD_M}m — {list[0].locality}{list.length > 1 ? ' + more' : ''}
        </span>
        <span style={{ font: '500 11.5px/1.4 Manrope', color: '#a4823f' }}>Double-check this isn't a repeat listing before continuing.</span>
      </div>
    </div>
  );
}

export function PinControls({ pm }) {
  return (
    <>
      <div style={{ padding: '12px 16px', borderRadius: 16, background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(22px)', border: '1px solid #e5e9e6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ font: '600 11.5px/1 Manrope', color: '#6b7570', letterSpacing: '.08em' }}>COORDINATES</span>
        <span style={{ font: '700 12.5px/1 ui-monospace,Menlo,monospace', color: pm.pin ? '#1f9d64' : '#8a958f' }}>{pm.pin ? pm.pin[0].toFixed(5) + ', ' + pm.pin[1].toFixed(5) : 'tap the map to drop a pin'}</span>
      </div>
      <div onClick={pm.confirmLocation} style={{ height: 56, borderRadius: 20, background: pm.pin ? 'linear-gradient(110deg,#1f9d64,#8355c9)' : '#eef1ef', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: pm.pin ? '0 16px 34px -14px rgba(31,157,100,.45)' : 'none' }}>
        <span style={{ font: '800 15.5px/1 Manrope', color: pm.pin ? '#ffffff' : '#8a958f', letterSpacing: '-.01em' }}>{pm.pin ? 'Confirm this location' : 'Drop a pin to continue'}</span>
      </div>
    </>
  );
}
