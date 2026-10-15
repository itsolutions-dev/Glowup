---
"@its/glowup-notifications": patch
---

Internal cleanup with no API change. Web Push now passes the VAPID public key to
`pushManager.subscribe` as the base64url string, which the Push API decodes
itself. The web push path and the `/testing` mock share one notification builder,
and scheduled and delivered notifications share one payload parser.
