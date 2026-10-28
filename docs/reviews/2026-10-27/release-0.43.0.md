# UI 0.43.0 — readable lists

Local, uncommitted over `7504e7f`; token set 0.8.0. No registry publication, push or hosted result.

The full inbox now separates matters, strengthens title/context hierarchy and exposes View/Ver in its existing
opening target. Its accessible name names the complete item. Mark read/unread, earlier updates, focus restoration,
permission rechecking and read state remain the existing behavior. The bell retains compact previews. Filter
faces use 12 px inline padding to keep the two filters together on a 390 px phone without shortening labels.

Object rows use 12 px vertical insets and a 4 px title/metadata gap. Wrapped actions follow the title after its
lead. The representative three-line mobile machine row grows from about 92 to 105 px; it remains a row with a
separator. The density guard allows 112 px rather than the previous 96. Comparison tables retain their density;
a column marked `menu: true` keeps one overflow menu beside the object name on a narrow table, with its desktop
column header and accessible menu name retained.

`inbox.css` is a separate component stylesheet before the inset rules. Components remain below the 300-line
source target. Public `DataColumn.menu` and its React counterpart describe the narrow menu placement.

Validation: 1023 unit checks pass, including the menu column; type checks pass. Chrome's original focused pass
established 73 checks, followed by 9/9 corrected presentation/touch/density checks. Firefox and WebKit each passed
7/7 focused inbox/touch/object checks before the final menu-column refinement. Final Accounts consumer views passed 24/24 in each of Chromium, Firefox and WebKit, covering the final menu
and toolbar styles at 390/1440 px, both themes and EN/ES. Nine product interfaces and the reference vendor the
identical archive. The family round records their individual checks and source heads. The first pass found the deliberate density change, a missing fixture-only
Spanish label, excessive touch spacing and source/cascade guards; these were corrected before packaging.

Family synchronization: `branding/docs/reviews/2026-10-27/listed-round.md`, reference 0.75.0; M1913/M1914,
D162's owner-directed pattern selection. This does not establish adoption by every installed product.
