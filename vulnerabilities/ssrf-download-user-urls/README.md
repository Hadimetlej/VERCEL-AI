# SSRF via User-Controlled URLs in Message Downloads

## Vulnerability Summary

When using `generateText`, `streamText`, or related AI SDK functions with **user messages** containing image or file parts that reference URLs, the SDK downloads those URLs if the model does not support them natively. The **default download function** fetches URLs with **no validation, allowlisting, or blocking** of internal/private addresses.

An attacker who can control message content (e.g., as a chat user or via prompt injection) can cause the server to fetch:
- Cloud metadata endpoints (`http://169.254.169.254/...`)
- Internal services (`http://localhost/`, `http://internal-api/`)
- Arbitrary external URLs (for data exfiltration, port scanning)

**Severity**: High (SSRF)  
**Affected**: Applications using default `experimental_download` with user-controlled messages

## Affected Files

- `packages/ai/src/util/download/download.ts` – default fetch with no URL validation
- `packages/ai/src/prompt/convert-to-language-model-prompt.ts` – `downloadAssets()` passes user message URLs to download
- `packages/ai/src/util/download/download-function.ts` – `createDefaultDownloadFunction`

## Root Cause

1. User messages can contain `ImagePart` or `FilePart` with `image` or `data` as a URL string.
2. `downloadAssets()` extracts these URLs and calls `download()` for parts where the model does not support the URL.
3. The default download function uses `fetch(url)` with no checks on scheme, host, or IP range.

```typescript
// download.ts - no validation
export const download = async ({ url }: { url: URL }) => {
  const response = await fetch(url.toString(), { ... });
  // ...
};
```

## Exploitation Scenario

1. Victim app: Next.js chat using `streamText` with user messages.
2. Attacker sends a message: `"Look at this image: [image with URL http://169.254.169.254/latest/meta-data/iam/security-credentials/]"`
3. SDK calls `download()` for that URL (when model doesn’t support it).
4. Server fetches cloud metadata → attacker retrieves IAM credentials via response/channel.

Or: attacker uses `http://internal-admin.local/secrets` to probe internal services.

## Trust Boundary

- **Input**: User message content (images/files with URLs)
- **Action**: Server-side `fetch` to those URLs
- **Impact**: Internal network access, cloud metadata, port scanning
