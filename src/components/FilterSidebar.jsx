import { CITIES } from '../data';

const KIND_OPTIONS = [['all', 'All'], ['plot', 'Individual'], ['layout', 'Developer']];
const PPSF_BOUNDS = [0, 15000];
const PRICE_BOUNDS = [0, 50000000];
const SQFT_BOUNDS = [0, 10000];

const rupeeShort = (v) => v >= 10000000 ? '₹' + (v / 10000000).toFixed(1).replace(/\.0$/, '') + 'Cr' : v >= 100000 ? '₹' + (v / 100000).toFixed(1).replace(/\.0$/, '') + 'L' : v >= 1000 ? '₹' + (v / 1000).toFixed(0) + 'k' : '₹' + v;

export default function FilterSidebar({ pm, mapRef, onClose }) {
  const {
    city, area, cityMenu, areaMenu, setCityMenu, setAreaMenu, goCity, goArea,
    kindFilter, setKindFilter, ppsfRange, setPpsfRange, totalPriceRange, setTotalPriceRange, sqftRange, setSqftRange,
  } = pm;

  const cityOptions = Object.keys(CITIES);
  const areaOptions = ['All areas'].concat(CITIES[city].areas.slice(1));

  const reset = () => { setKindFilter('all'); goArea('All areas'); setPpsfRange(null); setTotalPriceRange(null); setSqftRange(null); };

  return (
    <div className="pmScroll" style={{ width: 300, flex: 'none', borderRight: '1px solid #e5e9e6', background: '#ffffff', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ font: '800 18px/1 Manrope', color: '#1a1e1c', letterSpacing: '-.01em' }}>Filters</span>
        <span onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <span style={{ font: '700 12.5px/1 Manrope', color: '#495650' }}>Close</span>
          <span style={{ width: 17, height: 17, borderRadius: 99, border: '1.5px solid #8a958f', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 10px/1 Manrope', color: '#6b7570' }}>×</span>
        </span>
      </div>

      <div style={{ padding: '4px 20px 28px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <Section label="Location">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
            <Dropdown label={city} onClick={() => { setCityMenu(!cityMenu); setAreaMenu(false); }} />
            {cityMenu && (
              <Menu>
                {cityOptions.map((name) => (
                  <MenuItem key={name} label={name} active={name === city} onClick={() => goCity(name, (cfg) => mapRef?.current && mapRef.current.flyTo(cfg.center, cfg.zoom))} />
                ))}
              </Menu>
            )}
            <Dropdown label={area} onClick={() => { setAreaMenu(!areaMenu); setCityMenu(false); }} />
            {areaMenu && (
              <Menu>
                {areaOptions.map((name) => (
                  <MenuItem key={name} label={name} active={name === area} onClick={() => goArea(name)} />
                ))}
              </Menu>
            )}
          </div>
        </Section>

        <Section label="Listing type">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {KIND_OPTIONS.map(([key, label]) => (
              <Checkbox key={key} label={label} checked={kindFilter === key} onClick={() => setKindFilter(key)} />
            ))}
          </div>
        </Section>

        <Section label="Price range" badge={totalPriceRange ? 1 : 0}>
          <RangeSlider bounds={PRICE_BOUNDS} value={totalPriceRange} onChange={setTotalPriceRange} format={rupeeShort} step={50000} />
        </Section>

        <Section label="Price per sqft" badge={ppsfRange ? 1 : 0}>
          <RangeSlider bounds={PPSF_BOUNDS} value={ppsfRange} onChange={setPpsfRange} format={rupeeShort} step={100} />
        </Section>

        <Section label="Plot size (sq ft)" badge={sqftRange ? 1 : 0}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <NumberField placeholder="Min sq ft" value={sqftRange ? sqftRange[0] : ''} onChange={(v) => setSqftRange([Number(v) || SQFT_BOUNDS[0], sqftRange ? sqftRange[1] : SQFT_BOUNDS[1]])} />
            <span style={{ font: '600 12px/1 Manrope', color: '#8a958f' }}>–</span>
            <NumberField placeholder="Max sq ft" value={sqftRange ? sqftRange[1] : ''} onChange={(v) => setSqftRange([sqftRange ? sqftRange[0] : SQFT_BOUNDS[0], Number(v) || SQFT_BOUNDS[1]])} />
          </div>
        </Section>
      </div>

      <div style={{ marginTop: 'auto', padding: '18px 20px', borderTop: '1px solid #e5e9e6', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ textAlign: 'center', padding: '13px 0', borderRadius: 12, background: '#1f9d64', font: '800 13.5px/1 Manrope', color: '#fff', cursor: 'default' }}>
          Apply filters
        </div>
        <div onClick={reset} style={{ textAlign: 'center', padding: '13px 0', borderRadius: 12, background: '#fff', border: '1px solid #e0e6e2', font: '700 13.5px/1 Manrope', color: '#495650', cursor: 'pointer' }}>
          Reset
        </div>
      </div>
    </div>
  );
}

function Section({ label, badge, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ font: '800 10.5px/1 Manrope', color: '#8a958f', letterSpacing: '.1em', textTransform: 'uppercase' }}>{label}</span>
        {badge > 0 && <span style={{ width: 6, height: 6, borderRadius: 99, background: '#1f9d64' }} />}
      </div>
      {children}
    </div>
  );
}

function Dropdown({ label, onClick }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 44, padding: '0 14px', borderRadius: 12, background: '#f6f9f7', border: '1px solid #e5e9e6', cursor: 'pointer' }}>
      <span style={{ font: '600 13.5px/1 Manrope', color: '#1a1e1c' }}>{label}</span>
      <ChevronDown />
    </div>
  );
}

function Menu({ children }) {
  return (
    <div style={{ borderRadius: 14, padding: 6, background: '#fff', border: '1px solid #e5e9e6', boxShadow: '0 14px 30px -14px rgba(22,40,31,.28)', display: 'flex', flexDirection: 'column', maxHeight: 240, overflowY: 'auto' }}>
      {children}
    </div>
  );
}

function MenuItem({ label, active, onClick }) {
  return (
    <div onClick={onClick} style={{ padding: '10px 11px', borderRadius: 10, background: active ? '#e5f5ec' : 'transparent', cursor: 'pointer' }}>
      <span style={{ font: '600 13px/1 Manrope', color: active ? '#146b41' : '#1a1e1c' }}>{label}</span>
    </div>
  );
}

function Checkbox({ label, checked, onClick }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
      <span style={{
        width: 18, height: 18, borderRadius: 5, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: checked ? '#1f9d64' : '#fff', border: '1.5px solid ' + (checked ? '#1f9d64' : '#d7dcd8'),
      }}>
        {checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4 10-10" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </span>
      <span style={{ font: '600 13.5px/1 Manrope', color: '#1a1e1c' }}>{label}</span>
    </div>
  );
}

function NumberField({ placeholder, value, onChange }) {
  return (
    <input
      className="pmInput"
      type="number"
      inputMode="numeric"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ flex: 1, minWidth: 0, height: 42, padding: '0 12px', font: '600 13px/1 Manrope' }}
    />
  );
}

function RangeSlider({ bounds, value, onChange, format, step }) {
  const [lo, hi] = value || bounds;
  const pct = (v) => ((v - bounds[0]) / (bounds[1] - bounds[0])) * 100;

  const setLo = (v) => { const n = Math.min(Number(v), hi); onChange([n, hi]); };
  const setHi = (v) => { const n = Math.max(Number(v), lo); onChange([lo, n]); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ font: '800 12.5px/1 Manrope', color: '#1f9d64' }}>{format(lo)}</span>
        <span style={{ font: '800 12.5px/1 Manrope', color: '#1f9d64' }}>{format(hi)}</span>
      </div>
      <div style={{ position: 'relative', height: 20 }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 9, height: 2, borderRadius: 2, background: '#e5e9e6' }} />
        <div style={{ position: 'absolute', top: 9, height: 2, borderRadius: 2, background: '#1f9d64', left: pct(lo) + '%', right: (100 - pct(hi)) + '%' }} />
        <input className="pmRange pmRangeLight" type="range" min={bounds[0]} max={bounds[1]} step={step} value={lo} onChange={(e) => setLo(e.target.value)} />
        <input className="pmRange pmRangeLight" type="range" min={bounds[0]} max={bounds[1]} step={step} value={hi} onChange={(e) => setHi(e.target.value)} />
      </div>
    </div>
  );
}

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M6 9l6 6 6-6" stroke="#8a958f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
