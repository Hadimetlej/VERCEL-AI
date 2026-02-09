# Impact: RCE via eval() in Calculator Tool

## Real-World Scenario

- Developers copy examples into chat apps where the prompt = user message
- Attacker sends crafted prompt that steers the model to output malicious expression
- eval() executes attacker code → full RCE

## Who Is Affected

- Apps using the calculator tool pattern from examples with user-controlled prompts
- Chatbots, agents, or APIs that expose this tool to untrusted users
