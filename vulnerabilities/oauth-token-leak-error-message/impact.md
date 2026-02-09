# Impact: OAuth Token Leakage via Error Message

## Real-World Scenario

- **Error tracking**: Many apps use Sentry, Datadog, etc. and log full error messages
- **Logging**: `console.error(err)` or structured logging may capture the full message
- **User-facing**: Some UIs display error messages to users

Tokens in error messages can be:
- Stored in log aggregation systems
- Sent to third-party error tracking
- Displayed in developer consoles or user interfaces

## Who Is Affected

- Applications using `@ai-sdk/mcp` OAuth with default error handling
- Any code path that logs or reports errors from `auth()`, token exchange, or refresh

## Attacker Model

- **Passive**: Attacker with access to logs or error tracking (insider, compromised service)
- **Active**: Malicious OAuth server that intentionally returns malformed 400 with tokens to trigger the leak into the victim’s error pipeline
