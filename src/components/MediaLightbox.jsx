import { useEffect, useState } from 'react';

// Full-screen photo/video viewer. Zoom relies on the browser's native
// pinch-to-zoom on the <img> itself (our viewport meta tag doesn't disable
// user-scalable), so no custom pinch/zoom JS is needed here.
export default function MediaLightbox({ media, index, onClose }) {
  const [i, setI] = useState(index);
  const m = media[i];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setI((x) => Math.min(media.length - 1, x + 1));
      if (e.key === 'ArrowLeft') setI((x) => Math.max(0, x - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [media.length, onClose]);

  if (!m) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(6,7,14,.94)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'pinch-zoom',
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {m.type === 'video' ? (
          <video src={m.url} controls autoPlay style={{ maxWidth: '94vw', maxHeight: '86vh', borderRadius: 12 }} />
        ) : (
          <img src={m.url} alt="" style={{ maxWidth: '94vw', maxHeight: '86vh', objectFit: 'contain', borderRadius: 12 }} />
        )}

        <div
          onClick={onClose}
          style={{ position: 'absolute', top: 18, right: 18, width: 40, height: 40, borderRadius: 99, background: 'rgba(255,255,255,.1)', color: '#fff', font: '600 20px/40px Manrope', textAlign: 'center', cursor: 'pointer' }}
        >×</div>

        <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', font: '700 12px/1 Manrope', color: 'rgba(255,255,255,.6)', letterSpacing: '.08em' }}>
          {i + 1} / {media.length}
        </div>

        {i > 0 && (
          <div
            onClick={(e) => { e.stopPropagation(); setI(i - 1); }}
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: 99, background: 'rgba(255,255,255,.1)', color: '#fff', font: '700 20px/44px Manrope', textAlign: 'center', cursor: 'pointer' }}
          >‹</div>
        )}
        {i < media.length - 1 && (
          <div
            onClick={(e) => { e.stopPropagation(); setI(i + 1); }}
            style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, borderRadius: 99, background: 'rgba(255,255,255,.1)', color: '#fff', font: '700 20px/44px Manrope', textAlign: 'center', cursor: 'pointer' }}
          >›</div>
        )}
      </div>
    </div>
  );
}
