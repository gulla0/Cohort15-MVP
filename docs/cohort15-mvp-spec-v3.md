# Cohort15 — MVP Spec v3

## Product Summary

**Cohort15** is a simple online platform where people can create cohort-style events and others can show interest using tokens.

The core idea:

- A creator spends **2 tokens** to create a cohort event.
- A participant spends **1 token** to show interest.
- Tokens are held while the cohort is forming.
- If minimum quorum is met, the cohort unlocks and the private event link becomes visible.
- If quorum is not met before expiry, all held tokens are returned.
- Every new cohort event is automatically promoted through official social channels.

This keeps the product lightweight while giving creators built-in distribution.

---

## Core MVP Rules

### Token Rules

| Action | Token Cost | What Happens |
|---|---:|---|
| Create a cohort event | 2 tokens | Tokens are held while the event is open |
| Show interest in a cohort | 1 token | Token is held while the event is open |
| Quorum is met | N/A | Held tokens are consumed |
| Quorum is not met | N/A | Held tokens are returned |

Tokens should not be permanently spent until the cohort successfully unlocks.

---

## Quorum Rule

Each event has a required minimum number of participants.

This is the **minimum quorum**.

Example:

```txt
Minimum quorum = 5
Interested participants = 5
Result = quorum met
```

When quorum is met:

- event status becomes `active`
- held tokens are consumed
- the private online event link becomes visible
- users can join the cohort externally

---

## Expiry Rule

Each cohort event expires **14 days after creation**.

```txt
Default expiry = createdAt + 14 days
```

If quorum is met before expiry:

- the cohort unlocks
- tokens are consumed
- the private event link is revealed

If quorum is not met before expiry:

- the cohort expires
- all held tokens are refunded
- the private event link stays hidden

---

## Online-Only Rule

This MVP is purely online.

There is no in-person location support.

The event has a private online link, such as:

- Discord
- Zoom
- Google Meet
- Slack
- Telegram
- GitHub
- Notion

The private event link is hidden until quorum is met.

---

## Automated Social Promotion

When someone creates a cohort event, the platform automatically posts it to official social channels.

This turns every cohort request into a small marketing campaign.

### Social Promotion Flow

```txt
User creates cohort event
↓
2 tokens are held
↓
Event goes live on the platform
↓
System posts event to official socials
↓
People visit the event page
↓
Users spend 1 token to show interest
↓
Quorum is met or event expires
```

### Public Social Post Should Include

- event title
- topic
- target skill level
- short description
- quorum needed
- public event page link

### Public Social Post Should Not Include

- private event link
- meeting room link
- Discord invite
- Zoom link
- Google Meet link

The social post should drive people to the public event page.

---

## Event Lifecycle

### Success Path

```txt
Created
↓
Open
↓
Quorum Met
↓
Active
↓
Completed
```

### Failure Path

```txt
Created
↓
Open
↓
Expired
↓
Tokens Returned
```

---

## Event Statuses

| Status | Meaning |
|---|---|
| `open` | Event is live and collecting interest |
| `active` | Quorum was met and the private event link is unlocked |
| `expired` | 14 days passed without quorum being met |
| `cancelled` | Creator or admin cancelled the event |
| `completed` | Event or cohort has ended |

For the earliest MVP, the most important statuses are:

```ts
"open" | "active" | "expired"
```

But `cancelled` and `completed` are practical and worth keeping.

---

# Event Object

## Recommended MVP Event Type

```ts
type Event = {
  id: string;
  creatorId: string;

  // Basic public info
  title: string;
  description: string;
  category: "learn" | "build" | "practice" | "accountability" | "open_source" | "explore";
  topic: string;

  // Fit / expectations
  targetAudience: string;
  targetSkillLevel: "beginner" | "intermediate" | "advanced" | "any";
  additionalDetails?: string;

  // Quorum rules
  minQuorum: number;
  maxParticipants: number;
  status: "open" | "active" | "expired" | "cancelled" | "completed";

  // Hidden until quorum is met
  lockedEventLink: string;

  // Schedule
  firstMeetingAt: Date;
  meetingDurationMinutes: number;
  recurrence: "none" | "weekly" | "biweekly" | "monthly";
  meetingCount: number;

  // Expiry
  expiresAt: Date;

  // Social automation
  socialPostStatus: "pending" | "posted" | "failed";

  // System
  createdAt: Date;
  updatedAt: Date;
};
```

---

## Event Field Breakdown

### `id`

Unique event identifier.

Used for:

- database lookup
- URLs
- token transactions
- interest records
- social post tracking

---

### `creatorId`

The user who created the cohort event.

Used for:

- ownership
- editing permissions
- creator dashboard
- token holds/refunds
- abuse handling

---

### `title`

Short public event name.

Example:

```txt
Beginner TypeScript Build Cohort
```

This appears in:

- event feed
- event detail page
- social posts

---

### `description`

Short explanation of the cohort.

This should explain what the group is trying to do.

Example:

```txt
A small weekly cohort for beginners who want to learn TypeScript by building small projects together.
```

---

### `category`

The broad intent of the cohort.

Allowed values:

```ts
"learn" | "build" | "practice" | "accountability" | "open_source" | "explore"
```

Examples:

| Category | Meaning |
|---|---|
| `learn` | Learn a topic together |
| `build` | Build a project together |
| `practice` | Practice a skill together |
| `accountability` | Keep each other consistent |
| `open_source` | Contribute to open-source work |
| `explore` | Explore a new topic or idea |

---

### `topic`

The specific subject of the cohort.

Examples:

```txt
TypeScript
Python
React
AI agents
UX research
Solidity
```

Used for:

- search
- filtering
- social posts
- recommendations later

---

### `targetAudience`

Plain-English explanation of who the cohort is for.

Example:

```txt
Beginner developers who know basic JavaScript and want to start learning TypeScript.
```

This helps users self-select before spending a token.

---

### `targetSkillLevel`

The intended skill level of the event.

Allowed values:

```ts
"beginner" | "intermediate" | "advanced" | "any"
```

This is not verified.

It is only used to communicate expectations.

Better meaning:

```txt
Who is this event designed for?
```

Not:

```txt
What is the verified skill level of each user?
```

---

### `additionalDetails`

Flexible notes field.

This lets creators add extra context that does not fit into the structured fields.

Examples:

```txt
We will use the official TypeScript handbook.
Bring a small project idea.
We will meet on Discord.
This is best for people who already know basic JavaScript.
```

This is optional, but useful.

---

### `minQuorum`

Minimum number of interested participants required for the cohort to unlock.

Example:

```txt
minQuorum = 5
```

Once accepted interest reaches `minQuorum`, quorum is met.

---

### `maxParticipants`

Maximum number of participants allowed.

Validation rule:

```ts
maxParticipants >= minQuorum
maxParticipants <= 15
```

Examples:

```txt
If minQuorum is 5, maxParticipants can be 5–15.
If minQuorum is 8, maxParticipants can be 8–15.
```

This keeps cohorts small and focused.

---

### `status`

Current lifecycle state of the event.

Allowed values:

```ts
"open" | "active" | "expired" | "cancelled" | "completed"
```

---

### `lockedEventLink`

The private online event link.

Examples:

```txt
Discord invite
Zoom link
Google Meet link
Slack invite
Telegram group
GitHub repo
Notion page
```

This field is hidden until quorum is met.

Before quorum:

```txt
Location unlocks when quorum is met.
```

After quorum:

```txt
Here is the cohort link: [lockedEventLink]
```

---

### `firstMeetingAt`

The exact date and time of the first meeting.

This is required.

Example:

```ts
firstMeetingAt: "2026-06-10T18:00:00-04:00"
```

The event must have a real first meeting time.

---

### `meetingDurationMinutes`

How long each meeting lasts.

Examples:

```txt
30
60
90
120
```

This helps users understand the time commitment.

---

### `recurrence`

How often the cohort repeats.

Allowed values:

```ts
"none" | "weekly" | "biweekly" | "monthly"
```

Examples:

| Value | Meaning |
|---|---|
| `none` | One-time meeting |
| `weekly` | Repeats every week |
| `biweekly` | Repeats every two weeks |
| `monthly` | Repeats every month |

---

### `meetingCount`

Total number of meetings.

Minimum:

```ts
meetingCount >= 1
```

Examples:

| Event Type | Recurrence | Meeting Count |
|---|---|---:|
| One-time event | `none` | 1 |
| 4-week cohort | `weekly` | 4 |
| 6-session cohort | `weekly` | 6 |
| Monthly accountability group | `monthly` | 3 |

---

### `expiresAt`

When the cohort stops collecting interest.

Default:

```ts
expiresAt = createdAt + 14 days
```

If quorum is not met by this date, the event expires and tokens are returned.

---

### `socialPostStatus`

Tracks automated social posting.

Allowed values:

```ts
"pending" | "posted" | "failed"
```

This is useful because automated promotion is part of the product value.

---

### `createdAt`

When the event was created.

Used for:

- sorting
- expiry calculation
- audit history

---

### `updatedAt`

When the event was last updated.

Used for:

- debugging
- edit history
- admin review

---

# Important Validation Rules

## Participant Cap

```ts
if (maxParticipants < minQuorum) {
  throw new Error("Max participants cannot be lower than quorum.");
}

if (maxParticipants > 15) {
  throw new Error("Max participants cannot be greater than 15.");
}
```

---

## Meeting Count

```ts
if (meetingCount < 1) {
  throw new Error("Event must have at least one meeting.");
}

if (recurrence === "none" && meetingCount !== 1) {
  throw new Error("One-time events must have exactly one meeting.");
}

if (recurrence !== "none" && meetingCount < 2) {
  throw new Error("Repeating events must have at least two meetings.");
}
```

---

## Expiry

```ts
expiresAt = createdAt + 14 days
```

---

## Online Link

```ts
lockedEventLink is required
lockedEventLink is hidden until quorum is met
```

---

# Related Objects

The event object should not store everything.

Some information belongs in separate objects.

---

## EventInterest

One event can have many interested users.

```ts
type EventInterest = {
  id: string;
  eventId: string;
  userId: string;
  tokensHeld: number;
  status: "active" | "refunded" | "consumed";
  createdAt: Date;
};
```

### Why separate?

Because each interest belongs to one user and one event.

The event should not store a list of users directly.

---

## TokenTransaction

Token history should be auditable.

```ts
type TokenTransaction = {
  id: string;
  userId: string;
  eventId?: string;
  amount: number;
  type: "hold" | "consume" | "refund" | "purchase" | "grant";
  createdAt: Date;
};
```

### Why separate?

Because token movement should be traceable.

Do not silently update balances without transaction records.

---

## SocialPost

For earliest MVP, `socialPostStatus` on the event may be enough.

If posting to multiple channels, create a separate `SocialPost` object.

```ts
type SocialPost = {
  id: string;
  eventId: string;
  platform: "x" | "linkedin" | "discord" | "telegram";
  postText: string;
  postUrl?: string;
  status: "pending" | "posted" | "failed";
  createdAt: Date;
  postedAt?: Date;
};
```

### Why separate?

Because one event may be posted to multiple platforms.

Each platform can succeed or fail independently.

---

# Creator Flow

```txt
Creator logs in
↓
Creator creates cohort event
↓
System checks creator has at least 2 tokens
↓
System holds 2 tokens
↓
Event status = open
↓
Event is posted on platform
↓
Event is posted to official socials
↓
Creator waits for quorum
```

---

# Participant Flow

```txt
Participant logs in
↓
Participant views open cohorts
↓
Participant clicks show interest
↓
System checks participant has at least 1 token
↓
System holds 1 token
↓
Interest is recorded
↓
System checks quorum
```

---

# Quorum Met Flow

```txt
Interested count reaches minQuorum
↓
Event status = active
↓
Held tokens are consumed
↓
Private event link becomes visible
↓
Participants can join the online cohort
```

---

# Quorum Not Met Flow

```txt
Event reaches expiresAt
↓
Quorum was not met
↓
Event status = expired
↓
Held tokens are refunded
↓
Private event link remains hidden
```

---

# Recommended Creator Form Sections

The event object may look large, but the user form should be grouped simply.

## 1. What is this cohort?

- Title
- Description
- Category
- Topic

## 2. Who is it for?

- Target audience
- Target skill level
- Additional details

## 3. When does it meet?

- First meeting date
- First meeting time
- Meeting duration
- Recurrence
- Number of meetings

## 4. What unlocks after quorum?

- Private online event link

## 5. Cohort size

- Minimum quorum
- Maximum participants

---

# MVP Scope

## In Scope

- regular user auth
- token balance
- create cohort event for 2 tokens
- show interest for 1 token
- token hold / consume / refund logic
- quorum unlock
- 14-day expiry
- hidden online event link
- automated social posting
- event feed
- event detail page
- creator dashboard
- participant dashboard

---

## Out of Scope

- in-person events
- magic-link-only identity
- Stripe payment logic
- report windows
- complex fraud tooling
- in-app chat
- user profiles
- reputation system
- AI matching
- waitlists
- calendar integrations
- verified skill levels
- manual moderation tools

---

# Primary Success Metric

```txt
% of cohort events that reach quorum and unlock
```

Secondary metrics:

```txt
Average time to quorum
Number of interested users per event
Social post click-through rate
Token refund rate
Creator repeat rate
```

---

# Plain-English MVP Summary

Cohort15 lets users create online cohort events by staking 2 tokens. Each event is automatically promoted through official social channels. Other users stake 1 token to show interest. If enough people commit within 14 days, quorum is met, tokens are consumed, and the private event link unlocks. If not enough people commit, the event expires and all held tokens are returned.
