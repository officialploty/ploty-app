import PlotCard from './PlotCard';

const sortLabels = { new: 'Newest', low: 'Price ↑', high: 'Price ↓' };

export default function ListPanel({ pm, filterOpen, onToggleFilter, items, inMapView }) {
  const { city, area, sort, setSort, kindFilter, ppsfRange, totalPriceRange, sqftRange, open, saved, toggleSave, shareListing } = pm;
  const visible = items || pm.visible;

  const activeCount = (kindFilter !== 'all' ? 1 : 0) + (area !== 'All areas' ? 1 : 0)
    + (ppsfRange ? 1 : 0) + (totalPriceRange ? 1 : 0) + (sqftRange ? 1 : 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', background: '#f4f7f5' }}>
      <div style={{ padding: '18px 18px 12px', display: 'flex', flexDirection: 'column', gap: 14, borderBottom: '1px solid #e5e9e6' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 'none' }}>
            <div style={{ font: '800 22px/1 Manrope', color: '#1a1e1c', letterSpacing: '-.02em' }}>{visible.length} plots</div>
            <div style={{ font: '500 12px/1 Manrope', color: '#6b7570' }}>{inMapView ? 'In this map view' : city + ' · ' + area}</div>
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
      </div>
      <div className="pmScroll" style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 30px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visible.map((p) => (
          <PlotCard key={p.id} p={p} onClick={() => open(p.id)} saved={saved} onToggleSave={toggleSave} onShare={shareListing} />
        ))}
        {visible.length === 0 && (
          <div style={{ padding: '40px 10px', textAlign: 'center', font: '500 13px/1.6 Manrope', color: '#8a958f' }}>Nothing here yet. Widen the filters, or be the first to register a plot in this area.</div>
        )}
      </div>
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
