import { AMENITIES, CITIES } from '../data';
import { inr, ppsfLabel, kShort, num } from '../utils';

const label = { font: '700 11px/1 Manrope', color: 'rgba(255,255,255,.45)', letterSpacing: '.12em' };
const fieldStyle = { height: 52, padding: '0 16px', borderRadius: 16, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', outline: 0, font: '600 15px/1 Manrope', color: '#fff' };

export default function AddForm({ pm, onBackToPlacing }) {
  const { form, setForm, pin, city, derivedPpsf, derivedTotal, fb, canPublish, publishing, publish, cancelAdd, onFiles, auth, backToKind } = pm;
  const f = form;
  const areaOptions = CITIES[city].areas.filter((a) => a !== 'All areas');

  return (
    <div style={{ padding: '8px 20px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ font: '800 12px/1 Manrope', color: '#8b7bff', letterSpacing: '.16em' }}>STEP 3 OF 3</div>
          <div style={{ font: '800 22px/1.1 Manrope', color: '#fff', letterSpacing: '-.02em' }}>{f.kind === 'layout' ? 'Layout details' : 'Plot details'}</div>
        </div>
        <div onClick={cancelAdd} style={{ width: 32, height: 32, borderRadius: 99, background: 'rgba(255,255,255,.09)', color: 'rgba(255,255,255,.7)', font: '600 16px/32px Manrope', textAlign: 'center', cursor: 'pointer', flex: 'none' }}>×</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 16, background: 'rgba(53,224,192,.1)', border: '1px solid rgba(53,224,192,.26)' }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: '#35e0c0', flex: 'none' }} />
        <span style={{ font: '600 11.5px/1.4 ui-monospace,Menlo,monospace', color: '#8ef0dd' }}>{pin ? pin[0].toFixed(5) + ', ' + pin[1].toFixed(5) : ''}</span>
        <div style={{ flex: 1 }} />
        <span onClick={onBackToPlacing} style={{ font: '700 11.5px/1 Manrope', color: '#35e0c0', cursor: 'pointer' }}>Edit pin</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 14, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)' }}>
        <span style={{ font: '600 11px/1 Manrope', color: 'rgba(255,255,255,.4)', letterSpacing: '.06em' }}>
          {f.kind === 'layout' ? 'LISTING TYPE — LAYOUT' : 'LISTING AS INDIVIDUAL —'}
        </span>
        {f.kind === 'plot' && auth && <span style={{ font: '700 12px/1 Manrope', color: '#fff' }}>{auth.name}</span>}
        <div style={{ flex: 1 }} />
        <span onClick={backToKind} style={{ font: '700 11.5px/1 Manrope', color: '#35e0c0', cursor: 'pointer' }}>Change</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={label}>{f.kind === 'layout' ? 'LAYOUT / PROJECT NAME' : 'LOCALITY / AREA NAME'}</div>
        <input
          value={f.locality} onChange={(e) => setForm('locality', e.target.value)}
          placeholder={f.kind === 'layout' ? 'e.g. Thalambur Greenfields' : 'e.g. Kelambakkam, OMR'}
          style={fieldStyle}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={label}>AREA</div>
        <select
          value={f.area} onChange={(e) => setForm('area', e.target.value)}
          style={{ ...fieldStyle, appearance: 'auto' }}
        >
          <option value="" disabled>Select the area this pin is actually in</option>
          {areaOptions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={label}>PHOTOS &amp; VIDEO</div>
          <div style={{ font: '600 11px/1 Manrope', color: 'rgba(255,255,255,.32)' }}>{f.media.length ? f.media.length + ' added' : 'optional, up to 8'}</div>
        </div>
        <div className="pmScroll" style={{ display: 'flex', gap: 9, overflowX: 'auto', paddingBottom: 2 }}>
          <label style={{ flex: 'none', width: 96, height: 96, borderRadius: 16, border: '1.5px dashed rgba(53,224,192,.5)', background: 'rgba(53,224,192,.07)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer' }}>
            <div style={{ position: 'relative', width: 18, height: 18 }}>
              <div style={{ position: 'absolute', top: 8, left: 0, width: 18, height: 2.2, borderRadius: 2, background: '#35e0c0' }} />
              <div style={{ position: 'absolute', left: 8, top: 0, height: 18, width: 2.2, borderRadius: 2, background: '#35e0c0' }} />
            </div>
            <span style={{ font: '700 10px/1 Manrope', color: '#35e0c0', letterSpacing: '.08em' }}>UPLOAD</span>
            <input type="file" multiple accept="image/*,video/*" onChange={(e) => { onFiles(Array.from(e.target.files || [])); e.target.value = ''; }} style={{ display: 'none' }} />
          </label>
          {f.media.map((m, i) => (
            <div key={i} style={{ flex: 'none', width: 96, height: 96, borderRadius: 16, overflow: 'hidden', position: 'relative', background: m.url ? 'url("' + m.url + '") center/cover, ' + m.bg : m.bg, border: '1px solid rgba(255,255,255,.12)' }}>
              <div onClick={() => setForm('media', f.media.filter((_, k) => k !== i))} style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 99, background: 'rgba(10,11,18,.72)', color: '#fff', font: '600 13px/22px Manrope', textAlign: 'center', cursor: 'pointer' }}>×</div>
              <div style={{ position: 'absolute', left: 7, bottom: 7, padding: '3px 6px', borderRadius: 6, background: 'rgba(10,11,18,.68)', font: '700 9px/1 Manrope', color: '#fff', letterSpacing: '.1em' }}>{m.type === 'video' ? 'VIDEO' : 'PHOTO'}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={label}>AMENITIES</div>
          <div style={{ font: '600 11px/1 Manrope', color: 'rgba(255,255,255,.32)' }}>{f.amenities.length ? f.amenities.length + ' selected' : 'optional'}</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {AMENITIES.map((a) => {
            const on = f.amenities.includes(a);
            return (
              <div
                key={a}
                onClick={() => setForm('amenities', on ? f.amenities.filter((x) => x !== a) : f.amenities.concat(a))}
                style={{
                  padding: '9px 13px', borderRadius: 12, cursor: 'pointer',
                  background: on ? 'linear-gradient(110deg,rgba(53,224,192,.9),rgba(139,123,255,.85))' : 'rgba(255,255,255,.06)',
                  border: '1px solid ' + (on ? 'transparent' : 'rgba(255,255,255,.12)'),
                  font: '700 12px/1 Manrope', color: on ? '#0d1018' : 'rgba(255,255,255,.6)',
                }}
              >
                {a}
              </div>
            );
          })}
        </div>
      </div>

      {f.kind === 'plot' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={label}>PRICING</div>
            <div style={{ display: 'flex', padding: 4, borderRadius: 16, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
              <div onClick={() => setForm('priceMode', 'ppsf')} style={{ flex: 1, height: 40, borderRadius: 12, background: f.priceMode === 'ppsf' ? 'linear-gradient(110deg,rgba(53,224,192,.9),rgba(139,123,255,.85))' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <span style={{ font: '700 12.5px/1 Manrope', color: f.priceMode === 'ppsf' ? '#0d1018' : 'rgba(255,255,255,.55)' }}>Price per sqft</span>
              </div>
              <div onClick={() => setForm('priceMode', 'total')} style={{ flex: 1, height: 40, borderRadius: 12, background: f.priceMode === 'total' ? 'linear-gradient(110deg,rgba(53,224,192,.9),rgba(139,123,255,.85))' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <span style={{ font: '700 12.5px/1 Manrope', color: f.priceMode === 'total' ? '#0d1018' : 'rgba(255,255,255,.55)' }}>Total price</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 56, padding: '0 16px', borderRadius: 16, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)' }}>
              <span style={{ font: '700 18px/1 Manrope', color: 'rgba(255,255,255,.4)' }}>₹</span>
              <input value={f.price} onChange={(e) => setForm('price', e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" inputMode="numeric" style={{ flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 0, font: '800 20px/1 Manrope', color: '#fff', letterSpacing: '-.02em' }} />
              <span style={{ font: '600 12px/1 Manrope', color: 'rgba(255,255,255,.35)' }}>{f.priceMode === 'ppsf' ? 'per sqft' : 'total'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={label}>PLOT SIZE (SQFT)</div>
            <input value={f.size} onChange={(e) => setForm('size', e.target.value.replace(/[^0-9]/g, ''))} placeholder="2400" inputMode="numeric" style={fieldStyle} />
          </div>

          <div style={{ padding: 16, borderRadius: 18, background: 'linear-gradient(120deg,rgba(53,224,192,.13),rgba(139,123,255,.13))', border: '1px solid rgba(255,255,255,.13)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ font: '600 10.5px/1 Manrope', color: 'rgba(255,255,255,.5)', letterSpacing: '.12em' }}>{f.priceMode === 'ppsf' ? 'TOTAL PRICE (CALCULATED)' : 'PRICE PER SQFT (CALCULATED)'}</span>
              <span style={{ font: '800 21px/1 Manrope', color: '#fff', letterSpacing: '-.02em' }}>{f.priceMode === 'ppsf' ? inr(derivedTotal) : (derivedPpsf > 0 ? ppsfLabel(derivedPpsf) + ' /sqft' : '—')}</span>
            </div>
            <div style={{ padding: '7px 11px', borderRadius: 10, background: derivedPpsf > 0 ? fb.bg : 'rgba(255,255,255,.08)', font: '800 10.5px/1 Manrope', color: derivedPpsf > 0 ? fb.color : 'rgba(255,255,255,.4)', letterSpacing: '.08em' }}>{derivedPpsf > 0 ? fb.label : 'NO PRICE YET'}</div>
          </div>
        </>
      )}

      {f.kind === 'layout' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={label}>COMPANY / DEVELOPER NAME</div>
            <input value={f.company} onChange={(e) => setForm('company', e.target.value)} placeholder="e.g. Casagrand Estates" style={fieldStyle} />
            <div style={{ font: '500 11px/1.4 Manrope', color: 'rgba(255,255,255,.35)' }}>Layouts are listed under the developer's name, not yours.</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={label}>NUMBER OF PLOTS</div>
            <input value={f.plots} onChange={(e) => setForm('plots', e.target.value.replace(/[^0-9]/g, ''))} placeholder="240" inputMode="numeric" style={{ ...fieldStyle, font: '700 16px/1 Manrope' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={label}>PLOT SIZES (SQFT)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input value={f.sizeMin} onChange={(e) => setForm('sizeMin', e.target.value.replace(/[^0-9]/g, ''))} placeholder="1200" inputMode="numeric" style={{ ...fieldStyle, flex: 1, minWidth: 0 }} />
              <span style={{ font: '700 13px/1 Manrope', color: 'rgba(255,255,255,.35)', flex: 'none' }}>to</span>
              <input value={f.sizeMax} onChange={(e) => setForm('sizeMax', e.target.value.replace(/[^0-9]/g, ''))} placeholder="2400" inputMode="numeric" style={{ ...fieldStyle, flex: 1, minWidth: 0 }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={label}>PRICE PER SQFT RANGE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input value={f.ppsfMin} onChange={(e) => setForm('ppsfMin', e.target.value.replace(/[^0-9]/g, ''))} placeholder="3100" inputMode="numeric" style={{ ...fieldStyle, flex: 1, minWidth: 0 }} />
              <span style={{ font: '700 13px/1 Manrope', color: 'rgba(255,255,255,.35)', flex: 'none' }}>to</span>
              <input value={f.ppsfMax} onChange={(e) => setForm('ppsfMax', e.target.value.replace(/[^0-9]/g, ''))} placeholder="4400" inputMode="numeric" style={{ ...fieldStyle, flex: 1, minWidth: 0 }} />
            </div>
          </div>
          <div style={{ padding: 16, borderRadius: 18, background: 'linear-gradient(120deg,rgba(53,224,192,.13),rgba(139,123,255,.13))', border: '1px solid rgba(255,255,255,.13)', display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ font: '600 10.5px/1 Manrope', color: 'rgba(255,255,255,.5)', letterSpacing: '.12em' }}>HOW BUYERS WILL SEE IT</span>
            <span style={{ font: '800 18px/1.2 Manrope', color: '#fff', letterSpacing: '-.02em' }}>{layoutSummary(f)}</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '13px 15px', borderRadius: 16, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)' }}>
            <span style={{ width: 16, height: 16, borderRadius: 99, border: '1.5px solid rgba(255,255,255,.4)', color: 'rgba(255,255,255,.6)', font: '800 9px/13px Manrope', textAlign: 'center', flex: 'none' }}>i</span>
            <span style={{ font: '500 12px/1.5 Manrope', color: 'rgba(255,255,255,.55)' }}>One pin covers the whole layout. Buyers see the price range and call your sales team — availability is handled off-app.</span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={label}>NOTES / DESCRIPTION</div>
        <textarea value={f.notes} onChange={(e) => setForm('notes', e.target.value)} placeholder="Approval status, road width, nearby landmarks…" style={{ height: 88, padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', outline: 0, font: '500 13.5px/1.5 Manrope', color: '#fff', resize: 'none' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={label}>CONTACT (OPTIONAL)</div>
        <input value={f.contact} onChange={(e) => setForm('contact', e.target.value)} placeholder="+91 90000 00000" inputMode="tel" style={fieldStyle} />
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '13px 15px', borderRadius: 16, background: 'rgba(245,180,60,.1)', border: '1px solid rgba(245,180,60,.28)' }}>
        <span style={{ width: 16, height: 16, borderRadius: 99, border: '1.5px solid #f5b43c', color: '#f5b43c', font: '800 10px/13px Manrope', textAlign: 'center', flex: 'none' }}>!</span>
        <span style={{ font: '500 12px/1.5 Manrope', color: '#f0cf9a' }}>This will be public and visible to everyone. Only post details you're allowed to share.</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 2 }}>
        <div onClick={canPublish && !publishing ? publish : undefined} style={{
          height: 58, borderRadius: 20, background: canPublish && !publishing ? 'linear-gradient(110deg,#8b7bff,#35e0c0)' : 'rgba(255,255,255,.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: canPublish && !publishing ? 'pointer' : 'default', boxShadow: '0 18px 36px -16px rgba(139,123,255,.7)',
        }}>
          <span style={{ font: '800 16px/1 Manrope', color: canPublish && !publishing ? '#0d1018' : 'rgba(255,255,255,.35)', letterSpacing: '-.01em' }}>{publishing ? 'Publishing…' : canPublish ? (f.kind === 'layout' ? 'Publish layout' : 'Publish plot') : 'Fill the required fields'}</span>
        </div>
        <div onClick={cancelAdd} style={{ height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <span style={{ font: '700 13.5px/1 Manrope', color: 'rgba(255,255,255,.42)' }}>Discard</span>
        </div>
      </div>
    </div>
  );
}

function layoutSummary(f) {
  const lo = num(f.ppsfMin), hi = num(f.ppsfMax) || lo, n = num(f.plots);
  if (!lo || !n) return '—';
  return n + ' plots · ' + kShort(lo) + (hi > lo ? '–' + kShort(hi) : '') + ' per sqft';
}
