/* global __BEYOND_UI__ */

/**
 * The presentation the controller works on (0.25.0). The document paints the identity, the trace and
 * the one announced line; the controller adds the steps. A document drawn by another version of the
 * package (a development server that has not restarted since the package changed under it) is drawn
 * again in this version's form, keeping its wordmark, so the person still sees a styled opening that
 * can say what happened, never a page this stylesheet does not know.
 */
export class OpeningFrame {
	/** This controller's version, set where it is built (`tools/build.mjs`); empty where it runs unbuilt */
	static version = typeof __BEYOND_UI__ === 'string' ? __BEYOND_UI__ : '';

	#element;
	#words;
	#drawn;

	/**
	 * @param {HTMLElement} element the presentation (`#bui-opening`)
	 * @param {import('./words.js').OpeningWords} words
	 */
	constructor(element, words) {
		this.#element = element;
		this.#words = words;
		this.#drawn = element.dataset.version ?? '';
	}

	/** Whether the document was drawn by another version of the package */
	get outdated() {
		return this.#drawn !== OpeningFrame.version;
	}

	/** The version that drew the document, when it said one */
	get drawn() {
		return this.#drawn;
	}

	/** Draws what this version needs and returns its parts: `{ stage, status, list }` */
	draw() {
		if (this.outdated) this.#again();
		const stage = this.#element.querySelector('.bui-opening-stage');
		const status = this.#element.querySelector('[data-opening-status]');
		const list = document.createElement('ol');
		list.className = 'bui-opening-steps';
		list.dataset.openingSteps = '';
		// Seen, never read twice: the one announced line says each step
		list.setAttribute('aria-hidden', 'true');
		list.hidden = true;
		status.after(list);
		return { stage, status, list };
	}

	/** This version's identity, trace and announced line, in place of another version's markup */
	#again() {
		const part = (tag, className, host) => host.appendChild(Object.assign(document.createElement(tag), { className }));
		const source = this.#element.querySelector('img')?.getAttribute('src');
		this.#element.replaceChildren();
		this.#element.className = 'bui-opening';
		this.#element.dataset.state = 'opening';
		part('div', 'bui-opening-veil', this.#element);
		const stage = part('div', 'bui-opening-stage', this.#element);
		const lockup = part('div', 'bui-opening-lockup', stage);
		if (source) Object.assign(part('img', 'bui-opening-wordmark', lockup), { src: source, alt: 'Beyond', width: 120, height: 30 });
		part('span', 'bui-opening-divider', lockup).setAttribute('aria-hidden', 'true');
		part('span', 'bui-opening-name', lockup).textContent = this.#words.product;
		part('div', 'bui-opening-trace', stage).setAttribute('aria-hidden', 'true');
		const status = part('p', 'bui-opening-status', stage);
		status.setAttribute('role', 'status');
		status.dataset.openingStatus = '';
		status.textContent = this.#words.text('opening');
	}
}
