import { band, kShort, ppsfLabel, sqftRange } from '../utils';

export default function SearchBar({ pm, light }) {
  const { query, setQuery, setFocus, focus, visible, open, setCityMenu, setAreaMenu } = pm;
  const q = query.trim().toLowerCase();
  const suggestions = q ? visible.slice(0, 4) : [];
  const showSuggest = focus && !!q;
  const noSuggestions = focus && !!q && suggestions.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', height: 50, borderRadius: 18,
        background: light ? '#ffffff' : 'rgba(23,26,44,.72)', backdropFilter: light ? 'none' : 'blur(22px)',
        border: '1px solid ' + (light ? '#e0e6e2' : 'rgba(255,255,255,.12)'),
        boxShadow: light ? '0 2px 10px rgba(22,40,31,.07)' : '0 14px 34px -12px rgba(0,0,0,.7)',
      }}>
        <div style={{ width: 16, height: 16, borderRadius: 99, border: '2px solid #1f9d64', position: 'relative', flex: 'none' }}>
          <div style={{ position: 'absolute', left: 3, top: 3, width: 6, height: 6, borderRadius: 99, background: '#1f9d64' }} />
        </div>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setFocus(true); }}
          onFocus={() => { setFocus(true); setCityMenu(false); setAreaMenu(false); }}
          placeholder="Search locality, layout, developer…"
          style={{ flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 0, font: '600 15px/1 Manrope', color: light ? '#1a1e1c' : '#fff', letterSpacing: '-.01em' }}
        />
        {query && (
          <div onClick={() => { setQuery(''); setFocus(false); }} style={{ width: 22, height: 22, borderRadius: 99, background: light ? '#f0f3f1' : 'rgba(255,255,255,.12)', color: light ? '#6b7570' : 'rgba(255,255,255,.7)', font: '700 13px/22px Manrope', textAlign: 'center', cursor: 'pointer', flex: 'none' }}>×</div>
        )}
      </div>

      {showSuggest && (
        <div style={{
          borderRadius: 18, overflow: 'hidden', background: light ? '#ffffff' : 'rgba(23,26,44,.86)', backdropFilter: light ? 'none' : 'blur(26px)',
          border: '1px solid ' + (light ? '#e0e6e2' : 'rgba(255,255,255,.12)'),
          boxShadow: light ? '0 12px 30px -10px rgba(22,40,31,.18)' : '0 20px 44px -14px rgba(0,0,0,.8)', animation: 'pmSlide .18s ease',
        }}>
          {suggestions.map((p) => (
            <div
              key={p.id}
              onClick={() => { setQuery(''); setFocus(false); open(p.id); }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '13px 16px', borderBottom: '1px solid ' + (light ? '#eef1ef' : 'rgba(255,255,255,.06)'), cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ font: '600 14px/1 Manrope', color: light ? '#1a1e1c' : '#fff' }}>{p.locality}</div>
                <div style={{ font: '500 11px/1 Manrope', color: light ? '#6b7570' : 'rgba(255,255,255,.42)' }}>
                  {p.kind === 'layout'
                    ? p.area + ' · ' + p.owner + ' · ' + sqftRange(p.sizeMin, p.sizeMax) + ' sqft'
                    : p.area + ' · ' + Math.round(p.sqft || 0).toLocaleString('en-IN') + ' sqft'}
                </div>
              </div>
              <div style={{ font: '700 13px/1 Manrope', color: band(p.ppsf).color }}>
                {p.kind === 'layout' ? kShort(p.ppsf) + '–' + kShort(p.ppsfMax) : ppsfLabel(p.ppsf)}
              </div>
            </div>
          ))}
          {noSuggestions && <div style={{ padding: '15px 16px', font: '500 13px/1 Manrope', color: light ? '#6b7570' : 'rgba(255,255,255,.45)' }}>No plots match that search yet.</div>}
        </div>
      )}
    </div>
  );
}
