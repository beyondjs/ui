/**
 * Writes the tokens as CSS custom properties.
 *
 * The output is plain text, so the same writer serves the package build (which saves it as
 * `tokens.css`) and any consumer that inserts it as a stylesheet at runtime. Its header keeps the
 * wording of the first generated sheet, so the extracted source reproduces it byte for byte. Semantic colors are resolved to hex
 * values per theme; components only ever read `--color-<role>`.
 *
 * Themes follow the attribute the Beyond products already use, `data-beyond-mode`, with the system
 * preference as the fallback when no mode is set.
 */
export class TokenSheet {
	#tokens;

	constructor(tokens) {
		this.#tokens = tokens;
	}

	/** Custom properties that do not depend on the theme. */
	get shared() {
		const { typography, space, radius, elevation, overlay, motion, density, layout } = this.#tokens;
		const lines = [];
		for (const [name, entry] of Object.entries(typography.family)) lines.push(`--font-${name}: ${entry.value};`);
		for (const [name, entry] of Object.entries(typography.weight)) lines.push(`--weight-${name}: ${entry.value};`);
		for (const [name, entry] of Object.entries(typography.size)) {
			lines.push(`--text-${name}: ${entry.value};`, `--leading-${name}: ${entry.line};`);
			if (entry.tracking) lines.push(`--tracking-${name}: ${entry.tracking};`);
		}
		for (const [step, value] of Object.entries(space.steps)) lines.push(`--space-${step}: ${value};`);
		for (const [name, entry] of Object.entries(radius)) lines.push(`--radius-${name}: ${entry.value};`);
		for (const [name, entry] of Object.entries(elevation)) lines.push(`--elevation-${name}: ${entry.value};`);
		for (const [name, entry] of Object.entries(overlay)) lines.push(`--overlay-${name}: ${entry.value};`);
		for (const [name, entry] of Object.entries(motion)) lines.push(`--motion-${name}: ${entry.value};`);
		for (const [name, entry] of Object.entries(density)) {
			lines.push(`--${name}-control: ${entry.control};`, `--${name}-row: ${entry.row};`);
		}
		for (const [name, entry] of Object.entries(layout)) lines.push(`--layout-${name}: ${entry.value};`);
		return lines;
	}

	/** Custom properties of one theme, resolved to hex values. */
	theme(name) {
		const { primitives, themes } = this.#tokens.color;
		return Object.entries(themes[name]).map(([role, primitive]) => `--color-${role}: ${primitives[primitive].value};`);
	}

	/** The complete stylesheet text. */
	get css() {
		const attribute = this.#tokens.attribute;
		const block = (selector, lines) => `${selector} {\n${lines.map(line => `\t${line}`).join('\n')}\n}`;
		return [
			`/* Beyond family tokens ${this.#tokens.version} (${this.#tokens.status}). Generated from src/foundations; do not edit. */`,
			block(':root', [...this.shared, ...this.theme('light'), 'color-scheme: light;']),
			block(`:root[${attribute}='dark']`, [...this.theme('dark'), 'color-scheme: dark;']),
			`@media (prefers-color-scheme: dark) {\n${block(`:root:not([${attribute}='light'])`, [...this.theme('dark'), 'color-scheme: dark;'])}\n}`
		].join('\n\n');
	}
}
