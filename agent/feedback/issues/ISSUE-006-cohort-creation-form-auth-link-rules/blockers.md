# ISSUE-006 Blockers

No known blockers.

Resolved implementation decision:
- Full auth remains deferred to T012. The create route preserves a temporary `user-creator` demo creator path and ignores posted `creatorId` values after removing the visible Creator field.
