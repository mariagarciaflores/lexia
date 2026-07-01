#!/usr/bin/env node
// Escáner de seguridad local: bloquea el push si encuentra llaves privadas,
// secretos codificados a mano o código claramente inseguro en archivos versionados.
// Se ejecuta desde el hook pre-push de husky y desde el skill /security-check.
//
// Para permitir un falso positivo puntual, añade al final de la línea:
//   // pragma: allowlist secret
import { execSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';

const ALLOW = 'pragma: allowlist secret';

// Rutas que NO se escanean (este script y el skill contienen los patrones como texto).
const IGNORED_PATHS = [
  'scripts/check-secrets.mjs',
  '.claude/skills/security-check/SKILL.md',
  'package-lock.json',
];

// Extensiones binarias o irrelevantes.
const BINARY = /\.(png|jpe?g|gif|ico|webp|woff2?|ttf|eot|pdf|zip|gz|lock)$/i;

// Nombres de archivo que NUNCA deberían estar versionados.
const FORBIDDEN_FILES = [
  /(^|\/)\.env(\.(?!example|sample|template)\w+)?$/, // .env, .env.local… (no .env.example)
  /\.pem$/,
  /\.p12$/,
  /\.pfx$/,
  /(^|\/)id_rsa$/,
  /serviceaccount.*\.json$/i,
  /-adminsdk-.*\.json$/i,
  /\.key$/,
];

// Patrones de secretos → BLOQUEAN el push.
const SECRET_RULES = [
  { name: 'Clave privada PEM', re: /-----BEGIN(?: [A-Z]+)* PRIVATE KEY-----/ },
  { name: 'private_key de cuenta de servicio', re: /"private_key"\s*:/ },
  { name: 'AWS Access Key ID', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'AWS secret access key', re: /aws_secret_access_key\s*[:=]/i },
  { name: 'Token de Slack', re: /\bxox[baprs]-[0-9A-Za-z-]{10,}/ },
  { name: 'Token de GitHub', re: /\bghp_[0-9A-Za-z]{36}\b/ },
  {
    name: 'Secreto codificado a mano',
    re: /\b(password|passwd|secret|token|api[_-]?key)\b\s*[:=]\s*['"][^'"]{8,}['"]/i,
  },
];

// Patrones de código inseguro → BLOQUEAN el push.
const INSECURE_RULES = [
  { name: 'uso de eval()', re: /\beval\s*\(/ },
  { name: 'new Function(...) dinámico', re: /\bnew Function\s*\(/ },
];

// Referencias a variables de entorno o placeholders: no son secretos reales.
const FALSE_POSITIVE = /(import\.meta\.env|process\.env|TU_|CHANGE_?ME|xxxx|<[A-Z_]+>)/;

function trackedFiles() {
  return execSync('git ls-files', { encoding: 'utf8' })
    .split('\n')
    .map((f) => f.trim())
    .filter(Boolean);
}

const findings = [];

for (const file of trackedFiles()) {
  if (IGNORED_PATHS.includes(file)) continue;

  // 1) Archivos prohibidos por nombre.
  if (FORBIDDEN_FILES.some((re) => re.test(file))) {
    findings.push({ file, line: 0, rule: 'archivo sensible versionado', hard: true });
    continue;
  }

  if (BINARY.test(file)) continue;

  let content;
  try {
    if (statSync(file).size > 1_000_000) continue; // salta archivos enormes
    content = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  if (content.includes('\u0000')) continue; // binario (byte nulo)

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes(ALLOW)) continue;

    for (const rule of SECRET_RULES) {
      if (rule.re.test(line) && !FALSE_POSITIVE.test(line)) {
        findings.push({ file, line: i + 1, rule: rule.name, hard: true });
      }
    }
    for (const rule of INSECURE_RULES) {
      if (rule.re.test(line)) {
        findings.push({ file, line: i + 1, rule: rule.name, hard: true });
      }
    }
  }
}

if (findings.length === 0) {
  console.log('✅ Escaneo de seguridad: sin llaves privadas ni código inseguro.');
  process.exit(0);
}

console.error(
  '\n🚫 Escaneo de seguridad: se encontraron problemas que bloquean el push:\n',
);
for (const f of findings) {
  const where = f.line ? `${f.file}:${f.line}` : f.file;
  console.error(`  • [${f.rule}] ${where}`);
}
console.error(
  '\nCorrige o mueve los secretos a variables de entorno (.env, ya ignorado).' +
    `\nSi es un falso positivo, añade "// ${ALLOW}" al final de la línea.\n`,
);
process.exit(1);
