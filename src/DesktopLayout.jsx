import { useMemo, useRef, useState } from 'react';
import MapView from './MapView';
import SearchBar from './components/SearchBar';
import ListPanel from './components/ListPanel';
import FilterSidebar from './components/FilterSidebar';
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
  const [filterOpen, setFilterOpen] = useState(false);
  const [mapBounds, setMapBounds] = useState(null);
  const [mapVisible, setMapVisible] = useState(true);

  const inView = useMemo(() => {
    if (!mapBounds) return pm.visible;
    return pm.visible.filter((p) => p.lat <= mapBounds.north && p.lat >= mapBounds.south && p.lng <= mapBounds.east && p.lng >= mapBounds.west);
  }, [pm.visible, mapBounds]);

  const crosshairOn = pm.placing && !pm.pin;
  const ly = pm.visible.filter((p) => p.kind === 'layout').length;
  const si = pm.visible.length - ly;
  const nearbyLabel = si + (si === 1 ? ' plot' : ' plots') + (ly ? ' · ' + ly + (ly === 1 ? ' layout' : ' layouts') : '') + ' nearby';
  const browsing = pm.tab !== 'saved' && pm.tab !== 'profile' && pm.tab !== 'review';
  const listing = browsing && !pm.placing && !pm.choosingKind && !pm.formOpen && !pm.detailOpen;
  const initials = pm.auth ? (pm.auth.name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?') : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100vh', background: '#eef1ef' }}>
      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 24, height: 72, padding: '0 24px', borderBottom: '1px solid #e5e9e6', background: '#ffffff', zIndex: 10 }}>
        <div
          onClick={() => { pm.setTab('map'); pm.closeDetail(); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flex: 'none' }}
        >
          <span style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(130deg,#1f9d64,#8355c9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ width: 11, height: 11, borderRadius: 3, background: '#fff' }} />
          </span>
          <span style={{ font: '800 14px/1 Manrope', letterSpacing: '.18em', color: '#1a1e1c', textTransform: 'uppercase' }}>Ploty</span>
        </div>

        {browsing && (
          <div style={{ flex: 1, maxWidth: 520 }}>
            <SearchBar pm={pm} light />
          </div>
        )}

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
          <NavIconButton active={pm.tab === 'saved'} onClick={() => { pm.setTab('saved'); pm.closeDetail(); }} label="Saved plots">
            <HeaderHeartIcon filled={pm.tab === 'saved'} />
          </NavIconButton>
          <div
            onClick={() => { pm.setTab('profile'); pm.closeDetail(); }}
            title="Your account"
            style={{
              width: 38, height: 38, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              background: pm.tab === 'profile' ? 'linear-gradient(130deg,#1f9d64,#8355c9)' : '#f6f9f7',
              border: '1px solid ' + (pm.tab === 'profile' ? 'transparent' : '#e5e9e6'),
              boxShadow: pm.tab === 'profile' ? '0 4px 12px -4px rgba(131,85,201,.5)' : 'none',
            }}
          >
            {initials
              ? <span style={{ font: '800 12px/1 Manrope', color: pm.tab === 'profile' ? '#fff' : '#495650' }}>{initials}</span>
              : <span style={{ width: 15, height: 15, borderRadius: 99, border: '2px solid ' + (pm.tab === 'profile' ? '#fff' : '#495650'), display: 'block' }} />}
          </div>
          <div
            onClick={pm.startAdd}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, height: 38, padding: '0 18px', borderRadius: 99, cursor: 'pointer',
              background: 'linear-gradient(110deg,#1f9d64,#8355c9)', boxShadow: '0 6px 16px -6px rgba(131,85,201,.55)',
            }}
          >
            <PlusIcon />
            <span style={{ font: '800 12.5px/1 Manrope', color: '#fff', letterSpacing: '.02em' }}>Register a plot</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      {listing ? (
        <>
          {filterOpen && <FilterSidebar pm={pm} mapRef={mapRef} onClose={() => setFilterOpen(false)} />}
          <div className="pmScroll" style={{ width: mapVisible ? 400 : '100%', flex: mapVisible ? 'none' : 1, borderRight: mapVisible ? '1px solid #e5e9e6' : 'none', overflowY: 'auto', background: '#f4f7f5' }}>
            <ListPanel
              pm={pm} items={inView} inMapView={mapVisible && !!mapBounds} filterOpen={filterOpen}
              onToggleFilter={() => setFilterOpen((v) => !v)} mapVisible={mapVisible} onToggleMap={() => setMapVisible((v) => !v)}
            />
          </div>
        </>
      ) : (
        <div className="pmScroll" style={{ width: 440, flex: 'none', borderRight: '1px solid #e5e9e6', display: 'flex', flexDirection: 'column', overflowY: 'auto', background: '#f4f7f5' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {pm.placing && (
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: '15px 17px', borderRadius: 20, background: '#ffffff', border: '1px solid rgba(31,157,100,.32)', boxShadow: '0 2px 10px rgba(22,40,31,.06)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ font: '800 12px/1 Manrope', color: '#1f9d64', letterSpacing: '.16em' }}>STEP 1 OF 3</div>
                    <div onClick={pm.cancelAdd} style={{ font: '700 12px/1 Manrope', color: '#6b7570', cursor: 'pointer' }}>Cancel</div>
                  </div>
                  <div style={{ font: '700 16px/1.3 Manrope', color: '#1a1e1c', letterSpacing: '-.01em' }}>Click the map to place your plot</div>
                  <div style={{ font: '400 12px/1.5 Manrope', color: '#6b7570' }}>Pan and zoom to the exact spot, then drop the pin.</div>
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
                  <span style={{ font: '700 12px/1 Manrope', color: '#1f9d64' }}>← Back to list</span>
                </div>
                <DetailContent sel={pm.sel} saved={pm.saved} onToggleSave={pm.toggleSave} onContact={pm.contact} />
              </div>
            )}

            {pm.tab === 'saved' && <SavedPanel pm={pm} />}
            {pm.tab === 'profile' && <ProfilePanel pm={pm} />}
            {pm.tab === 'review' && (
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}>
                <div onClick={() => pm.setTab('profile')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px 0', cursor: 'pointer' }}>
                  <span style={{ font: '700 12px/1 Manrope', color: '#1f9d64' }}>← Back to profile</span>
                </div>
                <ReviewPanel pm={pm} />
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ position: 'relative', flex: listing && !mapVisible ? 'none' : 1, width: listing && !mapVisible ? 0 : undefined, overflow: 'hidden', background: '#eef1ef', isolation: 'isolate' }}>
        <MapView
          ref={mapRef}
          visible={pm.visible}
          selected={pm.sel && pm.sel.id}
          pin={pm.pin}
          mode={pm.mode}
          onMarkerClick={(id) => pm.open(id, (p) => mapRef.current && mapRef.current.flyTo([p.lat, p.lng], 13.5))}
          onMapClick={(lat, lng) => { if (pm.mode === 'placing') pm.setPin([lat, lng]); }}
          onMapDeselect={() => { pm.setCityMenu(false); pm.setAreaMenu(false); pm.setFocus(false); }}
          onBoundsChange={setMapBounds}
        />

        {crosshairOn && (
          <div style={{ position: 'absolute', left: '50%', top: '50%', width: 78, height: 78, margin: '-39px 0 0 -39px', zIndex: 400, pointerEvents: 'none', animation: 'pmFade .25s ease' }}>
            <div style={{ position: 'absolute', left: 39, top: 0, width: 1, height: 78, background: 'linear-gradient(180deg,transparent,#1f9d64,transparent)' }} />
            <div style={{ position: 'absolute', top: 39, left: 0, height: 1, width: 78, background: 'linear-gradient(90deg,transparent,#1f9d64,transparent)' }} />
            <div style={{ position: 'absolute', left: 26, top: 26, width: 26, height: 26, border: '1.5px solid rgba(31,157,100,.9)', borderRadius: 99, boxShadow: '0 0 22px rgba(31,157,100,.6)' }} />
          </div>
        )}

        <div style={{ position: 'absolute', right: 22, bottom: 30, zIndex: 500, display: 'flex', flexDirection: 'column', borderRadius: 16, overflow: 'hidden', background: 'rgba(255,255,255,.88)', backdropFilter: 'blur(20px)', border: '1px solid rgba(20,40,31,.1)', boxShadow: '0 12px 30px -12px rgba(22,40,31,.35)' }}>
          <div onClick={() => mapRef.current && mapRef.current.zoomIn()} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderBottom: '1px solid rgba(20,40,31,.1)' }}>
            <div style={{ position: 'relative', width: 16, height: 16 }}>
              <div style={{ position: 'absolute', top: 7, left: 0, width: 16, height: 2.2, borderRadius: 2, background: '#1a1e1c' }} />
              <div style={{ position: 'absolute', left: 7, top: 0, height: 16, width: 2.2, borderRadius: 2, background: '#1a1e1c' }} />
            </div>
          </div>
          <div onClick={() => mapRef.current && mapRef.current.zoomOut()} style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <div style={{ width: 16, height: 2.2, borderRadius: 2, background: '#1a1e1c' }} />
          </div>
        </div>

        <div style={{ position: 'absolute', left: 22, bottom: 30, zIndex: 500, display: 'flex', alignItems: 'center', gap: 8, height: 34, padding: '0 14px', borderRadius: 99, background: 'rgba(255,255,255,.88)', backdropFilter: 'blur(20px)', border: '1px solid rgba(20,40,31,.1)', boxShadow: '0 12px 30px -12px rgba(22,40,31,.35)' }}>
          <span style={{ width: 7, height: 7, borderRadius: 99, background: '#1f9d64', boxShadow: '0 0 10px #1f9d64' }} />
          <span style={{ font: '700 12px/1 Manrope', color: '#1a1e1c' }}>{nearbyLabel}</span>
        </div>

        {pm.toast && (
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 22, zIndex: 900, padding: '14px 18px', borderRadius: 18, background: '#e5f5ec', backdropFilter: 'blur(20px)', border: '1px solid #a8dcbf', animation: 'pmSlide .24s ease', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 20, height: 20, borderRadius: 99, background: '#1f9d64', color: '#fff', font: '800 11px/20px Manrope', textAlign: 'center', flex: 'none' }}>✓</span>
            <span style={{ font: '700 12.5px/1.4 Manrope', color: '#146b41', whiteSpace: 'nowrap' }}>{pm.toast}</span>
          </div>
        )}
      </div>
      </div>

      {pm.authPrompt && (
        <div onClick={pm.cancelAuthPrompt} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(20,24,22,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pmFade .2s ease' }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 380, borderRadius: 24, background: '#ffffff', border: '1px solid #e5e9e6', boxShadow: '0 30px 80px -20px rgba(22,40,31,.4)', animation: 'pmSlide .22s ease' }}
          >
            <AuthPromptContent pm={pm} />
          </div>
        </div>
      )}
    </div>
  );
}

function HeaderHeartIcon({ filled }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? '#1f9d64' : 'none'}>
      <path d="M12 20.5s-7.5-4.6-10-9.3C.5 7.8 2.3 4 6 4c2 0 3.5 1.1 6 3.5C14.5 5.1 16 4 18 4c3.7 0 5.5 3.8 4 7.2-2.5 4.7-10 9.3-10 9.3Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function NavIconButton({ active, onClick, label, children }) {
  return (
    <div
      onClick={onClick}
      title={label}
      style={{
        width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        background: active ? '#e5f5ec' : '#f6f9f7',
        border: '1px solid ' + (active ? '#a8dcbf' : '#e5e9e6'),
        color: active ? '#1f9d64' : '#6b7570',
        font: '800 12px/1 Manrope',
      }}
    >
      {children}
    </div>
  );
}
