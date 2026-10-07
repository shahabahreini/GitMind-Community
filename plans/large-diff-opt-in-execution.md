# Large diff opt-in execution

Authorized by the user's instruction to implement the supplied plan. No separate plan review was requested.

| ID | Task | Priority | Acceptance | Status |
| --- | --- | --- | --- | --- |
| T1 | Direct generation and streamed replay | must | Fitting and bounded unknown diffs get one direct attempt; input remains replayable | done (verified): streamed Copilot and unknown-model tests; Unicode spool replay test |
| T2 | Preflight batch planning | must | Spans cover source and planned total includes final and reductions before sending | done (verified): planner stores all spans before approval; coverage, long-line, Unicode and ordered-summary tests pass |
| T3 | Approval and attempt meter | must | Modal approval gates all batch calls, higher total requires second approval, runtime calls cannot exceed approval | done (verified): decline, second-approval, and runtime-splitting ceiling tests pass |
| T4 | Recovery and progress | must | Rate limits stop queue, fallback is metered, progress shows planned and actual calls | done (verified): sequential rate-limit test and metered recovery path; progress and diagnostic fields inspected in diff |
| T5 | Settings, handbook, tests | must | Text reflects consent and all prescribed checks pass | done (verified): settings and handbook/wiki edits; all required commands pass |

## Deviations

Legacy chunk-size, batch-size, and concurrency settings remain accepted for compatibility but no longer constrain the budget planner. The old parallel-failure test now checks sequential stop behavior.

## QC results

`rtk pnpm test:generation`: 109/109 passed. `rtk pnpm check-types`: passed. `rtk pnpm lint`: passed. `rtk pnpm docs:validate`: passed after wiki sync. `rtk proxy git diff HEAD --check`: passed. Final diff review covered direct attempt, spool, planner, meter, recovery, tests, settings, and handbook.

## Unfinished items

None.

## Handover

Context: prior code auto batched for Pro and streamed diffs. Decisions: approval per generation, five-attempt initial ceiling, sequential batch requests. State: T1–T5 verified. Remaining: none. Verification: commands above. Risk: estimated reduction calls are heuristic; unforeseen calls pause for fresh approval before provider invocation.
