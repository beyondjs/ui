# Opening implementation — 2026-10-18

Evidence baseline: UI `1b89a61` on `feature/next`, initially clean, plus this change. UI 0.17.0 retains token set 0.6.0 and implements the owner's authorized loading improvement under the existing family rules. It creates no new approval or product acceptance.

The public `OpeningDocument` and `OpeningPlugin` share one static presentation and bundled controller. Same-origin assets preserve strict CSP and Trusted Types. DOM and React loading lines use one quiet mark; skeletons preserve structure without continuous motion. The guide describes readiness, the 12-second recovery default and the distinction from service outages.

Executed locally: the adapter contract checks, the full UI unit suite and declarations, and the opening browser fixture in Chrome, Firefox and WebKit (9 scenarios per engine: both themes at 320/390/1440 px, delayed/failed module and reload, unavailable content and JavaScript disabled). The browser cases check reduced motion, context preservation and focus when content arrives after recovery. The screenshots were visually inspected locally. No screen reader, native app or hosted product was exercised by this fixture.

The suite's opening evidence records each product's actual adoption and verification. Family synchronization: reference 0.33.1 catalogs the implementation, adds journey `opening` and matrix row M1201, and embeds an explicitly simulated document at `/manual/opening`. Its checks are separate from product acceptance.
