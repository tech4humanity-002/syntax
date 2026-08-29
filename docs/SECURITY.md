# Security and privacy baseline

- Local-first indexing and content processing.
- Explicit folder access and exclusions.
- macOS Keychain for personal secrets; never plaintext configuration.
- BYO providers with visible scopes and revocation.
- No service-role or administrator key in the client.
- Signed local requests, replay protection and idempotency.
- Source permission preservation for connected apps.
- Sensitive-result masking and history retention controls.
- Exportable and deletable memory, history and telemetry.
- Secret redaction in diagnostics and receipts.
- Signed, notarised builds and verifiable update hashes.

Production is blocked until threat modelling, dependency review, code signing,
notarisation, privacy policy, EULA and recovery testing are complete.
