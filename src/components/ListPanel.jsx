import PlotCard from './PlotCard';

const sortLabels = { new: 'Newest', low: 'Price ↑', high: 'Price ↓' };

export default function ListPanel({ pm, filterOpen, onToggleFilter, items, inMapView, mapVisible, onToggleMap }) {
  const { city, area, sort, setSort, kindFilter, ppsfRange, totalPriceRange, sqftRange, open, saved, toggleSave, shareListing } = pm;
  const visible = items || pm.visible;

  const activeCount = (kindFilter !== 'all' ? 1 : 0) + (area !== 'All areas' ? 1 : 0)
    + (ppsfRange ? 1 : 0) + (totalPriceRange ? 1 : 0) + (sqftRange ? 1 : 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', background: '#f4f7f5' }}>
      <div style={{ padding: '18px 18px 12px', display: 'flex', flexDirection: 'column', gap: 12, borderBottom: '1px solid #e5e9e6' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ font: '600 15px/1.3 Manrope', color: '#1a1e1c', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <span style={{ fontWeight: 800 }}>{visible.length} results</span>
            {!inMapView && (
              <>
                {' in '}
                <span style={{ textDecoration: 'underline', textUnderlineOffset: 2, color: '#495650' }}>{city}{area !== 'All areas' ? ', ' + area : ''}</span>
              </>
            )}
            {inMapView && <span style={{ font: '500 13px/1.3 Manrope', color: '#6b7570' }}> in this map view</span>}
          </div>
          {onToggleMap && (
            <div onClick={onToggleMap} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 'none' }}>
              <span style={{ font: '600 12.5px/1 Manrope', color: '#495650' }}>View map</span>
              <Toggle on={!!mapVisible} />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div
            onClick={onToggleFilter}
            style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 12px', borderRadius: 12, background: filterOpen || activeCount ? '#e5f5ec' : '#f6f9f7', border: '1px solid ' + (filterOpen || activeCount ? '#a8dcbf' : '#e5e9e6'), cursor: 'pointer' }}
          >
            <SlidersIcon color={filterOpen || activeCount ? '#1f9d64' : '#6b7570'} />
            <span style={{ font: '700 12.5px/1 Manrope', color: filterOpen || activeCount ? '#146b41' : '#495650', whiteSpace: 'nowrap' }}>Filters</span>
            {activeCount > 0 && (
              <span style={{ minWidth: 17, height: 17, padding: '0 5px', borderRadius: 99, background: '#1f9d64', color: '#fff', font: '800 10px/17px Manrope', textAlign: 'center' }}>{activeCount}</span>
            )}
          </div>
          <div onClick={() => setSort(sort === 'new' ? 'low' : sort === 'low' ? 'high' : 'new')} style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 12px', borderRadius: 12, background: '#f1ecfa', border: '1px solid #d9caf0', cursor: 'pointer' }}>
            <span style={{ font: '700 12px/1 Manrope', color: '#6a3fb0', whiteSpace: 'nowrap' }}>{sortLabels[sort]}</span>
          </div>
        </div>
      </div>
      <div className="pmScroll" style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 340px))', gap: 12, alignContent: 'start' }}>
        {visible.map((p) => (
          <PlotCard key={p.id} p={p} onClick={() => open(p.id)} saved={saved} onToggleSave={toggleSave} onShare={shareListing} />
        ))}
        {visible.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '40px 10px', textAlign: 'center', font: '500 13px/1.6 Manrope', color: '#8a958f' }}>Nothing here yet. Widen the filters, or be the first to register a plot in this area.</div>
        )}
      </div>
    </div>
  );
}

function Toggle({ on }) {
  return (
    <div style={{
      width: 38, height: 22, borderRadius: 99, flex: 'none', padding: 2, boxSizing: 'border-box',
      background: on ? '#1f9d64' : '#d7dcd8', transition: 'background .15s ease',
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: 99, background: '#fff', boxShadow: '0 1px 3px rgba(22,40,31,.3)',
        transform: on ? 'translateX(16px)' : 'translateX(0)', transition: 'transform .15s ease',
      }} />
    </div>
  );
}

function SlidersIcon({ color }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h10M18 7h2M4 17h2M8 17h12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="7" r="2.3" fill="#f6f9f7" stroke={color} strokeWidth="1.8" />
      <circle cx="6" cy="17" r="2.3" fill="#f6f9f7" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}
