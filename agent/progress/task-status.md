# Lofi MVP Task Status

`tasks.json` is canonical. This view is intentionally reset for the lofi branch.

| Task | Title | Status | Dependencies Ready | Evidence |
|---|---|---|---|---|
| L000 | Establish the clean lofi application shell | done | yes | Legacy runtime removed; focused shell tests and full checks passed. |
| L001 | Define the lofi domain and validation policy | done | yes | Domain records, validation, recurrence/DST, lifecycle, serialization, and privacy boundaries verified. |
| L002 | Add isolated lofi persistence and Supabase migration | done | yes | Local and Supabase repositories, atomic quorum RPC, isolated migration, RLS, privacy, concurrency, and idempotency verified. |
| L003 | Build anonymous cohort creation | done | yes | Form, service, route policy, timezone capture, honeypot, and five-success IP limit verified. |
| L004 | Build the landing page, listing, and lifecycle views | done | yes | Landing listing, filters, detail lifecycle views, local times, privacy, and safe link visibility verified. |
| L005 | Build anonymous interest and quorum unlock | done | yes | Email-only interest, request guards, conflicts, atomic quorum unlock, privacy, and ten-success IP limit verified. |
| L006 | Add Resend confirmation and quorum notifications | done | yes | Resend adapter, idempotent delivery records, confirmations, quorum fanout, sanitized failures, and fake-provider tests verified. |
| L007 | Isolate lofi production configuration and deployment | done | yes | Production requires the complete lofi-only environment contract and isolated Supabase persistence; Render/env/runbook configuration and tests are aligned. |
| L008 | Complete lofi privacy, abuse, and end-to-end verification | done | yes | Integrated lifecycle/privacy/abuse gates passed; browser smoke found and verified the local-time formatter fix. |
| L009 | Create isolated provider resources and deploy | not_started | yes | Pending human provider and DNS work. |
| L010 | Run production lofi smoke test | not_started | no | Pending |
| L011 | Add public Research & Field Notes editorial pages | done | yes | Index, stable research article, navigation, safe extensible entry rendering, and focused tests verified. |
| L012 | Publish the original Cohort15 product thesis video update | done | yes | Supplied video, transcript-derived article, original-vs-current framing, embed safety, and focused tests verified. |

Next ready task: L009.
