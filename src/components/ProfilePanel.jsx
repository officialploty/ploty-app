export default function ProfilePanel({ pm }) {
  const { auth, saved, logout, openAuthPrompt, pendingLayouts, myListings, addMediaToListing, setTab } = pm;

  if (!auth) {
    return (
      <div style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 99, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 26, height: 26, borderRadius: 99, border: '2px solid rgba(255,255,255,.4)' }} />
        </div>
        <div style={{ font: '800 18px/1.3 Manrope', color: '#fff' }}>You're browsing as a guest</div>
        <div style={{ font: '400 13px/1.55 Manrope', color: 'rgba(255,255,255,.5)', maxWidth: 260 }}>Saving plots works without an account. Sign in when you're ready to contact a lister or list your own.</div>
        {saved.length > 0 && (
          <div style={{ padding: '12px 20px', borderRadius: 14, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
            <span style={{ font: '700 13px/1 Manrope', color: 'rgba(255,255,255,.7)' }}>{saved.length} plot{saved.length === 1 ? '' : 's'} saved on this device</span>
          </div>
        )}
        <div
          onClick={() => openAuthPrompt('profile')}
          style={{ height: 50, padding: '0 28px', borderRadius: 18, background: 'linear-gradient(110deg,#35e0c0,#8b7bff)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <span style={{ font: '800 14px/1 Manrope', color: '#0d1018' }}>Sign in</span>
        </div>
      </div>
    );
  }

  const initials = auth.name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: 99, background: 'linear-gradient(130deg,#35e0c0,#8b7bff)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <span style={{ font: '800 20px/1 Manrope', color: '#0d1018' }}>{initials}</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ font: '700 17px/1.2 Manrope', color: '#fff' }}>{auth.name}</div>
          <div style={{ font: '500 12px/1.4 Manrope', color: 'rgba(255,255,255,.45)' }}>{auth.email}</div>
        </div>
      </div>

      <div style={{ padding: 16, borderRadius: 18, background: 'linear-gradient(120deg,rgba(53,224,192,.13),rgba(139,123,255,.13))', border: '1px solid rgba(255,255,255,.13)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ font: '600 10.5px/1 Manrope', color: 'rgba(255,255,255,.5)', letterSpacing: '.12em' }}>SAVED PLOTS</span>
        <span style={{ font: '800 22px/1 Manrope', color: '#fff' }}>{saved.length}</span>
      </div>

      <div
        onClick={() => setTab('review')}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, padding: '0 16px', borderRadius: 16, background: 'rgba(139,123,255,.1)', border: '1px solid rgba(139,123,255,.3)', cursor: 'pointer' }}
      >
        <span style={{ font: '700 13.5px/1 Manrope', color: '#b4a9ff' }}>Review pending layouts</span>
        <span style={{ padding: '4px 9px', borderRadius: 99, background: pendingLayouts.length ? 'rgba(245,180,60,.2)' : 'rgba(255,255,255,.08)', font: '800 12px/1 Manrope', color: pendingLayouts.length ? '#f5b43c' : 'rgba(255,255,255,.4)' }}>{pendingLayouts.length}</span>
      </div>

      {myListings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ font: '700 11px/1 Manrope', color: 'rgba(255,255,255,.45)', letterSpacing: '.12em' }}>MY LISTINGS</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myListings.map((l) => <MyListingRow key={l.id} listing={l} onAddMedia={(files) => addMediaToListing(l, files)} />)}
          </div>
        </div>
      )}

      <div
        onClick={logout}
        style={{ height: 48, borderRadius: 16, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
      >
        <span style={{ font: '700 13.5px/1 Manrope', color: 'rgba(255,255,255,.65)' }}>Sign out</span>
      </div>

    </div>
  );
}

function MyListingRow({ listing, onAddMedia }) {
  const statusLabel = listing.kind === 'layout' ? (listing.status || 'approved') : 'live';
  const statusColor = statusLabel === 'pending' ? '#f5b43c' : statusLabel === 'rejected' ? '#ff9b9b' : '#8ef0dd';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)' }}>
      <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ font: '700 13.5px/1.2 Manrope', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.locality}</span>
        <span style={{ font: '600 11px/1 Manrope', color: 'rgba(255,255,255,.4)', letterSpacing: '.04em' }}>
          {listing.area?.toUpperCase()} · {listing.media.length} PHOTO{listing.media.length === 1 ? '' : 'S'} · <span style={{ color: statusColor }}>{statusLabel.toUpperCase()}</span>
        </span>
      </div>
      <label style={{ flex: 'none', height: 36, padding: '0 14px', borderRadius: 12, background: 'rgba(53,224,192,.12)', border: '1px solid rgba(53,224,192,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <span style={{ font: '700 11.5px/1 Manrope', color: '#35e0c0' }}>Add photos</span>
        <input
          type="file" multiple accept="image/*,video/*" style={{ display: 'none' }}
          onChange={(e) => { onAddMedia(Array.from(e.target.files || [])); e.target.value = ''; }}
        />
      </label>
    </div>
  );
}
