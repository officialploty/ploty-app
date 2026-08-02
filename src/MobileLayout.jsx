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

export default function MobileLayout({ pm }) {
  const mapRef = useRef(null);

  const showMapChrome = pm.tab === 'map' && !pm.placing && !pm.choosingKind && !pm.formOpen;
  const showTabs = !pm.placing && !pm.choosingKind && !pm.formOpen && !pm.detailOpen;
  const crosshairOn = pm.placing && !pm.pin;
  const ly = pm.visible.filter((p) => p.kind === 'layout').length;
  const si = pm.visible.length - ly;
  const nearbyLabel = si + (si === 1 ? ' plot' : ' plots') + (ly ? ' · ' + ly + (ly === 1 ? ' layout' : ' layouts') : '') + ' nearby';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100dvh', overflow: 'hidden', background: '#12141f', isolation: 'isolate' }}>
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

      {showMapChrome && (
        <>
          <div style={{ position: 'absolute', top: 'env(safe-area-inset-top,0px)', left: 0, right: 0, zIndex: 500, padding: '12px 14px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SearchBar pm={pm} />
              <CityAreaKindRow pm={pm} mapRef={mapRef} />
            </div>
          </div>

          <div style={{ position: 'absolute', right: 14, bottom: 120, zIndex: 500, display: 'flex', flexDirection: 'column', borderRadius: 16, overflow: 'hidden', background: 'rgba(23,26,44,.72)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,.13)', boxShadow: '0 12px 30px -12px rgba(0,0,0,.75)' }}>
            <div onClick={() => mapRef.current && mapRef.current.zoomIn()} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
              <PlusIcon />
            </div>
            <div onClick={() => mapRef.current && mapRef.current.zoomOut()} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <div style={{ width: 16, height: 2.2, borderRadius: 2, background: '#fff' }} />
            </div>
          </div>

          <div style={{ position: 'absolute', left: 14, bottom: 120, zIndex: 500, display: 'flex', alignItems: 'center', gap: 8, height: 34, padding: '0 14px', borderRadius: 99, background: 'rgba(23,26,44,.72)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,.13)', boxShadow: '0 12px 30px -12px rgba(0,0,0,.75)' }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: '#35e0c0', boxShadow: '0 0 10px #35e0c0' }} />
            <span style={{ font: '700 12px/1 Manrope', color: 'rgba(255,255,255,.9)' }}>{nearbyLabel}</span>
          </div>
        </>
      )}

      {pm.tab === 'list' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 700, background: 'linear-gradient(180deg,rgba(18,20,31,.97),rgba(10,11,18,.99))', animation: 'pmFade .2s ease', paddingTop: 'env(safe-area-inset-top,0px)' }}>
          <ListPanel pm={pm} />
        </div>
      )}

      {pm.tab === 'saved' && (
        <div className="pmScroll" style={{ position: 'absolute', inset: 0, zIndex: 700, background: 'linear-gradient(180deg,rgba(18,20,31,.97),rgba(10,11,18,.99))', animation: 'pmFade .2s ease', paddingTop: 'calc(env(safe-area-inset-top,0px) + 46px)', overflowY: 'auto' }}>
          <SavedPanel pm={pm} />
        </div>
      )}

      {pm.tab === 'profile' && (
        <div className="pmScroll" style={{ position: 'absolute', inset: 0, zIndex: 700, background: 'linear-gradient(180deg,rgba(18,20,31,.97),rgba(10,11,18,.99))', animation: 'pmFade .2s ease', paddingTop: 'calc(env(safe-area-inset-top,0px) + 46px)', overflowY: 'auto' }}>
          <ProfilePanel pm={pm} />
        </div>
      )}

      {pm.tab === 'review' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 700, background: 'linear-gradient(180deg,rgba(18,20,31,.97),rgba(10,11,18,.99))', animation: 'pmFade .2s ease', paddingTop: 'env(safe-area-inset-top,0px)', display: 'flex', flexDirection: 'column' }}>
          <div onClick={() => pm.setTab('profile')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 18px 0', cursor: 'pointer' }}>
            <span style={{ font: '700 12px/1 Manrope', color: '#35e0c0' }}>← Back to profile</span>
          </div>
          <ReviewPanel pm={pm} />
        </div>
      )}

      {pm.placing && (
        <>
          <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top,0px) + 14px)', left: 14, right: 14, zIndex: 750, padding: '15px 17px', borderRadius: 20, background: 'rgba(23,26,44,.8)', backdropFilter: 'blur(22px)', border: '1px solid rgba(53,224,192,.32)', boxShadow: '0 18px 40px -14px rgba(0,0,0,.8)', animation: 'pmSlide .22s ease', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ font: '800 12px/1 Manrope', color: '#35e0c0', letterSpacing: '.16em' }}>STEP 1 OF 3</div>
              <div onClick={pm.cancelAdd} style={{ font: '700 12px/1 Manrope', color: 'rgba(255,255,255,.5)', cursor: 'pointer' }}>Cancel</div>
            </div>
            <div style={{ font: '700 16px/1.3 Manrope', color: '#fff', letterSpacing: '-.01em' }}>Tap the map to place your plot</div>
            <div style={{ font: '400 12px/1.5 Manrope', color: 'rgba(255,255,255,.5)' }}>Drag and zoom to the exact spot, then drop the pin.</div>
          </div>
          <div style={{ position: 'absolute', left: 14, right: 14, bottom: 26, zIndex: 750, display: 'flex', flexDirection: 'column', gap: 10, animation: 'pmSlide .22s ease' }}>
            <NearbyWarning pm={pm} />
            <PinControls pm={pm} />
          </div>
        </>
      )}

      {pm.choosingKind && (
        <>
          <div onClick={pm.cancelAdd} style={{ position: 'absolute', inset: 0, zIndex: 800, background: 'rgba(8,9,15,.55)', backdropFilter: 'blur(3px)', animation: 'pmFade .2s ease' }} />
          <div className="pmScroll" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 70, zIndex: 810, borderRadius: '30px 30px 0 0', background: 'linear-gradient(180deg,rgba(35,38,72,.97),rgba(16,18,30,.99))', borderTop: '1px solid rgba(255,255,255,.16)', boxShadow: '0 -20px 60px -20px rgba(0,0,0,.9)', animation: 'pmSheet .34s cubic-bezier(.16,1.1,.3,1)', overflowY: 'auto' }}>
            <SheetHandle onClick={pm.backToPlacing} />
            <KindChoice pm={pm} />
          </div>
        </>
      )}

      {pm.formOpen && (
        <>
          <div onClick={pm.cancelAdd} style={{ position: 'absolute', inset: 0, zIndex: 800, background: 'rgba(8,9,15,.55)', backdropFilter: 'blur(3px)', animation: 'pmFade .2s ease' }} />
          <div className="pmScroll" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 70, zIndex: 810, borderRadius: '30px 30px 0 0', background: 'linear-gradient(180deg,rgba(35,38,72,.97),rgba(16,18,30,.99))', borderTop: '1px solid rgba(255,255,255,.16)', boxShadow: '0 -20px 60px -20px rgba(0,0,0,.9)', animation: 'pmSheet .34s cubic-bezier(.16,1.1,.3,1)', overflowY: 'auto' }}>
            <SheetHandle onClick={pm.backToKind} />
            <AddForm pm={pm} onBackToPlacing={pm.backToPlacing} />
          </div>
        </>
      )}

      {pm.detailOpen && (
        <>
          <div onClick={pm.closeDetail} style={{ position: 'absolute', inset: 0, zIndex: 800, background: 'rgba(8,9,15,.5)', animation: 'pmFade .2s ease' }} />
          <div className="pmScroll" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '80%', zIndex: 810, borderRadius: '30px 30px 0 0', background: 'linear-gradient(180deg,rgba(35,38,72,.97),rgba(16,18,30,.99))', borderTop: '1px solid rgba(255,255,255,.16)', boxShadow: '0 -20px 60px -20px rgba(0,0,0,.9)', animation: 'pmSheet .36s cubic-bezier(.16,1.1,.3,1)', overflowY: 'auto' }}>
            <SheetHandle onClick={pm.closeDetail} />
            <DetailContent sel={pm.sel} saved={pm.saved} onToggleSave={pm.toggleSave} onContact={pm.contact} />
          </div>
        </>
      )}

      {pm.authPrompt && (
        <>
          <div onClick={pm.cancelAuthPrompt} style={{ position: 'absolute', inset: 0, zIndex: 930, background: 'rgba(8,9,15,.6)', animation: 'pmFade .2s ease' }} />
          <div className="pmScroll" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 940, borderRadius: '28px 28px 0 0', background: 'linear-gradient(180deg,rgba(35,38,72,.98),rgba(16,18,30,.99))', borderTop: '1px solid rgba(255,255,255,.16)', boxShadow: '0 -20px 60px -20px rgba(0,0,0,.9)', animation: 'pmSheet .3s cubic-bezier(.16,1.1,.3,1)', overflowY: 'auto', maxHeight: '84%' }}>
            <SheetHandle onClick={pm.cancelAuthPrompt} />
            <AuthPromptContent pm={pm} />
          </div>
        </>
      )}

      {pm.toast && (
        <div style={{ position: 'absolute', left: 20, right: 20, top: 'calc(env(safe-area-inset-top,0px) + 66px)', zIndex: 900, padding: '14px 16px', borderRadius: 18, background: 'rgba(53,224,192,.16)', backdropFilter: 'blur(20px)', border: '1px solid rgba(53,224,192,.4)', animation: 'pmSlide .24s ease', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 20, height: 20, borderRadius: 99, background: '#35e0c0', color: '#0d1018', font: '800 11px/20px Manrope', textAlign: 'center', flex: 'none' }}>✓</span>
          <span style={{ font: '700 12.5px/1.4 Manrope', color: '#c9fff4' }}>{pm.toast}</span>
        </div>
      )}

      {showTabs && (
        <div style={{ position: 'absolute', left: 14, right: 14, bottom: 'calc(env(safe-area-inset-bottom,0px) + 14px)', zIndex: 820, height: 74, borderRadius: 26, background: 'rgba(23,26,44,.78)', backdropFilter: 'blur(26px)', border: '1px solid rgba(255,255,255,.13)', boxShadow: '0 20px 44px -16px rgba(0,0,0,.85)', display: 'flex', alignItems: 'center', padding: '0 6px' }}>
          <TabButton onClick={() => pm.setTab('map')} active={pm.tab === 'map'} label="Map">
            <div style={{ width: 19, height: 19, borderRadius: 6, border: '2px solid ' + (pm.tab === 'map' ? '#35e0c0' : 'rgba(255,255,255,.42)') }} />
          </TabButton>
          <TabButton onClick={() => { pm.setTab('list'); pm.closeDetail(); pm.setFocus(false); }} active={pm.tab === 'list'} label="List">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: 19 }}>
              <div style={{ height: 2.5, borderRadius: 2, background: pm.tab === 'list' ? '#35e0c0' : 'rgba(255,255,255,.42)' }} />
              <div style={{ height: 2.5, borderRadius: 2, background: pm.tab === 'list' ? '#35e0c0' : 'rgba(255,255,255,.42)' }} />
              <div style={{ height: 2.5, borderRadius: 2, background: pm.tab === 'list' ? '#35e0c0' : 'rgba(255,255,255,.42)', width: '65%' }} />
            </div>
          </TabButton>
          <div onClick={pm.startAdd} style={{ flex: 'none', width: 74, display: 'flex', justifyContent: 'center', cursor: 'pointer' }}>
            <div style={{ width: 58, height: 58, borderRadius: 22, background: 'linear-gradient(130deg,#35e0c0,#8b7bff)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 14px 30px -10px rgba(53,224,192,.75)' }}>
              <PlusIcon dark />
            </div>
          </div>
          <TabButton onClick={() => { pm.setTab('saved'); pm.closeDetail(); pm.setFocus(false); }} active={pm.tab === 'saved'} label="Saved">
            <span style={{ font: '700 15px/1 Manrope', color: pm.tab === 'saved' ? '#35e0c0' : 'rgba(255,255,255,.42)' }}>♥</span>
          </TabButton>
          <TabButton onClick={() => { pm.setTab('profile'); pm.closeDetail(); pm.setFocus(false); }} active={pm.tab === 'profile'} label="You">
            <div style={{ width: 17, height: 17, borderRadius: 99, border: '2px solid ' + (pm.tab === 'profile' ? '#35e0c0' : 'rgba(255,255,255,.42)') }} />
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
      <span style={{ font: '700 10px/1 Manrope', color: active ? '#35e0c0' : 'rgba(255,255,255,.42)', letterSpacing: '.06em' }}>{label}</span>
    </div>
  );
}

function SheetHandle({ onClick }) {
  return (
    <div onClick={onClick} style={{ position: 'sticky', top: 0, zIndex: 2, padding: '11px 0 6px', display: 'flex', justifyContent: 'center', cursor: 'grab', background: 'linear-gradient(180deg,rgba(35,38,72,.98),rgba(35,38,72,0))' }}>
      <div style={{ width: 44, height: 5, borderRadius: 99, background: 'rgba(255,255,255,.28)' }} />
    </div>
  );
}

function PlusIcon({ dark }) {
  const c = dark ? '#0d1018' : '#fff';
  return (
    <div style={{ position: 'relative', width: 16, height: 16 }}>
      <div style={{ position: 'absolute', top: 7, left: 0, width: 16, height: 2.2, borderRadius: 2, background: c }} />
      <div style={{ position: 'absolute', left: 7, top: 0, height: 16, width: 2.2, borderRadius: 2, background: c }} />
    </div>
  );
}
