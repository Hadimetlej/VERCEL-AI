# OAuth Token Leakage via Error Message

## Vulnerability Summary

When the OAuth token endpoint returns an HTTP error (e.g., 400) with a response body that contains tokens but does **not** conform to the OAuth error schema (missing required `error` field), the SDK's `parseErrorResponse` throws a generic `ServerError` with the **entire raw response body** included in the error message:

```typescript
const errorMessage = `${statusCode ? `HTTP ${statusCode}: ` : ''}Invalid OAuth error response: ${error}. Raw body: ${body}`;
return new ServerError({ message: errorMessage });
```

This causes sensitive tokens (`access_token`, `refresh_token`, `id_token`) to be leaked into error objects that may be logged, sent to error tracking services (Sentry, etc.), or displayed to users.

**Severity**: Medium–High (sensitive data exposure)  
**CVSS**: Depends on logging/error handling; can lead to token exposure

## Affected Files

- `packages/mcp/src/tool/oauth.ts`
  - `parseErrorResponse()` lines 582-601
  - Called from `exchangeAuthorization()`, `refreshAuthorization()`, `registerClient()`

## Root Cause

The OAuth error response schema requires an `error` field. When the server returns a non-conforming body (e.g., valid token payload without `error`), `OAuthErrorResponseSchema.parse(JSON.parse(body))` throws. The catch block includes the full `body` in the error message.

Real-world causes:
- OAuth server bug (returns tokens in error case)
- Misconfiguration (wrong content-type, malformed response)
- Malicious OAuth server probing for this behavior

## Exploitation Scenario

1. Victim exchanges auth code at a token endpoint
2. Server mistakenly returns 400 with body:
   ```json
   {"access_token":"eyJ...","refresh_token":"eyJ...","id_token":"eyJ..."}
   ```
   (no `error` field)
3. SDK throws: `ServerError: Invalid OAuth error response: ... Raw body: {"access_token":"eyJ...","refresh_token":"eyJ...","id_token":"eyJ..."}`
4. App logs the error or sends to Sentry → tokens exposed

## Mitigation

- Do not include raw server response body in error messages
- Log only safe excerpts or redact token-like values before including in errors
