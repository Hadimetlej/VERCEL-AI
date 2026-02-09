# Vulnerability Summary – Report Each Separately for Maximum Bounty

Report **each vulnerability in its own HackerOne submission** to maximize bounty. Critical/RCE typically pays highest.

---

## 1. RCE – Codemod Command Injection (CRITICAL)
**Folder:** `rce-codemod-command-injection/`  
**Package:** @ai-sdk/codemod  
**Issue:** `execSync(command)` with unsanitized `codemod` and `source` arguments → shell command injection  
**Impact:** Full RCE when user runs codemod with attacker-controlled input (CLI, supply chain postinstall)  
**Bounty potential:** Critical tier

---

## 2. RCE – Codemod Scaffold Code Injection (CRITICAL)
**Folder:** `rce-codemod-scaffold-injection/`  
**Package:** @ai-sdk/codemod  
**Issue:** `codemodName` from argv embedded in upgrade.ts and test templates without sanitization → code injection  
**Impact:** RCE when upgrade.ts is loaded (supply chain, malicious package postinstall)  
**Bounty potential:** Critical tier  

---

## 3. RCE – OAuth URL + exec() (CRITICAL, chains with #4)
**Folder:** `rce-oauth-open-url-injection/`  
**Location:** examples/mcp-with-auth/client.ts  
**Issue:** `exec(cmd)` with `authorizationUrl` in shell command; URL from OAuth discovery  
**Impact:** With malicious discovery, attacker-controlled URL → command injection → RCE  
**Bounty potential:** Critical (note: chains with OAuth discovery vuln)

---

## 4. SSRF + Credential Theft – OAuth Discovery (HIGH/CRITICAL)
**Folder:** `ssrf-oauth-discovery/`  
**Package:** @ai-sdk/mcp  
**Issue:** No validation of `token_endpoint` or `resource_metadata` URLs from discovery  
**Impact:** Attacker exfiltrates OAuth credentials (auth code, client secret, PKCE verifier)  
**Bounty potential:** High–Critical

---

## 5. Sensitive Data – OAuth Token Leak in Error Message (MEDIUM)
**Folder:** `oauth-token-leak-error-message/`  
**Package:** @ai-sdk/mcp  
**Issue:** `parseErrorResponse` puts full raw body in error when schema invalid → tokens in logs/Sentry  
**Impact:** Access/refresh/id tokens leaked via error tracking  
**Bounty potential:** Medium

---

## 6. SSRF – Download User URLs (HIGH)
**Folder:** `ssrf-download-user-urls/`  
**Package:** ai  
**Issue:** Default download fetches user message URLs with no allowlist/validation  
**Impact:** Fetch cloud metadata (169.254.169.254), internal services  
**Bounty potential:** High

---

## 7. RCE – eval() on Calculator Tool Expression (CRITICAL)
**Folder:** `rce-eval-calculator-tool/`  
**Location:** examples/ai-functions (openai-reasoning-tools, feature-test-suite)  
**Issue:** `eval(expression)` on LLM tool output; expression influenced by user prompt  
**Impact:** Prompt injection → model outputs malicious expression → eval() → RCE  
**Bounty potential:** Critical

---

## 8. RCE – Shell Tool + exec() via Prompt Injection (CRITICAL)
**Folder:** `rce-shell-tool-prompt-injection/`  
**Location:** examples/ai-functions (shell-executor, openai-responses-shell-tool)  
**Issue:** `exec(command)` with command from LLM; no sandbox, no validation  
**Impact:** Prompt injection → model outputs arbitrary command → exec → RCE  
**Bounty potential:** Critical

---

## 9. SQL Injection – Natural Language Postgres Cookbook (HIGH)
**Folder:** `sqli-natural-language-postgres-cookbook/`  
**Location:** content/cookbook (documentation pattern)  
**Issue:** LLM-generated SQL executed without validation; user question influences query  
**Impact:** Prompt injection → model outputs malicious SQL → SQLi, data breach  
**Bounty potential:** High

---

## Reporting Tips

- Use one report per vulnerability.
- Include README, PoC, and impact from each folder.
- Prioritize RCE and credential-related issues.
- Mention realistic attack paths and affected configurations.
