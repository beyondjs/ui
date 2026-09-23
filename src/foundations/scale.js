/**
 * Non-color foundations: typography, space, shape, elevation, motion, density and layout.
 *
 * Every entry carries its provenance. `captured` values come from the verified capture of the public
 * Beyond site; `proposed` values are introduced here for product interfaces, which the marketing
 * site never had to serve (dense tables, sidebars, dialogs).
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
		light: { value: 300, provenance: 'captured', source: 'Rubik 300, the body weight' },
		medium: { value: 500, provenance: 'captured', source: 'Rubik 500, the heading weight' }
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
			value: '0.6875rem',
			line: 1.3,
			tracking: '0.08em',
			provenance: 'proposed',
			reason: 'Uppercase labels, echoing the captured `.t3` and `.pretitle`.'
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

// The capture defines shadows but uses none: surfaces are flat and separated by 1px borders.
// Elevation is kept for things that float above the page, and nothing else.
export const elevation = {
	flat: { value: 'none', provenance: 'captured', source: 'Flat, border-defined surfaces' },
	menu: { value: '0 8px 16px 0 rgba(0, 0, 0, .08), 0 4px 8px 0 rgba(0, 0, 0, .06)', provenance: 'captured', source: '--shadow-5' },
	dialog: {
		value: '0 32px 64px -4px rgba(0, 0, 0, .12), 0 12px 24px -2px rgba(0, 0, 0, .06)',
		provenance: 'captured',
		source: '--shadow-7'
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
	measure: { value: '68ch', provenance: 'proposed', reason: 'Reading width for prose.' },
	content: {
		value: '1180px',
		provenance: 'proposed',
		reason: 'Maximum product content width; the captured section container is 1146.67px.'
	}
};

export const breakpoints = {
	provenance: 'captured',
	source: 'Media queries of styles.css and global.css',
	steps: { phone: 480, tablet: 768, desktop: 1024 }
};
