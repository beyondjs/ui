# Local UI 0.20.0 integration

UI 0.20.0 was packed from the coordinated `feature/next` working tree. Token set 0.6.0 is unchanged. The archive remains local; no registry publication, push, deployment or owner acceptance is established.

## Artifact and adoption

Archive: `dist-pack/beyond-ui-0.20.0.tgz`.

Integrity: `sha512-uxWEWP1x6trBSgAX5u4aObLbR+A8EGicyjMNAxQo9q5MRA/Znu4bNETtxKqnarNH0q7DZWOJYsjZOuv/R9Fw7w==`.

Thirteen consumers installed the same archive offline, with install scripts disabled: Conduict frontend, Accounts frontend, Projects service, Snapshots frontend, Delegate app, CDN administration, CDN backoffice, Packages UI, Beyond Home, retained Workspace client, family reference, Labs and Docs Site. Each installed source, declaration and font file matches the packed source by SHA-256. Archive copies also match. Installation is not browser or product acceptance.

## Combined behavior

Dialog and SideSheet retain the native modal until exit completes, with reversal, bounded completion and immediate reduced-motion closure. SideSheet outside dismissal defaults to enabled; consumer guards protect drafts and pending writes. Sidebar context uses paired motion and consistent current selection. Shared recovery keeps retry state and diagnostics together. Collection.Tools exposes search and active filters; React rows preserve action slots, and narrow rows/tables retain their facts and labels. Page headers and facts span their region, with actions beside the title; prose and forms retain their existing reading bounds.

## Executed checks

- `npm test`: 745 passed after the combined review. The first run exposed four failures: two obsolete exit-picture expectations, a stylesheet selector assertion that included disabled-state rules, and SideSheet exceeding the 300-line target. Keyboard cycling moved into its existing Focus collaborator, preserving its algorithm.
- The updated host-motion regression reproduced a real zero-duration wait. Motion now closes immediately when every named animation has zero duration. The focused DOM, React, motion and source checks passed before the complete repeat.
- TypeScript declarations compiled successfully before the internal Focus/Motion corrections; public declarations did not change in those corrections.
- Earlier focused checks covered Recovery in React 18, repeated retry and StrictMode behavior, and list-tools/action slots. They supplement the full unit result and do not establish browser behavior.
- An isolated source Chrome geometry check passed EN/ES, both themes and 320/390/1440/1920 px: full-region header/facts, adjacent actions and no horizontal overflow. It is not the final installed matrix.

The installed Chrome/Firefox/WebKit acceptance and consumer checks remain in progress. Their results must be added before the coordinated assignment closes. Reference synchronization remains in the suite reference owner's coordinated scope.
