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
 * D10 intends instead of casting nothing. Token set 0.5.0 (2026-10-10) records the owner's decisions D94 to
 * D102 of settled contract S29 that need tokens (`approval.conversation`): the exit duration and easing of
 * D95 and the thread's lane, its rail indent and its wide lane (`thread`, approved by D96, which amends
 * D67's tier); the panel's widths of D67 stay pending, joined by the code colors of Conduict's audit
 * (P3), a proposal. Token set 0.5.1 (2026-10-10) records the panel's widths as approved with the
 * conversation round: the owner approved D67 as amended by D96 in S29, whose rule makes the panel grow to
 * `aside-max` and its wide form start at `aside-wide`; values unchanged, and only the code colors stay
 * pending. Token set 0.6.0 (2026-10-17) carries decision C2 (`approval.visual`, decided under the owner's
 * delegation, amending D08, D09, D10, D12 and D52): links in the text's color with coral kept for the
 * primary action, the selection and focus; Inter for the interface at 400, 500 and 600 with Rubik kept for
 * the wordmark (`font-brand`); raised surfaces inside a page; neutral disabled controls; one surface
 * family in the light theme (the bar and the sidebar on the page's surface); off-white text on dark.
 * Each entry's own `provenance` still says whether its value
 * was captured or introduced by the family reference. `version` identifies the token set; a product
 * review cites it together with the package version.
 */
export const tokens = {
	version: '0.6.0',
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
		},
		conversation: {
			date: '2026-10-10',
			by: 'owner',
			decisions: ['D67', 'D95', 'D96'],
			contract: 'S29',
			tokens: ['motion.exit', 'motion.ease-exit', 'layout.thread', 'layout.indent', 'layout.lane', 'layout.aside-max', 'layout.aside-wide'],
			note: 'The conversation round (settled contract S29, D94 to D102): motion follows the person\'s action, with an exit a little faster than the entry (D95), and one edge, one lane in a thread, with code, diffs, tool output and approval cards in the wide lane (D96, amending D67\'s thread tier), and the widths a page\'s panel kept in view grows to (D67 as amended by D96, approved in S29; recorded in token set 0.5.1). The reading measure stays 54ch. Values are engineering defaults to be measured. Token set 0.5.0; 0.5.1 adds the panel\'s widths.'
		},
		visual: {
			date: '2026-10-17',
			by: 'agent under the owner\'s delegation of 2026-10-17',
			decisions: ['C2'],
			amends: ['D08', 'D09', 'D10', 'D12', 'D52'],
			tokens: ['color.link', 'color.text', 'color.disabled', 'color.on-disabled', 'color.surface-raised', 'color.sidebar', 'color.sidebar-hover', 'color.tooltip', 'color.on-tooltip', 'color.family-bar', 'color.family-text', 'color.family-muted', 'color.family-marker', 'typography.family.sans', 'typography.family.brand', 'typography.weight.semibold', 'elevation.raised', 'overlay.lift'],
			note: 'The family audit\'s visual rules (decision C2 of 2026-10-17, decided under the owner\'s delegation; the owner may override it): coral only for the primary action, the selection and focus, links in the text color and underlined on hover; Inter for the interface at 400/500/600 and Rubik for the wordmark; a monospace for identifiers; raised surfaces inside pages; status told apart by shape; neutral disabled controls; one surface family in the light theme. Values are engineering defaults to be measured. Token set 0.6.0.'
		}
	},
	pending: {
		date: '2026-10-10',
		decisions: [],
		tokens: ['color.code-comment', 'color.code-keyword', 'color.code-string', 'color.code-number', 'color.code-name', 'color.code-tag'],
		note: 'Proposals: the code colors of Conduict\'s audit of 2026-10-10 (P3), contrast-checked in both themes, since token set 0.5.0. Shipped so a product can adopt them; not approved family rules. The panel\'s widths (D67), pending from token set 0.4.0, are approved since token set 0.5.1 (approval.conversation).'
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
