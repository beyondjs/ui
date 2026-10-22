# Nested heading diagnostic coverage

**Date:** 2026-10-22. **Evidence:** source and targeted Node tests, uncommitted. No package version or installation is claimed by this correction.

`Hierarchy` now compares a subgroup with content after its heading, ending at the next peer or ancestor heading. A preceding parent title does not belong to the subgroup. It includes ARIA headings, skips visually clipped one-pixel headings, and requires `data-bui-label` on the heading itself; a container cannot suppress every nested heading.

The suite acceptance helper uses the same measurement boundaries. Its isolated browser fixture passed seven scenarios before the owner serialized heavy validation. The package's `node --test tests/hierarchy.test.mjs` passed nine tests after this change. The Node measurement fixtures supply explicit sizes; they are not rendered browser evidence.

The shared-package coordinator owns the next archive, version and consumer installation. This source correction must be included in that final build. Existing Dialog, SideSheet and Sidebar work remains separately owned.

## Family reference synchronization

The suite's hierarchy coverage record traces this correction to D158 and M980. Reference integration and its final browser verification remain pending the consolidated validation run. No new family decision or owner acceptance is claimed.
