# Impact: RCE via Shell Tool + Prompt Injection

## Real-World Scenario

- Developer copies ai-functions shell example into a chat app
- User messages become the prompt
- Attacker sends prompt injection → model outputs malicious command → exec runs it
- Full system compromise

## Who Is Affected

- Apps that use openai.tools.shell with executeShellCommand (raw exec) and user-controlled prompts
- Chatbots/agents that expose shell to untrusted users without sandbox
