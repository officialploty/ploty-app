export default function KindChoice({ pm }) {
  return (
    <div style={{ padding: '8px 20px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ font: '800 12px/1 Manrope', color: '#8b7bff', letterSpacing: '.16em' }}>STEP 2 OF 3</div>
          <div style={{ font: '800 22px/1.1 Manrope', color: '#fff', letterSpacing: '-.02em' }}>What are you listing?</div>
        </div>
        <div onClick={pm.cancelAdd} style={{ width: 32, height: 32, borderRadius: 99, background: 'rgba(255,255,255,.09)', color: 'rgba(255,255,255,.7)', font: '600 16px/32px Manrope', textAlign: 'center', cursor: 'pointer', flex: 'none' }}>×</div>
      </div>

      <KindCard
        onClick={() => pm.chooseKind('plot')}
        title="One plot"
        desc="A single plot, listed under your name. Goes live instantly."
        icon={<div style={{ width: 22, height: 22, borderRadius: 6, border: '2.5px solid #35e0c0' }} />}
      />

      <KindCard
        onClick={() => pm.chooseKind('layout')}
        title="Layout · many plots"
        desc="A developer project with multiple plots, listed under a company name. Reviewed before it goes live."
        icon={(
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, width: 22, height: 22 }}>
            <div style={{ borderRadius: 3, border: '2px solid #8b7bff' }} />
            <div style={{ borderRadius: 3, border: '2px solid #8b7bff' }} />
            <div style={{ borderRadius: 3, border: '2px solid #8b7bff' }} />
            <div style={{ borderRadius: 3, border: '2px solid #8b7bff' }} />
          </div>
        )}
      />

      <div onClick={pm.backToPlacing} style={{ textAlign: 'center', cursor: 'pointer', paddingTop: 4 }}>
        <span style={{ font: '700 13px/1 Manrope', color: 'rgba(255,255,255,.42)' }}>← Edit pin location</span>
      </div>
    </div>
  );
}

function KindCard({ onClick, title, desc, icon }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: 18, borderRadius: 20,
        background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', cursor: 'pointer',
      }}
    >
      <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
        {icon}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <span style={{ font: '800 16px/1.2 Manrope', color: '#fff', letterSpacing: '-.01em' }}>{title}</span>
        <span style={{ font: '400 12.5px/1.45 Manrope', color: 'rgba(255,255,255,.5)' }}>{desc}</span>
      </div>
    </div>
  );
}
