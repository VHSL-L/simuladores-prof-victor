// Run against a Pages/Worker preview, NOT the static Vite preview.
import assert from 'node:assert/strict';
const baseUrl = process.env.SIMULATOR_BASE_URL ?? 'http://127.0.0.1:8788';
for (const path of ['/', '/sobre', '/entrar', '/privacidade', '/professor/entrar']) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: 'manual' });
  assert.equal(response.status, 200, `${path} deve ser público`);
}
const slugs = ['rcp', 'choque', 'ventilacao-mecanica', 'bls', 'gasometria', 'ecg', 'eletrolitos', 'via-aerea'];
for (const path of ['/professor', ...slugs.flatMap(slug => ['/' + slug, '/simulators/' + slug + '/index.html'])]) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: 'manual' });
  assert.equal(response.status, 303, `${path} deve exigir login`);
  assert.ok(response.headers.get('Location')?.startsWith(path === '/professor' ? '/professor/entrar' : '/entrar?next='), path);
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
}
for (const path of ['/api/professor/overview', '/api/professor/students']) {
  const response = await fetch(`${baseUrl}${path}`, { redirect: 'manual' });
  assert.equal(response.status, 401, `${path} deve exigir sessão administrativa`);
}
console.log('Rotas públicas e proteção dos links diretos verificadas.');
