# npm audit summary (post NestJS 11 migration)

After upgrading to NestJS 11, `npm audit` initially reported **17 vulnerabilities**. Step 1 (`npm audit fix`) cleared 9 with no code impact. Six newly-disclosed advisories then surfaced (mostly via a new `uuid` advisory), bringing the count back to 14. Step 2 removed `@compodoc/compodoc` outright, eliminating 9 dev-only advisories in one stroke.

| Severity | Initial | After `npm audit fix` | After new disclosures | After compodoc removed |
|----------|---------|-----------------------|-----------------------|------------------------|
| Critical | 1 | 0 | 0 | 0 |
| High | 8 | 4 | 4 | 3 |
| Moderate | 7 | 4 | 10 | 2 |
| Low | 1 | 0 | 0 | 0 |
| **Total** | **17** | **8** | **14** | **5** |

The 5 remaining advisories are all **runtime** dependencies in two clusters: bcrypt's `tar` chain and the `uuid` advisory.

## Remaining vulnerabilities (all runtime)

| Package | Severity | Issue | Fix | Status |
|---------|----------|-------|-----|--------|
| `bcrypt` (5.0.1 – 5.1.1) → `@mapbox/node-pre-gyp` → `tar` (<=7.5.10) | High (×3) | Path traversal, symlink poisoning, hardlink escape, Unicode-ligature race in `tar` extraction (6 advisories collapsed into 3 packages) | `bcrypt` 5 → 6 (breaking, dedicated PR) | ⏳ Pending |
| `uuid` (<14.0.0) | Moderate | Missing buffer bounds check in v3/v5/v6 when `buf` is provided (`GHSA-w5hq-g745-h8pq`) | `uuid` 10 → 14 (breaking) | ⏳ Pending |
| `typeorm` (0.2.42-dev – 0.4.0-alpha.1) | Moderate | Bundles a vulnerable `uuid@11.1.0` transitively | Wait for upstream `typeorm` patch (current 0.3.28) | ⏳ Pending |

## What was cleared

### Step 1 — `npm audit fix` (safe)

Cleared 9 of the original 17: `qs`, `undici`, `yaml`, `diff`, `flatted`, `brace-expansion` family, `@isaacs/brace-expansion`, `handlebars` (the lone critical), and one more in the eslint/jest internals chain.

### Step 2 — remove `@compodoc/compodoc` (this PR)

`@compodoc/compodoc` is a dev-only API-docs generator. After NestJS 11, its transitive dependency tree accumulated 9 advisories with no clean upgrade path (downgrading was the only `npm audit fix --force` option, sacrificing features for a chain that's only used to render HTML docs). We removed it entirely.

Cleared in this PR:

| Package | Severity | Why it was here |
|---------|----------|-----------------|
| `@compodoc/compodoc` | Moderate | direct dev dep |
| `@compodoc/live-server` | Moderate | compodoc → live-server |
| `http-auth` | Moderate | live-server → http-auth |
| `vis-network`, `vis-data` | Moderate (×2) | compodoc graph rendering |
| `@angular-devkit/core`, `@angular-devkit/schematics` | Moderate (×2) | compodoc schematics |
| `ajv` | Moderate | angular-devkit → ajv |
| `picomatch` | High | compodoc → picomatch |

If module-graph docs are needed in the future, `npx @compodoc/compodoc -p tsconfig.json` can be run as a one-off without a permanent dependency. Swagger UI ([@nestjs/swagger](../../package.json)) remains as the API documentation surface.

## Next steps

1. **`bcrypt` 5 → 6** — dedicated PR. Major bump on a runtime auth dep:
   - Verify existing hashed passwords still validate (bcrypt hashes are stable across the v5→v6 boundary, but smoke-test it).
   - Review [bcrypt 6 release notes](https://github.com/kelektiv/node.bcrypt.js/releases) for API changes.
   - Auth flow regression: register, login, password round-trip.
   - Clears 3 of the 5 remaining advisories (bcrypt + tar chain).
2. **`uuid` 10 → 14** — dedicated PR. Major bump; check call-sites that pass a `buf` argument or rely on v1/v3/v5/v6 generation. Clears 1 advisory. `typeorm`'s bundled `uuid` will remain flagged until upstream typeorm patches.
3. **`typeorm`** — track upstream; no action on our side.
