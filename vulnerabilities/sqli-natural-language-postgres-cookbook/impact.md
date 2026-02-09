# Impact: Prompt Injection → SQL Injection

## Real-World Scenario

- App built from cookbook: user asks natural language questions → LLM generates SQL → executed
- Attacker crafts question that manipulates the model's output
- Malicious SQL runs → data breach, table drops, privilege escalation

## Who Is Affected

- Apps implemented following the natural-language-postgres cookbook
- Any text-to-SQL pattern that executes LLM output without validation
