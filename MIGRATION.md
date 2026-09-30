# Migration notes

Per release tag, newest first. Read by the platform's own version surface
(`GET /platform/versions`) and served to creators' agents through `vincentt
outdated`. Accurate or absent — never speculative. `required: false` is the
authored "no action required," not silence.

## 1.5.7
required: false
No action required.
- Release tooling only: the starter now carries two checks for the template's own release tags and its `latest` pointer. They run only in the template repository and do nothing in a creator's project.

## 1.5.6
required: false
No action required.
- The starter's default scene now demonstrates face and hand bounding boxes plus a footer HUD. These are creator-owned files, so upgrading an existing project will not add them; only a brand-new scaffold receives them.
- The starter's agent-contract docs were corrected to point at the SDK's own grounding file instead of a merge step that does not exist. Those docs are not touched by the upgrade either, so this only affects newly-scaffolded projects.

## 1.5.5
required: false
No action required.
- The local preview script now falls back automatically when the platform CLI is not resolvable on the shell's PATH, instead of only printing an install hint.
