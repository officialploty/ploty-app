export default function KindChoice({ pm }) {
  return (
    <div style={{ padding: '8px 20px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ font: '800 12px/1 Manrope', color: '#8355c9', letterSpacing: '.16em' }}>STEP 2 OF 3</div>
          <div style={{ font: '800 22px/1.1 Manrope', color: '#1a1e1c', letterSpacing: '-.02em' }}>What are you listing?</div>
        </div>
        <div onClick={pm.cancelAdd} style={{ width: 32, height: 32, borderRadius: 99, background: '#eef1ef', color: '#495650', font: '600 16px/32px Manrope', textAlign: 'center', cursor: 'pointer', flex: 'none' }}>×</div>
      </div>

      <KindCard
        onClick={() => pm.chooseKind('plot')}
        title="One plot"
        desc="A single plot, listed under your name. Goes live instantly."
        icon={<div style={{ width: 22, height: 22, borderRadius: 6, border: '2.5px solid #1f9d64' }} />}
      />

      <KindCard
        onClick={() => pm.chooseKind('layout')}
        title="Layout · many plots"
        desc="A developer project with multiple plots, listed under a company name. Reviewed before it goes live."
        icon={(
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, width: 22, height: 22 }}>
            <div style={{ borderRadius: 3, border: '2px solid #8355c9' }} />
            <div style={{ borderRadius: 3, border: '2px solid #8355c9' }} />
            <div style={{ borderRadius: 3, border: '2px solid #8355c9' }} />
            <div style={{ borderRadius: 3, border: '2px solid #8355c9' }} />
          </div>
        )}
      />

      <div onClick={pm.backToPlacing} style={{ textAlign: 'center', cursor: 'pointer', paddingTop: 4 }}>
        <span style={{ font: '700 13px/1 Manrope', color: '#6b7570' }}>← Edit pin location</span>
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
        background: '#ffffff', border: '1px solid #e5e9e6', boxShadow: '0 2px 10px rgba(22,40,31,.06)', cursor: 'pointer',
      }}
    >
      <div style={{ width: 52, height: 52, borderRadius: 16, background: '#f6f9f7', border: '1px solid #e8ece9', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
        {icon}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <span style={{ font: '800 16px/1.2 Manrope', color: '#1a1e1c', letterSpacing: '-.01em' }}>{title}</span>
        <span style={{ font: '400 12.5px/1.45 Manrope', color: '#6b7570' }}>{desc}</span>
      </div>
    </div>
  );
}
