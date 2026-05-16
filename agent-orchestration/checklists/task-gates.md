# Task Gate Checklist

A task is complete only if all checks pass:

- [ ] Acceptance criteria from OpenSpec task are satisfied.
- [ ] Scope is limited to the assigned task.
- [ ] Lint passes.
- [ ] Tests pass.
- [ ] Reviewer verdict is `approve`.
- [ ] No unresolved `high` severity findings.
- [ ] Any deferred `medium` findings are explicitly documented.
- [ ] Traceability recorded (task id and commit SHA).

If any checkbox fails, task returns to retry loop.
