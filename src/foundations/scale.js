/**
 * Non-color foundations: typography, space, shape, elevation, motion, density and layout.
 *
 * Every entry carries its provenance. `captured` values come from the verified capture of the public
 * Beyond site; `proposed` values are introduced here for product interfaces, which the marketing
 * site never had to serve (dense tables, sidebars, dialogs). The owner approved the product type
 * scale (D09, with weight 400 and the sentence-case label) and the elevation rule (D10, with the
 * window levels) on 2026-09-29; `provenance` still records where each value came from.
 */
export const typography = {
	family: {
		sans: {
			value: "'Rubik', system-ui, sans-serif",
			provenance: 'captured',
			source: '--font-family ("Rubik", sans-serif); system-ui fallback proposed'
		},
		mono: {
			value: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
			provenance: 'proposed',
			reason: 'The capture defines no monospace face; identifiers, versions and paths need one. System faces keep the site offline.'
		}
	},
	weight: {
		light: { value: 300, provenance: 'captured', source: 'Rubik 300, the body weight; only at body size and larger' },
		regular: {
			value: 400,
			provenance: 'proposed',
			reason: 'Text below body size (small, tables, reasons, hints): Rubik 300 thins out at 13 px and less (D09).'
		},
		medium: { value: 500, provenance: 'captured', source: 'Rubik 500, the heading weight; labels, buttons and names' }
	},
	// Product interfaces use a tighter scale than the marketing site (h1 2.7rem there).
	size: {
		display: {
			value: '2.5rem',
			line: 1.12,
			provenance: 'proposed',
			reason: 'Marketing and reference headlines; the captured h1 is 2.7rem.'
		},
		'title-1': { value: '1.625rem', line: 1.2, provenance: 'proposed', reason: 'Page title inside a product.' },
		'title-2': { value: '1.1875rem', line: 1.3, provenance: 'proposed', reason: 'Section title inside a page.' },
		'title-3': { value: '1rem', line: 1.4, provenance: 'proposed', reason: 'Card and dialog title.' },
		body: {
			value: '0.9375rem',
			line: 1.55,
			provenance: 'proposed',
			reason: 'Product body; the captured body is 1rem/24px for reading pages.'
		},
		small: { value: '0.8125rem', line: 1.45, provenance: 'proposed', reason: 'Secondary facts and table metadata.' },
		label: {
			value: '0.75rem',
			line: 1.3,
			tracking: '0.02em',
			provenance: 'proposed',
			reason: 'Labels (table headings, tags, menu headings) in sentence case, as written: told apart by weight 500 and the muted color, never by capitals; 12 px is the smallest text (D09, D20).'
		}
	}
};

export const space = {
	provenance: 'proposed',
	reason: 'A 4px base. The capture uses literal 15px gaps and 1-2rem paddings, which do not form a scale.',
	steps: { 0: '0', 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px', 6: '24px', 8: '32px', 10: '40px', 12: '48px', 16: '64px' }
};

export const radius = {
	control: { value: '5px', provenance: 'captured', source: 'Buttons and chips (literal 5px)' },
	base: { value: '8px', provenance: 'captured', source: '--border-radius-base' },
	round: { value: '999px', provenance: 'proposed', reason: 'Avatars, status dots and pills.' }
};

// The capture defines shadows but uses none: surfaces are flat and separated by 1px borders (D10).
// Only what overlaps other content casts a shadow: `menu` (menus, popovers, tooltips, toasts,
// drawers), `dialog`, and `window` / `window-focus` (Desktop windows at rest and focused). Inset or
// ring shadows that mark a state or draw focus are marks, not elevation. Surfaces inside the page
// (cards, panels, tables, sections) are flat. An entry with `dark` takes that value in the dark theme.
export const elevation = {
	flat: { value: 'none', provenance: 'captured', source: 'Flat, border-defined surfaces' },
	menu: {
		value: '0 8px 16px 0 rgba(0, 0, 0, .08), 0 4px 8px 0 rgba(0, 0, 0, .06)',
		dark: '0 12px 28px -6px rgba(0, 0, 0, .5), 0 4px 10px 0 rgba(0, 0, 0, .32)',
		provenance: 'captured',
		source: '--shadow-5; its dark value (token set 0.4.2) is the family reference\'s: at 8% black a menu cast nothing on the navy page, so only its 1px border told it from what it covered'
	},
	dialog: {
		value: '0 32px 64px -4px rgba(0, 0, 0, .12), 0 12px 24px -2px rgba(0, 0, 0, .06)',
		provenance: 'captured',
		source: '--shadow-7'
	},
	window: {
		value: '0 1px 2px rgba(18, 31, 54, .06), 0 8px 20px -12px rgba(18, 31, 54, .16)',
		dark: '0 14px 30px -12px rgba(12, 21, 37, .9)',
		provenance: 'proposed',
		reason: 'A Desktop window at rest: the Desktop\'s --frame-shadow, resolved per theme (the text color at 6% and 16% on light; the sunken surface at 90% on dark).'
	},
	'window-focus': {
		value: '0 2px 4px rgba(18, 31, 54, .06), 0 22px 44px -18px rgba(18, 31, 54, .28)',
		dark: '0 30px 64px -16px rgba(12, 21, 37, .96)',
		provenance: 'proposed',
		reason: 'The focused Desktop window: the Desktop\'s --frame-shadow-focus, resolved per theme; a deeper, wider shadow says which window has focus.'
	}
};

// Translucent layers over any surface; they are not colors of their own.
export const overlay = {
	scrim: { value: 'rgb(0 0 0 / 0.4)', provenance: 'proposed', reason: 'Backdrop behind a modal dialog.' },
	lift: { value: 'rgb(255 255 255 / 0.1)', provenance: 'proposed', reason: 'Hover on the navy family bar.' }
};

export const motion = {
	quick: { value: '150ms', provenance: 'captured', source: '--duration-quickly' },
	standard: { value: '200ms', provenance: 'captured', source: 'Most common literal transition (200ms)' },
	ease: {
		value: 'cubic-bezier(0.2, 0.7, 0.3, 1)',
		provenance: 'proposed',
		reason: 'One easing for entering elements; the capture mixes linear and ease-in.'
	}
};

// Density changes row and control heights only; type and spacing stay on the same scale.
export const density = {
	comfortable: { control: '36px', row: '44px', provenance: 'proposed' },
	compact: { control: '30px', row: '34px', provenance: 'proposed' }
};

export const layout = {
	family: { value: '44px', provenance: 'proposed', reason: 'Height of the family bar shared by every product.' },
	header: { value: '56px', provenance: 'proposed', reason: 'Product header; the captured site header is 60px for marketing.' },
	sidebar: { value: '250px', provenance: 'captured', source: '--bynd-aside-width' },
	measure: {
		value: '54ch',
		provenance: 'family',
		reason: 'Reading width for prose (LR-02): no line past 80 characters. Measured in token set 0.3.1 on 100 paragraphs of the family\'s English and Spanish prose in Rubik at body size (weight 300) and small size (weight 400), in Chrome, Firefox and WebKit: 54ch holds at most 77 characters a line (67 to 71 on average); 56ch reached 83 and the earlier 68ch 97.'
	},
	content: {
		value: '1180px',
		provenance: 'proposed',
		reason: 'Maximum product content width; the captured section container is 1146.67px. Superseded inside a `Page` by the width tiers of token set 0.3.0.'
	},
	// Token set 0.3.0 (D52, the family page system: LR-01 to LR-03; engineering defaults, to be measured): where content starts and how wide each block may grow.
	gutter: { value: '16px', provenance: 'family', reason: 'Start of content from the navigation (LR-01): 16px in a region narrower than 640px; a `Page` raises it to gutter-medium and gutter-wide by its region\'s width.' },
	'gutter-medium': { value: '24px', provenance: 'family', reason: 'Start of content from the navigation in a region of 640px to 1023px (LR-01).' },
	'gutter-wide': { value: '32px', provenance: 'family', reason: 'Start of content from the navigation in a region of 1024px or more (LR-01).' },
	form: { value: '40rem', provenance: 'family', reason: 'Width tier of inputs, settings groups and task pages (LR-02); the help panel already stops there.' },
	standard: { value: '90rem', provenance: 'family', reason: 'Width tier of a main column with its aside (LR-02); it re-derives the marketing container `content`.' },
	aside: { value: '22rem', provenance: 'family', reason: 'Width of a resource page\'s side panel (LR-03), between the 20 and 24rem the analysis measured.' },
	'fluid-max': { value: '100rem', provenance: 'family', reason: 'Limit of a fluid collection, past which a row is lost between its first and last column (LR-02).' },
	// Token set 0.4.0 (2026-10-08): the family proposal D67 (Q-B), adopted by Conduict; proposals, not approved family rules.
	thread: { value: '52rem', provenance: 'proposed', reason: 'Width tier of a conversation thread (proposal D67, Q-B; Conduict\'s CB-Q4): wider than the reading measure so code and output keep a column, narrow enough that a message and its answer stay close. Not an approved family rule.' },
	'aside-max': { value: '40rem', provenance: 'proposed', reason: 'Widest a page\'s panel kept in view grows on a wide region, so extra width goes to the panel rather than to an empty band (proposal D67, Conduict\'s CB-07 and CB-Q4). Token set 0.4.1 raises it from 30rem: at 1920 px beside a 250 px sidebar the panel stopped 294 px before the region\'s edge (Conduict\'s review M11). Not an approved family rule.' },
	'aside-wide': { value: '48rem', provenance: 'proposed', reason: 'Width a panel kept in view takes first in its wide form, such as a diff beside a conversation, which since token set 0.4.1 grows on to the region\'s far edge while the main column gives down to the aside tier (proposal D67, Conduict\'s CB-Q1 and review M11). Not an approved family rule.' }
};

export const breakpoints = {
	provenance: 'captured',
	source: 'Media queries of styles.css and global.css; `compact` from the products\' own 640px (token set 0.3.0, LR-09)',
	steps: { phone: 480, compact: 640, tablet: 768, desktop: 1024 }
};
