import { createRemoteJWKSet, jwtVerify } from 'jose';

// Filled at build time from the public platform's dependency graph, not simulator assets.
const PUBLIC_ASSETS = new Set(/* PUBLIC_ASSETS */ []);
const PUBLIC_PAGES = new Set(['/', '/sobre', '/entrar', '/privacidade']);
const COOKIE = '__Host-simuladores_session';
const NONCE_COOKIE = '__Host-simuladores_google';
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const CHALLENGE_SECONDS = 10 * 60;
const GOOGLE_KEYS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'), {
  timeoutDuration: 5000, cacheMaxAge: 600000,
});
const encoder = new TextEncoder();
const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
});
class HttpError extends Error {
  constructor(status, message, headers = {}) { super(message); this.status = status; this.headers = headers; }
}
export function normalizeEmail(input) {
  if (typeof input !== 'string') return null;
  const email = input.trim().toLowerCase();
  const parts = email.split('@');
  if (parts.length !== 2 || parts[1] !== 'aluno.unc.br' || parts[0].length > 64 ||
      !/^[a-z0-9]+(?:[._+-][a-z0-9]+)*$/.test(parts[0])) return null;
  return email;
}
export function safeNext(input) {
  return ['/rcp', '/choque', '/ventilacao-mecanica'].includes(input) ? input : '/';
}
const hex = (bytes) => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
const randomToken = () => hex(crypto.getRandomValues(new Uint8Array(32)));
const hash = async (value) => hex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
function readCookie(request, name = COOKIE) {
  const token = request.headers.get('Cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith(name + '='))?.slice(name.length + 1);
  return /^[a-f0-9]{64}$/.test(token ?? '') ? token : null;
}
function cookie(token, age = SESSION_SECONDS, name = COOKIE) {
  return `${name}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
}
function ready(env) {
  return Boolean(env.AUTH_DB && /^[a-zA-Z0-9-]+\.apps\.googleusercontent\.com$/.test(env.GOOGLE_CLIENT_ID ?? ''));
}
async function userFor(request, env, now) {
  const token = readCookie(request);
  if (!token || !env.AUTH_DB) return null;
  const user = await env.AUTH_DB.prepare(`SELECT u.id, u.email, u.access_kind FROM sessions s
    JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ? AND u.status = 'active' AND u.google_sub IS NOT NULL`)
    .bind(await hash(token), now).first();
  // Paid access is reserved for a later, server-verified entitlement integration.
  return user?.access_kind === 'unc' && normalizeEmail(user.email) ? user : null;
}
async function limit(env, key, max, seconds, now) {
  const bucket = Math.floor(now / seconds);
  const row = await env.AUTH_DB.prepare(`INSERT INTO auth_limits (key, count, expires_at) VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET count = count + 1 WHERE count < ? RETURNING count`)
    .bind(`${key}:${bucket}`, (bucket + 1) * seconds, max).first();
  if (!row) throw new HttpError(429, 'Muitas tentativas. Aguarde alguns minutos e tente novamente.', { 'Retry-After': String(seconds - now % seconds) });
}
async function readBody(request) {
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) throw new HttpError(415, 'Formato inválido.');
  // Bound even chunked bodies; do not trust Content-Length.
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Preencha os campos.');
  let size = 0; const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 8192) { await reader.cancel(); throw new HttpError(413, 'Solicitação muito grande.'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try {
    const body = JSON.parse(new TextDecoder().decode(bytes));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
    return body;
  } catch { throw new HttpError(400, 'Solicitação inválida.'); }
}
async function startGoogle(request, env, now) {
  // Reuse a live browser challenge, including when React mounts twice in development.
  let nonce = readCookie(request, NONCE_COOKIE);
  const existing = nonce && await env.AUTH_DB.prepare('SELECT expires_at FROM google_challenges WHERE nonce_hash = ? AND expires_at > ?')
    .bind(await hash(nonce), now).first();
  if (!existing) {
    nonce = randomToken();
    await env.AUTH_DB.prepare('INSERT INTO google_challenges (nonce_hash, expires_at) VALUES (?, ?)')
      .bind(await hash(nonce), now + CHALLENGE_SECONDS).run();
  }
  const expiresIn = existing ? existing.expires_at - now : CHALLENGE_SECONDS;
  return json({ clientId: env.GOOGLE_CLIENT_ID, nonce, expiresIn }, 200,
    { 'Set-Cookie': cookie(nonce, expiresIn, NONCE_COOKIE) });
}
async function verifyGoogle(request, env, body, now) {
  const nonce = readCookie(request, NONCE_COOKIE);
  if (!nonce || typeof body.credential !== 'string' || body.credential.length > 7000) {
    throw new HttpError(400, 'Recarregue a página e entre novamente com sua conta Google institucional.');
  }
  const nonceHash = await hash(nonce);
  const challenge = await env.AUTH_DB.prepare('SELECT nonce_hash FROM google_challenges WHERE nonce_hash = ? AND expires_at > ?')
    .bind(nonceHash, now).first();
  if (!challenge) throw new HttpError(400, 'Esta tentativa expirou ou já foi utilizada. Recarregue a página para entrar.');
  let claims;
  try {
    ({ payload: claims } = await jwtVerify(body.credential, GOOGLE_KEYS, {
      algorithms: ['RS256'], audience: env.GOOGLE_CLIENT_ID,
      issuer: ['accounts.google.com', 'https://accounts.google.com'],
      requiredClaims: ['sub', 'email', 'email_verified', 'hd', 'iat', 'exp', 'nonce'],
      maxTokenAge: '10m', currentDate: new Date(now * 1000),
    }));
  } catch {
    throw new HttpError(401, 'Não foi possível confirmar sua conta Google. Entre novamente com a conta institucional.');
  }
  if (claims.nonce !== nonce || claims.aud !== env.GOOGLE_CLIENT_ID ||
      (claims.azp !== undefined && claims.azp !== env.GOOGLE_CLIENT_ID) ||
      typeof claims.sub !== 'string' || !claims.sub || claims.sub.length > 255) {
    throw new HttpError(401, 'Confirmação de acesso inválida. Recarregue a página e tente novamente.');
  }
  const email = normalizeEmail(claims.email);
  // The verified Workspace domain is required in addition to the exact email domain.
  if (!email || claims.email_verified !== true || claims.hd !== 'aluno.unc.br') {
    throw new HttpError(403, 'Use sua conta Google @aluno.unc.br. Contas pessoais e de outras instituições ainda não têm acesso.');
  }
  const existing = await env.AUTH_DB.prepare('SELECT google_sub, status, access_kind FROM users WHERE google_sub = ? OR email = ?')
    .bind(claims.sub, email).first();
  // Never link accounts by email alone or silently reactivate a blocked/paid account.
  if (existing && (existing.google_sub !== claims.sub || existing.status !== 'active' || existing.access_kind !== 'unc')) {
    throw new HttpError(403, 'Seu acesso não está disponível. Entre em contato com o professor.');
  }
  const consumed = await env.AUTH_DB.prepare('DELETE FROM google_challenges WHERE nonce_hash = ? AND expires_at > ? RETURNING nonce_hash')
    .bind(nonceHash, now).first();
  if (!consumed) throw new HttpError(400, 'Esta tentativa já foi utilizada. Recarregue a página para entrar.');
  const token = randomToken(); const tokenHash = await hash(token);
  const oldToken = readCookie(request);
  await env.AUTH_DB.batch([
    env.AUTH_DB.prepare(`INSERT INTO users (id, email, google_sub, created_at, last_login_at) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(google_sub) DO UPDATE SET email = excluded.email, last_login_at = excluded.last_login_at`)
      .bind(crypto.randomUUID(), email, claims.sub, now, now),
    env.AUTH_DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(oldToken ? await hash(oldToken) : ''),
    env.AUTH_DB.prepare(`INSERT INTO sessions (token_hash, user_id, expires_at)
      SELECT ?, id, ? FROM users WHERE google_sub = ? AND email = ? AND status = 'active' AND access_kind = 'unc'`)
      .bind(tokenHash, now + SESSION_SECONDS, claims.sub, email),
  ]);
  const exists = await env.AUTH_DB.prepare('SELECT user_id FROM sessions WHERE token_hash = ?').bind(tokenHash).first();
  if (!exists) throw new HttpError(403, 'Seu acesso não está disponível. Entre em contato com o professor.');
  const headers = new Headers();
  headers.append('Set-Cookie', cookie(token));
  headers.append('Set-Cookie', cookie('', 0, NONCE_COOKIE));
  return new Response(JSON.stringify({ ok: true, next: safeNext(body.next) }), {
    headers: new Headers([...headers, ['Content-Type', 'application/json; charset=utf-8']]),
  });
}
async function api(request, env, now) {
  const path = new URL(request.url).pathname;
  if (path === '/api/auth/session' && request.method === 'GET') {
    const user = await userFor(request, env, now);
    return json({ user: user ? { email: user.email, accessKind: user.access_kind } : null, available: ready(env) });
  }
  if (!['/api/auth/google/start', '/api/auth/google/verify', '/api/auth/logout'].includes(path)) throw new HttpError(404, 'Não encontrado.');
  if (request.method !== 'POST') throw new HttpError(405, 'Método não permitido.', { Allow: 'POST' });
  if (request.headers.get('Origin') !== new URL(request.url).origin) throw new HttpError(403, 'Origem não permitida.');
  if (path === '/api/auth/logout') {
    const token = readCookie(request);
    if (token && env.AUTH_DB) await env.AUTH_DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await hash(token)).run();
    return json({ ok: true }, 200, { 'Set-Cookie': cookie('', 0) });
  }
  if (!ready(env)) throw new HttpError(503, 'O acesso institucional está em preparação. Tente novamente mais tarde.');
  // Shared campus networks can serve a whole class. IP hashes rotate daily; no raw IP is stored.
  const ipKey = await hash(`${Math.floor(now / 86400)}:${request.headers.get('CF-Connecting-IP') ?? 'unknown'}`);
  await limit(env, `ip:${ipKey}`, 300, 600, now);
  const body = await readBody(request);
  return path.endsWith('/start') ? startGoogle(request, env, now) : verifyGoogle(request, env, body, now);
}
async function handle(request, env, ctx) {
  const url = new URL(request.url); const now = Math.floor(Date.now() / 1000);
  if (url.pathname.startsWith('/api/')) return api(request, env, now);
  if (!['GET', 'HEAD'].includes(request.method)) throw new HttpError(405, 'Método não permitido.');
  const path = url.pathname.replace(/\/+$/, '') || '/';
  // Deny by default: every non-public file (including raw HTML, JS and encoded aliases) needs a session.
  if (!PUBLIC_PAGES.has(path) && !PUBLIC_ASSETS.has(url.pathname)) {
    if (!await userFor(request, env, now)) {
      return new Response(null, { status: 303, headers: { Location: `/entrar?next=${encodeURIComponent(safeNext(path))}` } });
    }
  }
  if (env.AUTH_DB && crypto.getRandomValues(new Uint8Array(1))[0] === 0) {
    ctx.waitUntil(env.AUTH_DB.batch([
      env.AUTH_DB.prepare('DELETE FROM google_challenges WHERE expires_at < ?').bind(now),
      env.AUTH_DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now),
      env.AUTH_DB.prepare('DELETE FROM auth_limits WHERE expires_at < ?').bind(now),
    ]).catch(() => {}));
  }
  return env.ASSETS.fetch(request);
}
export default {
  async fetch(request, env, ctx) {
    let response;
    try { response = await handle(request, env, ctx); }
    catch (error) {
      // Never log emails, Google credentials, session tokens or provider errors.
      response = error instanceof HttpError ? json({ error: error.message }, error.status, error.headers)
        : json({ error: 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.' }, 503);
    }
    const result = new Response(response.body, response);
    result.headers.set('Cache-Control', 'private, no-store');
    result.headers.set('X-Content-Type-Options', 'nosniff');
    result.headers.set('X-Frame-Options', 'SAMEORIGIN');
    result.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    result.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    result.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    return result;
  },
};
