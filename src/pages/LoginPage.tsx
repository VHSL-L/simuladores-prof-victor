import { useEffect, useState, type FormEvent } from 'react';
import { PageMetadata } from '../components/PageMetadata';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [available, setAvailable] = useState<boolean | null>(null);
  const requested = new URLSearchParams(window.location.search).get('next');
  const next = requested && ['/rcp', '/choque', '/ventilacao-mecanica'].includes(requested) ? requested : '/';

  useEffect(() => {
    let active = true;
    fetch('/api/auth/session', { cache: 'no-store' }).then(async response => {
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (!active) return;
      if (data.user) window.location.replace(next);
      else setAvailable(data.available === true);
    }).catch(() => { if (active) setAvailable(false); });
    return () => { active = false; };
  }, [next]);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown(value => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function submit(action: 'send-code' | 'verify-code') {
    if (busy) return;
    setError(''); setNotice('');
    if (!/^[a-z0-9]+(?:[._+-][a-z0-9]+)*@aluno\.unc\.br$/i.test(email.trim())) {
      setError('Use seu e-mail @aluno.unc.br. O acesso para outros e-mails ainda não está disponível.'); return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/auth/${action}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code, next }),
      });
      const data = await response.json();
      if (!response.ok) {
        const retry = Number(response.headers.get('Retry-After'));
        if (response.status === 429 && retry > 0) setCooldown(retry);
        throw new Error(data.error || 'Não foi possível continuar. Tente novamente.');
      }
      if (action === 'verify-code') { window.location.assign(next); return; }
      setStep('code'); setCode(''); setCooldown(data.retryAfter ?? 60);
      setNotice('Código enviado. Confira sua caixa de entrada e a pasta de spam.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível conectar. Tente novamente.');
    } finally { setBusy(false); }
  }
  function onSubmit(event: FormEvent) { event.preventDefault(); void submit(step === 'email' ? 'send-code' : 'verify-code'); }

  return <>
    <PageMetadata title="Entrar" description="Acesse os simuladores com seu e-mail de aluno da UNC, sem senha." />
    <section className="container login-page">
      <div className="login-intro">
        <p className="eyebrow">Área do aluno</p>
        <h1>Acesso aos simuladores</h1>
        <p className="lead">Entre com seu e-mail institucional para iniciar a prática.</p>
      </div>
      <div className="login-layout">
      <div className="login-card">
        <div className="login-card-heading"><h2>{step === 'email' ? 'Identificação' : 'Confirme seu acesso'}</h2><span>{step === 'email' ? '01' : '02'} / 02</span></div>
        <p>{step === 'email' ? 'Enviaremos um código de 6 dígitos para seu e-mail. Não é necessário criar uma senha.' : <>Enviamos um código para <strong>{email.trim().toLowerCase()}</strong>. Ele vale por 10 minutos; use sempre o mais recente.</>}</p>
        {available === false && <p className="auth-message" role="status">O acesso por e-mail está em preparação ou temporariamente indisponível. Tente novamente mais tarde.</p>}
        <form onSubmit={onSubmit} aria-busy={busy}>
          {step === 'email' ? <>
            <label htmlFor="student-email">E-mail institucional</label>
            <input id="student-email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required maxLength={254}
              placeholder="seunome@aluno.unc.br" value={email} onChange={event => setEmail(event.target.value)} disabled={busy} />
          </> : <>
            <label htmlFor="access-code">Código de acesso</label>
            <input id="access-code" className="code-input" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} minLength={6} required autoFocus
              placeholder="000000" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} disabled={busy} />
          </>}
          {error && <p className="auth-message auth-error" role="alert">{error}</p>}
          {notice && <p className="auth-message" role="status">{notice}</p>}
          <button className="button primary" type="submit" disabled={busy || available !== true || (step === 'email' && cooldown > 0)}>
            {busy ? 'Aguarde…' : available === null ? 'Verificando acesso…' : step === 'email' ? cooldown > 0 ? `Aguarde ${cooldown}s` : 'Receber código' : 'Entrar nos simuladores'}
          </button>
          {step === 'code' && <div className="login-actions">
            <button type="button" className="plain-button" disabled={busy || cooldown > 0} onClick={() => void submit('send-code')}>
              {cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar código'}
            </button>
            <button type="button" className="plain-button" disabled={busy} onClick={() => { setStep('email'); setCode(''); setError(''); setNotice(''); }}>Corrigir e-mail</button>
          </div>}
        </form>
        <p className="login-privacy">Usamos seu e-mail para verificar seu acesso. Em um computador compartilhado, saia ao terminar. <a href="/privacidade">Saiba mais</a>.</p>
      </div>
      <aside className="login-sidebar" aria-label="Informações sobre os simuladores">
        <div className="practice-index">
          <p className="eyebrow">Biblioteca de prática</p>
          <h2>Conteúdos disponíveis</h2>
          <ul>
            <li><span aria-hidden="true">01</span>Ventilação Mecânica</li>
            <li><span aria-hidden="true">02</span>Choque</li>
            <li><span aria-hidden="true">03</span>RCP</li>
          </ul>
          <p className="practice-author">Prof. Victor Hugo Sant&apos;Ana<br /><span>Medicina intensiva e ensino médico</span></p>
        </div>
        <div className="login-external"><h3>Acesso institucional</h3><p>Gratuito para alunos com e-mail <strong>@aluno.unc.br</strong>.</p><p>O acesso para outros públicos ainda não está disponível. Acompanhe as novidades no <a href="https://www.instagram.com/victorhugosantana/" target="_blank" rel="noopener noreferrer">Instagram do professor</a>.</p></div>
      </aside>
      </div>
    </section>
  </>;
}
