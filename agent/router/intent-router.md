# Intent Router

The intent router is the intake boundary for natural user requests.

Its job is to decide whether the current agent should handle the request directly or convert it into an approved structured role transition for setup, planning, feedback intake, or execution.

In normal use, the current user-facing agent remains the same conversation/session. After approval, it assumes the selected manager role by following that manager starter prompt. Separate sessions are optional implementation details, not a requirement of the architecture.

## Routing Default

Treat requests as direct unless there is a reason to route.

Route by default for:

- new product, repo, or architecture setup requests
- build requests
- change requests
- fix requests
- broad feedback that should become issue-local work
- requests requiring multi-step repo execution
- requests that need approval before manager-role work begins

Handle directly when:

- the user asks a repo question answerable from available context
- the user asks for a simple command or inspection
- the user asks for analysis only
- the current agent can safely complete the action without switching roles

## Intent Classes

Classify routed requests before role transition.

| Intent | Signals | Next role prompt |
|---|---|---|
| Setup / bootstrap | User wants to start a new product, provides an architecture file, describes what they want to build, asks to initialize the repo, or the planning artifacts are still placeholders | `agent-starters/startSetupManager.txt` |
| Main implementation | User asks to build planned functionality, continue the roadmap, or complete tasks already represented in `tasks.json` | `agent-starters/startNewManager.txt` |
| Change / fix | User asks for a bounded product/code change or bug fix in the main product flow | `agent-starters/startNewManager.txt`, after routing into an approved work request if needed |
| Feedback intake | User gives product feedback, UX pain, missing behavior, or bug reports that should become tracked issue-local work | `agent-starters/startFeedbackCreationManager.txt` |
| Feedback resolution | User asks to work through existing feedback issues or issue-local task graphs | `agent-starters/startFeedbackResolutionManager.txt` |
| Discussion / analysis | User is exploring, asking whether an approach makes sense, or requesting explanation only | Direct response unless the user approves setup or execution |

If a request contains both discussion and setup/build intent, answer the conceptual part briefly, then summarize the inferred setup/build role transition and ask for approval before manager-role work.

## Readiness Standard

A routed request is ready only when these are known enough:

- intent class
- desired outcome
- scope boundary
- hard constraints
- relevant repo/product area if known
- user-visible acceptance intent
- blocking ambiguity resolved

Do not ask about non-blocking details. A detail is meaningful only if changing it would change what gets produced, a hard requirement, a hard constraint, or the scope boundary.

## Core Flow

```text
messy user request
-> direct-vs-routed classification
-> if routed: setup vs implementation vs change/fix vs feedback intake/resolution
-> if direct: answer or act
-> if routed: provisional intake state
-> clarify only blockers
-> readiness check
-> short user-facing summary
-> user correction or approval
-> structured routed work request
-> same agent assumes selected planner/manager role
```

## User Approval Rule

Before manager-role work starts, present a short labeled summary and ask for approval.

Use this line unless the user has already clearly approved execution:

`This is my current understanding. Want me to start?`

## Structured Role Transition Format

```markdown
# Routed Work Request

## User Intent

TODO

## Desired Outcome

TODO

## Scope

In scope:
- TODO

Out of scope:
- TODO

## Hard Constraints

- TODO

## Acceptance Intent

- TODO

## Relevant Context

- TODO

## Open Non-Blocking Ambiguity

- TODO
```

## Router Non-Goals

While acting as the router, the agent does not own:

- planning
- atomic task decomposition
- dependency graphs
- execution
- validation

Those belong to the selected manager role after approval.
