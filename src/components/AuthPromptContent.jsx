import { useState } from 'react';

const COPY = {
  call: { title: 'Contact the lister', body: 'Verify your number to view contact details and reach out directly.' },
  profile: { title: 'Sign in to Ploty', body: 'Verify your number to manage your saved plots and listings in one place.' },
  register: { title: 'Register a plot', body: 'Verify your phone number to list a plot or layout on Ploty.' },
};

const fieldStyle = {
  height: 50, padding: '0 16px', borderRadius: 16, background: 'rgba(255,255,255,.06)',
  border: '1px solid rgba(255,255,255,.12)', outline: 0, font: '600 15px/1 Manrope', color: '#fff',
};

export default function AuthPromptContent({ pm }) {
  const [step, setStep] = useState('details');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const reason = pm.authPrompt?.reason || 'profile';
  const copy = COPY[reason];
  const canSendOtp = name.trim().length > 0 && phone.trim().replace(/[^0-9]/g, '').length >= 7;
  const canVerify = otp.trim().replace(/[^0-9]/g, '').length >= 4;

  const sendOtp = () => {
    if (!canSendOtp) return;
    setStep('otp');
    pm.flash('OTP sent to ' + phone.trim());
  };

  const verify = () => {
    if (!canVerify) return;
    pm.login(name, phone);
  };

  return (
    <div style={{ padding: '10px 22px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(130deg,#35e0c0,#8b7bff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 16, height: 16, borderRadius: 99, border: '2px solid #0d1018' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ font: '800 20px/1.25 Manrope', color: '#fff', letterSpacing: '-.01em' }}>{copy.title}</div>
        <div style={{ font: '400 13px/1.55 Manrope', color: 'rgba(255,255,255,.55)' }}>{copy.body}</div>
      </div>

      {step === 'details' ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={fieldStyle} />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" inputMode="tel" style={fieldStyle} />
          </div>

          <div
            onClick={sendOtp}
            style={{
              height: 52, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: canSendOtp ? 'linear-gradient(110deg,#35e0c0,#8b7bff)' : 'rgba(255,255,255,.08)',
              cursor: canSendOtp ? 'pointer' : 'default',
            }}
          >
            <span style={{ font: '800 15px/1 Manrope', color: canSendOtp ? '#0d1018' : 'rgba(255,255,255,.35)', letterSpacing: '-.01em' }}>Send OTP</span>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)' }}>
            <span style={{ font: '600 13px/1 Manrope', color: 'rgba(255,255,255,.7)' }}>{phone.trim()}</span>
            <span onClick={() => setStep('details')} style={{ font: '700 12px/1 Manrope', color: '#35e0c0', cursor: 'pointer' }}>Change number</span>
          </div>

          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            placeholder="Enter OTP"
            inputMode="numeric"
            style={{ ...fieldStyle, letterSpacing: '.3em', font: '700 18px/1 ui-monospace,Menlo,monospace', textAlign: 'center' }}
          />
          <div style={{ font: '500 11.5px/1.4 Manrope', color: 'rgba(255,255,255,.35)', textAlign: 'center', marginTop: -8 }}>
            Prototype demo — enter any {'4+'} digit code to verify
          </div>

          <div
            onClick={verify}
            style={{
              height: 52, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: canVerify ? 'linear-gradient(110deg,#35e0c0,#8b7bff)' : 'rgba(255,255,255,.08)',
              cursor: canVerify ? 'pointer' : 'default',
            }}
          >
            <span style={{ font: '800 15px/1 Manrope', color: canVerify ? '#0d1018' : 'rgba(255,255,255,.35)', letterSpacing: '-.01em' }}>Verify &amp; continue</span>
          </div>
          <div onClick={sendOtp} style={{ textAlign: 'center', cursor: 'pointer' }}>
            <span style={{ font: '700 12.5px/1 Manrope', color: 'rgba(255,255,255,.4)' }}>Resend code</span>
          </div>
        </>
      )}

      <div onClick={pm.cancelAuthPrompt} style={{ textAlign: 'center', cursor: 'pointer' }}>
        <span style={{ font: '700 13px/1 Manrope', color: 'rgba(255,255,255,.4)' }}>Maybe later</span>
      </div>
    </div>
  );
}
