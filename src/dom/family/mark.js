import { el } from '../core/element.js';
import { Avatar } from './avatar.js';
import { Picture } from './picture.js';

/**
 * An organization's mark (D195, 0.40.0): a rounded square with the initial of its name, and its logo
 * laid over it once it loads, under the rules of `Picture`; a logo that fails is removed, so the initial
 * remains. A square, so it never reads as a person's round avatar.
 *
 * The family bar's organization menu draws one on every row once one of the person's organizations has a
 * logo, so the rows keep one left edge; a product's own list of organizations does the same with it
 * (React `OrganizationMark`).
 */
export class OrganizationMark {
	#element;

	/**
	 * @param {object} options
	 * @param {string} options.name the organization's name
	 * @param {string|null} [options.picture] the logo's address
	 */
	constructor({ name, picture = null }) {
		this.#element = el('span', { class: 'bui-organization-mark', 'aria-hidden': 'true' }, [OrganizationMark.initial(name)]);
		Picture.lay(this.#element, picture);
	}

	get element() {
		return this.#element;
	}

	/** The initial of the name, upper case; '' without a name. */
	static initial(name) {
		return Avatar.initials(name).slice(0, 1);
	}

	/** Whether a mark would show this logo's address. */
	static shows(picture) {
		return Picture.source(picture) !== null;
	}
}
