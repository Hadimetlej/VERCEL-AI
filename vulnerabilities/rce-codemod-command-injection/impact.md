# Impact: RCE via Codemod Command Injection

## Real-World Scenario

- **CLI usage**: Developers run `npx @ai-sdk/codemod <codemod> <source>` or `upgrade` commands
- **Supply chain**: Malicious packages can trigger codemod via `postinstall` with crafted arguments
- **CI/CD**: Build scripts that run codemod with variables from config/env
- **Documentation**: Docs or tutorials that tell users to run codemod; an attacker could provide a malicious command in a comment, issue, or PR

## Attack Prerequisites

- Victim runs the codemod CLI with attacker-controlled input, OR
- Victim installs a malicious npm package that runs codemod in postinstall, OR
- CI/CD uses codemod with unvalidated input from config, API, or env

## Attacker Gains

- Full code execution in the context of the user/process running the codemod
- On a developer machine: access to secrets, SSH keys, env vars, source code
- In CI: access to deployment credentials, artifact signing, etc.
- On a server: complete server compromise

## Default Configuration

The vulnerability exists in the default codemod behavior. No special configuration is required; any invocation with unsanitized input is vulnerable.
