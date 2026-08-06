const INK = '#1a1e1c';
const SUB = '#6b7570';

export default function ProfilePanel({ pm }) {
  const { auth, saved, logout, openAuthPrompt, pendingLayouts, myListings, addMediaToListing, startEdit, setTab } = pm;

  if (!auth) {
    return (
      <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', maxWidth: 340 }}>
          <div style={{ width: 64, height: 64, borderRadius: 99, background: '#f6f9f7', border: '1px solid #e5e9e6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 26, height: 26, borderRadius: 99, border: '2px solid #8a958f' }} />
          </div>
          <div style={{ font: '800 18px/1.3 Manrope', color: INK }}>You're browsing as a guest</div>
          <div style={{ font: '400 13px/1.55 Manrope', color: SUB }}>Saving plots works without an account. Sign in when you're ready to contact a lister or list your own.</div>
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
      </div>
    );
  }

  const initials = auth.name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';
  const memberSince = auth.memberSince
    ? new Date(auth.memberSince).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '32px 32px 60px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 68, height: 68, borderRadius: 99, background: 'linear-gradient(130deg,#1f9d64,#8355c9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <span style={{ font: '800 24px/1 Manrope', color: '#ffffff' }}>{initials}</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ font: '800 21px/1.25 Manrope', color: INK, letterSpacing: '-.01em' }}>{auth.name}</div>
            <div style={{ font: '500 13px/1.5 Manrope', color: SUB }}>{auth.email}</div>
            {memberSince && <div style={{ font: '500 11.5px/1.5 Manrope', color: '#8a958f' }}>Member since {memberSince}</div>}
          </div>
        </div>
        <div
          onClick={logout}
          style={{ height: 44, padding: '0 20px', borderRadius: 14, background: '#f6f9f7', border: '1px solid #e5e9e6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none' }}
        >
          <span style={{ font: '700 13px/1 Manrope', color: '#495650' }}>Sign out</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <StatCard label="SAVED PLOTS" value={saved.length} bg="linear-gradient(120deg,#e5f5ec,#f1ecfa)" valueColor={INK} />
        <StatCard label="MY LISTINGS" value={myListings.length} bg="#f6f9f7" border="#e5e9e6" valueColor={INK} />
        <StatCard
          label="REVIEW PENDING LAYOUTS" value={pendingLayouts.length}
          bg="#f1ecfa" border="#d9caf0" valueColor="#6a3fb0"
          onClick={() => setTab('review')}
        />
      </div>

      {myListings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span style={{ font: '700 12px/1 Manrope', color: SUB, letterSpacing: '.12em' }}>MY LISTINGS</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
            {myListings.map((l) => (
              <MyListingCard key={l.id} listing={l} onAddMedia={(files) => addMediaToListing(l, files)} onEdit={() => startEdit(l)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, bg, border, valueColor, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: 18, borderRadius: 18, background: bg, border: '1px solid ' + (border || 'transparent'),
        display: 'flex', flexDirection: 'column', gap: 6, cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <span style={{ font: '600 10.5px/1 Manrope', color: SUB, letterSpacing: '.1em' }}>{label}</span>
      <span style={{ font: '800 26px/1 Manrope', color: valueColor }}>{value}</span>
    </div>
  );
}

function MyListingCard({ listing, onAddMedia, onEdit }) {
  const statusLabel = listing.kind === 'layout' ? (listing.status || 'approved') : 'live';
  const statusColor = statusLabel === 'pending' ? '#d98a1f' : statusLabel === 'rejected' ? '#d64545' : '#146b41';
  const thumb = listing.media[0];
  const thumbBg = thumb ? (thumb.url ? 'url("' + thumb.url + '") center/cover' + (thumb.bg ? ', ' + thumb.bg : '') : thumb.bg) : null;

  return (
    <div style={{ display: 'flex', gap: 12, padding: 12, borderRadius: 18, background: '#ffffff', border: '1px solid #e8ece9' }}>
      <div style={{ width: 64, height: 64, borderRadius: 12, flex: 'none', background: thumbBg || '#f2f5f3', backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid #e8ece9' }} />
      <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ font: '700 13.5px/1.25 Manrope', color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{listing.locality}</div>
          <div style={{ font: '600 10.5px/1.4 Manrope', color: '#8a958f', letterSpacing: '.03em' }}>
            {listing.area?.toUpperCase()} · {listing.media.length} PHOTO{listing.media.length === 1 ? '' : 'S'} · <span style={{ color: statusColor }}>{statusLabel.toUpperCase()}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div onClick={onEdit} style={{ flex: 1, height: 32, borderRadius: 10, background: '#f1ecfa', border: '1px solid #d9caf0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <span style={{ font: '700 11px/1 Manrope', color: '#6a3fb0' }}>Edit</span>
          </div>
          <label style={{ flex: 1, height: 32, borderRadius: 10, background: '#e5f5ec', border: '1px solid #a8dcbf', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <span style={{ font: '700 11px/1 Manrope', color: '#1f9d64' }}>Add photos</span>
            <input
              type="file" multiple accept="image/*,video/*" style={{ display: 'none' }}
              onChange={(e) => { onAddMedia(Array.from(e.target.files || [])); e.target.value = ''; }}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
