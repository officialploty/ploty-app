import { CITIES } from '../data';

function chip(name, key, cur) {
  return {
    name,
    bg: cur === key ? 'rgba(53,224,192,.18)' : 'rgba(255,255,255,.06)',
    border: cur === key ? 'rgba(53,224,192,.45)' : 'rgba(255,255,255,.1)',
    color: cur === key ? '#35e0c0' : 'rgba(255,255,255,.62)',
  };
}

export function CityAreaKindRow({ pm, mapRef }) {
  const { city, area, cityMenu, areaMenu, setCityMenu, setAreaMenu, kindFilter, setKindFilter, goCity, goArea } = pm;

  const isLive = (p) => p.kind !== 'layout' || !p.status || p.status === 'approved';
  const cityOptions = Object.keys(CITIES).map((name) => ({
    name, count: pm.plots.filter((p) => p.city === name && isLive(p)).length,
    bg: name === city ? 'rgba(139,123,255,.22)' : 'transparent',
  }));

  const areaOptions = CITIES[city].areas.map((name) => ({ name, ...chip(name, name, area) }));

  const kindSegments = [
    { key: 'all', label: 'All' }, { key: 'plot', label: 'Individual' }, { key: 'layout', label: 'Developer' },
  ].map((o) => ({
    ...o,
    bg: kindFilter === o.key ? 'rgba(53,224,192,.9)' : 'transparent',
    color: kindFilter === o.key ? '#0d1018' : 'rgba(255,255,255,.6)',
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div onClick={() => { setCityMenu(!cityMenu); setAreaMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 34, padding: '0 13px', borderRadius: 99, background: 'rgba(23,26,44,.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,.13)', cursor: 'pointer' }}>
          <span style={{ font: '700 12.5px/1 Manrope', color: '#fff' }}>{city}</span>
          <Caret />
        </div>
        <div onClick={() => { setAreaMenu(!areaMenu); setCityMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 34, padding: '0 13px', borderRadius: 99, background: 'rgba(23,26,44,.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,.13)', cursor: 'pointer' }}>
          <span style={{ font: '700 12.5px/1 Manrope', color: area === 'All areas' ? '#fff' : '#35e0c0' }}>{area}</span>
          <Caret />
        </div>
        <div style={{ flex: 1 }} />
        <div onClick={() => mapRef.current && mapRef.current.flyTo(CITIES[city].center, CITIES[city].zoom)} style={{ width: 34, height: 34, borderRadius: 99, background: 'rgba(23,26,44,.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,.13)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <div style={{ width: 13, height: 13, border: '2px solid #8b7bff', borderRadius: 99, position: 'relative' }}>
            <div style={{ position: 'absolute', left: -5, top: 5, width: 3, height: 1.5, background: '#8b7bff' }} />
            <div style={{ position: 'absolute', right: -5, top: 5, width: 3, height: 1.5, background: '#8b7bff' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', padding: 3, borderRadius: 99, background: 'rgba(23,26,44,.72)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,.13)', alignSelf: 'flex-start', boxShadow: '0 12px 30px -14px rgba(0,0,0,.75)' }}>
        {kindSegments.map((k) => (
          <div key={k.key} onClick={() => setKindFilter(k.key)} style={{ padding: '7px 14px', borderRadius: 99, background: k.bg, cursor: 'pointer' }}>
            <span style={{ font: '700 11.5px/1 Manrope', color: k.color, letterSpacing: '.02em' }}>{k.label}</span>
          </div>
        ))}
      </div>

      {cityMenu && (
        <div style={{ borderRadius: 18, padding: 6, background: 'rgba(23,26,44,.88)', backdropFilter: 'blur(26px)', border: '1px solid rgba(255,255,255,.12)', boxShadow: '0 20px 44px -14px rgba(0,0,0,.8)', animation: 'pmSlide .16s ease', display: 'flex', flexDirection: 'column' }}>
          {cityOptions.map((c) => (
            <div key={c.name} onClick={() => goCity(c.name, (cfg) => mapRef.current && mapRef.current.flyTo(cfg.center, cfg.zoom))} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 12px', borderRadius: 13, background: c.bg, cursor: 'pointer' }}>
              <span style={{ font: '600 13.5px/1 Manrope', color: '#fff' }}>{c.name}</span>
              <span style={{ font: '600 11px/1 Manrope', color: 'rgba(255,255,255,.4)' }}>{c.count} plots</span>
            </div>
          ))}
        </div>
      )}

      {areaMenu && (
        <div style={{ borderRadius: 18, padding: 10, background: 'rgba(23,26,44,.88)', backdropFilter: 'blur(26px)', border: '1px solid rgba(255,255,255,.12)', boxShadow: '0 20px 44px -14px rgba(0,0,0,.8)', animation: 'pmSlide .16s ease', display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {areaOptions.map((a) => (
            <div
              key={a.name}
              onClick={() => goArea(a.name, (name) => {
                const map = mapRef.current;
                if (!map) return;
                const pts = pm.plots.filter((p) => p.city === city && (name === 'All areas' || p.area === name)).map((p) => [p.lat, p.lng]);
                if (name === 'All areas') map.flyTo(CITIES[city].center, CITIES[city].zoom);
                else if (pts.length) map.flyToBounds(pts);
              })}
              style={{ padding: '8px 12px', borderRadius: 99, background: a.bg, border: '1px solid ' + a.border, font: '600 12px/1 Manrope', color: a.color, cursor: 'pointer' }}
            >
              {a.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Caret() {
  return <span style={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '5px solid rgba(255,255,255,.55)' }} />;
}

export function priceChip(name, key, cur) { return chip(name, key, cur); }
