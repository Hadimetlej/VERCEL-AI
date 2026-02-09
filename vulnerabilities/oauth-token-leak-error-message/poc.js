/**
 * PoC: OAuth token leak via error message
 *
 * Simulates parseErrorResponse behavior when token endpoint returns
 * 400 with token payload but no "error" field.
 *
 * Run:
 *   Terminal 1: node mock-server.js
 *   Terminal 2: node poc.js
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

  console.log('1) Server response body:');
  console.log(body);
  console.log('');

  const result = parseErrorResponseLogic(body, 400);
  if (result.type === 'server_error') {
    console.log('2) Error message (would be thrown / logged):');
    console.log(result.message);
    console.log('');
    const leaked = /access_token|refresh_token|id_token/.test(result.message);
    console.log(leaked ? '>>> LEAK: Tokens present in error message.' : 'No tokens in message.');
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  console.error('Is mock-server.js running on 5050?');
  process.exit(1);
});
