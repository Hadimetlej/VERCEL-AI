# Impact: RCE via OAuth URL + exec()

Chains with SSRF/OAuth discovery vuln. Attacker controls authorization_endpoint → command injection when app opens URL in shell.
