import { CITIES } from '../data';
import PlotCard from './PlotCard';
import { priceChip } from './Filters';

const sortLabels = { new: 'Newest', low: 'Price ↑', high: 'Price ↓' };

export default function ListPanel({ pm }) {
  const { visible, city, area, sort, setSort, kindFilter, setKindFilter, priceFilter, setPriceFilter, setArea, open, saved, toggleSave, shareListing } = pm;

  const filterChips = [
    { ...priceChip('All listings', 'all', kindFilter), onClick: () => setKindFilter('all') },
    { ...priceChip('Individual plots', 'plot', kindFilter), onClick: () => setKindFilter('plot') },
    { ...priceChip('Developer layouts', 'layout', kindFilter), onClick: () => setKindFilter('layout') },
    { ...priceChip('All prices', 'all', priceFilter), onClick: () => setPriceFilter('all') },
    { ...priceChip('Under ₹4,000', 'value', priceFilter), onClick: () => setPriceFilter('value') },
    { ...priceChip('₹4,000–8,000', 'mid', priceFilter), onClick: () => setPriceFilter('mid') },
    { ...priceChip('₹8,000+', 'premium', priceFilter), onClick: () => setPriceFilter('premium') },
  ].concat(CITIES[city].areas.slice(1).map((a) => ({
    ...priceChip(a, a, area), onClick: () => setArea(area === a ? 'All areas' : a),
  })));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '18px 18px 12px', display: 'flex', flexDirection: 'column', gap: 14, borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ font: '800 24px/1 Manrope', color: '#fff', letterSpacing: '-.02em' }}>{visible.length} plots</div>
            <div style={{ font: '500 12px/1 Manrope', color: 'rgba(255,255,255,.42)' }}>{city + ' · ' + area}</div>
          </div>
          <div onClick={() => setSort(sort === 'new' ? 'low' : sort === 'low' ? 'high' : 'new')} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 32, padding: '0 12px', borderRadius: 99, background: 'rgba(139,123,255,.16)', border: '1px solid rgba(139,123,255,.4)', cursor: 'pointer' }}>
            <span style={{ font: '700 11.5px/1 Manrope', color: '#b4a9ff' }}>{sortLabels[sort]}</span>
          </div>
        </div>
        <div className="pmScroll" style={{ display: 'flex', gap: 7, overflowX: 'auto' }}>
          {filterChips.map((f, i) => (
            <div key={i} onClick={f.onClick} style={{ flex: 'none', padding: '8px 13px', borderRadius: 99, background: f.bg, border: '1px solid ' + f.border, font: '600 12px/1 Manrope', color: f.color, cursor: 'pointer' }}>{f.name}</div>
          ))}
        </div>
      </div>
      <div className="pmScroll" style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 30px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visible.map((p) => (
          <PlotCard key={p.id} p={p} onClick={() => open(p.id)} saved={saved} onToggleSave={toggleSave} onShare={shareListing} />
        ))}
        {visible.length === 0 && (
          <div style={{ padding: '40px 10px', textAlign: 'center', font: '500 13px/1.6 Manrope', color: 'rgba(255,255,255,.4)' }}>Nothing here yet. Widen the filters, or be the first to register a plot in this area.</div>
        )}
      </div>
    </div>
  );
}
