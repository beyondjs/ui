import { el } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Picture } from './picture.js';

/**
 * The person's avatar in the family bar and at the head of the profile menu (D78, D81; 0.13.0).
 *
 * Initials of the name (up to two words), or the person glyph when no name is known. When the
 * descriptor carries `person.avatar`, the picture is laid over the initials once it loads, under the
 * rules of `Picture`: a failed one is removed, so the initials always remain.
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
		Picture.lay(this.#element, picture);
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
}
