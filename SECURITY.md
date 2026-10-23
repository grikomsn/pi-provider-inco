# Security Policy

## Supported versions

Security fixes target the latest version published on [npm](https://www.npmjs.com/package/pi-provider-inco). Update before reporting an issue that may already be fixed.

## Reporting a vulnerability

Email [security@nibras.co](mailto:security@nibras.co). Do not open a public issue or discussion.

Include, when applicable:

- A concise description and potential impact
- Affected package, Pi, and Node.js versions
- Reproduction steps or a proof of concept
- Relevant logs with API keys, prompts, and personal data removed

You should receive an acknowledgment and a request for any missing details. Please allow time for investigation and a release before public disclosure. If the report is not security-sensitive, use the normal issue templates instead.

## Scope

This integration forwards requests to the public Inco AI service at `api.inco.ai`. It is independent and unaffiliated: report issues about the Inco AI service itself to Inco AI, and issues about this integration through the policy above.

API keys are read from the ambient environment (`INCO_API_KEY`) or pi's credential store. Never commit keys; the tests use injected fakes and never contact the live service.
