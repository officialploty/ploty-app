const COPY = {
  call: { title: 'Contact the lister', body: 'Sign in to view contact details and reach out directly.' },
  profile: { title: 'Sign in to Ploty', body: 'Sign in to manage your saved plots and listings in one place.' },
  register: { title: 'Register a plot', body: 'Sign in to list a plot or layout on Ploty.' },
};

export default function AuthPromptContent({ pm }) {
  const reason = pm.authPrompt?.reason || 'profile';
  const copy = COPY[reason];

  return (
    <div style={{ padding: '10px 22px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(130deg,#35e0c0,#8b7bff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 16, height: 16, borderRadius: 99, border: '2px solid #0d1018' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ font: '800 20px/1.25 Manrope', color: '#fff', letterSpacing: '-.01em' }}>{copy.title}</div>
        <div style={{ font: '400 13px/1.55 Manrope', color: 'rgba(255,255,255,.55)' }}>{copy.body}</div>
      </div>

      <div
        onClick={pm.loginWithGoogle}
        style={{
          height: 52, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          background: '#fff', cursor: 'pointer',
        }}
      >
        <GoogleGlyph />
        <span style={{ font: '700 15px/1 Manrope', color: '#1f1f1f', letterSpacing: '-.01em' }}>Continue with Google</span>
      </div>

      <div onClick={pm.cancelAuthPrompt} style={{ textAlign: 'center', cursor: 'pointer' }}>
        <span style={{ font: '700 13px/1 Manrope', color: 'rgba(255,255,255,.4)' }}>Maybe later</span>
      </div>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z" />
    </svg>
  );
}
