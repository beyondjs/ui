import { el } from '../core/element.js';
import { glyph } from '../core/icons.js';

/**
 * The person's avatar in the family bar and at the head of the profile menu (D78, D81; 0.13.0).
 *
 * Initials of the name (up to two words), or the person glyph when no name is known. When the
 * descriptor carries `person.avatar`, the picture is laid over the initials once it loads; one that
 * fails (an address the product's content policy refuses, a picture gone at its provider) is removed,
 * so the initials always remain. Only an `https:` address or an image `data:` address is used, and
 * the picture is requested without a referrer, so the provider never learns which product asked.
 */
export class Avatar {
	#element;

	/**
	 * @param {object} options
	 * @param {string|null} options.name the person's name
	 * @param {string|null} [options.picture] the picture's address (`person.avatar`)
	 * @param {'bar'|'large'} [options.size] 28 px in the bar, 40 px at the head of the menu
	 */
	constructor({ name, picture = null, size = 'bar' }) {
		const initials = Avatar.initials(name);
		this.#element = el('span', { class: `bui-family-avatar bui-family-avatar-${size}`, 'aria-hidden': 'true' }, [initials || glyph('user')]);
		const source = Avatar.#source(picture);
		if (!source) return;
		const image = el('img', { class: 'bui-family-picture', alt: '', src: source, referrerpolicy: 'no-referrer', decoding: 'async' });
		image.addEventListener('load', () => this.#element.setAttribute('data-picture', ''), { once: true });
		image.addEventListener('error', () => image.remove(), { once: true });
		this.#element.append(image);
	}

	get element() {
		return this.#element;
	}

	/** Up to two initials of the name's words, upper case; '' without a name. */
	static initials(name) {
		return String(name ?? '')
			.split(/\s+/)
			.filter(Boolean)
			.slice(0, 2)
			.map(word => word[0].toUpperCase())
			.join('');
	}

	/** The picture's address when it is one the bar shows: `https:`, or an image as `data:`. */
	static #source(picture) {
		if (typeof picture !== 'string' || !picture) return null;
		if (/^data:image\//i.test(picture)) return picture;
		try {
			return new URL(picture).protocol === 'https:' ? picture : null;
		} catch {
			return null;
		}
	}
}
