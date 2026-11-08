// Filled at build time from the public platform's dependency graph, not simulator assets.
const PUBLIC_ASSETS = new Set(/* PUBLIC_ASSETS */ []);
const PUBLIC_PAGES = new Set(['/', '/sobre', '/entrar', '/privacidade']);
const COOKIE = '__Host-simuladores_session';
const SESSION_SECONDS = 7 * 24 * 60 * 60;
const CODE_SECONDS = 10 * 60;
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
async function hmac(secret, value) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}
function randomCode() {
  // Rejection sampling avoids modulo bias.
  const value = new Uint32Array(1);
  do { crypto.getRandomValues(value); } while (value[0] >= 4294000000);
  return String(value[0] % 1000000).padStart(6, '0');
}
function sessionToken(request) {
  const token = request.headers.get('Cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1);
  return /^[a-f0-9]{64}$/.test(token ?? '') ? token : null;
}
function cookie(token, age = SESSION_SECONDS) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`;
}
function ready(env) {
  return Boolean(env.AUTH_DB && env.AUTH_SECRET?.length >= 32 && env.RESEND_API_KEY && env.AUTH_EMAIL_FROM);
}
async function userFor(request, env, now) {
  const token = sessionToken(request);
  if (!token || !env.AUTH_DB) return null;
  const user = await env.AUTH_DB.prepare(`SELECT u.id, u.email, u.access_kind FROM sessions s
    JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ? AND u.status = 'active'`)
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
    if (size > 2048) { await reader.cancel(); throw new HttpError(413, 'Solicitação muito grande.'); }
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
async function sendCode(request, env, body, now) {
  const email = normalizeEmail(body.email);
  if (!email) throw new HttpError(400, 'Nesta etapa, use seu e-mail @aluno.unc.br. O acesso externo ainda não está disponível.');
  const emailKey = await hmac(env.AUTH_SECRET, `limit:${email}`);
  await limit(env, `send-email:${emailKey}`, 5, 3600, now);
  // A shared campus IP can serve a whole class. Separate per-address and global budgets.
  await limit(env, 'send-global', 500, 3600, now);
  const code = randomCode(); const challenge = randomToken();
  const digest = await hmac(env.AUTH_SECRET, `${email}:${challenge}:${code}`);
  const row = await env.AUTH_DB.prepare(`INSERT INTO login_codes (email, challenge_id, digest, expires_at, sent_at, attempts)
    VALUES (?, ?, ?, ?, ?, 0) ON CONFLICT(email) DO UPDATE SET challenge_id = excluded.challenge_id,
    digest = excluded.digest, expires_at = excluded.expires_at, sent_at = excluded.sent_at, attempts = 0
    WHERE login_codes.sent_at <= ? RETURNING challenge_id`)
    .bind(email, challenge, digest, now + CODE_SECONDS, now, now - 60).first();
  if (!row) throw new HttpError(429, 'Aguarde um minuto antes de pedir outro código.', { 'Retry-After': '60' });
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': challenge },
      body: JSON.stringify({ from: env.AUTH_EMAIL_FROM, to: [email], subject: 'Seu código de acesso — Simuladores do Prof. Victor',
        text: `Seu código de acesso é: ${code}\n\nEle vale por 10 minutos e só pode ser usado uma vez. Não compartilhe este código.\n\nSe você não pediu acesso, ignore esta mensagem.\n\nSimuladores do Prof. Victor Hugo Sant’Ana` }),
    });
    if (!response.ok) throw new Error('mail_failed');
  } catch {
    await env.AUTH_DB.prepare('DELETE FROM login_codes WHERE email = ? AND challenge_id = ?').bind(email, challenge).run();
    throw new HttpError(503, 'Não foi possível enviar o código agora. Tente novamente em alguns minutos.');
  }
  return json({ ok: true, expiresIn: CODE_SECONDS, retryAfter: 60 });
}
async function verifyCode(request, env, body, now) {
  const email = normalizeEmail(body.email);
  if (!email || typeof body.code !== 'string' || !/^\d{6}$/.test(body.code)) throw new HttpError(400, 'Informe o e-mail institucional e o código de 6 dígitos.');
  const emailKey = await hmac(env.AUTH_SECRET, `limit:${email}`);
  await limit(env, `verify-email:${emailKey}`, 15, 3600, now);
  const challenge = await env.AUTH_DB.prepare(`UPDATE login_codes SET attempts = attempts + 1
    WHERE email = ? AND expires_at > ? AND attempts < 5 RETURNING challenge_id, digest`)
    .bind(email, now).first();
  if (!challenge) throw new HttpError(400, 'Código inválido, expirado ou com tentativas esgotadas. Solicite um novo código.');
  const expected = await hmac(env.AUTH_SECRET, `${email}:${challenge.challenge_id}:${body.code}`);
  // Consumption is atomic: parallel verification cannot reuse a valid code.
  const consumed = await env.AUTH_DB.prepare(`DELETE FROM login_codes WHERE email = ? AND challenge_id = ?
    AND digest = ? AND expires_at > ? RETURNING email`).bind(email, challenge.challenge_id, expected, now).first();
  if (!consumed) throw new HttpError(400, 'Código inválido ou expirado. Confira o código mais recente recebido.');
  const token = randomToken(); const tokenHash = await hash(token);
  await env.AUTH_DB.batch([
    env.AUTH_DB.prepare(`INSERT INTO users (id, email, created_at, last_login_at) VALUES (?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET last_login_at = excluded.last_login_at`).bind(crypto.randomUUID(), email, now, now),
    env.AUTH_DB.prepare(`INSERT INTO sessions (token_hash, user_id, expires_at)
      SELECT ?, id, ? FROM users WHERE email = ? AND status = 'active' AND access_kind = 'unc'`)
      .bind(tokenHash, now + SESSION_SECONDS, email),
  ]);
  const exists = await env.AUTH_DB.prepare('SELECT user_id FROM sessions WHERE token_hash = ?').bind(tokenHash).first();
  if (!exists) throw new HttpError(403, 'Seu acesso não está disponível. Entre em contato com o professor.');
  return json({ ok: true, next: safeNext(body.next) }, 200, { 'Set-Cookie': cookie(token) });
}
async function api(request, env, now) {
  const path = new URL(request.url).pathname;
  if (path === '/api/auth/session' && request.method === 'GET') {
    const user = await userFor(request, env, now);
    return json({ user: user ? { email: user.email, accessKind: user.access_kind } : null, available: ready(env) });
  }
  if (!['/api/auth/send-code', '/api/auth/verify-code', '/api/auth/logout'].includes(path)) throw new HttpError(404, 'Não encontrado.');
  if (request.method !== 'POST') throw new HttpError(405, 'Método não permitido.', { Allow: 'POST' });
  if (request.headers.get('Origin') !== new URL(request.url).origin) throw new HttpError(403, 'Origem não permitida.');
  if (path === '/api/auth/logout') {
    const token = sessionToken(request);
    if (token && env.AUTH_DB) await env.AUTH_DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await hash(token)).run();
    return json({ ok: true }, 200, { 'Set-Cookie': cookie('', 0) });
  }
  if (!ready(env)) throw new HttpError(503, 'O acesso por e-mail está em preparação. Tente novamente mais tarde.');
  const ipKey = await hmac(env.AUTH_SECRET, `ip:${request.headers.get('CF-Connecting-IP') ?? 'unknown'}`);
  await limit(env, `ip:${ipKey}`, 300, 600, now);
  const body = await readBody(request);
  return path.endsWith('/send-code') ? sendCode(request, env, body, now) : verifyCode(request, env, body, now);
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
      env.AUTH_DB.prepare('DELETE FROM login_codes WHERE expires_at < ?').bind(now),
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
      // Never log emails, codes, session tokens, provider errors or secrets.
      response = error instanceof HttpError ? json({ error: error.message }, error.status, error.headers)
        : json({ error: 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.' }, 503);
    }
    const result = new Response(response.body, response);
    result.headers.set('Cache-Control', 'private, no-store');
    result.headers.set('X-Content-Type-Options', 'nosniff');
    result.headers.set('X-Frame-Options', 'SAMEORIGIN');
    result.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    result.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    return result;
  },
};
