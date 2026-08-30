const baseUrl = process.env.SIMULATOR_BASE_URL ?? "http://127.0.0.1:5173";
const paths = [
  "/",
  "/ventilacao-mecanica",
  "/choque",
  "/rcp",
  "/sobre",
  "/simulators/rcp/index.html",
];

const results = [];

for (const path of paths) {
  const response = await fetch(`${baseUrl}${path}`);
  results.push({ path, status: response.status, ok: response.ok });
  if (!response.ok) process.exitCode = 1;
}

console.log(JSON.stringify(results));
