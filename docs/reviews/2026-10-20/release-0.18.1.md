# UI 0.18.1: hierarchy and contextual navigation

## Scope

The local UI package adds route links for contextual rail objects through `SidebarObject.href` and `current`, preserving the existing toggle behavior when no address is supplied. The consuming product owns its route and panel state. The contextual panel separates its heading and collapse control from the action/search row; English and Spanish headings fit the 250 px panel without shrinking or splitting words.

Products, notifications and profile identity share the same main title role, while section labels stay quieter than rows. The recovery component keeps its semantic heading level and places a compact status mark beside the heading, with readable body text and actions aligned underneath. No public strings or token values changed in this patch.

The previous UI 0.18.0 consumer snapshot is separate. This patch is backward compatible and remains uncommitted. It is neither a registry publication nor product acceptance.

## Executed evidence

- `npm test`: 668 passed, none failed.
- `npm run types`: passed, including DOM and React contextual destination fixtures.
- `npm run acceptance -- "shared hierarchy"`: 5 passed in each of Chrome 155, Firefox 155 and WebKit 26.6. Installed DOM, React 19.3.0 and React 18.3.1 consumers cover both themes at 1440, 390 and 320 px.
- `npm run acceptance -- "rail navigation"`: 9 passed in each of those engines. Checks include English/Spanish contextual headings with action/search/close, keyboard collapse and focus recovery, narrow merged drawers, product-menu placement and alignment, route navigation, and visible Floating tooltips on hover and keyboard focus.
- `npm run acceptance -- "bar end"`: 2 passed in Chrome, preserving the existing equal-gap, right-edge and width checks at desktop and phone widths in both themes.
- `git diff --check`: passed.

Isolated screenshots of the packed consumer fixtures were visually reviewed for the compact recovery card in both themes, Products/profile at 390 px and contextual navigation/tooltips at 1440 px. They establish shared component composition, not Conduict integration or owner acceptance. A Conduict-specific broad `h3` selector was separately identified as overriding the recovery heading; its correction belongs to the consumer's coordinated work.

## Family synchronization

The shared navigation and typography guide records the API and component roles. The canonical writing guidance is referenced portably from the package instructions. Branding/reference and Conduict adoption are assigned to their respective owners in the coordinated assignment; the package alone does not establish their synchronization or acceptance.
