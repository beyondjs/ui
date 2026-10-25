/**
 * Color foundations: the primitive palette and the semantic roles built on it.
 *
 * Primitives marked `captured` are values of the verified capture of the public Beyond site
 * (2026-09-18), the same capture every product's `brand/tokens.css` copies. Primitives marked
 * `proposed` are values the family reference introduced, each for a stated reason — mostly because a
 * captured value fails contrast for the role it would otherwise fill. `provenance` records where a
 * value came from, not whether it is approved: the owner approved the whole palette and its roles on
 * 2026-09-29 (decision D08, token set 0.2.0; see `tokens.approval`).
 *
 * The brand orange (decision D12) is coral-400, the wordmark's `#e46f4e`. On light backgrounds its
 * text and fill variant is coral-600; on navy its text variant is coral-200. coral-500 is only the
 * light accent and focus ring, never "the brand color". White text never sits on coral-400
 * (3.14:1): the dark action puts navy on it.
 *
 * Semantic roles name what a color is for, never what it looks like. Products consume roles only;
 * a primitive is never referenced from a component.
 */
export const primitives = {
	'coral-500': { value: '#cb6245', provenance: 'captured', source: '--primary', use: 'Only the light accent and focus ring; never named the brand color.' },
	'coral-600': { value: '#9e533e', provenance: 'captured', source: '--primary-dark', use: 'The brand orange as text and fill on light backgrounds.' },
	'coral-700': {
		value: '#86442f',
		provenance: 'proposed',
		reason: 'Hover for the light filled action; darker than coral-600 so the hover never loses contrast.'
	},
	'coral-400': { value: '#e46f4e', provenance: 'captured', source: '--primary-light and the wordmark', use: 'The brand orange (D12); navy text on it, never white (3.14:1).' },
	'coral-200': { value: '#ffa385', provenance: 'captured', source: '--accent-color (dark)', use: 'The brand orange as text on navy.' },
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
	'mist-100': {
		value: '#e6e9ef',
		provenance: 'proposed',
		reason: 'Text on the dark theme (token set 0.6.0, DQ-10): pure white on navy blooms; an off-white keeps 13:1 or more on every dark surface.'
	},

	white: { value: '#ffffff', provenance: 'captured', source: '--background' },
	'gray-50': { value: '#f5f5f5', provenance: 'captured', source: '--surface / --color-gray-5' },
	'gray-100': { value: '#e4e4e4', provenance: 'captured', source: '--color-gray-10' },
	'gray-200': { value: '#c8c8c8', provenance: 'captured', source: '--color-gray-20' },
	'gray-500': {
		value: '#767676',
		provenance: 'proposed',
		reason: 'Boundary of controls on white (4.54:1): gray-200 is 1.7:1, below the 3:1 a control boundary needs.'
	},
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
 * `border` and `border-strong` separate content (dividers, in-page surfaces, tags); `border-control`
 * is the boundary of inputs, selects, checkboxes, toggles and other controls, held to 3:1 because a
 * person must see where a control is (WCAG 1.4.11).
 *
 * `code-*` roles (token set 0.5.0, a proposal: Conduict's audit of 2026-10-10, P3) color the kinds of a
 * highlighted code's text (`Highlighter`): comments, keywords, strings, numbers and literals, names
 * (keys, properties, attributes, variables) and tags. They are held to 4.5:1 on every surface code is
 * drawn on, a diff's added and deleted rows included, in both themes; the words stay readable without
 * them (D42).
 *
 * `family-*` roles belong to the family bar, the one piece of chrome every product shares. Until token
 * set 0.5.1 it was navy in both themes; since 0.6.0 (decision C2, DQ-23) the light bar sits on the page's
 * own surface, so the light theme has one surface family, and the dark bar stays the darkest navy.
 *
 * Token set 0.6.0 (decision C2): `link` is the text's color in both themes (coral is kept for the
 * primary action, the selection and focus); `disabled`/`on-disabled` draw a disabled control as a neutral
 * surface with muted words, never a dimmed coral; `surface-raised` is a card or panel raised inside a
 * page; `sidebar` and `sidebar-hover` put the sidebar on the page's surface in light; `tooltip` and
 * `on-tooltip` keep tooltips dark in both themes, now that the light bar is not. Dark text is `mist-100`.
 * Token set 0.8.0 (D187): `focus` is the coral of the ring, the cursor's inner ring and the caret; `focus-edge` the
 * light a focused box gives its own border, in the text's tone: a coral border would read as the box's error.
 */
export const themes = {
	light: {
		canvas: 'white',
		surface: 'white',
		'surface-sunken': 'gray-50',
		'surface-selected': 'coral-50',
		border: 'gray-100',
		'border-strong': 'gray-200',
		'border-control': 'gray-500',
		text: 'navy-800',
		'text-muted': 'gray-600',
		'text-inverse': 'white',
		link: 'navy-800',
		accent: 'coral-500',
		focus: 'coral-500',
		'focus-edge': 'navy-800',
		action: 'coral-600',
		'action-hover': 'coral-700',
		'on-action': 'white',
		disabled: 'gray-100',
		'on-disabled': 'gray-600',
		'surface-raised': 'white',
		sidebar: 'white',
		'sidebar-hover': 'gray-50',
		tooltip: 'navy-800',
		'on-tooltip': 'white',
		'family-bar': 'white',
		'family-text': 'navy-800',
		'family-muted': 'gray-600',
		'family-marker': 'coral-600',
		code: 'navy-750',
		'on-code': 'gray-50',
		'code-comment': 'gray-600',
		'code-keyword': 'lavender-700',
		'code-string': 'green-700',
		'code-number': 'coral-600',
		'code-name': 'amber-800',
		'code-tag': 'red-700',
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
		'border-control': 'navy-300',
		text: 'mist-100',
		'text-muted': 'slate-300',
		'text-inverse': 'navy-900',
		link: 'mist-100',
		accent: 'coral-500',
		focus: 'coral-200',
		'focus-edge': 'mist-100',
		action: 'coral-400',
		'action-hover': 'coral-200',
		'on-action': 'navy-900',
		disabled: 'navy-750',
		'on-disabled': 'slate-300',
		'surface-raised': 'navy-750',
		sidebar: 'navy-950',
		'sidebar-hover': 'navy-850',
		tooltip: 'navy-600',
		'on-tooltip': 'mist-100',
		'family-bar': 'navy-950',
		'family-text': 'mist-100',
		'family-muted': 'slate-300',
		'family-marker': 'coral-400',
		code: 'navy-950',
		'on-code': 'gray-50',
		'code-comment': 'slate-300',
		'code-keyword': 'lavender-300',
		'code-string': 'green-300',
		'code-number': 'coral-200',
		'code-name': 'amber-400',
		'code-tag': 'red-300',
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
	['on-disabled', 'disabled', 'text'],
	['text', 'surface-raised', 'text'],
	['text-muted', 'surface-raised', 'text'],
	['text', 'sidebar', 'text'],
	['text-muted', 'sidebar', 'text'],
	['text', 'sidebar-hover', 'text'],
	['on-tooltip', 'tooltip', 'text'],
	['family-bar', 'family-marker', 'text'],
	['family-text', 'family-bar', 'text'],
	['family-muted', 'family-bar', 'text'],
	['family-marker', 'family-bar', 'graphic'],
	['on-code', 'code', 'text'],
	['focus', 'canvas', 'graphic'],
	['focus', 'surface', 'graphic'],
	['focus-edge', 'canvas', 'graphic'],
	['focus-edge', 'surface', 'graphic'],
	['focus-edge', 'surface-raised', 'graphic'],
	['accent', 'canvas', 'graphic'],
	['border-strong', 'canvas', 'decorative'],
	['border-control', 'canvas', 'graphic'],
	['border-control', 'surface', 'graphic'],
	['success', 'success-surface', 'text'],
	['success', 'surface', 'text'],
	['warning', 'warning-surface', 'text'],
	['warning', 'surface', 'text'],
	['danger', 'danger-surface', 'text'],
	['danger', 'surface', 'text'],
	['info', 'info-surface', 'text'],
	['info', 'surface', 'text'],
	['reference', 'reference-surface', 'text'],
	['code-comment', 'canvas', 'text'],
	['code-comment', 'surface', 'text'],
	['code-comment', 'surface-sunken', 'text'],
	['code-comment', 'success-surface', 'text'],
	['code-comment', 'danger-surface', 'text'],
	['code-keyword', 'canvas', 'text'],
	['code-keyword', 'surface', 'text'],
	['code-keyword', 'surface-sunken', 'text'],
	['code-keyword', 'success-surface', 'text'],
	['code-keyword', 'danger-surface', 'text'],
	['code-string', 'canvas', 'text'],
	['code-string', 'surface', 'text'],
	['code-string', 'surface-sunken', 'text'],
	['code-string', 'success-surface', 'text'],
	['code-string', 'danger-surface', 'text'],
	['code-number', 'canvas', 'text'],
	['code-number', 'surface', 'text'],
	['code-number', 'surface-sunken', 'text'],
	['code-number', 'success-surface', 'text'],
	['code-number', 'danger-surface', 'text'],
	['code-name', 'canvas', 'text'],
	['code-name', 'surface', 'text'],
	['code-name', 'surface-sunken', 'text'],
	['code-name', 'success-surface', 'text'],
	['code-name', 'danger-surface', 'text'],
	['code-tag', 'canvas', 'text'],
	['code-tag', 'surface', 'text'],
	['code-tag', 'surface-sunken', 'text'],
	['code-tag', 'success-surface', 'text'],
	['code-tag', 'danger-surface', 'text']
];
