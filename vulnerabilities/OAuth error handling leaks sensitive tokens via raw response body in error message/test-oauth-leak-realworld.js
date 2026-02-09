/**
 * Real-world test: MCP client gets 400 from token endpoint with body that has
 * tokens but no "error" field → parseErrorResponse puts full body in error message → leak.
 *
 * Run:
 *   Terminal 1: node mock-oauth-server.js
 *   Terminal 2: node test-oauth-leak-realworld.js
 */

const http = require('http');

const TOKEN_URL = 'http://127.0.0.1:5050/token';

function parseErrorResponseLogic(body, statusCode = 400) {
  try {
    const parsed = JSON.parse(body);
    if (typeof parsed.error !== 'string') {
      throw new Error('OAuth error schema: missing "error"');
    }
    return { type: 'oauth_error', message: parsed.error_description };
  } catch (err) {
    const errorMessage = `${statusCode ? `HTTP ${statusCode}: ` : ''}Invalid OAuth error response: ${err}. Raw body: ${body}`;
    return { type: 'server_error', message: errorMessage };
  }
}

async function main() {
  const body = await new Promise((resolve, reject) => {
    const req = http.get(TOKEN_URL, (res) => {
      let data = '';
      res.on('data', (ch) => (data += ch));
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
  });

  console.log('1) Response body from server (what a real OAuth server might wrongly return):');
  console.log(body);
  console.log('');

  const result = parseErrorResponseLogic(body, 400);
  if (result.type === 'server_error') {
    console.log('2) Error message that would be thrown / logged (contains full body):');
    console.log(result.message);
    console.log('');
    const leaked = /access_token|refresh_token|id_token/.test(result.message);
    console.log(leaked ? '>>> LEAK: tokens are in the error message (real-world impact).' : 'No tokens in message.');
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  console.error('Is mock-oauth-server.js running on 5050?');
  process.exit(1);
});
