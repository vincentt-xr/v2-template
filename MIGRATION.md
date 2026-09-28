# Migration notes

Per release tag, newest first. Read by the platform's own version surface
(`GET /platform/versions`) and served to creators' agents through `vincentt
outdated`. Accurate or absent — never speculative. `required: false` is the
authored "no action required," not silence.

## 1.5.5
required: false
No action required.
- The local preview script now falls back automatically when the platform CLI is not resolvable on the shell's PATH, instead of only printing an install hint.
