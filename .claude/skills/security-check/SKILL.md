---
name: security-check
description: Audita el repositorio en busca de llaves privadas, secretos codificados a mano, archivos sensibles versionados (.env, .pem, cuentas de servicio) y código inseguro (eval, new Function). Úsalo antes de un push o cuando quieras revisar que no se filtre nada. La misma verificación corre automáticamente en el hook pre-push de git.
---

# Security check

Verifica que no se suba nada de llaves privadas ni código inseguro al repositorio.

## Cómo ejecutarlo

```bash
npm run check:secrets
```

Esto ejecuta `scripts/check-secrets.mjs`, que recorre los archivos versionados
(`git ls-files`) y **bloquea (exit 1)** si encuentra:

- **Archivos sensibles versionados**: `.env` (no `.env.example`), `*.pem`, `*.p12`,
  `*.pfx`, `*.key`, `id_rsa`, `serviceAccount*.json`, `*-adminsdk-*.json`.
- **Secretos codificados a mano**: claves privadas PEM, `"private_key"` de cuentas
  de servicio, AWS Access Keys, tokens de Slack/GitHub, y asignaciones tipo
  `password/secret/token/api_key = "…"`.
- **Código inseguro**: `eval(...)`, `new Function(...)`.

Se ignoran referencias a variables de entorno (`import.meta.env`, `process.env`)
y placeholders, para evitar falsos positivos. La `apiKey` pública de Firebase web
no se marca porque no es un secreto.

## Cuándo se ejecuta solo

El hook **pre-push** de husky (`.husky/pre-push`) corre esta misma verificación en
cada `git push`. Si encuentra algo, el push se aborta.

## Falsos positivos

Si una línea es un falso positivo legítimo, añade al final:

```
// pragma: allowlist secret
```

## Al usar este skill

1. Ejecuta `npm run check:secrets` y reporta el resultado.
2. Si hay hallazgos, para cada uno: explica el riesgo y propón moverlo a `.env`
   (ya ignorado por git) o eliminarlo del historial si ya fue commiteado.
3. No añadas `pragma: allowlist secret` salvo que sea genuinamente un falso positivo.
