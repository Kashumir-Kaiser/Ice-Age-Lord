# Image generation checkpoints

The user requires a committed, pushed checkpoint after every 10 generated assets.
Check git status and the current branch, then git add, git commit and git push all
current task work. Include original generated files, their source destinations/
provenance, and related source/manifest changes. Do not generate an 11th asset while
the preceding batch remains unpublished. Never push these changes
to main when the task uses a separate branch.

Also commit and push remaining work before stopping or handing off, including a
clear unfinished-work checkpoint. Verify the remote commit and expected files.
If saving or pushing fails, report the precise failure immediately; a local path,
chat image record, or uncommitted working tree is not a durable checkpoint.

For the current map task, use codex/map-25d-overhaul and GitHub integration/Actions.
Reuse prior generated art. Do not regenerate missing originals merely because a
new chat cannot access the previous chat's workspace.

User update, 2026-10-15: GitHub Actions minutes are exhausted. Do not trigger,
dispatch or rerun Actions for this task. Use [skip ci] on every subsequent map
branch commit/push, perform available checks locally, and upload original and
generated derivative Git blobs directly through the integration. Do not rely on
the asset persistence Action while this instruction is active. Leave main and
its workflow settings alone.

Later user update, 2026-10-15: the repository is now public. Retry GitHub Actions
for the current map checkpoint; if GitHub still blocks execution, return to
local checks. This supersedes the temporary quota instruction above. Use normal
map-branch commits for this retry; do not dispatch redundant old runs.

If native git cannot reach GitHub and a large connector image upload stalls,
transfer small base64 parts through the integration under assets/source/uploads.
The map-asset-upload workflow verifies the original Git blob hashes, restores
the PNGs, rebuilds derivatives, commits and pushes them to the map branch.
Verify that final commit and its original image hashes before generating more.
