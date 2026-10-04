import { el } from '../core/element.js';
import { entry } from './menu.js';

/**
 * "Sign out of Beyond" in the profile menu (Q09, answered on 2026-10-03): one action that signs the
 * person out of Beyond in this browser, every product included, with no question.
 *
 * Pressed, it asks the product's `before()` first (a product holding unsaved work warns there and
 * cancels by returning false), then runs the product's `end()` to end its own session, under a bound
 * of about five seconds: a failure or no answer does not block, because Accounts' `/leave` ends every
 * product session derived from the Beyond session anyway. It then goes to `links.leave` (Accounts'
 * `/leave`, from the descriptor or the product's `fallback.links`) with `product=<the bar's
 * product>` and `return=<the address the person is on>`, without its transient parameters. Without
 * that address it calls the product's `after()` (its own signed-out page) instead. While it runs the
 * entry says it is working, keeps the menu open and ignores another press.
 */
export class Leave {
	/** Milliseconds `end()` may take before the bar goes on without its answer. */
	static bound = 5000;

	#signout;
	#address;
	#manage;
	#product;
	#labels;
	#label;
	#node;
	#busy = false;
	#onfinish;

	/**
	 * @param {object} options
	 * @param {{end?: () => unknown, before?: () => boolean|Promise<boolean>, after?: () => void, bound?: number}} options.signout
	 * @param {string|null} options.address Accounts' `/leave`, or null
	 * @param {import('./manage.js').Manage} options.manage completes the way back
	 * @param {string} options.product the bar's product id
	 * @param {string} options.label the entry's label
	 * @param {import('../core/labels.js').Labels} options.labels
	 * @param {() => void} [options.onfinish] after a flow that did not leave the page
	 */
	constructor({ signout, address, manage, product, label, labels, onfinish = null }) {
		this.#signout = signout;
		this.#address = address;
		this.#manage = manage;
		this.#product = product;
		this.#labels = labels;
		this.#label = label;
		this.#onfinish = onfinish;
		this.#node = entry({ label, run: () => this.run(), class: 'bui-family-signout' });
		// The menu stays open while it runs, so the entry can say it is working.
		this.#node.dataset.buiKeep = '';
	}

	get element() {
		return this.#node;
	}

	get busy() {
		return this.#busy;
	}

	/** The address of Accounts' `/leave` for the page the person is on, or null without one. */
	address(location = globalThis.location) {
		if (!this.#address) return null;
		try {
			const url = new URL(this.#address, globalThis.document?.baseURI);
			url.searchParams.set('product', this.#product);
			if (location?.href) url.searchParams.set('return', this.#manage.clean(location.href));
			return url.href;
		} catch {
			return null;
		}
	}

	/**
	 * Signs out: `before`, the bounded `end`, then `/leave` or `after`. A second press while it runs is
	 * ignored. A failing `before` or `after` goes to `reportError` and leaves the entry pressable again.
	 */
	async run() {
		if (this.#busy) return;
		const { before = null, end = null, after = null, bound = Leave.bound } = this.#signout;
		this.#busy = true;
		try {
			// The product's own question comes first, before the entry says it is signing out.
			if (before && (await before()) === false) return this.#finish();
			this.#working(true);
			await Leave.#bounded(end, bound);
			const view = this.#node.ownerDocument.defaultView ?? globalThis;
			const address = this.address(view.location);
			if (address) return view.location.assign(address);
			await after?.();
			this.#finish();
		} catch (error) {
			this.#finish();
			globalThis.reportError?.(error);
		}
	}

	#finish() {
		this.#working(false);
		this.#onfinish?.();
	}

	#working(busy) {
		this.#busy = busy;
		const node = this.#node;
		const text = node.querySelector('.bui-navmenu-label');
		if (busy) node.setAttribute('aria-disabled', 'true');
		else node.removeAttribute('aria-disabled');
		node.toggleAttribute('data-busy', busy);
		if (text) text.textContent = busy ? this.#labels.text('leaving') : this.#label;
		node.querySelector('.bui-spinner')?.remove();
		if (busy) node.prepend(el('span', { class: 'bui-spinner', 'aria-hidden': 'true' }));
	}

	/** Runs `end` and settles when it does, fails or the bound passes, whichever comes first. */
	static async #bounded(end, bound) {
		if (typeof end !== 'function') return;
		let timer = null;
		const late = new Promise(resolve => (timer = setTimeout(resolve, Math.max(0, Number(bound) || 0))));
		try {
			await Promise.race([Promise.resolve().then(end).catch(() => undefined), late]);
		} finally {
			clearTimeout(timer);
		}
	}
}
