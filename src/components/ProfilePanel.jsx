export default function ProfilePanel({ pm }) {
  const { auth, saved, logout, openAuthPrompt, pendingLayouts, myListings, addMediaToListing, startEdit, setTab } = pm;

  if (!auth) {
    return (
      <div style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 99, background: '#f6f9f7', border: '1px solid #e5e9e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 26, height: 26, borderRadius: 99, border: '2px solid #8a958f' }} />
        </div>
        <div style={{ font: '800 18px/1.3 Manrope', color: '#1a1e1c' }}>You're browsing as a guest</div>
        <div style={{ font: '400 13px/1.55 Manrope', color: '#6b7570', maxWidth: 260 }}>Saving plots works without an account. Sign in when you're ready to contact a lister or list your own.</div>
        {saved.length > 0 && (
          <div style={{ padding: '12px 20px', borderRadius: 14, background: '#f6f9f7', border: '1px solid #e5e9e6' }}>
            <span style={{ font: '700 13px/1 Manrope', color: '#495650' }}>{saved.length} plot{saved.length === 1 ? '' : 's'} saved on this device</span>
          </div>
        )}
        <div
          onClick={() => openAuthPrompt('profile')}
          style={{ height: 50, padding: '0 28px', borderRadius: 18, background: 'linear-gradient(110deg,#1f9d64,#8355c9)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <span style={{ font: '800 14px/1 Manrope', color: '#ffffff' }}>Sign in</span>
        </div>
      </div>
    );
  }

  const initials = auth.name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: 99, background: 'linear-gradient(130deg,#1f9d64,#8355c9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <span style={{ font: '800 20px/1 Manrope', color: '#ffffff' }}>{initials}</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ font: '700 17px/1.2 Manrope', color: '#1a1e1c' }}>{auth.name}</div>
          <div style={{ font: '500 12px/1.4 Manrope', color: '#6b7570' }}>{auth.email}</div>
        </div>
      </div>

      <div style={{ padding: 16, borderRadius: 18, background: 'linear-gradient(120deg,#e5f5ec,#f1ecfa)', border: '1px solid #e5e9e6', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ font: '600 10.5px/1 Manrope', color: '#6b7570', letterSpacing: '.12em' }}>SAVED PLOTS</span>
        <span style={{ font: '800 22px/1 Manrope', color: '#1a1e1c' }}>{saved.length}</span>
      </div>

      <div
        onClick={() => setTab('review')}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, padding: '0 16px', borderRadius: 16, background: '#f1ecfa', border: '1px solid #d9caf0', cursor: 'pointer' }}
      >
        <span style={{ font: '700 13.5px/1 Manrope', color: '#6a3fb0' }}>Review pending layouts</span>
        <span style={{ padding: '4px 9px', borderRadius: 99, background: pendingLayouts.length ? '#fdf3e2' : '#eef1ef', font: '800 12px/1 Manrope', color: pendingLayouts.length ? '#d98a1f' : '#8a958f' }}>{pendingLayouts.length}</span>
      </div>

      {myListings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <span style={{ font: '700 11px/1 Manrope', color: '#6b7570', letterSpacing: '.12em' }}>MY LISTINGS</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {myListings.map((l) => (
              <MyListingRow key={l.id} listing={l} onAddMedia={(files) => addMediaToListing(l, files)} onEdit={() => startEdit(l)} />
            ))}
          </div>
        </div>
      )}

      <div
        onClick={logout}
        style={{ height: 48, borderRadius: 16, background: '#f6f9f7', border: '1px solid #e5e9e6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
      >
        <span style={{ font: '700 13.5px/1 Manrope', color: '#495650' }}>Sign out</span>
      </div>

    </div>
  );
}

function MyListingRow({ listing, onAddMedia, onEdit }) {
  const statusLabel = listing.kind === 'layout' ? (listing.status || 'approved') : 'live';
  const statusColor = statusLabel === 'pending' ? '#d98a1f' : statusLabel === 'rejected' ? '#d64545' : '#146b41';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 16, background: '#f6f9f7', border: '1px solid #eef1ef' }}>
      <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ font: '700 13.5px/1.2 Manrope', color: '#1a1e1c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.locality}</span>
        <span style={{ font: '600 11px/1 Manrope', color: '#8a958f', letterSpacing: '.04em' }}>
          {listing.area?.toUpperCase()} · {listing.media.length} PHOTO{listing.media.length === 1 ? '' : 'S'} · <span style={{ color: statusColor }}>{statusLabel.toUpperCase()}</span>
        </span>
      </div>
      <div onClick={onEdit} style={{ flex: 'none', height: 36, padding: '0 14px', borderRadius: 12, background: '#f1ecfa', border: '1px solid #d9caf0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <span style={{ font: '700 11.5px/1 Manrope', color: '#6a3fb0' }}>Edit</span>
      </div>
      <label style={{ flex: 'none', height: 36, padding: '0 14px', borderRadius: 12, background: '#e5f5ec', border: '1px solid #a8dcbf', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <span style={{ font: '700 11.5px/1 Manrope', color: '#1f9d64' }}>Add photos</span>
        <input
          type="file" multiple accept="image/*,video/*" style={{ display: 'none' }}
          onChange={(e) => { onAddMedia(Array.from(e.target.files || [])); e.target.value = ''; }}
        />
      </label>
    </div>
  );
}
