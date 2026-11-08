// Run against a Pages/Worker preview, NOT the static Vite preview.
import assert from 'node:assert/strict';
const baseUrl = process.env.SIMULATOR_BASE_URL ?? 'http://127.0.0.1:8788';
for (const path of ['/', '/sobre', '/entrar', '/privacidade']) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: 'manual' });
  assert.equal(response.status, 200, `${path} deve ser público`);
}
for (const path of ['/rcp', '/choque', '/ventilacao-mecanica', '/simulators/rcp/index.html', '/simulators/choque/index.html', '/simulators/ventilacao-mecanica/index.html']) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: 'manual' });
  assert.equal(response.status, 303, `${path} deve exigir login`);
  assert.ok(response.headers.get('Location')?.startsWith('/entrar?next='));
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
}
console.log('Rotas públicas e proteção dos links diretos verificadas.');
