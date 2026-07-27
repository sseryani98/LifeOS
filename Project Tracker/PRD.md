# Life OS — Project Tracker Product Design

## 1. Purpose

The Project Tracker is a Life OS module for managing:

* Complex professional work with many moving parts
* Personal and software projects
* Persistent life systems such as fitness, organization, and well-being
* Tasks, meetings, decisions, risks, resources, requirements, and project history
* Weekly planning and calendar-based execution
* Reusable methodologies that improve over time

It is not only a task manager. It is a combination of:

* Project memory
* Execution planner
* Methodology library
* Personal systems tracker
* Calendar scheduler
* Review and reflection system

The overall Life OS homepage remains undecided. This design covers only the Project Tracker module.

---

# 2. Core Design Principles

## Low maintenance

The system must avoid the organizational burden that caused previous Notion systems to fail.

* Quick capture must be available
* Guided creation must use simple sequential questions
* Items may be created with incomplete setup
* Organization can happen later
* Automation should reduce maintenance, not create more of it

## Flexible structure

Not everything should be forced into a finite project.

The system must support:

* Long-running workspaces
* Time-boxed initiatives
* Persistent personal systems
* Standalone tasks
* Cross-project tasks
* Recurring routines

## One canonical home

Every record has one official location in the life structure.

Example:

`Work → Enbridge → Security → Assist Security in FuT`

It may also have unlimited related contexts:

* Nominations
* Business Partner
* Theming

This avoids duplicate records while preserving cross-project visibility.

## Explainable automation

Scheduling, health calculations, reminders, and suggestions must explain why they were produced.

The user can override recommendations.

## Weak linkage where appropriate

Converting one record into another creates provenance, not ongoing synchronization.

Example:

* An idea creates a project
* The project receives an immutable note saying it came from that idea
* The idea shows the projects it created
* Later edits to the idea do not change the project

---

# 3. Life Structure

The structure supports navigation through context.

```text
Area
└── Engagement / Program
    └── Persistent Workspace
        └── Time-boxed Initiative
            └── Optional Milestone
                └── Task
                    └── Subtask
```

Example:

```text
Work
└── Enbridge
    └── Nominations
        └── SIT Defect Resolution
            └── Testing
                └── Retest defect 1842
```

Milestones are optional. They should only be used when they meaningfully group work.

Subtasks stop at one level.

---

# 4. Main Structural Concepts

## Persistent Workspace

A long-running home for a subject that may become active, quiet, dormant, and active again.

Examples:

* Nominations
* Theming
* Life OS

It preserves:

* Tasks
* Initiatives
* Resources
* Meetings
* Decisions
* Requirements
* Risks
* Notes
* Historical activity

Typical lifecycle:

`Planned → Active → Quiet → Dormant → Reactivated`

## Time-boxed Initiative

A temporary wave of work with a defined outcome.

Examples:

* Assist Security in FuT
* Complete Business Partner SIT Defects
* Close Theming-Level FuT Defects

Typical lifecycle:

`Planned → Active → Blocked / Waiting → Paused → Completed / Cancelled`

Completion is a declaration that the current wave has ended, not a guarantee that no related work will ever return.

## Persistent Personal System

An ongoing life system with routines, health, momentum, streaks, and levels.

Examples:

* Sports and Fitness
* Personal Organization
* Personal Hygiene and Well-being
* Reading
* Social Life
* Personal Software

A personal system may contain:

* Recurring tasks
* Routine bundles
* Temporary initiatives
* Weekly standards
* Logs and lessons
* Gamification

---

# 5. Project and Workspace Pages

A workspace page should surface:

* Status
* Calculated health
* Manual health assessment
* Current Focus
* Next Action
* Open tasks
* Last five completed tasks
* Active initiatives
* Upcoming milestones
* Recent meetings
* Recent decisions
* Open risks, issues, and blockers
* Key resources
* Important requirements
* Recent activity
* Manually pinned records

## Current Focus

A manually maintained summary of the workspace’s current direction.

Example:

> Finish FuT defects and unblock Security testing.

Rules:

* Focus changes create automatic log entries
* Previous focus entries remain in history
* Focus becomes stale after inactivity or major project changes
* Important child focuses may be shown on parent pages
* Child focuses are suggested by the system but require approval
* Pins may have optional expiry dates
* Completed or dormant children automatically stop appearing

## Next Action

A specific next step for the workspace.

Example:

> Ask Security about shared-role restrictions Friday.

Rules:

* The system may suggest it from tasks
* The user may override it
* Outdated next actions are marked stale and reviewed rather than deleted

---

# 6. Tasks

Tasks are independent records that can be linked to multiple contexts.

## Task lifecycle

Core states:

* Someday
* Not Ready
* Ready
* In Progress
* Waiting
* Done
* Cancelled

Readiness is a manual judgment. Open blockers may create warnings but do not automatically prevent a task from becoming Ready.

## Task relationships

Tasks may be:

* Blocked by
* Blocking
* Related to
* Duplicate of
* Follow-up to

## Cross-project task modes

### Shared task

One completion satisfies all linked projects.

Example:

> Approve shared security design

### Repeated task set

The same work must be completed independently for several projects.

Example:

```text
Validate theming
- Nominations — Done
- Business Partner — In Progress
- Contracting — Not Started
```

## Delegation

The system is single-user. Delegation is therefore private commitment tracking.

A task may contain:

* Responsible person
* Date requested
* Promised date
* Follow-up date
* Waiting-on status
* Your role
* Review required
* Related meeting or email

A dedicated **Waiting On** dashboard surfaces delegated work and external commitments.

## Task types

Task types may define:

* Custom fields
* Type-specific statuses
* Suggested methodologies
* Default reminders
* Specialized views

Type-specific statuses must map to the shared task lifecycle.

Example:

> Defect status: Retesting
> Base status: In Progress

A defect is a task with the Defect type, not a separate object.

## Completion and reopening

* Parent tasks may be completed with unresolved subtasks after a warning
* The user decides what happens to unresolved subtasks
* Completed tasks can be reopened
* Previous completion records remain in history
* Real abandoned work should be cancelled
* Accidental or duplicate tasks may be deleted
* Cancelled tasks are hidden by default
* Project views show the five most recently completed tasks by default

---

# 7. Methodologies, Types, and Templates

## Type

Defines what an object is and how it behaves.

Examples:

* SAP application
* Defect
* Time-boxed initiative
* Persistent personal system

Types may define custom fields, statuses, health rules, default views, and suggested methodologies.

## Methodology

Defines reusable execution knowledge.

Examples:

* Fix a Defect
* Security Readiness
* Production Deployment
* Code Review
* Process Meeting Notes

A methodology contains:

* Flexible subtasks
* Guidance
* SOPs
* Supporting resources
* Completion expectations
* Required, recommended, optional, or conditional steps

Methodology steps become normal subtasks.

Example:

```text
Fix defect #223
├── Reproduce issue
├── Identify root cause
├── Implement fix
├── Retest
├── Inform functional owner
└── Update documentation
```

Methodologies:

* May be applied at creation or later
* May be applied in combination
* Are always suggested, never applied without approval
* Can apply to projects or tasks
* May attach supporting resources automatically
* Keep selected resources pinned as Key Resources

When multiple methodologies contain the same step:

* Merge them into one shared task by default
* Preserve which methodologies require it
* Allow the user to separate them

Methodologies are edited directly in the library. Existing projects retain the checklist and references they originally received unless manually refreshed.

Methodology improvements happen deliberately from the Methodology Library.

Lessons from completed work remain linked to their original context and are surfaced in the relevant methodology for possible incorporation.

## Template

A convenient starting package combining:

* Object type
* Suggested methodologies
* Starter milestones
* Starter tasks
* Default fields
* Recommended resources

Templates do not determine behavior; types do.

---

# 8. Creation Flows

## Quick create

Used for immediate capture.

Minimum information:

* Name
* Object type
* Parent or context
* Optional date

The item may be marked as having incomplete setup.

## Guided setup

A sequence of simple questions, one decision per step.

Typical topics:

* What is being created?
* Where does it belong?
* What is the intended outcome?
* Is it persistent or time-boxed?
* Does a methodology apply?
* Are there important dates?
* What are the first tasks or milestones?
* How much attention should it receive?

Most steps may be skipped and completed later.

Parent records may offer suggested defaults for future children. Defaults are not forced.

A **Propagate to Children** action can later apply selected parent settings:

* Direct children by default
* Optional all descendants
* Optional selected items
* Preview required before applying
* Manual child overrides should be respected

---

# 9. Meetings

Meetings are first-class records.

They may include:

* Date
* Attendees
* Related contexts
* Raw notes
* Agenda items
* Decisions
* Tasks
* Waiting-on items
* Resources
* Open questions
* Follow-ups
* Outcome summary

Meetings are created:

* Manually
* Through the Apple Notes import pipeline

They are not automatically created from calendar events.

## Recurring meetings

A meeting series stores:

* Default attendees
* Related contexts
* Agenda bucket
* Common resources
* Prep rules
* Previous meeting links

Each occurrence remains a separate record.

The user may:

* Skip one occurrence with a reason
* Cancel one occurrence
* Cancel this and all future occurrences

Skipped and cancelled meetings remain in history but do not affect project health.

---

# 10. Agenda Items and Meeting Prep

Agenda items capture questions or topics that must resurface for a meeting.

Example:

> Ask Security whether shared roles support Nominations.

Agenda items may target:

* A specific meeting
* A recurring meeting series
* A topic bucket such as Next Security Meeting

Lifecycle:

`Captured → Upcoming → Asked → Answered / Follow-up Needed → Closed`

They resurface:

* The morning of the meeting
* Shortly before the meeting
* In the Meeting Prep view
* After the meeting until handled

After the meeting, an agenda item may:

* Record an answer
* Create a task for you
* Create a delegated task
* Update or create a decision
* Carry forward to another meeting
* Remain open
* Close

Carry-forward is always a user decision.

## Meeting Prep

Meeting Prep automatically suggests:

* Agenda items
* Open decisions
* Waiting-on items
* Overdue tasks
* Blockers
* Recent related meetings
* Recent project changes
* Relevant resources

Suggested prep items may be dismissed for that meeting without affecting their underlying records.

Meeting Prep:

* Opens automatically shortly before the meeting
* Is available through notifications
* Can be opened manually
* Switches to closeout mode after the meeting

Live note-taking is not required. Notes can be transferred afterward.

---

# 11. Decisions, Requirements, Risks, Issues, and Blockers

## Decisions

Decision records prioritize provenance:

* What was decided
* Date
* Participants
* Decision-maker
* Context: meeting, email, Teams, call, in person
* Source reference
* Related work
* Optional rationale
* Status
* Superseding decision

Lifecycle:

`Open Question → Proposed → Pending Approval → Decided → Superseded`

Unresolved decisions appear in a **Decisions Needed** view.

## Requirements

Requirements are optional first-class records for larger builds.

They may link to:

* Source meeting or person
* Multiple affected workspaces
* Decisions
* Implementation tasks
* Verification tasks
* Defects
* Resources

Lifecycle:

`Proposed → Approved → In Progress → Delivered → Verified → Rejected`

Formal acceptance criteria are not required. An optional “How do we know it is done?” note may be used.

## Risks

Something that might happen.

Fields may include:

* Risk statement
* Likelihood
* Impact
* Owner
* Mitigation
* Review date
* Status

## Issues

Something that has happened.

## Blockers

An active issue preventing progress.

A risk may materialize into an issue, and an issue may become a blocker.

---

# 12. Resources

Resources are first-class records containing both meaning and provenance.

A resource may be:

* Uploaded file
* SharePoint link
* Email
* Teams thread
* Website
* Repository
* Local file path
* Screenshot
* Document reference

Fields may include:

* Title
* Type
* Source
* Exact location
* Related contexts
* Topics
* Shared by
* Date found
* Description
* Status
* Canonical source
* Multiple alternate locations

Resources should be discoverable by:

* Project
* Topic
* Person
* Source
* Meeting
* Decision
* Task
* Search text

Resources may be pinned manually as Key Resources.

Stored file replacement deletes the old file. Resource deletion is permanent and requires confirmation showing where the resource is referenced.

Future requirement:

* Search inside uploaded PDFs, Word documents, presentations, and spreadsheets
* OCR for scanned documents later

---

# 13. Notes

Notes may exist under any context.

Types include:

* General
* Idea
* Project update
* Lesson learned
* Observation
* Question
* Sports cue

A note may remain a note or create:

* Task
* Decision
* Resource
* Agenda item
* Project update

The original note remains linked as provenance.

Notes may have persistent reminders. Viewing the note does not clear the reminder.

Reminder lifecycle:

`Active → Snoozed → Dismissed`

Dismissed reminders are hidden by default but available through history.

Recurring reminder actions ask whether they apply to:

* Current occurrence
* Current and future occurrences
* The entire recurrence

---

# 14. Ideas

Idea lifecycle:

`Inbox → Exploring → Planned → Converted → Archived`

Ideas may have reminders and may create:

* One or more tasks
* One or more projects or initiatives
* Notes
* Methodology improvements

When converted:

* New items receive a copied description
* New items receive an immutable source note
* The idea becomes Converted
* The idea keeps backlinks to everything it created
* Later idea edits do not modify created records
* Converted ideas remain editable

---

# 15. Project Logs and Activity

Each project or workspace has one combined timeline containing:

## Automatic activity

* Task completion or reopening
* Milestone changes
* Deadline changes
* Decisions
* Meetings
* Resources
* Status changes
* Current Focus changes
* Initiative completion

## Manual narrative updates

* Status updates
* Monthly summaries
* Checkpoints
* Risk updates
* Lessons learned
* General notes

Important descendant activity may roll up to parent pages.

Related-context activity may also roll up when marked important.

Duplicate events are shown once with all relevant contexts listed.

Major changes belong in the activity log. Full field-by-field audit history is future scope.

---

# 16. Health

## Work project health

Show both:

* Calculated health
* Manual assessment

Calculated health may consider:

* Deadlines
* Blockers
* Overdue tasks
* Stalled activity
* Unresolved decisions
* Child health

Manual health appears beside calculated health and includes:

* Rating
* Reason
* Last reviewed date

Child health affects parent health through configurable roll-up weights:

* Critical
* High
* Normal
* Low
* Excluded

Completed, dormant, paused, or cancelled children stop affecting current health unless unresolved obligations remain.

## Personal-system health

Calculated automatically from sensible defaults that may change over time.

Possible inputs:

* Routine completion
* Bundle completion
* Weekly standards
* Overdue severity
* Initiative progress
* Recent attention
* Momentum

Health bands:

`Thriving · Healthy · Needs Attention · Struggling`

Health, momentum, level, streak, and manual monthly assessment remain separate concepts.

---

# 17. Personal Systems and Gamification

Gamification applies only to persistent personal systems, not work projects.

## Mechanics

* Streaks reward consistency
* XP rewards effort and mastery
* Levels show long-term growth
* Weekly quests give immediate direction
* Health shows current condition
* Momentum shows recent direction
* Boss quests represent finite initiatives

## XP

### Effort XP

Examples:

* Workout completed
* Deep-work session completed
* Cleaning routine completed
* Weekly review completed

### Mastery XP

Examples:

* Shipped a Life OS feature
* Improved a tennis skill
* Reached a meaningful fitness achievement
* Completed a major personal initiative

XP should not reward unnecessary task splitting.

## Levels

Each persistent personal system has its own permanent level.

A poor week may reduce health or momentum but does not remove levels.

## Prestige

Prestige requires:

* Reaching the required level
* Completing a concrete capstone achievement

Prestige begins a new chapter rather than simply making the same routine harder.

Possible chapter paths:

* Deepen
* Broaden
* Maintain
* Transform

Prestige preserves:

* Lifetime XP
* Previous titles
* Achievements
* Best streaks
* Historical standards

---

# 18. Recurring Tasks and Routine Bundles

Recurring tasks remain overdue until completed.

Recurrence stays anchored to the original schedule rather than shifting based on late completion.

Supported timing styles:

* Exact day
* Completion window
* Preferred day with grace window

To avoid piling up, repeated missed occurrences may remain represented by one active overdue item while missed history is recorded.

## Routine Bundles

A bundle groups related recurring tasks.

Example:

```text
Weekly Room Reset
├── Clean desk
├── Clear laundry and garbage
├── Vacuum floor
└── Put loose items away
```

Each task retains its own recurrence, history, status, and streak.

The bundle also has:

* Bundle progress
* Bundle streak
* Optional combined calendar block
* Configurable success rule

Both task-level and bundle-level streaks are supported.

## Grace weeks

Grace may apply because of:

* Vacation
* Illness
* Travel
* Major work deadline
* Family event
* Unexpected personal circumstances
* Any manually approved reason

Grace options:

* Full grace
* Reduced standard
* Area-specific grace

Grace preserves streaks but does not increase them or create attention debt.

---

# 19. Weekly and Monthly Planning

## Sunday weekly planning

The system generates a tentative weekly schedule based on:

* Meetings
* Accepted workouts
* Hard deadlines
* Target dates
* Current priorities
* Weekly standards
* Deep-work needs
* Soft-work workload
* Attention across life areas
* Reminder profile

The user reviews and adjusts it.

## Daily review

The user reviews the day and makes changes based on new information.

## Ad hoc replanning

Urgent tasks may trigger replanning during the week.

Displaced tasks return to backlog rather than automatically rolling into tomorrow.

## Monthly review

One guided monthly review across all projects and life areas.

It includes:

* Area health
* Attention received
* Projects that progressed or stalled
* Major wins and problems
* Decisions and risks
* Project status changes
* Methodology lessons
* Updated weekly standards
* Next month’s priorities
* Written vibe check

Area ratings:

`Thriving · Healthy · Needs Attention · Struggling`

The monthly review may change the system’s seasonal focus and standards.

---

# 20. Scheduling and Work Blocks

The calendar is the primary execution mechanism.

## Scheduling priority

1. Meetings — fixed
2. Accepted workouts — locked
3. Deep work — protected but movable
4. Dog responsibilities — flexible
5. Reading — flexible and sacrificial
6. Soft work — fills remaining capacity

## Work modes

* Deep Work
* Soft Work
* Quick Task

Suggested defaults:

* Deep Work: 90 minutes
* Soft Work: 30 minutes
* Quick Task: approximately 15 minutes

All may be overridden.

## Many-to-many scheduling

A work block may cover multiple tasks.

A task may require multiple work blocks.

Example:

> 90-minute block: Close as many Theming FuT defects as possible.

Each block may have its own objective.

Tasks may be linked before, during, or after the block.

## Block outcomes

* Completed
* Partial
* Missed
* Cancelled

Multi-task closeout:

* Completed
* Progressed
* Not touched

Partial or missed work returns to backlog.

The user may optionally schedule another session immediately.

## Interruptions

A block may record:

* Interruption reason
* Approximate time lost

A 90-minute deep-work block counts as completed when at least 60 focused minutes were achieved.

Partial blocks contribute to focused-minute reporting but do not count as full deep-work blocks.

## Deep-work targets

Targets may vary by day.

The system also tracks weekly:

* Minimum
* Target
* Stretch target

Example:

`Minimum 6 · Target 8 · Stretch 10`

## Soft work

Soft-work blocks may group related tasks such as:

* Admin
* Follow-ups
* Documentation
* Waiting-on reviews

If the planned tasks finish early, the system may suggest another suitable task but does not add it automatically.

---

# 21. Attention Across Life Areas

The scheduler protects minimum weekly attention across areas.

Current “good enough week” examples:

* Five workouts
* Room is clean
* Hygiene and well-being handled
* Spoke to a few people
* Closed meaningful work tasks
* Spent more time on Life OS than recently

Standards may be measured through:

* Counts
* Desired state
* Due-item completion
* Social coverage
* Throughput
* Momentum

Standards may change throughout the year.

When capacity is insufficient, the system recommends what to sacrifice and explains the consequences. The user may override the recommendation.

---

# 22. Reminder Profiles and Notifications

Reminder intensity is selected during weekly planning and may change week to week.

Profiles:

* Recovery
* Light
* Balanced
* Ambitious
* Vacation

Hard deadlines and meeting agenda items remain visible in all profiles, but notification intensity may decrease.

## Notification Center

Reminders appear only in the Notification Center.

Groups may include:

* Today
* Upcoming
* Overdue
* Meeting Prep

Notification policies:

* Persistent
* Auto-expiring
* Dismissible

Notification history has a configurable retention period.

Email notifications are future scope.

---

# 23. Navigation and Dashboards

The module has two navigation modes.

## Life structure navigation

Used to explore context.

Example:

`Work → Enbridge → Nominations`

## Dashboard navigation

Cross-cutting views such as:

* Tasks
* Calendar
* Portfolio
* Deadlines
* Waiting On
* Meetings
* Decisions
* Resources
* Methodologies
* Reviews
* Notifications

Dashboards may be:

* Saved
* Filtered
* Sorted
* Grouped
* Pinned to navigation
* Used for single-item inline actions

Bulk dashboard actions are left to later UX design.

---

# 24. Pins and Tags

## Pins

Pinning is manual.

Pins may exist:

* Within a workspace
* Within a specific dashboard

Pinned categories may include:

* Key Resources
* Current Decisions
* Critical Blockers
* Main Initiatives

Pins support:

* Manual ordering
* Optional expiry dates
* Soft clutter limits
* Workspace-specific placement
* Outdated warnings

Expired unresolved pins remain visible and appear in planning review.

## Tags

Tags are optional and secondary to structured relationships.

They use one global flat tag library.

Tags support:

* Colour
* Optional description
* Search
* Dashboard filters
* Autocomplete
* Similar-tag warnings
* Merge
* Archive and reactivate
* Optional propagation to children

Inherited and direct tags look identical.

A child may remove an inherited tag. That exception persists during future propagation.

---

# 25. Search

Search covers everything:

* Active work
* Completed work
* Dormant work
* Archived work

Search returns related context, not only exact title matches.

Searching “authorization” may return:

* Tasks
* Decisions
* Meeting notes
* Resources
* Projects
* Requirements
* People involved
* Related contexts

Results show:

* Matching text
* Why it matched
* Canonical path
* Source
* Related backlinks

Archived records remain editable but are clearly marked historical. Major archived edits create history entries.

---

# 26. Apple Notes Capture Pipeline

Life OS runs on Windows. Apple Notes is accessed through iCloud.com and scraped through browser automation.

A folder such as **Life OS Inbox** contains fixed notes:

* Meetings
* Tasks
* Notes
* Ideas
* Resources

## Meetings note

Meeting sections use headings.

```text
## UX Meeting

<notes>


## Security Meeting

<notes>
```

The nightly process:

1. Opens iCloud Notes
2. Reads the folder
3. Parses each fixed note
4. Creates records directly when clear
5. Sends ambiguous content to a Review Inbox
6. Stores raw imported text and source
7. Clears only successfully imported sections
8. Preserves content if import fails
9. Uses duplicate detection

## Tasks note

```text
## Current Tasks — generated by Life OS

[In Progress] Fix Nominations defect #223
[Waiting] Security confirmation

---

## New Tasks — write below
```

Nightly processing:

* Reads the New Tasks section
* Creates tasks or inbox items
* Clears the captured section
* Refreshes Current Tasks and statuses

The status section is generated by Life OS and replaced each night.

## Ideas note

Ideas are captured during the day and imported into the Idea lifecycle.

Browser scraping is the chosen initial design despite its fragility.

---

# 27. Calendar Integration

Project Tracker remains the source of truth for work blocks.

Accepted blocks may be exported automatically to:

* Google Calendar
* Apple Calendar
* Outlook

Only accepted blocks sync. Tentative suggestions remain inside Project Tracker.

Initial direction:

* One-way sync from Project Tracker to calendars
* Two-way synchronization is a later enhancement
* External deletion should not delete the task itself

Sync states may include:

`Draft · Accepted · Synced · Changed Externally · Conflict · Cancelled`

---

# 28. Initiative History and Lineage

Completed initiatives remain visible until the monthly review, then move into a collapsible history section.

Archived initiatives:

* Remain searchable
* Remain editable
* May be restored
* May have linked successors

Successor initiatives may selectively carry forward:

* Resources
* Decisions
* Lessons
* Methodologies

Lineage view shows:

* Outcomes
* Major decisions
* Optional selected metrics
* Optional manual takeaway
* Previous and next initiatives

A compact lineage summary appears on the workspace, with full detail in a dedicated view.

Methodology evolution is not shown in lineage; it remains in the Methodology Library.

---

# 29. Future Scope

Explicit future requirements include:

* AI extraction and organization
* AI methodology improvement suggestions
* Search inside uploaded documents
* OCR for scanned files
* Semantic search
* Email notifications
* Two-way calendar synchronization
* Learned time-of-day preferences
* Area-specific working-hour rules
* Full field-level audit history
* Full backup and export
* Dated backup snapshots with configurable retention
* Dedicated CRM module for richer people and relationship tracking
* Device and location execution constraints
* Broader Life OS homepage and cross-module experience

---

# 30. Undecided or Deferred UX Areas

The following are intentionally left for later UX work:

* Overall Life OS homepage
* Exact Project Tracker landing page
* Detailed dashboard layouts
* Bulk-management interfaces
* Visual design of guided setup
* Exact RPG styling and celebration effects
* Detailed reporting presentation
* Mobile versus desktop interaction patterns
