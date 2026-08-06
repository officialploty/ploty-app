import { useRef } from 'react';
import MapView from './MapView';
import SearchBar from './components/SearchBar';
import { CityAreaKindRow } from './components/Filters';
import ListPanel from './components/ListPanel';
import AddForm from './components/AddForm';
import KindChoice from './components/KindChoice';
import DetailContent from './components/DetailContent';
import ProfilePanel from './components/ProfilePanel';
import AuthPromptContent from './components/AuthPromptContent';
import { NearbyWarning, PinControls } from './components/PlacingControls';

const PROFILE_TABS = ['profile', 'listings', 'saved', 'review', 'account'];

export default function MobileLayout({ pm }) {
  const mapRef = useRef(null);

  const showMapChrome = pm.tab === 'map' && !pm.placing && !pm.choosingKind && !pm.formOpen;
  const showTabs = !pm.placing && !pm.choosingKind && !pm.formOpen && !pm.detailOpen;
  const crosshairOn = pm.placing && !pm.pin;
  const ly = pm.visible.filter((p) => p.kind === 'layout').length;
  const si = pm.visible.length - ly;
  const nearbyLabel = si + (si === 1 ? ' plot' : ' plots') + (ly ? ' · ' + ly + (ly === 1 ? ' layout' : ' layouts') : '') + ' nearby';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden', background: '#eef1ef', isolation: 'isolate' }}>
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
          <div style={{ position: 'absolute', left: 39, top: 0, width: 1, height: 78, background: 'linear-gradient(180deg,transparent,#1f9d64,transparent)' }} />
          <div style={{ position: 'absolute', top: 39, left: 0, height: 1, width: 78, background: 'linear-gradient(90deg,transparent,#1f9d64,transparent)' }} />
          <div style={{ position: 'absolute', left: 26, top: 26, width: 26, height: 26, border: '1.5px solid rgba(31,157,100,.9)', borderRadius: 99, boxShadow: '0 0 22px rgba(31,157,100,.6)' }} />
        </div>
      )}

      {showMapChrome && (
        <>
          <div style={{ position: 'absolute', top: 'env(safe-area-inset-top,0px)', left: 0, right: 0, zIndex: 500, padding: '12px 14px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SearchBar pm={pm} light />
              <CityAreaKindRow pm={pm} mapRef={mapRef} />
            </div>
          </div>

          <div style={{ position: 'absolute', right: 14, bottom: 120, zIndex: 500, display: 'flex', flexDirection: 'column', borderRadius: 16, overflow: 'hidden', background: 'rgba(255,255,255,.88)', backdropFilter: 'blur(20px)', border: '1px solid rgba(20,40,31,.1)', boxShadow: '0 12px 30px -12px rgba(22,40,31,.35)' }}>
            <div onClick={() => mapRef.current && mapRef.current.zoomIn()} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderBottom: '1px solid rgba(20,40,31,.1)' }}>
              <PlusIcon dark />
            </div>
            <div onClick={() => mapRef.current && mapRef.current.zoomOut()} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <div style={{ width: 16, height: 2.2, borderRadius: 2, background: '#1a1e1c' }} />
            </div>
          </div>

          <div style={{ position: 'absolute', left: 14, bottom: 120, zIndex: 500, display: 'flex', alignItems: 'center', gap: 8, height: 34, padding: '0 14px', borderRadius: 99, background: 'rgba(255,255,255,.88)', backdropFilter: 'blur(20px)', border: '1px solid rgba(20,40,31,.1)', boxShadow: '0 12px 30px -12px rgba(22,40,31,.35)' }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: '#1f9d64', boxShadow: '0 0 10px #1f9d64' }} />
            <span style={{ font: '700 12px/1 Manrope', color: '#1a1e1c' }}>{nearbyLabel}</span>
          </div>
        </>
      )}

      {pm.tab === 'list' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 700, background: '#f4f7f5', animation: 'pmFade .2s ease', paddingTop: 'env(safe-area-inset-top,0px)', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: '14px 18px 0' }}>
            <SearchBar pm={pm} light />
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ListPanel pm={pm} mapVisible={false} onToggleMap={() => { pm.setTab('map'); pm.setFocus(false); }} />
          </div>
        </div>
      )}

      {PROFILE_TABS.includes(pm.tab) && (
        <div className="pmScroll" style={{ position: 'absolute', inset: 0, zIndex: 700, background: '#f4f7f5', animation: 'pmFade .2s ease', paddingTop: 'env(safe-area-inset-top,0px)', overflowY: 'auto' }}>
          <ProfilePanel pm={pm} />
        </div>
      )}

      {pm.placing && (
        <>
          <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top,0px) + 14px)', left: 14, right: 14, zIndex: 750, padding: '15px 17px', borderRadius: 20, background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(22px)', border: '1px solid rgba(31,157,100,.32)', boxShadow: '0 18px 40px -14px rgba(22,40,31,.4)', animation: 'pmSlide .22s ease', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ font: '800 12px/1 Manrope', color: '#1f9d64', letterSpacing: '.16em' }}>STEP 1 OF 3</div>
              <div onClick={pm.cancelAdd} style={{ font: '700 12px/1 Manrope', color: '#6b7570', cursor: 'pointer' }}>Cancel</div>
            </div>
            <div style={{ font: '700 16px/1.3 Manrope', color: '#1a1e1c', letterSpacing: '-.01em' }}>Tap the map to place your plot</div>
            <div style={{ font: '400 12px/1.5 Manrope', color: '#6b7570' }}>Drag and zoom to the exact spot, then drop the pin.</div>
          </div>
          <div style={{ position: 'absolute', left: 14, right: 14, bottom: 26, zIndex: 750, display: 'flex', flexDirection: 'column', gap: 10, animation: 'pmSlide .22s ease' }}>
            <NearbyWarning pm={pm} />
            <PinControls pm={pm} />
          </div>
        </>
      )}

      {pm.choosingKind && (
        <>
          <div onClick={pm.cancelAdd} style={{ position: 'absolute', inset: 0, zIndex: 800, background: 'rgba(20,24,22,.45)', backdropFilter: 'blur(3px)', animation: 'pmFade .2s ease' }} />
          <div className="pmScroll" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 70, zIndex: 810, borderRadius: '30px 30px 0 0', background: '#f4f7f5', borderTop: '1px solid #e5e9e6', boxShadow: '0 -20px 60px -20px rgba(22,40,31,.4)', animation: 'pmSheet .34s cubic-bezier(.16,1.1,.3,1)', overflowY: 'auto' }}>
            <SheetHandle onClick={pm.backToPlacing} />
            <KindChoice pm={pm} />
          </div>
        </>
      )}

      {pm.formOpen && (
        <>
          <div onClick={pm.cancelAdd} style={{ position: 'absolute', inset: 0, zIndex: 800, background: 'rgba(20,24,22,.45)', backdropFilter: 'blur(3px)', animation: 'pmFade .2s ease' }} />
          <div className="pmScroll" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 70, zIndex: 810, borderRadius: '30px 30px 0 0', background: '#f4f7f5', borderTop: '1px solid #e5e9e6', boxShadow: '0 -20px 60px -20px rgba(22,40,31,.4)', animation: 'pmSheet .34s cubic-bezier(.16,1.1,.3,1)', overflowY: 'auto' }}>
            <SheetHandle onClick={pm.backToKind} />
            <AddForm pm={pm} onBackToPlacing={pm.backToPlacing} />
          </div>
        </>
      )}

      {pm.detailOpen && (
        <>
          <div onClick={pm.closeDetail} style={{ position: 'absolute', inset: 0, zIndex: 800, background: 'rgba(20,24,22,.4)', animation: 'pmFade .2s ease' }} />
          <div className="pmScroll" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '80%', zIndex: 810, borderRadius: '30px 30px 0 0', background: '#f4f7f5', borderTop: '1px solid #e5e9e6', boxShadow: '0 -20px 60px -20px rgba(22,40,31,.4)', animation: 'pmSheet .36s cubic-bezier(.16,1.1,.3,1)', overflowY: 'auto' }}>
            <SheetHandle onClick={pm.closeDetail} />
            <DetailContent sel={pm.sel} saved={pm.saved} onToggleSave={pm.toggleSave} onContact={pm.contact} />
          </div>
        </>
      )}

      {pm.authPrompt && (
        <>
          <div onClick={pm.cancelAuthPrompt} style={{ position: 'absolute', inset: 0, zIndex: 930, background: 'rgba(20,24,22,.5)', animation: 'pmFade .2s ease' }} />
          <div className="pmScroll" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 940, borderRadius: '28px 28px 0 0', background: '#f4f7f5', borderTop: '1px solid #e5e9e6', boxShadow: '0 -20px 60px -20px rgba(22,40,31,.4)', animation: 'pmSheet .3s cubic-bezier(.16,1.1,.3,1)', overflowY: 'auto', maxHeight: '84%' }}>
            <SheetHandle onClick={pm.cancelAuthPrompt} />
            <AuthPromptContent pm={pm} />
          </div>
        </>
      )}

      {pm.toast && (
        <div style={{ position: 'absolute', left: 20, right: 20, top: 'calc(env(safe-area-inset-top,0px) + 66px)', zIndex: 900, padding: '14px 16px', borderRadius: 18, background: '#e5f5ec', backdropFilter: 'blur(20px)', border: '1px solid #a8dcbf', animation: 'pmSlide .24s ease', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 20, height: 20, borderRadius: 99, background: '#1f9d64', color: '#fff', font: '800 11px/20px Manrope', textAlign: 'center', flex: 'none' }}>✓</span>
          <span style={{ font: '700 12.5px/1.4 Manrope', color: '#146b41' }}>{pm.toast}</span>
        </div>
      )}

      {showTabs && (
        <div style={{ position: 'absolute', left: 14, right: 14, bottom: 'calc(env(safe-area-inset-bottom,0px) + 14px)', zIndex: 820, height: 74, borderRadius: 26, background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(26px)', border: '1px solid rgba(20,40,31,.08)', boxShadow: '0 20px 44px -16px rgba(22,40,31,.35)', display: 'flex', alignItems: 'center', padding: '0 6px' }}>
          <TabButton onClick={() => pm.setTab('map')} active={pm.tab === 'map'} label="Map">
            <div style={{ width: 19, height: 19, borderRadius: 6, border: '2px solid ' + (pm.tab === 'map' ? '#1f9d64' : '#a3aca6') }} />
          </TabButton>
          <TabButton onClick={() => { pm.setTab('list'); pm.closeDetail(); pm.setFocus(false); }} active={pm.tab === 'list'} label="List">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: 19 }}>
              <div style={{ height: 2.5, borderRadius: 2, background: pm.tab === 'list' ? '#1f9d64' : '#a3aca6' }} />
              <div style={{ height: 2.5, borderRadius: 2, background: pm.tab === 'list' ? '#1f9d64' : '#a3aca6' }} />
              <div style={{ height: 2.5, borderRadius: 2, background: pm.tab === 'list' ? '#1f9d64' : '#a3aca6', width: '65%' }} />
            </div>
          </TabButton>
          <div onClick={pm.startAdd} style={{ flex: 'none', width: 74, display: 'flex', justifyContent: 'center', cursor: 'pointer' }}>
            <div style={{ width: 58, height: 58, borderRadius: 22, background: 'linear-gradient(130deg,#1f9d64,#8355c9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 14px 30px -10px rgba(31,157,100,.55)' }}>
              <PlusIcon />
            </div>
          </div>
          <TabButton onClick={() => { pm.setTab('saved'); pm.closeDetail(); pm.setFocus(false); }} active={pm.tab === 'saved'} label="Saved">
            <span style={{ font: '700 15px/1 Manrope', color: pm.tab === 'saved' ? '#d64545' : '#a3aca6' }}>♥</span>
          </TabButton>
          <TabButton onClick={() => { pm.setTab('profile'); pm.closeDetail(); pm.setFocus(false); }} active={PROFILE_TABS.includes(pm.tab) && pm.tab !== 'saved'} label="You">
            <div style={{ width: 17, height: 17, borderRadius: 99, border: '2px solid ' + (PROFILE_TABS.includes(pm.tab) && pm.tab !== 'saved' ? '#1f9d64' : '#a3aca6') }} />
          </TabButton>
        </div>
      )}
    </div>
  );
}

function TabButton({ onClick, active, label, children }) {
  return (
    <div onClick={onClick} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer' }}>
      {children}
      <span style={{ font: '700 10px/1 Manrope', color: active ? (label === 'Saved' ? '#d64545' : '#1f9d64') : '#a3aca6', letterSpacing: '.06em' }}>{label}</span>
    </div>
  );
}

function SheetHandle({ onClick }) {
  return (
    <div onClick={onClick} style={{ position: 'sticky', top: 0, zIndex: 2, padding: '11px 0 6px', display: 'flex', justifyContent: 'center', cursor: 'grab', background: 'linear-gradient(180deg,#f4f7f5,rgba(244,247,245,0))' }}>
      <div style={{ width: 44, height: 5, borderRadius: 99, background: 'rgba(20,40,31,.18)' }} />
    </div>
  );
}

function PlusIcon({ dark }) {
  const c = dark ? '#1a1e1c' : '#fff';
  return (
    <div style={{ position: 'relative', width: 16, height: 16 }}>
      <div style={{ position: 'absolute', top: 7, left: 0, width: 16, height: 2.2, borderRadius: 2, background: c }} />
      <div style={{ position: 'absolute', left: 7, top: 0, height: 16, width: 2.2, borderRadius: 2, background: c }} />
    </div>
  );
}
