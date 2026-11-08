import { useEffect, useState } from 'react';
export function AccountLink() {
  const [signedIn, setSignedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    fetch('/api/auth/session', { cache: 'no-store' }).then(r => r.ok ? r.json() : null)
      .then(data => { if (active) setSignedIn(Boolean(data?.user)); }).catch(() => {});
    return () => { active = false; };
  }, []);
  async function logout() {
    setBusy(true); setError(false);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error();
      window.location.assign('/entrar');
    } catch { setError(true); setBusy(false); }
  }
  return signedIn ? <span className="account-control"><button className="plain-button" disabled={busy} onClick={() => void logout()}>{busy ? 'Saindo…' : 'Sair'}</button>{error && <span role="alert">Não foi possível sair. Tente novamente.</span>}</span> : <a href="/entrar">Entrar</a>;
}
