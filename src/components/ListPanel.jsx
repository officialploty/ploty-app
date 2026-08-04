import { useState } from 'react';
import { createPortal } from 'react-dom';
import { CITIES } from '../data';
import PlotCard from './PlotCard';

const sortLabels = { new: 'Newest', low: 'Price ↑', high: 'Price ↓' };
const KIND_OPTIONS = [['all', 'All listings'], ['plot', 'Individual plots'], ['layout', 'Developer layouts']];

const PPSF_BOUNDS = [0, 15000];
const PRICE_BOUNDS = [0, 50000000];
const SQFT_BOUNDS = [0, 10000];

const rupeeShort = (v) => v >= 10000000 ? '₹' + (v / 10000000).toFixed(1).replace(/\.0$/, '') + 'Cr' : v >= 100000 ? '₹' + (v / 100000).toFixed(1).replace(/\.0$/, '') + 'L' : v >= 1000 ? '₹' + (v / 1000).toFixed(0) + 'k' : '₹' + v;
const sqftShort = (v) => v.toLocaleString('en-IN') + ' sqft';

export default function ListPanel({ pm }) {
  const { visible, city, area, sort, setSort, kindFilter, setKindFilter, ppsfRange, setPpsfRange, totalPriceRange, setTotalPriceRange, sqftRange, setSqftRange, open, saved, toggleSave, shareListing } = pm;
  const [filterOpen, setFilterOpen] = useState(false);

  const activeCount = (kindFilter !== 'all' ? 1 : 0) + (area !== 'All areas' ? 1 : 0)
    + (ppsfRange ? 1 : 0) + (totalPriceRange ? 1 : 0) + (sqftRange ? 1 : 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <div style={{ padding: '18px 18px 12px', display: 'flex', flexDirection: 'column', gap: 14, borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 'none' }}>
            <div style={{ font: '800 22px/1 Manrope', color: '#fff', letterSpacing: '-.02em' }}>{visible.length} plots</div>
            <div style={{ font: '500 12px/1 Manrope', color: 'rgba(255,255,255,.42)' }}>{city + ' · ' + area}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <div
              onClick={() => setFilterOpen(true)}
              style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 12px', borderRadius: 12, background: activeCount ? 'rgba(53,224,192,.12)' : 'rgba(255,255,255,.05)', border: '1px solid ' + (activeCount ? 'rgba(53,224,192,.4)' : 'rgba(255,255,255,.1)'), cursor: 'pointer' }}
            >
              <SlidersIcon color={activeCount ? '#35e0c0' : 'rgba(255,255,255,.6)'} />
              <span style={{ font: '700 12.5px/1 Manrope', color: activeCount ? '#35e0c0' : 'rgba(255,255,255,.75)', whiteSpace: 'nowrap' }}>Filters</span>
              {activeCount > 0 && (
                <span style={{ minWidth: 17, height: 17, padding: '0 5px', borderRadius: 99, background: '#35e0c0', color: '#08150f', font: '800 10px/17px Manrope', textAlign: 'center' }}>{activeCount}</span>
              )}
            </div>
            <div onClick={() => setSort(sort === 'new' ? 'low' : sort === 'low' ? 'high' : 'new')} style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 12px', borderRadius: 12, background: 'rgba(139,123,255,.16)', border: '1px solid rgba(139,123,255,.4)', cursor: 'pointer' }}>
              <span style={{ font: '700 12px/1 Manrope', color: '#b4a9ff', whiteSpace: 'nowrap' }}>{sortLabels[sort]}</span>
            </div>
          </div>
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

      {filterOpen && (
        <FilterSheet
          pm={pm}
          activeCount={activeCount}
          onClose={() => setFilterOpen(false)}
        />
      )}
    </div>
  );
}

function FilterSheet({ pm, activeCount, onClose }) {
  const { city, area, kindFilter, setKindFilter, goArea, ppsfRange, setPpsfRange, totalPriceRange, setTotalPriceRange, sqftRange, setSqftRange } = pm;
  const areaOptions = [['All areas', 'All areas']].concat(CITIES[city].areas.slice(1).map((a) => [a, a]));
  const [open, setOpen] = useState({});
  const toggle = (key) => setOpen((o) => ({ ...o, [key]: !o[key] }));

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'linear-gradient(180deg,rgba(18,20,31,.99),rgba(10,11,18,.995))', display: 'flex', flexDirection: 'column', animation: 'pmFade .18s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 18px 14px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <span style={{ font: '800 18px/1 Manrope', color: '#fff', letterSpacing: '-.01em' }}>Filters</span>
        <div onClick={onClose} style={{ width: 30, height: 30, borderRadius: 99, background: 'rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', font: '700 15px/1 Manrope', color: '#fff' }}>×</div>
      </div>

      <div className="pmScroll" style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <FilterSection title="Listing type" open={!!open.type} onToggle={() => toggle('type')} badge={kindFilter !== 'all' ? 1 : 0}>
          {KIND_OPTIONS.map(([key, label]) => (
            <FilterOption key={key} label={label} active={kindFilter === key} onClick={() => setKindFilter(key)} />
          ))}
        </FilterSection>

        <FilterSection title="Price per sqft" open={!!open.ppsf} onToggle={() => toggle('ppsf')} badge={ppsfRange ? 1 : 0}>
          <RangeSlider bounds={PPSF_BOUNDS} value={ppsfRange} onChange={setPpsfRange} format={rupeeShort} step={100} />
        </FilterSection>

        <FilterSection title="Total price" open={!!open.total} onToggle={() => toggle('total')} badge={totalPriceRange ? 1 : 0}>
          <RangeSlider bounds={PRICE_BOUNDS} value={totalPriceRange} onChange={setTotalPriceRange} format={rupeeShort} step={50000} />
        </FilterSection>

        <FilterSection title="Plot size (sqft)" open={!!open.sqft} onToggle={() => toggle('sqft')} badge={sqftRange ? 1 : 0}>
          <RangeSlider bounds={SQFT_BOUNDS} value={sqftRange} onChange={setSqftRange} format={sqftShort} step={50} />
        </FilterSection>

        <FilterSection title="Area" open={!!open.area} onToggle={() => toggle('area')} badge={area !== 'All areas' ? 1 : 0}>
          {areaOptions.map(([key, label]) => (
            <FilterOption key={key} label={label} active={area === key} onClick={() => goArea(key)} />
          ))}
        </FilterSection>
      </div>

      <div style={{ padding: 18, borderTop: '1px solid rgba(255,255,255,.07)', display: 'flex', gap: 10 }}>
        <div
          onClick={() => { setKindFilter('all'); goArea('All areas'); setPpsfRange(null); setTotalPriceRange(null); setSqftRange(null); }}
          style={{ flex: 1, textAlign: 'center', padding: '13px 0', borderRadius: 12, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', font: '700 13.5px/1 Manrope', color: 'rgba(255,255,255,.75)', cursor: 'pointer' }}
        >
          Reset
        </div>
        <div
          onClick={onClose}
          style={{ flex: 2, textAlign: 'center', padding: '13px 0', borderRadius: 12, background: '#35e0c0', font: '800 13.5px/1 Manrope', color: '#08150f', cursor: 'pointer' }}
        >
          Show results{activeCount > 0 ? ' · ' + activeCount + ' applied' : ''}
        </div>
      </div>
    </div>,
    document.body
  );
}

function FilterSection({ title, children, open, onToggle, badge }) {
  return (
    <div style={{ flex: 'none', borderRadius: 14, background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', overflow: 'hidden' }}>
      <div
        onClick={onToggle}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 15px', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ font: '700 13.5px/1 Manrope', color: '#fff' }}>{title}</span>
          {badge > 0 && <span style={{ width: 7, height: 7, borderRadius: 99, background: '#35e0c0' }} />}
        </div>
        <div style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .15s ease' }}>
          <ChevronIcon />
        </div>
      </div>
      {open && <div style={{ padding: '0 15px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>}
    </div>
  );
}

function RangeSlider({ bounds, value, onChange, format, step }) {
  const [lo, hi] = value || bounds;
  const pct = (v) => ((v - bounds[0]) / (bounds[1] - bounds[0])) * 100;

  const setLo = (v) => { const n = Math.min(Number(v), hi); onChange([n, hi]); };
  const setHi = (v) => { const n = Math.max(Number(v), lo); onChange([lo, n]); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ font: '800 13px/1 Manrope', color: '#35e0c0' }}>{format(lo)}</span>
        <span style={{ font: '800 13px/1 Manrope', color: '#35e0c0' }}>{format(hi)}</span>
      </div>
      <div style={{ position: 'relative', height: 20 }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 9, height: 2, borderRadius: 2, background: 'rgba(255,255,255,.12)' }} />
        <div style={{ position: 'absolute', top: 9, height: 2, borderRadius: 2, background: '#35e0c0', left: pct(lo) + '%', right: (100 - pct(hi)) + '%' }} />
        <input className="pmRange" type="range" min={bounds[0]} max={bounds[1]} step={step} value={lo} onChange={(e) => setLo(e.target.value)} />
        <input className="pmRange" type="range" min={bounds[0]} max={bounds[1]} step={step} value={hi} onChange={(e) => setHi(e.target.value)} />
      </div>
    </div>
  );
}

function FilterOption({ label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 15px', borderRadius: 12,
        background: active ? 'rgba(53,224,192,.12)' : 'rgba(255,255,255,.04)', border: '1px solid ' + (active ? 'rgba(53,224,192,.4)' : 'rgba(255,255,255,.08)'), cursor: 'pointer',
      }}
    >
      <span style={{ font: '600 13.5px/1 Manrope', color: active ? '#35e0c0' : 'rgba(255,255,255,.8)' }}>{label}</span>
      {active && (
        <div style={{ width: 18, height: 18, borderRadius: 99, background: '#35e0c0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4 10-10" stroke="#08150f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      )}
    </div>
  );
}

function SlidersIcon({ color }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M4 7h10M18 7h2M4 17h2M8 17h12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="7" r="2.3" fill="#0a0b12" stroke={color} strokeWidth="1.8" />
      <circle cx="6" cy="17" r="2.3" fill="#0a0b12" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M9 6l6 6-6 6" stroke="rgba(255,255,255,.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
