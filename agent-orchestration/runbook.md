# Orchestration Runbook

Use this runbook to execute high-quality delivery loops quickly and consistently.

## 1) Prepare a Change

1. Create or update OpenSpec artifacts:
   - `proposal.md`
   - `design.md`
   - `tasks.md`
   - spec deltas
2. Ensure each task has:
   - explicit acceptance criteria
   - verification commands
   - risk level
   - dependencies

## 2) Execute One Task Loop

1. Orchestrator selects next eligible task (dependency-safe).
2. Implementer executes only that task.
3. Validation gates run:
   - lint
   - tests
4. Reviewer evaluates diff + validation outputs.
5. Outcome:
   - `approve` -> mark task done
   - `reject` -> retry with specific fixes
   - `blocked` -> escalate to human

## 3) Retry Policy

- Max retries per task: `2`.
- Retry only with concrete reviewer findings.
- If same failure repeats, escalate instead of looping.

## 4) Escalation Triggers

- Retry limit reached
- High-severity security finding
- Persistent flaky tests
- Ambiguous acceptance criteria or conflicting requirements

## 5) Definition of Done (Task)

A task is done only when:

- Acceptance criteria pass
- Lint and tests pass
- Reviewer approves
- No unresolved high-severity findings
- Traceability fields are recorded

## 6) Definition of Done (Change)

A change is done only when:

- All tasks are complete
- No blocking reviewer findings remain
- Acceptance criteria for the overall change are met
- OpenSpec can be archived
