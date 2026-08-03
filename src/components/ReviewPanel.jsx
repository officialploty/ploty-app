import { kShort, sqftRange } from '../utils';

export default function ReviewPanel({ pm }) {
  const list = pm.pendingLayouts;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '18px 18px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ font: '800 24px/1 Manrope', color: '#fff', letterSpacing: '-.02em' }}>{list.length} layout{list.length === 1 ? '' : 's'} awaiting review</div>
        <div style={{ font: '500 12px/1.4 Manrope', color: 'rgba(255,255,255,.42)' }}>Only Ploty staff accounts can approve or reject listings here.</div>
      </div>
      <div className="pmScroll" style={{ flex: 1, overflowY: 'auto', padding: '0 18px 30px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.map((p) => <ReviewCard key={p.id} p={p} pm={pm} />)}
        {list.length === 0 && (
          <div style={{ padding: '40px 10px', textAlign: 'center', font: '500 13px/1.6 Manrope', color: 'rgba(255,255,255,.4)' }}>No layouts waiting for review.</div>
        )}
      </div>
    </div>
  );
}

function ReviewCard({ p, pm }) {
  return (
    <div style={{ borderRadius: 22, padding: 16, background: 'rgba(30,33,64,.55)', border: '1px solid rgba(255,255,255,.09)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <div style={{ font: '700 16px/1.2 Manrope', color: '#fff', letterSpacing: '-.01em' }}>{p.locality}</div>
          <div style={{ font: '500 11.5px/1 Manrope', color: 'rgba(255,255,255,.4)', letterSpacing: '.04em' }}>{p.area.toUpperCase()} · {p.city.toUpperCase()}</div>
        </div>
        <div style={{ padding: '5px 10px', borderRadius: 8, background: 'rgba(245,180,60,.16)', font: '800 10px/1 Manrope', color: '#f5b43c', letterSpacing: '.08em', flex: 'none' }}>PENDING</div>
      </div>

      <div style={{ display: 'flex', gap: 9 }}>
        <MiniStat label="DEVELOPER" value={p.owner} />
        <MiniStat label="SUBMITTED BY" value={p.submittedBy || 'Unknown'} />
      </div>
      <div style={{ display: 'flex', gap: 9 }}>
        <MiniStat label="PLOTS" value={p.plots + ' plots'} />
        <MiniStat label="SIZES" value={sqftRange(p.sizeMin, p.sizeMax) + ' sqft'} />
        <MiniStat label="PRICE/SQFT" value={kShort(p.ppsf) + '–' + kShort(p.ppsfMax)} />
      </div>

      <div style={{ font: '400 12.5px/1.5 Manrope', color: 'rgba(255,255,255,.55)' }}>{p.notes}</div>

      <div style={{ display: 'flex', gap: 9, paddingTop: 2 }}>
        <div
          onClick={() => pm.rejectLayout(p.id)}
          style={{ flex: 1, height: 44, borderRadius: 14, background: 'rgba(255,107,107,.12)', border: '1px solid rgba(255,107,107,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <span style={{ font: '700 13px/1 Manrope', color: '#ff9b9b' }}>Reject</span>
        </div>
        <div
          onClick={() => pm.approveLayout(p.id)}
          style={{ flex: 1.4, height: 44, borderRadius: 14, background: 'linear-gradient(110deg,#3ecf6e,#2fae59)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <span style={{ font: '800 13px/1 Manrope', color: '#0d1018' }}>Approve &amp; publish</span>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div style={{ flex: 1, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.09)', display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
      <span style={{ font: '600 9px/1 Manrope', color: 'rgba(255,255,255,.4)', letterSpacing: '.1em' }}>{label}</span>
      <span style={{ font: '700 12px/1.2 Manrope', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}
