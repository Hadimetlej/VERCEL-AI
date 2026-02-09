# Impact: SSRF / OAuth Credential Theft

## Real-World Scenario

- **MCP with OAuth**: Apps using `@ai-sdk/mcp` with OAuth for MCP server authentication
- **Trust boundary**: Discovery metadata (from server or 401 header) is trusted without validation
- **Attacker gains**: Full OAuth credentials including:
  - `authorization_code` (one-time use but enables token exchange)
  - `client_secret` (via Basic auth or POST body)
  - `code_verifier` (PKCE secret)

With these, the attacker can:
1. Exchange the code for access/refresh tokens
2. Impersonate the victim
3. Access protected MCP resources
4. If refresh_token is obtained, long-term account takeover

## Who Is Affected

- Any application using `createMcpClient` or MCP transports with `authProvider` and OAuth
- Users who add MCP servers from untrusted sources (malicious packages, phishing)
- Environments where discovery URL or MCP server URL can be influenced by an attacker

## Default Configuration

No special configuration required. Default OAuth flow uses discovery; no origin checks exist.
