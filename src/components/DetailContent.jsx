import { detailFields } from '../fields';
import MiniMap from '../MiniMap';

export default function DetailContent({ sel, saved, onToggleSave, onContact }) {
  const d = detailFields(sel);
  if (!d) return null;
  const isSaved = saved.includes(sel.id);

  return (
    <div style={{ padding: '6px 20px 42px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
          {d.isPlot && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
              <span style={{ font: '800 40px/1 Manrope', letterSpacing: '-.035em', color: d.color }}>{d.ppsf}</span>
              <span style={{ font: '700 13px/1 Manrope', color: 'rgba(255,255,255,.42)' }}>/ sqft</span>
            </div>
          )}
          {d.isLayout && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ font: '800 30px/1 Manrope', letterSpacing: '-.03em', color: d.color }}>{d.range}</span>
              <span style={{ font: '700 11px/1 Manrope', color: 'rgba(255,255,255,.42)', letterSpacing: '.1em' }}>PER SQFT RANGE</span>
            </div>
          )}
          <div style={{ font: '700 19px/1.2 Manrope', color: '#fff', letterSpacing: '-.02em' }}>{d.locality}</div>
          <div style={{ font: '500 12px/1 Manrope', color: 'rgba(255,255,255,.42)', letterSpacing: '.04em' }}>{d.cityLine}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flex: 'none' }}>
          <div style={{ padding: '7px 11px', borderRadius: 10, background: d.bandBg, font: '800 10px/1 Manrope', color: d.color, letterSpacing: '.1em' }}>{d.bandLabel}</div>
          <div onClick={onToggleSave} style={{
            width: 36, height: 36, borderRadius: 99,
            background: isSaved ? 'rgba(255,107,107,.2)' : 'rgba(255,255,255,.07)',
            border: '1px solid ' + (isSaved ? 'rgba(255,107,107,.5)' : 'rgba(255,255,255,.13)'),
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <span style={{ font: '700 15px/1 Manrope', color: isSaved ? '#ff6b6b' : 'rgba(255,255,255,.5)' }}>♥</span>
          </div>
        </div>
      </div>

      <div className="pmScroll" style={{ display: 'flex', gap: 9, overflowX: 'auto', paddingBottom: 2 }}>
        {d.media.map((m, i) => (
          <div key={i} style={{
            flex: 'none', width: 150, height: 104, borderRadius: 16, overflow: 'hidden', position: 'relative',
            background: m.bg, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid rgba(255,255,255,.1)',
          }}>
            {m.isVideo && (
              <div style={{
                position: 'absolute', left: '50%', top: '50%', margin: '-17px 0 0 -17px', width: 34, height: 34,
                borderRadius: 99, background: 'rgba(10,11,18,.6)', border: '1px solid rgba(255,255,255,.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ width: 0, height: 0, borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderLeft: '11px solid #fff', marginLeft: 3 }} />
              </div>
            )}
            <div style={{ position: 'absolute', left: 8, bottom: 8, padding: '4px 7px', borderRadius: 7, background: 'rgba(10,11,18,.66)', font: '700 9px/1 Manrope', color: '#fff', letterSpacing: '.1em' }}>{m.label}</div>
          </div>
        ))}
        {d.noMedia && (
          <div style={{ flex: 1, height: 88, borderRadius: 16, border: '1px dashed rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 11.5px/1 Manrope', color: 'rgba(255,255,255,.35)' }}>No photos uploaded for this plot</div>
        )}
      </div>

      {d.isLayout && (
        <>
          <div style={{ display: 'flex', gap: 9 }}>
            <StatBox label="PLOTS" value={d.plotCount} flex={1} />
            <StatBox label="PLOT SIZES" value={d.sizeRange} flex={1.35} />
            <StatBox label="MEDIA" value={d.mediaCount} flex={1} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 15px', borderRadius: 16, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)' }}>
            <span style={{ font: '600 9.5px/1 Manrope', color: 'rgba(255,255,255,.4)', letterSpacing: '.12em' }}>APPROVAL</span>
            <span style={{ font: '700 12px/1 Manrope', color: '#fff' }}>{d.approval}</span>
          </div>
        </>
      )}

      {d.isPlot && (
        <div style={{ display: 'flex', gap: 9 }}>
          <StatBox label="PLOT SIZE" value={d.size} flex={1} />
          <StatBox label="TOTAL" value={d.total} flex={1} />
          <StatBox label="MEDIA" value={d.mediaCount} flex={1} />
        </div>
      )}

      {d.amenities.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <div style={{ font: '700 11px/1 Manrope', color: 'rgba(255,255,255,.45)', letterSpacing: '.12em' }}>AMENITIES</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {d.amenities.map((a) => (
              <div key={a} style={{ padding: '7px 12px', borderRadius: 10, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', font: '600 11.5px/1 Manrope', color: 'rgba(255,255,255,.72)' }}>
                {a}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div style={{ font: '700 11px/1 Manrope', color: 'rgba(255,255,255,.45)', letterSpacing: '.12em' }}>NOTES</div>
        <div style={{ font: '400 13.5px/1.6 Manrope', color: 'rgba(255,255,255,.72)' }}>{d.notes}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', borderRadius: 16, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)' }}>
        <MiniMap lat={sel.lat} lng={sel.lng} ppsf={sel.ppsf} style={{ width: 74, height: 74, borderRadius: 12, overflow: 'hidden', flex: 'none' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
          <span style={{ font: '600 10px/1 Manrope', color: 'rgba(255,255,255,.4)', letterSpacing: '.12em' }}>EXACT LOCATION</span>
          <span style={{ font: '600 12px/1.4 ui-monospace,Menlo,monospace', color: 'rgba(255,255,255,.75)' }}>{d.coords}</span>
          <span style={{ font: '500 11.5px/1 Manrope', color: '#8b7bff' }}>{d.landmark}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 14, background: d.trustBg, border: '1px solid ' + d.trustBorder }}>
        <span style={{ width: 16, height: 16, borderRadius: 99, border: '1.5px solid ' + d.trustMark, color: d.trustColor, font: '800 9px/13px Manrope', textAlign: 'center', flex: 'none' }}>i</span>
        <span style={{ font: '600 11.5px/1.45 Manrope', color: d.trustColor }}>{d.trustText}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ font: '600 10px/1 Manrope', color: 'rgba(255,255,255,.4)', letterSpacing: '.12em' }}>{d.ownerLabel}</span>
            <span style={{ font: '700 13.5px/1 Manrope', color: '#fff' }}>{d.owner}</span>
          </div>
          <span style={{ font: '500 11.5px/1 Manrope', color: 'rgba(255,255,255,.35)' }}>{d.age}</span>
        </div>
        <div style={{ display: 'flex', gap: 9 }}>
          <div onClick={onContact} style={{
            flex: 1, height: 54, borderRadius: 18, background: 'linear-gradient(110deg,#35e0c0,#8b7bff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 16px 32px -14px rgba(53,224,192,.6)',
          }}>
            <span style={{ font: '800 15px/1 Manrope', color: '#0d1018', letterSpacing: '-.01em' }}>{d.contactLabel}</span>
          </div>
          <div onClick={onContact} style={{
            width: 54, height: 54, borderRadius: 18, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.13)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <span style={{ font: '700 17px/1 Manrope', color: '#35e0c0' }}>☎</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, flex }) {
  return (
    <div style={{ flex, padding: 14, borderRadius: 16, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ font: '600 9.5px/1 Manrope', color: 'rgba(255,255,255,.4)', letterSpacing: '.12em' }}>{label}</span>
      <span style={{ font: '700 13.5px/1 Manrope', color: '#fff', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}
