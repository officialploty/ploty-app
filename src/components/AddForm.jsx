import { AMENITIES, CITIES } from '../data';
import { inr, ppsfLabel, kShort, num } from '../utils';

const label = { font: '700 11px/1 Manrope', color: '#6b7570', letterSpacing: '.12em' };
const fieldStyle = { height: 52, padding: '0 16px', borderRadius: 16, background: '#f6f9f7', border: '1px solid #e5e9e6', outline: 0, font: '600 15px/1 Manrope', color: '#1a1e1c' };

export default function AddForm({ pm, onBackToPlacing }) {
  const { form, setForm, pin, city, derivedPpsf, derivedTotal, fb, canPublish, publishing, publish, cancelAdd, onFiles, auth, backToKind, editingId } = pm;
  const f = form;
  const isEditing = !!editingId;
  const areaOptions = CITIES[city].areas.filter((a) => a !== 'All areas');

  return (
    <div style={{ padding: '8px 20px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ font: '800 12px/1 Manrope', color: '#8355c9', letterSpacing: '.16em' }}>{isEditing ? 'EDITING' : 'STEP 3 OF 3'}</div>
          <div style={{ font: '800 22px/1.1 Manrope', color: '#1a1e1c', letterSpacing: '-.02em' }}>{f.kind === 'layout' ? 'Layout details' : 'Plot details'}</div>
        </div>
        <div onClick={cancelAdd} style={{ width: 32, height: 32, borderRadius: 99, background: '#eef1ef', color: '#495650', font: '600 16px/32px Manrope', textAlign: 'center', cursor: 'pointer', flex: 'none' }}>×</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 16, background: '#e5f5ec', border: '1px solid #a8dcbf' }}>
        <span style={{ width: 8, height: 8, borderRadius: 99, background: '#1f9d64', flex: 'none' }} />
        <span style={{ font: '600 11.5px/1.4 ui-monospace,Menlo,monospace', color: '#146b41' }}>{pin ? pin[0].toFixed(5) + ', ' + pin[1].toFixed(5) : ''}</span>
        <div style={{ flex: 1 }} />
        <span onClick={onBackToPlacing} style={{ font: '700 11.5px/1 Manrope', color: '#1f9d64', cursor: 'pointer' }}>Edit pin</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 14, background: '#f6f9f7', border: '1px solid #eef1ef' }}>
        <span style={{ font: '600 11px/1 Manrope', color: '#6b7570', letterSpacing: '.06em' }}>
          {f.kind === 'layout' ? 'LISTING TYPE — LAYOUT' : 'LISTING AS INDIVIDUAL —'}
        </span>
        {f.kind === 'plot' && auth && <span style={{ font: '700 12px/1 Manrope', color: '#1a1e1c' }}>{auth.name}</span>}
        <div style={{ flex: 1 }} />
        {!isEditing && <span onClick={backToKind} style={{ font: '700 11.5px/1 Manrope', color: '#1f9d64', cursor: 'pointer' }}>Change</span>}
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
          <div style={label}>{isEditing ? 'ADD MORE PHOTOS & VIDEO' : 'PHOTOS & VIDEO'}</div>
          <div style={{ font: '600 11px/1 Manrope', color: '#8a958f' }}>{f.media.length ? f.media.length + ' added' : 'optional, up to 8'}</div>
        </div>
        {isEditing && <div style={{ font: '500 11.5px/1.5 Manrope', color: '#6b7570', marginTop: -4 }}>These are added on top of your existing photos, not a replacement for them.</div>}
        <div className="pmScroll" style={{ display: 'flex', gap: 9, overflowX: 'auto', paddingBottom: 2 }}>
          <label style={{ flex: 'none', width: 96, height: 96, borderRadius: 16, border: '1.5px dashed #a8dcbf', background: '#e5f5ec', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7, cursor: 'pointer' }}>
            <div style={{ position: 'relative', width: 18, height: 18 }}>
              <div style={{ position: 'absolute', top: 8, left: 0, width: 18, height: 2.2, borderRadius: 2, background: '#1f9d64' }} />
              <div style={{ position: 'absolute', left: 8, top: 0, height: 18, width: 2.2, borderRadius: 2, background: '#1f9d64' }} />
            </div>
            <span style={{ font: '700 10px/1 Manrope', color: '#1f9d64', letterSpacing: '.08em' }}>UPLOAD</span>
            <input type="file" multiple accept="image/*,video/*" onChange={(e) => { onFiles(Array.from(e.target.files || [])); e.target.value = ''; }} style={{ display: 'none' }} />
          </label>
          {f.media.map((m, i) => (
            <div key={i} style={{ flex: 'none', width: 96, height: 96, borderRadius: 16, overflow: 'hidden', position: 'relative', background: m.url ? 'url("' + m.url + '") center/cover, ' + m.bg : m.bg, border: '1px solid #e5e9e6' }}>
              <div onClick={() => setForm('media', f.media.filter((_, k) => k !== i))} style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 99, background: 'rgba(20,24,22,.68)', color: '#fff', font: '600 13px/22px Manrope', textAlign: 'center', cursor: 'pointer' }}>×</div>
              <div style={{ position: 'absolute', left: 7, bottom: 7, padding: '3px 6px', borderRadius: 6, background: 'rgba(20,24,22,.68)', font: '700 9px/1 Manrope', color: '#fff', letterSpacing: '.1em' }}>{m.type === 'video' ? 'VIDEO' : 'PHOTO'}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={label}>AMENITIES</div>
          <div style={{ font: '600 11px/1 Manrope', color: '#8a958f' }}>{f.amenities.length ? f.amenities.length + ' selected' : 'optional'}</div>
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
                  background: on ? 'linear-gradient(110deg,#1f9d64,#8355c9)' : '#f6f9f7',
                  border: '1px solid ' + (on ? 'transparent' : '#e5e9e6'),
                  font: '700 12px/1 Manrope', color: on ? '#ffffff' : '#495650',
                }}
              >
                {a}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={label}>LEGAL APPROVAL <span style={{ color: '#d64545' }}>*</span></div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ font: '600 10.5px/1 Manrope', color: '#8a958f', letterSpacing: '.06em' }}>PLANNING APPROVAL — DTCP OR CMDA</div>
          <div style={{ display: 'flex', padding: 4, borderRadius: 16, background: '#f6f9f7', border: '1px solid #e5e9e6' }}>
            {[['dtcp', 'DTCP'], ['cmda', 'CMDA'], ['none', 'None']].map(([val, lbl]) => (
              <div
                key={val}
                onClick={() => setForm('planningApproval', val)}
                style={{
                  flex: 1, minHeight: 40, borderRadius: 12, cursor: 'pointer',
                  background: f.planningApproval === val ? 'linear-gradient(110deg,#1f9d64,#8355c9)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 4px',
                }}
              >
                <span style={{ font: '700 12.5px/1 Manrope', color: f.planningApproval === val ? '#ffffff' : '#495650' }}>{lbl}</span>
              </div>
            ))}
          </div>
          {(f.planningApproval === 'dtcp' || f.planningApproval === 'cmda') && (
            <input
              value={f.planningApprovalNumber} onChange={(e) => setForm('planningApprovalNumber', e.target.value)}
              placeholder={(f.planningApproval === 'dtcp' ? 'DTCP' : 'CMDA') + ' approval number (required)'} style={fieldStyle}
            />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ font: '600 10.5px/1 Manrope', color: '#8a958f', letterSpacing: '.06em' }}>RERA STATUS</div>
          <div style={{ display: 'flex', padding: 4, borderRadius: 16, background: '#f6f9f7', border: '1px solid #e5e9e6' }}>
            {[['registered', 'Registered'], ['exempted', 'Exempted'], ['not_registered', 'Not Registered']].map(([val, lbl]) => (
              <div
                key={val}
                onClick={() => setForm('reraStatus', val)}
                style={{
                  flex: 1, minHeight: 40, borderRadius: 12, cursor: 'pointer',
                  background: f.reraStatus === val ? 'linear-gradient(110deg,#1f9d64,#8355c9)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 4px', textAlign: 'center',
                }}
              >
                <span style={{ font: '700 10.5px/1.2 Manrope', color: f.reraStatus === val ? '#ffffff' : '#495650' }}>{lbl}</span>
              </div>
            ))}
          </div>
          {f.reraStatus === 'registered' && (
            <input
              value={f.reraNumber} onChange={(e) => setForm('reraNumber', e.target.value)}
              placeholder="RERA number (required)" style={fieldStyle}
            />
          )}
        </div>
      </div>

      {f.kind === 'plot' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={label}>PRICING</div>
            <div style={{ display: 'flex', padding: 4, borderRadius: 16, background: '#f6f9f7', border: '1px solid #e5e9e6' }}>
              <div onClick={() => setForm('priceMode', 'ppsf')} style={{ flex: 1, height: 40, borderRadius: 12, background: f.priceMode === 'ppsf' ? 'linear-gradient(110deg,#1f9d64,#8355c9)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <span style={{ font: '700 12.5px/1 Manrope', color: f.priceMode === 'ppsf' ? '#ffffff' : '#495650' }}>Price per sqft</span>
              </div>
              <div onClick={() => setForm('priceMode', 'total')} style={{ flex: 1, height: 40, borderRadius: 12, background: f.priceMode === 'total' ? 'linear-gradient(110deg,#1f9d64,#8355c9)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <span style={{ font: '700 12.5px/1 Manrope', color: f.priceMode === 'total' ? '#ffffff' : '#495650' }}>Total price</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 56, padding: '0 16px', borderRadius: 16, background: '#f6f9f7', border: '1px solid #e5e9e6' }}>
              <span style={{ font: '700 18px/1 Manrope', color: '#6b7570' }}>₹</span>
              <input value={f.price} onChange={(e) => setForm('price', e.target.value.replace(/[^0-9]/g, ''))} placeholder="0" inputMode="numeric" style={{ flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 0, font: '800 20px/1 Manrope', color: '#1a1e1c', letterSpacing: '-.02em' }} />
              <span style={{ font: '600 12px/1 Manrope', color: '#8a958f' }}>{f.priceMode === 'ppsf' ? 'per sqft' : 'total'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={label}>PLOT SIZE (SQFT)</div>
            <input value={f.size} onChange={(e) => setForm('size', e.target.value.replace(/[^0-9]/g, ''))} placeholder="2400" inputMode="numeric" style={fieldStyle} />
          </div>

          <div style={{ padding: 16, borderRadius: 18, background: 'linear-gradient(120deg,#e5f5ec,#f1ecfa)', border: '1px solid #e5e9e6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ font: '600 10.5px/1 Manrope', color: '#6b7570', letterSpacing: '.12em' }}>{f.priceMode === 'ppsf' ? 'TOTAL PRICE (CALCULATED)' : 'PRICE PER SQFT (CALCULATED)'}</span>
              <span style={{ font: '800 21px/1 Manrope', color: '#1a1e1c', letterSpacing: '-.02em' }}>{f.priceMode === 'ppsf' ? inr(derivedTotal) : (derivedPpsf > 0 ? ppsfLabel(derivedPpsf) + ' /sqft' : '—')}</span>
            </div>
            <div style={{ padding: '7px 11px', borderRadius: 10, background: derivedPpsf > 0 ? fb.bg : '#eef1ef', font: '800 10.5px/1 Manrope', color: derivedPpsf > 0 ? fb.color : '#6b7570', letterSpacing: '.08em' }}>{derivedPpsf > 0 ? fb.label : 'NO PRICE YET'}</div>
          </div>
        </>
      )}

      {f.kind === 'layout' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={label}>COMPANY / DEVELOPER NAME</div>
            <input value={f.company} onChange={(e) => setForm('company', e.target.value)} placeholder="e.g. Casagrand Estates" style={fieldStyle} />
            <div style={{ font: '500 11px/1.4 Manrope', color: '#8a958f' }}>Layouts are listed under the developer's name, not yours.</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={label}>NUMBER OF PLOTS</div>
            <input value={f.plots} onChange={(e) => setForm('plots', e.target.value.replace(/[^0-9]/g, ''))} placeholder="240" inputMode="numeric" style={{ ...fieldStyle, font: '700 16px/1 Manrope' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={label}>PLOT SIZES (SQFT)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input value={f.sizeMin} onChange={(e) => setForm('sizeMin', e.target.value.replace(/[^0-9]/g, ''))} placeholder="1200" inputMode="numeric" style={{ ...fieldStyle, flex: 1, minWidth: 0 }} />
              <span style={{ font: '700 13px/1 Manrope', color: '#8a958f', flex: 'none' }}>to</span>
              <input value={f.sizeMax} onChange={(e) => setForm('sizeMax', e.target.value.replace(/[^0-9]/g, ''))} placeholder="2400" inputMode="numeric" style={{ ...fieldStyle, flex: 1, minWidth: 0 }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={label}>PRICE PER SQFT RANGE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input value={f.ppsfMin} onChange={(e) => setForm('ppsfMin', e.target.value.replace(/[^0-9]/g, ''))} placeholder="3100" inputMode="numeric" style={{ ...fieldStyle, flex: 1, minWidth: 0 }} />
              <span style={{ font: '700 13px/1 Manrope', color: '#8a958f', flex: 'none' }}>to</span>
              <input value={f.ppsfMax} onChange={(e) => setForm('ppsfMax', e.target.value.replace(/[^0-9]/g, ''))} placeholder="4400" inputMode="numeric" style={{ ...fieldStyle, flex: 1, minWidth: 0 }} />
            </div>
          </div>
          <div style={{ padding: 16, borderRadius: 18, background: 'linear-gradient(120deg,#e5f5ec,#f1ecfa)', border: '1px solid #e5e9e6', display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ font: '600 10.5px/1 Manrope', color: '#6b7570', letterSpacing: '.12em' }}>HOW BUYERS WILL SEE IT</span>
            <span style={{ font: '800 18px/1.2 Manrope', color: '#1a1e1c', letterSpacing: '-.02em' }}>{layoutSummary(f)}</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '13px 15px', borderRadius: 16, background: '#f6f9f7', border: '1px solid #e5e9e6' }}>
            <span style={{ width: 16, height: 16, borderRadius: 99, border: '1.5px solid #6b7570', color: '#495650', font: '800 9px/13px Manrope', textAlign: 'center', flex: 'none' }}>i</span>
            <span style={{ font: '500 12px/1.5 Manrope', color: '#495650' }}>One pin covers the whole layout. Buyers see the price range and call your sales team — availability is handled off-app.</span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={label}>NOTES / DESCRIPTION</div>
        <textarea value={f.notes} onChange={(e) => setForm('notes', e.target.value)} placeholder="Approval status, road width, nearby landmarks…" style={{ height: 88, padding: '14px 16px', borderRadius: 16, background: '#f6f9f7', border: '1px solid #e5e9e6', outline: 0, font: '500 13.5px/1.5 Manrope', color: '#1a1e1c', resize: 'none' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={label}>CONTACT (OPTIONAL)</div>
        <input value={f.contact} onChange={(e) => setForm('contact', e.target.value)} placeholder="+91 90000 00000" inputMode="tel" style={fieldStyle} />
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '13px 15px', borderRadius: 16, background: '#fdf3e2', border: '1px solid #f0d9a8' }}>
        <span style={{ width: 16, height: 16, borderRadius: 99, border: '1.5px solid #d98a1f', color: '#d98a1f', font: '800 10px/13px Manrope', textAlign: 'center', flex: 'none' }}>!</span>
        <span style={{ font: '500 12px/1.5 Manrope', color: '#8a651c' }}>This will be public and visible to everyone. Only post details you're allowed to share.</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 2 }}>
        <div onClick={canPublish && !publishing ? publish : undefined} style={{
          height: 58, borderRadius: 20, background: canPublish && !publishing ? '#1f9d64' : '#eef1ef',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: canPublish && !publishing ? 'pointer' : 'default', boxShadow: canPublish && !publishing ? '0 18px 36px -16px rgba(31,157,100,.55)' : 'none',
        }}>
          <span style={{ font: '800 16px/1 Manrope', color: canPublish && !publishing ? '#ffffff' : '#8a958f', letterSpacing: '-.01em' }}>
            {publishing ? (isEditing ? 'Saving…' : 'Publishing…') : canPublish ? (isEditing ? 'Save changes' : (f.kind === 'layout' ? 'Publish layout' : 'Publish plot')) : 'Fill the required fields'}
          </span>
        </div>
        <div onClick={cancelAdd} style={{ height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <span style={{ font: '700 13.5px/1 Manrope', color: '#8a958f' }}>{isEditing ? 'Cancel' : 'Discard'}</span>
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
