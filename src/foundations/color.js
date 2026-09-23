/**
 * Color foundations: the primitive palette and the semantic roles built on it.
 *
 * Primitives marked `captured` are values of the verified capture of the public Beyond site
 * (2026-09-18), the same capture every product's `brand/tokens.css` copies. Primitives marked
 * `proposed` are new values the family reference introduced, each for a stated reason — mostly because a
 * captured value fails contrast for the role it would otherwise fill. Nothing proposed is approved
 * until the owner approves it in the family reference's decision register.
 *
 * Semantic roles name what a color is for, never what it looks like. Products consume roles only;
 * a primitive is never referenced from a component.
 */
export const primitives = {
	'coral-500': { value: '#cb6245', provenance: 'captured', source: '--primary' },
	'coral-600': { value: '#9e533e', provenance: 'captured', source: '--primary-dark' },
	'coral-700': {
		value: '#86442f',
		provenance: 'proposed',
		reason: 'Hover for the light filled action; darker than coral-600 so the hover never loses contrast.'
	},
	'coral-400': { value: '#e46f4e', provenance: 'captured', source: '--primary-light and the wordmark' },
	'coral-200': { value: '#ffa385', provenance: 'captured', source: '--accent-color (dark)' },
	'coral-50': {
		value: '#fbeee9',
		provenance: 'proposed',
		reason: 'Tint for selected rows and the current product marker in light mode.'
	},
	'coral-950': { value: '#2c1a17', provenance: 'proposed', reason: 'Tint for selected rows in dark mode.' },

	'navy-950': { value: '#0c1525', provenance: 'captured', source: '--secondary-darker (dark)' },
	'navy-900': { value: '#101625', provenance: 'captured', source: '--background (dark)' },
	'navy-850': { value: '#112036', provenance: 'captured', source: '--surface (dark)' },
	'navy-800': { value: '#121f36', provenance: 'captured', source: '--secondary' },
	'navy-750': { value: '#1d2b3d', provenance: 'captured', source: '--app-editor-bg' },
	'navy-700': { value: '#2b3853', provenance: 'captured', source: '--app-icon-bg (dark)' },
	'navy-600': { value: '#313c50', provenance: 'captured', source: '--secondary-light' },
	'navy-500': { value: '#424f6e', provenance: 'captured', source: '--secondary-accent' },
	'navy-400': { value: '#617096', provenance: 'captured', source: '--secondary-light (dark)' },
	'navy-300': { value: '#8e99bb', provenance: 'captured', source: '--secondary-accent (dark)' },
	'slate-300': { value: '#99a3b1', provenance: 'captured', source: '--secondary-text-color and the wordmark "JS"' },

	white: { value: '#ffffff', provenance: 'captured', source: '--background' },
	'gray-50': { value: '#f5f5f5', provenance: 'captured', source: '--surface / --color-gray-5' },
	'gray-100': { value: '#e4e4e4', provenance: 'captured', source: '--color-gray-10' },
	'gray-200': { value: '#c8c8c8', provenance: 'captured', source: '--color-gray-20' },
	'gray-600': { value: '#5f5f5f', provenance: 'captured', source: '--color-gray-70' },
	'gray-700': { value: '#424242', provenance: 'captured', source: '--color-gray-80' },

	'indigo-50': { value: '#e9edf3', provenance: 'captured', source: '--color-indigo-20' },
	'indigo-800': { value: '#2d4665', provenance: 'captured', source: '--color-indigo-90' },
	'lavender-300': { value: '#9fb5ff', provenance: 'captured', source: '--color-lavender-40' },
	'lavender-600': { value: '#3c67ff', provenance: 'captured', source: '--color-lavender-80' },
	'lavender-700': { value: '#0033e8', provenance: 'captured', source: '--color-lavender-100' },
	'lavender-50': { value: '#f7f8ff', provenance: 'captured', source: '--color-lavender-0' },
	'lavender-900': {
		value: '#1a2247',
		provenance: 'proposed',
		reason: 'Dark background of the reference frame, which must never look like product chrome.'
	},
	'indigo-900': { value: '#1a2540', provenance: 'proposed', reason: 'Dark information tint.' },

	'green-700': {
		value: '#2b6a3f',
		provenance: 'proposed',
		reason: 'Captured success #6aac7d is 2.9:1 on white; this passes AA as text.'
	},
	'green-50': { value: '#eaf5ee', provenance: 'proposed', reason: 'Success tint.' },
	'green-300': { value: '#7fd19b', provenance: 'proposed', reason: 'Success text on dark backgrounds.' },
	'green-950': { value: '#13301f', provenance: 'proposed', reason: 'Dark success tint.' },
	'amber-400': { value: '#f7c700', provenance: 'captured', source: 'warning (tailwind-tokens.json)' },
	'amber-800': {
		value: '#7a5200',
		provenance: 'proposed',
		reason: 'Captured warning #f7c700 cannot carry text on white; this passes AA.'
	},
	'amber-50': { value: '#fdf4d7', provenance: 'proposed', reason: 'Warning tint.' },
	'amber-950': { value: '#2e2710', provenance: 'proposed', reason: 'Dark warning tint.' },
	'red-700': { value: '#b3261e', provenance: 'proposed', reason: 'Captured error #f04141 is 3.6:1 on white; this passes AA as text.' },
	'red-50': { value: '#fdecea', provenance: 'proposed', reason: 'Danger tint.' },
	'red-300': { value: '#ff8a80', provenance: 'proposed', reason: 'Danger text on dark backgrounds.' },
	'red-950': { value: '#3a1616', provenance: 'proposed', reason: 'Dark danger tint.' }
};

/**
 * Semantic roles per theme. Each role names a primitive.
 *
 * `family-*` roles belong to the family bar, the one piece of chrome every product shares. It is
 * navy in both themes, which is also where the published wordmark reads best: its gray "JS" is
 * 2.55:1 on white but 6.45:1 on navy.
 */
export const themes = {
	light: {
		canvas: 'white',
		surface: 'white',
		'surface-sunken': 'gray-50',
		'surface-selected': 'coral-50',
		border: 'gray-100',
		'border-strong': 'gray-200',
		text: 'navy-800',
		'text-muted': 'gray-600',
		'text-inverse': 'white',
		link: 'coral-600',
		accent: 'coral-500',
		focus: 'coral-500',
		action: 'coral-600',
		'action-hover': 'coral-700',
		'on-action': 'white',
		'family-bar': 'navy-800',
		'family-text': 'white',
		'family-muted': 'slate-300',
		'family-marker': 'coral-400',
		code: 'navy-750',
		'on-code': 'gray-50',
		success: 'green-700',
		'success-surface': 'green-50',
		warning: 'amber-800',
		'warning-surface': 'amber-50',
		danger: 'red-700',
		'danger-surface': 'red-50',
		info: 'indigo-800',
		'info-surface': 'indigo-50',
		reference: 'lavender-700',
		'reference-surface': 'lavender-50'
	},
	dark: {
		canvas: 'navy-900',
		surface: 'navy-850',
		'surface-sunken': 'navy-950',
		'surface-selected': 'coral-950',
		border: 'navy-700',
		'border-strong': 'navy-500',
		text: 'white',
		'text-muted': 'slate-300',
		'text-inverse': 'navy-900',
		link: 'coral-200',
		accent: 'coral-500',
		focus: 'coral-200',
		action: 'coral-400',
		'action-hover': 'coral-200',
		'on-action': 'navy-900',
		'family-bar': 'navy-950',
		'family-text': 'white',
		'family-muted': 'slate-300',
		'family-marker': 'coral-400',
		code: 'navy-950',
		'on-code': 'gray-50',
		success: 'green-300',
		'success-surface': 'green-950',
		warning: 'amber-400',
		'warning-surface': 'amber-950',
		danger: 'red-300',
		'danger-surface': 'red-950',
		info: 'lavender-300',
		'info-surface': 'indigo-900',
		reference: 'lavender-300',
		'reference-surface': 'lavender-900'
	}
};

/**
 * The pairs that carry text or meaningful graphics, held to WCAG ratios in both themes by the tests.
 * `text` needs 4.5:1; `graphic` (borders of controls, focus rings, markers) needs 3:1.
 */
export const pairs = [
	['text', 'canvas', 'text'],
	['text', 'surface', 'text'],
	['text', 'surface-sunken', 'text'],
	['text', 'surface-selected', 'text'],
	['text-muted', 'canvas', 'text'],
	['text-muted', 'surface', 'text'],
	['text-muted', 'surface-sunken', 'text'],
	['link', 'canvas', 'text'],
	['link', 'surface', 'text'],
	['on-action', 'action', 'text'],
	['on-action', 'action-hover', 'text'],
	['family-text', 'family-bar', 'text'],
	['family-muted', 'family-bar', 'text'],
	['family-marker', 'family-bar', 'graphic'],
	['on-code', 'code', 'text'],
	['focus', 'canvas', 'graphic'],
	['focus', 'surface', 'graphic'],
	['accent', 'canvas', 'graphic'],
	['border-strong', 'canvas', 'decorative'],
	['success', 'success-surface', 'text'],
	['success', 'surface', 'text'],
	['warning', 'warning-surface', 'text'],
	['warning', 'surface', 'text'],
	['danger', 'danger-surface', 'text'],
	['danger', 'surface', 'text'],
	['info', 'info-surface', 'text'],
	['info', 'surface', 'text'],
	['reference', 'reference-surface', 'text']
];
