import PlotCard from './PlotCard';

export default function SavedPanel({ pm }) {
  const { plots, saved, open, toggleSave, shareListing } = pm;
  const list = plots.filter((p) => saved.includes(p.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '18px 18px 12px' }}>
        <div style={{ font: '800 24px/1 Manrope', color: '#fff', letterSpacing: '-.02em' }}>{list.length} saved plot{list.length === 1 ? '' : 's'}</div>
      </div>
      <div className="pmScroll" style={{ flex: 1, overflowY: 'auto', padding: '0 18px 30px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.map((p) => (
          <PlotCard key={p.id} p={p} onClick={() => open(p.id)} saved={saved} onToggleSave={toggleSave} onShare={shareListing} />
        ))}
        {list.length === 0 && (
          <div style={{ padding: '40px 10px', textAlign: 'center', font: '500 13px/1.6 Manrope', color: 'rgba(255,255,255,.4)' }}>Tap the ♥ on any plot to save it here.</div>
        )}
      </div>
    </div>
  );
}
