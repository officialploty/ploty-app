import { useState } from 'react';
import { useIsDesktop } from '../useIsDesktop';
import SavedPanel from './SavedPanel';
import ReviewPanel from './ReviewPanel';

const INK = '#1a1e1c';
const SUB = '#6b7570';

const NAV_ITEMS = [
  { tab: 'profile', label: 'Overview' },
  { tab: 'listings', label: 'My Listings' },
  { tab: 'saved', label: 'Saved Plots' },
  { tab: 'review', label: 'Review Queue' },
  { tab: 'account', label: 'Account' },
];

export default function ProfilePanel({ pm }) {
  const { auth, saved, openAuthPrompt } = pm;
  const isDesktop = useIsDesktop();

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

  const activeTab = NAV_ITEMS.some((n) => n.tab === pm.tab) ? pm.tab : 'profile';

  return (
    <div style={{ display: 'flex', flexDirection: isDesktop ? 'row' : 'column', minHeight: '100%' }}>
      <ProfileSidebar pm={pm} isDesktop={isDesktop} activeTab={activeTab} />
      <div style={{ flex: 1, minWidth: 0, maxWidth: 960, padding: isDesktop ? '32px 32px 60px' : '0 0 40px' }}>
        {activeTab === 'profile' && <OverviewSection pm={pm} />}
        {activeTab === 'listings' && <ListingsSection pm={pm} />}
        {activeTab === 'saved' && <SavedPanel pm={pm} />}
        {activeTab === 'review' && <ReviewPanel pm={pm} />}
        {activeTab === 'account' && <AccountSection pm={pm} />}
      </div>
    </div>
  );
}

function ProfileSidebar({ pm, isDesktop, activeTab }) {
  const { auth, pendingLayouts } = pm;
  const initials = auth.name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';

  const items = NAV_ITEMS.map((n) => ({
    ...n,
    badge: n.tab === 'review' && pendingLayouts.length ? pendingLayouts.length : null,
  }));

  if (isDesktop) {
    return (
      <div style={{ width: 220, flex: 'none', padding: '32px 12px 32px 0', display: 'flex', flexDirection: 'column', gap: 24, borderRight: '1px solid #e5e9e6' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px' }}>
          <div style={{ width: 40, height: 40, borderRadius: 99, background: 'linear-gradient(130deg,#1f9d64,#8355c9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <span style={{ font: '800 14px/1 Manrope', color: '#ffffff' }}>{initials}</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ font: '700 13px/1.3 Manrope', color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{auth.name}</div>
            <div style={{ font: '500 11px/1.3 Manrope', color: SUB, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{auth.email}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {items.map((n) => <SidebarItem key={n.tab} n={n} active={activeTab === n.tab} onClick={() => pm.setTab(n.tab)} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="pmScroll" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '14px 18px', borderBottom: '1px solid #e5e9e6' }}>
      {items.map((n) => (
        <div
          key={n.tab}
          onClick={() => pm.setTab(n.tab)}
          style={{
            flex: 'none', display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', borderRadius: 99, cursor: 'pointer',
            background: activeTab === n.tab ? 'linear-gradient(110deg,#1f9d64,#8355c9)' : '#f6f9f7',
            border: '1px solid ' + (activeTab === n.tab ? 'transparent' : '#e5e9e6'),
          }}
        >
          <span style={{ font: '700 12.5px/1 Manrope', color: activeTab === n.tab ? '#ffffff' : '#495650', whiteSpace: 'nowrap' }}>{n.label}</span>
          {n.badge && (
            <span style={{ minWidth: 16, height: 16, padding: '0 4px', borderRadius: 99, background: activeTab === n.tab ? 'rgba(255,255,255,.3)' : '#d98a1f', color: '#fff', font: '800 9px/16px Manrope', textAlign: 'center' }}>{n.badge}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function SidebarItem({ n, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 40, padding: '0 10px', borderRadius: 12, cursor: 'pointer',
        background: active ? '#e5f5ec' : 'transparent',
      }}
    >
      <span style={{ font: '700 13px/1 Manrope', color: active ? '#146b41' : '#495650' }}>{n.label}</span>
      {n.badge && (
        <span style={{ minWidth: 18, height: 18, padding: '0 5px', borderRadius: 99, background: '#d98a1f', color: '#fff', font: '800 10px/18px Manrope', textAlign: 'center' }}>{n.badge}</span>
      )}
    </div>
  );
}

function OverviewSection({ pm }) {
  const { auth, saved, myListings, pendingLayouts, setTab } = pm;
  const initials = auth.name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';
  const memberSince = auth.memberSince
    ? new Date(auth.memberSince).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : null;

  return (
    <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 20 }}>
        <div style={{ width: 68, height: 68, borderRadius: 99, background: 'linear-gradient(130deg,#1f9d64,#8355c9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <span style={{ font: '800 24px/1 Manrope', color: '#ffffff' }}>{initials}</span>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ font: '800 21px/1.25 Manrope', color: INK, letterSpacing: '-.01em' }}>{auth.name}</div>
          <div style={{ font: '500 13px/1.5 Manrope', color: SUB }}>{auth.email}</div>
          {memberSince && <div style={{ font: '500 11.5px/1.5 Manrope', color: '#8a958f' }}>Member since {memberSince}</div>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <StatCard label="SAVED PLOTS" value={saved.length} bg="linear-gradient(120deg,#e5f5ec,#f1ecfa)" valueColor={INK} onClick={() => setTab('saved')} />
        <StatCard label="MY LISTINGS" value={myListings.length} bg="#f6f9f7" border="#e5e9e6" valueColor={INK} onClick={() => setTab('listings')} />
        <StatCard label="REVIEW PENDING LAYOUTS" value={pendingLayouts.length} bg="#f1ecfa" border="#d9caf0" valueColor="#6a3fb0" onClick={() => setTab('review')} />
      </div>
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

function ListingsSection({ pm }) {
  const { myListings, addMediaToListing, startEdit } = pm;
  return (
    <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <span style={{ font: '800 20px/1 Manrope', color: INK, letterSpacing: '-.01em' }}>My Listings</span>
      {myListings.length === 0 ? (
        <div style={{ padding: '40px 10px', textAlign: 'center', font: '500 13px/1.6 Manrope', color: '#8a958f' }}>You haven't registered any plots or layouts yet.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 }}>
          {myListings.map((l) => (
            <MyListingCard key={l.id} listing={l} onAddMedia={(files) => addMediaToListing(l, files)} onEdit={() => startEdit(l)} />
          ))}
        </div>
      )}
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

function AccountSection({ pm }) {
  const { logout, deleteAccount, deletingAccount, myListings } = pm;
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  return (
    <div style={{ padding: '20px 20px 0', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 480 }}>
      <span style={{ font: '800 20px/1 Manrope', color: INK, letterSpacing: '-.01em' }}>Account</span>

      <div
        onClick={logout}
        style={{ height: 48, borderRadius: 16, background: '#f6f9f7', border: '1px solid #e5e9e6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
      >
        <span style={{ font: '700 13.5px/1 Manrope', color: '#495650' }}>Sign out</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 18, borderRadius: 18, background: '#fbe9e9', border: '1px solid #f0c6c6' }}>
        <div style={{ font: '700 13px/1 Manrope', color: '#d64545' }}>Delete account</div>
        <div style={{ font: '500 12px/1.55 Manrope', color: '#a13a3a' }}>
          Permanently deletes your account, sign-in, and everything you've listed{myListings.length > 0 ? ` (${myListings.length} listing${myListings.length === 1 ? '' : 's'}, all their photos, and any saves/favorites pointing at them)` : ''}. This can't be undone.
        </div>

        {!confirming ? (
          <div
            onClick={() => setConfirming(true)}
            style={{ height: 44, borderRadius: 14, background: '#ffffff', border: '1px solid #d64545', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <span style={{ font: '700 13px/1 Manrope', color: '#d64545' }}>Delete my account</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ font: '600 12px/1.5 Manrope', color: '#a13a3a' }}>Type <strong>DELETE</strong> to confirm — this is permanent.</div>
            <input
              value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE"
              style={{ height: 44, padding: '0 14px', borderRadius: 12, background: '#ffffff', border: '1px solid #f0c6c6', outline: 0, font: '700 13px/1 Manrope', color: '#1a1e1c' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <div
                onClick={() => { setConfirming(false); setConfirmText(''); }}
                style={{ flex: 1, height: 44, borderRadius: 14, background: '#ffffff', border: '1px solid #e5e9e6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <span style={{ font: '700 13px/1 Manrope', color: '#495650' }}>Cancel</span>
              </div>
              <div
                onClick={() => { if (confirmText === 'DELETE' && !deletingAccount) deleteAccount(); }}
                style={{
                  flex: 1, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: confirmText === 'DELETE' && !deletingAccount ? '#d64545' : '#eef1ef',
                  cursor: confirmText === 'DELETE' && !deletingAccount ? 'pointer' : 'default',
                }}
              >
                <span style={{ font: '800 13px/1 Manrope', color: confirmText === 'DELETE' && !deletingAccount ? '#ffffff' : '#8a958f' }}>
                  {deletingAccount ? 'Deleting…' : 'Confirm delete'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
