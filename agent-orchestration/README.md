# Agent Orchestration Playbook

This folder is a reusable operating system for AI-assisted delivery in fast-paced teams.
It is OpenSpec-first, quality-gated, and designed for high signal reviews.

## Delivery Principles

- Ship in thin vertical slices with strict task boundaries.
- Optimize for correctness first, then speed through parallel-safe work.
- Enforce objective quality gates before any task is marked complete.
- Keep full traceability from requirement -> task -> diff -> tests -> review verdict.
- Escalate early when blockers appear instead of burning retries.

## Recommended Framework Stack

- Primary: `langchain-ai/langgraph` for explicit state-machine orchestration.
- Alternative: `crewAIInc/crewAI` for fast role-based team workflows.
- Legacy reference: `microsoft/autogen` (maintenance mode; not default for greenfield).

## Why LangGraph Is the Default

- State is explicit (`queued -> implementing -> validating -> reviewing -> done`).
- Durable execution enables recoverable long-running workflows.
- Strong fit for human-in-the-loop checkpoints and retry control.
- Easy to represent branching policies (hotfix path, blocker path, rollback path).

## Execution Loop (OpenSpec Source of Truth)

1. `propose`: create `proposal.md`, `design.md`, `tasks.md`, and spec deltas.
2. `apply` loop per task:
   - select one unchecked task with clear acceptance criteria
   - run implementer role
   - run lint/test validation
   - run reviewer role with severity rubric
   - retry or escalate according to policy
3. `archive`: only when all tasks pass quality bars and acceptance checks.

## Quality Bar (Non-Negotiable)

- Acceptance criteria fully satisfied.
- Lint and tests pass.
- Reviewer returns `approve` with no high-severity findings.
- No hidden scope expansion.
- Traceability fields captured for audit.

## Operating Modes

- **Lean mode (default early startup):** orchestrator + implementer + reviewer.
- **Scale mode:** add tester, security reviewer, and docs reviewer.
- **Incident mode:** block feature work and run hotfix-only orchestration path.

## Files in This Kit

- `orchestrator.config.json`: policy and gate controls.
- `prompts/*.md`: role contracts.
- `checklists/task-gates.md`: task-level definition of done.
- `templates/open-spec-task-template.md`: orchestration-ready task template.
- `runbook.md`: day-to-day execution and escalation procedure.

## Reuse in New Projects

1. Copy `agent-orchestration/` into the new repo.
2. Update `orchestrator.config.json` commands and paths.
3. Keep OpenSpec artifacts current and task-oriented.
4. Run the same gated loop; do not bypass quality checks.
