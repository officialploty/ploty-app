import { useRef } from 'react';
import MapView from './MapView';
import SearchBar from './components/SearchBar';
import { CityAreaKindRow } from './components/Filters';
import ListPanel from './components/ListPanel';
import AddForm from './components/AddForm';
import KindChoice from './components/KindChoice';
import DetailContent from './components/DetailContent';
import SavedPanel from './components/SavedPanel';
import ProfilePanel from './components/ProfilePanel';
import ReviewPanel from './components/ReviewPanel';
import AuthPromptContent from './components/AuthPromptContent';
import { NearbyWarning, PinControls } from './components/PlacingControls';

export default function DesktopLayout({ pm }) {
  const mapRef = useRef(null);

  const crosshairOn = pm.placing && !pm.pin;
  const ly = pm.visible.filter((p) => p.kind === 'layout').length;
  const si = pm.visible.length - ly;
  const nearbyLabel = si + (si === 1 ? ' plot' : ' plots') + (ly ? ' · ' + ly + (ly === 1 ? ' layout' : ' layouts') : '') + ' nearby';
  const browsing = pm.tab !== 'saved' && pm.tab !== 'profile' && pm.tab !== 'review';
  const initials = pm.auth ? (pm.auth.name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?') : null;

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', background: '#0a0b12' }}>
      <div className="pmScroll" style={{ width: 440, flex: 'none', borderRight: '1px solid rgba(255,255,255,.08)', display: 'flex', flexDirection: 'column', overflowY: 'auto', background: 'linear-gradient(180deg,#14162a,#0a0b12)' }}>
        <div style={{ padding: '22px 20px 14px', display: 'flex', flexDirection: 'column', gap: 16, borderBottom: '1px solid rgba(255,255,255,.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div
              onClick={() => { pm.setTab('map'); pm.closeDetail(); }}
              style={{ font: '800 13px/1 Manrope', letterSpacing: '.22em', color: '#35e0c0', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              Ploty
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <NavIconButton active={pm.tab === 'saved'} onClick={() => { pm.setTab('saved'); pm.closeDetail(); }} label="Saved plots">♥</NavIconButton>
              <NavIconButton active={pm.tab === 'profile'} onClick={() => { pm.setTab('profile'); pm.closeDetail(); }} label="Your account">
                {initials || <span style={{ width: 15, height: 15, borderRadius: 99, border: '2px solid currentColor', display: 'block' }} />}
              </NavIconButton>
              <div onClick={pm.startAdd} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 16px', borderRadius: 12, background: 'linear-gradient(130deg,#35e0c0,#8b7bff)', cursor: 'pointer', boxShadow: '0 10px 22px -10px rgba(53,224,192,.7)' }}>
                <span style={{ font: '800 13px/1 Manrope', color: '#0d1018' }}>+ Register a plot</span>
              </div>
            </div>
          </div>
          {browsing && (
            <>
              <SearchBar pm={pm} />
              <CityAreaKindRow pm={pm} mapRef={mapRef} />
            </>
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {pm.placing && (
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ padding: '15px 17px', borderRadius: 20, background: 'rgba(23,26,44,.8)', border: '1px solid rgba(53,224,192,.32)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ font: '800 12px/1 Manrope', color: '#35e0c0', letterSpacing: '.16em' }}>STEP 1 OF 3</div>
                  <div onClick={pm.cancelAdd} style={{ font: '700 12px/1 Manrope', color: 'rgba(255,255,255,.5)', cursor: 'pointer' }}>Cancel</div>
                </div>
                <div style={{ font: '700 16px/1.3 Manrope', color: '#fff', letterSpacing: '-.01em' }}>Click the map to place your plot</div>
                <div style={{ font: '400 12px/1.5 Manrope', color: 'rgba(255,255,255,.5)' }}>Pan and zoom to the exact spot, then drop the pin.</div>
              </div>
              <NearbyWarning pm={pm} />
              <PinControls pm={pm} />
            </div>
          )}

          {pm.choosingKind && <KindChoice pm={pm} />}

          {pm.formOpen && <AddForm pm={pm} onBackToPlacing={pm.backToPlacing} />}

          {pm.detailOpen && !pm.placing && !pm.formOpen && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div onClick={pm.closeDetail} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px 0', cursor: 'pointer' }}>
                <span style={{ font: '700 12px/1 Manrope', color: '#35e0c0' }}>← Back to list</span>
              </div>
              <DetailContent sel={pm.sel} saved={pm.saved} onToggleSave={pm.toggleSave} onContact={pm.contact} />
            </div>
          )}

          {!pm.placing && !pm.choosingKind && !pm.formOpen && !pm.detailOpen && pm.tab === 'saved' && <SavedPanel pm={pm} />}
          {!pm.placing && !pm.choosingKind && !pm.formOpen && !pm.detailOpen && pm.tab === 'profile' && <ProfilePanel pm={pm} />}
          {!pm.placing && !pm.choosingKind && !pm.formOpen && !pm.detailOpen && pm.tab === 'review' && (
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
              <div onClick={() => pm.setTab('profile')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px 0', cursor: 'pointer' }}>
                <span style={{ font: '700 12px/1 Manrope', color: '#35e0c0' }}>← Back to profile</span>
              </div>
              <ReviewPanel pm={pm} />
            </div>
          )}
          {!pm.placing && !pm.choosingKind && !pm.formOpen && !pm.detailOpen && browsing && <ListPanel pm={pm} />}
        </div>
      </div>

      <div style={{ position: 'relative', flex: 1, background: '#12141f', isolation: 'isolate' }}>
        <MapView
          ref={mapRef}
          visible={pm.visible}
          selected={pm.sel && pm.sel.id}
          pin={pm.pin}
          mode={pm.mode}
          onMarkerClick={(id) => pm.open(id, (p) => mapRef.current && mapRef.current.flyTo([p.lat, p.lng], 13.5))}
          onMapClick={(lat, lng) => { if (pm.mode === 'placing') pm.setPin([lat, lng]); }}
          onMapDeselect={() => { pm.setCityMenu(false); pm.setAreaMenu(false); pm.setFocus(false); }}
        />

        {crosshairOn && (
          <div style={{ position: 'absolute', left: '50%', top: '50%', width: 78, height: 78, margin: '-39px 0 0 -39px', zIndex: 400, pointerEvents: 'none', animation: 'pmFade .25s ease' }}>
            <div style={{ position: 'absolute', left: 39, top: 0, width: 1, height: 78, background: 'linear-gradient(180deg,transparent,#35e0c0,transparent)' }} />
            <div style={{ position: 'absolute', top: 39, left: 0, height: 1, width: 78, background: 'linear-gradient(90deg,transparent,#35e0c0,transparent)' }} />
            <div style={{ position: 'absolute', left: 26, top: 26, width: 26, height: 26, border: '1.5px solid rgba(53,224,192,.9)', borderRadius: 99, boxShadow: '0 0 22px rgba(53,224,192,.6)' }} />
          </div>
        )}

        <div style={{ position: 'absolute', right: 22, bottom: 30, zIndex: 500, display: 'flex', flexDirection: 'column', borderRadius: 16, overflow: 'hidden', background: 'rgba(23,26,44,.72)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,.13)', boxShadow: '0 12px 30px -12px rgba(0,0,0,.75)' }}>
          <div onClick={() => mapRef.current && mapRef.current.zoomIn()} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
            <div style={{ position: 'relative', width: 16, height: 16 }}>
              <div style={{ position: 'absolute', top: 7, left: 0, width: 16, height: 2.2, borderRadius: 2, background: '#fff' }} />
              <div style={{ position: 'absolute', left: 7, top: 0, height: 16, width: 2.2, borderRadius: 2, background: '#fff' }} />
            </div>
          </div>
          <div onClick={() => mapRef.current && mapRef.current.zoomOut()} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <div style={{ width: 16, height: 2.2, borderRadius: 2, background: '#fff' }} />
          </div>
        </div>

        <div style={{ position: 'absolute', left: 22, bottom: 30, zIndex: 500, display: 'flex', alignItems: 'center', gap: 8, height: 34, padding: '0 14px', borderRadius: 99, background: 'rgba(23,26,44,.72)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,.13)', boxShadow: '0 12px 30px -12px rgba(0,0,0,.75)' }}>
          <span style={{ width: 7, height: 7, borderRadius: 99, background: '#35e0c0', boxShadow: '0 0 10px #35e0c0' }} />
          <span style={{ font: '700 12px/1 Manrope', color: 'rgba(255,255,255,.9)' }}>{nearbyLabel}</span>
        </div>

        {pm.toast && (
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 22, zIndex: 900, padding: '14px 18px', borderRadius: 18, background: 'rgba(53,224,192,.16)', backdropFilter: 'blur(20px)', border: '1px solid rgba(53,224,192,.4)', animation: 'pmSlide .24s ease', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 20, height: 20, borderRadius: 99, background: '#35e0c0', color: '#0d1018', font: '800 11px/20px Manrope', textAlign: 'center', flex: 'none' }}>✓</span>
            <span style={{ font: '700 12.5px/1.4 Manrope', color: '#c9fff4', whiteSpace: 'nowrap' }}>{pm.toast}</span>
          </div>
        )}
      </div>

      {pm.authPrompt && (
        <div onClick={pm.cancelAuthPrompt} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(8,9,15,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pmFade .2s ease' }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 380, borderRadius: 24, background: 'linear-gradient(180deg,rgba(35,38,72,.98),rgba(16,18,30,.99))', border: '1px solid rgba(255,255,255,.14)', boxShadow: '0 30px 80px -20px rgba(0,0,0,.8)', animation: 'pmSlide .22s ease' }}
          >
            <AuthPromptContent pm={pm} />
          </div>
        </div>
      )}
    </div>
  );
}

function NavIconButton({ active, onClick, label, children }) {
  return (
    <div
      onClick={onClick}
      title={label}
      style={{
        width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        background: active ? 'rgba(53,224,192,.16)' : 'rgba(255,255,255,.06)',
        border: '1px solid ' + (active ? 'rgba(53,224,192,.4)' : 'rgba(255,255,255,.12)'),
        color: active ? '#35e0c0' : 'rgba(255,255,255,.6)',
        font: '800 12px/1 Manrope',
      }}
    >
      {children}
    </div>
  );
}
