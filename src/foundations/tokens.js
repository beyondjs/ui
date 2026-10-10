import { primitives, themes, pairs } from './color.js';
import { typography, space, radius, elevation, overlay, motion, density, layout, breakpoints } from './scale.js';

/**
 * The canonical design tokens of the Beyond family, published as `@beyond-js/ui/tokens`.
 *
 * This module is the single source from version 0.1.0: the stylesheet `@beyond-js/ui/tokens.css`
 * is generated from it, the components of this package read only the custom properties it
 * defines, and the Beyond family reference (Branding) imports it from the installed package to
 * render its manual, check contrast and write its own sheet. It is plain data with no dependency on
 * a browser, a bundler or a UI framework, so any technology can consume it.
 *
 * The values moved here unchanged from the family reference at 0.1.0; `provenance` records where
 * from. The owner approved the set on 2026-09-29 with one addition (`border-control`), weight 400,
 * the sentence-case label and the window elevations: that is token set 0.2.0, `status: 'approved'`,
 * and `approval` records the decisions. On 2026-10-04 the owner approved the family page system
 * (D52), whose layout tokens (gutters by band, the width tiers and the compact band) make token set 0.3.0
 * (`approval.layout`); token set 0.3.1 narrows the reading measure to what was measured against
 * LR-02. Token set 0.4.0 adds three layout proposals (`pending`: the thread tier and the panel's
 * widths of the family proposal D67, adopted by Conduict); they are not approved family rules, and the
 * rest of the set stays approved. Token set 0.4.1 (2026-10-08) raises the pending `aside-max` to 40rem and
 * lets the wide form grow past `aside-wide`, still proposals. Token set 0.4.2 (2026-10-09) gives the menu
 * elevation a dark value, so a menu, a popover and the family bar's panels lift off the navy page as
 * D10 intends instead of casting nothing. Each entry's own `provenance` still says whether its value
 * was captured or introduced by the family reference. `version` identifies the token set; a product
 * review cites it together with the package version.
 */
export const tokens = {
	version: '0.4.2',
	status: 'approved',
	source: 'Verified capture of the public Beyond site, 2026-09-18, with the family reference\'s additions',
	approval: {
		date: '2026-09-29',
		by: 'owner',
		decisions: ['D08', 'D09', 'D10', 'D12', 'D20'],
		note: 'Approved in the Beyond family reference\'s decision register: the palette and roles with border-control (D08), the product type scale with weight 400 and a 0.75rem sentence-case label (D09, D20), flat surfaces with the window elevations (D10) and the brand orange\'s roles (D12).',
		layout: {
			date: '2026-10-04',
			by: 'owner',
			decisions: ['D52'],
			note: 'The family page system (D52, settled contract S23: LR-01 to LR-09 and LR-11): the gutter by band, the form, standard, aside and fluid width tiers and the compact 640px band, their values engineering defaults to be measured. Token set 0.3.0; 0.3.1 sets the reading measure to the 54ch measured against LR-02.'
		}
	},
	pending: {
		date: '2026-10-08',
		decisions: ['D67'],
		tokens: ['layout.thread', 'layout.aside-max', 'layout.aside-wide'],
		note: 'Proposals in the family reference\'s register, adopted by Conduict (its CB-Q4): a thread width tier and the widths a page\'s panel kept in view grows to (aside-max raised to 40rem in token set 0.4.1 for wide regions, Conduict\'s review M11). Shipped so a product can adopt them; not approved family rules.'
	},
	attribute: 'data-beyond-mode',
	provenance: {
		origin: 'branding/src/foundations',
		revision: '4c47733631efa4f16fd04ebcb2867de5dbd5b8f1',
		moved: '2026-09-23',
		note: 'Extracted unchanged from the Beyond Suite family reference; its last change there was at this suite revision.'
	},
	color: { primitives, themes, pairs },
	typography,
	space,
	radius,
	elevation,
	overlay,
	motion,
	density,
	layout,
	breakpoints
};
