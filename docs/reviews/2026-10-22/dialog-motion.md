# Dialog motion — 2026-10-22

Source: `feature/next` at `19c2531` with uncommitted Dialog, SideSheet and Sidebar changes. This assignment changes Dialog only and preserves the other owners' source.

Dialog already entered with `bui-enter` for 200 ms. It closed immediately. The correction keeps the real modal through its token-based exit with `Motion`, including the backdrop, then returns focus and resolves the opening. `Question.ask()` consequently destroys the modal after the exit. Reduced motion, including a host's `data-motion="reduced"`, closes immediately. Reopening cancels an exit; destruction completes it immediately. The shared motion utility is unchanged.

Executed: 15 focused DOM tests, 23 React/React 18 tests including controlled reopening, nine installed Dialog checks across Chrome 155, Firefox 155 and WebKit 26.6, 21 combined Chrome motion checks, and TypeScript declarations passed. The combined unit suite passed 691 after the Sidebar owner corrected its source-size gate. The added device-preference checks and final combined artifact verification are recorded in the suite's `branding/docs/reviews/2026-10-22/dialog-motion.md` when completed.

Family reference synchronization is blocked on the serialized combined artifact and reference browser check. Reference 0.39.1 prepares component `dialog`/`questions`, M1210 and the two Conduict Rename journeys under approved D95 and EXP-01. The suite owns that evidence and the remaining Sidebar WebKit acceptance and SideSheet exit coordination. No publication, commit or owner acceptance.
