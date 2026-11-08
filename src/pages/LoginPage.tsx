import { useEffect, useRef, useState } from 'react';
import { PageMetadata } from '../components/PageMetadata';

type GoogleIdentity = {
  initialize: (options: { client_id: string; nonce: string; hd?: string; auto_select: boolean; ux_mode: 'popup'; callback: (response: { credential: string }) => void }) => void;
  renderButton: (element: HTMLElement, options: { type: 'standard'; theme: 'outline'; size: 'large'; text: 'signin_with'; shape: 'rectangular'; locale: string; width: number }) => void;
};
declare global { interface Window { google?: { accounts: { id: GoogleIdentity } } } }
let googleScript: Promise<GoogleIdentity> | undefined;
function loadGoogle() {
  if (window.google?.accounts.id) return Promise.resolve(window.google.accounts.id);
  if (!googleScript) googleScript = new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement('script');
    const timer = window.setTimeout(() => fail(), 15000);
    const fail = () => { window.clearTimeout(timer); script.remove(); googleScript = undefined; reject(new Error('Não foi possível carregar o Google. Confira sua conexão e tente novamente.')); };
    script.src = 'https://accounts.google.com/gsi/client'; script.async = true;
    script.onload = () => { window.clearTimeout(timer); if (window.google?.accounts.id) resolve(window.google.accounts.id); else fail(); };
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return googleScript;
}
// Coalesce the development StrictMode mounts so one browser receives one challenge.
let starting: Promise<{ clientId: string; nonce: string; expiresIn: number }> | undefined;
function startGoogle() {
  if (!starting) starting = fetch('/api/auth/google/start', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}', cache: 'no-store',
  }).then(async response => {
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'O acesso está temporariamente indisponível.');
    return data;
  }).finally(() => { starting = undefined; });
  return starting;
}

export function LoginPage({ mode = 'student' }: { mode?: 'student' | 'professor' }) {
  const professor = mode === 'professor';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const button = useRef<HTMLDivElement>(null);
  const verifying = useRef(false);
  const requested = new URLSearchParams(window.location.search).get('next');
  const next = professor ? '/professor' : requested && ['/rcp', '/choque', '/ventilacao-mecanica'].includes(requested) ? requested : '/';

  useEffect(() => {
    let active = true; let expiry: number | undefined;
    async function prepare() {
      try {
        const response = await fetch('/api/auth/session', { cache: 'no-store' });
        if (!response.ok) throw new Error('O acesso está temporariamente indisponível. Tente novamente mais tarde.');
        const session = await response.json();
        if (!active) return;
        if (session.user && (!professor || session.user.role === 'professor')) { window.location.replace(next); return; }
        if (!session.available) throw new Error('O acesso institucional está em preparação ou temporariamente indisponível. Tente novamente mais tarde.');
        const [config, google] = await Promise.all([startGoogle(), loadGoogle()]);
        if (!active || !button.current) return;
        google.initialize({ client_id: config.clientId, nonce: config.nonce, ...(professor ? {} : { hd: 'aluno.unc.br' }), auto_select: false, ux_mode: 'popup',
          callback: async ({ credential }) => {
            if (!active || verifying.current) return;
            verifying.current = true; setBusy(true); setError('');
            try {
              const result = await fetch('/api/auth/google/verify', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential, next, mode }),
              });
              const data = await result.json();
              if (!result.ok) throw new Error(data.error || 'Não foi possível entrar. Tente novamente.');
              window.location.assign(data.next === '/professor' && professor ? '/professor' : next);
            } catch (cause) {
              if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível conectar. Tente novamente.');
            } finally { verifying.current = false; if (active) setBusy(false); }
          },
        });
        google.renderButton(button.current, { type: 'standard', theme: 'outline', size: 'large', text: 'signin_with', shape: 'rectangular', locale: 'pt-BR', width: Math.min(360, button.current.clientWidth) });
        setReady(true);
        expiry = window.setTimeout(() => {
          if (active) { setReady(false); setError('Esta página ficou aberta por alguns minutos. Atualize para iniciar uma nova tentativa.'); }
        }, config.expiresIn * 1000);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível preparar o acesso. Tente novamente.');
      }
    }
    void prepare();
    return () => { active = false; if (expiry) window.clearTimeout(expiry); };
  }, [next, mode, professor]);

  return <>
    <PageMetadata title={professor ? "Entrada do professor" : "Entrar"} description={professor ? "Acesso reservado à administração dos simuladores." : "Acesse os simuladores com sua conta Google institucional da UNC."} />
    <section className="container login-page">
      <div className="login-intro">
        <p className="eyebrow">{professor ? "Administração" : "Área do aluno"}</p>
        <h1>{professor ? "Entrada do professor" : "Acesso aos simuladores"}</h1>
        <p className="lead">{professor ? "Use sua conta Google autorizada para administrar os acessos." : "Entre com sua conta institucional para iniciar a prática."}</p>
      </div>
      <div className="login-layout">
      <div className="login-card" aria-busy={busy}>
        <div className="login-card-heading"><h2>{professor ? "Acesso reservado" : "Conta institucional"}</h2><span>{professor ? "Professor" : "UNC"}</span></div>
        <p>{professor ? "Somente a conta do responsável pelo projeto pode abrir o painel. Escolha essa conta ao entrar pelo Google." : <>Use a mesma conta Google do seu e-mail <strong>@aluno.unc.br</strong>. Não é necessário criar uma nova senha.</>}</p>
        <div className="google-signin" ref={button} inert={busy || !ready} style={{ visibility: ready ? 'visible' : 'hidden' }} />
        {!ready && !error && <p role="status">Preparando acesso…</p>}
        {busy && <p role="status">Confirmando sua conta…</p>}
        {error && <><p className="auth-message auth-error" role="alert">{error}</p><button className="plain-button" onClick={() => window.location.reload()} disabled={busy}>Atualizar e tentar novamente</button></>}
        <p className="login-account-help">{professor ? <>É aluno? <a href="/entrar">Entre pela área do aluno</a>.</> : "Se o Google mostrar sua conta pessoal, escolha outra conta e entre com o e-mail de aluno."}</p>
        <p className="login-privacy">O site recebe a identificação da sua conta, sem acesso à caixa de e-mail ou à sua senha. Em um computador compartilhado, saia ao terminar. <a href="/privacidade">Saiba mais</a>.</p>
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
