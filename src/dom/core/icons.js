import { paths, unlabeled } from './glyphs.js';

export { paths, unlabeled };

/** Every name of the icon catalog, in catalog order. */
export const icons = Object.freeze(Object.keys(paths));

/** The sizes an icon is drawn at, in CSS pixels. */
export const sizes = Object.freeze([16, 20, 24]);

/**
 * One icon of the catalog: validates its name, size and label and describes its SVG element, which
 * `element` builds for the DOM and the React adapter renders from `attributes` and `paths`.
 *
 * An icon without a label is decorative (`aria-hidden`); its control or its visible text names it.
 * With a label it is an image with that accessible name (`role="img"`). A sized icon carries
 * `data-size`, which the stylesheet draws at that size; an unsized one (the components' own glyphs)
 * is drawn at the size its component's stylesheet gives it.
 */
export class Glyph {
	#name;
	#size;
	#label;

	/**
	 * @param {string} name a name of `icons`
	 * @param {{size?: 16|20|24|null, label?: string|null}} [options]
	 */
	constructor(name, { size = null, label = null } = {}) {
		if (typeof name !== 'string' || !Object.hasOwn(paths, name)) throw new TypeError(`Unknown icon "${name}": use one of the names in \`icons\``);
		if (size !== null && !sizes.includes(size)) throw new RangeError(`Icon size ${size} is not one of ${sizes.join(', ')}`);
		if (label !== null && (typeof label !== 'string' || !label.trim())) throw new TypeError('An icon label is a non-empty string, or null for a decorative icon');
		this.#name = name;
		this.#size = size;
		this.#label = label;
	}

	get name() {
		return this.#name;
	}

	/** The path data of the glyph. */
	get paths() {
		return [].concat(paths[this.#name]);
	}

	/** The attributes of the `<svg>` element, by their DOM names. */
	get attributes() {
		const sized = this.#size === null ? {} : { width: String(this.#size), height: String(this.#size), 'data-size': String(this.#size) };
		const named = this.#label === null ? { 'aria-hidden': 'true' } : { role: 'img', 'aria-label': this.#label };
		return { viewBox: '0 0 24 24', class: 'bui-icon', 'data-icon': this.#name, ...sized, ...named, focusable: 'false' };
	}

	/** A new `<svg>` element of the glyph. */
	get element() {
		const namespace = 'http://www.w3.org/2000/svg';
		const svg = document.createElementNS(namespace, 'svg');
		for (const [name, value] of Object.entries(this.attributes)) svg.setAttribute(name, value);
		for (const d of this.paths) {
			const path = document.createElementNS(namespace, 'path');
			path.setAttribute('d', d);
			svg.append(path);
		}
		return svg;
	}
}

/**
 * An icon of the catalog as an inline SVG element, 16, 20 (default) or 24 px. Without `label` it is
 * hidden from assistive technology; with one it is an image of that name. An unknown name, a size
 * outside 16/20/24 or an empty label throws.
 */
export function icon(name, { size = 20, label = null } = {}) {
	return new Glyph(name, { size, label }).element;
}

/** The package's own decorative glyph, drawn at the size its component's stylesheet gives it. */
export function glyph(name) {
	return new Glyph(name).element;
}
