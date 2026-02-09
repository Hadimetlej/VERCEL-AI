# Impact: SSRF via Download (User URLs)

## Real-World Scenario

- **Chat applications**: Users can paste or reference image URLs
- **Multi-modal AI**: Image inputs are common; URLs are a supported format
- **Server-side execution**: AI calls typically run on the server, so fetch originates from the backend

## Attack Vectors

1. **Direct user input**: Attacker sends message with malicious image URL
2. **Prompt injection**: Attacker injects image URL into a prompt that gets processed as a message
3. **Stored content**: Previously stored messages with URLs replayed in conversation

## Potential Impact

- **Cloud metadata**: AWS/GCP/Azure metadata services → IAM credentials, environment data
- **Internal services**: Admin panels, databases, microservices
- **Port scanning**: Probe internal ports via error/timing differences
- **Data exfiltration**: Fetch internal endpoints and leak data via model response or side channels

## Who Is Affected

- Apps using `generateText`/`streamText` with the default `experimental_download`
- Apps that do not provide a custom download function with URL validation
- Any app where user messages (including images/files) are passed to the AI SDK
