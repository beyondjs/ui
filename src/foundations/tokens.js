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
 * The values moved here unchanged from the family reference; `provenance` records where from.
 * `status` stays `proposed`: moving the source approves no value. `version` identifies the token
 * set; a product review cites it together with the package version.
 */
export const tokens = {
	version: '0.1.0',
	status: 'proposed',
	source: 'Verified capture of the public Beyond site, 2026-09-18, with proposed additions',
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
