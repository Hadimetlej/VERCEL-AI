# Impact: RCE via scaffold-codemod Code Injection

## Attacker Gains

- Arbitrary code execution when upgrade.ts or generated test is loaded
- Supply chain: corrupt upgrade.ts during package install → RCE on next codemod run
- Developer machine compromise: secrets, SSH keys, env vars

## Who Is Affected

- Projects that depend on @ai-sdk/codemod (direct or transitive)
- Developers who run `pnpm scaffold` with untrusted input
- CI/CD that runs codemod after install from untrusted registry
