/**
 * The keyboard shortcut to a product's sidebar search (0.14.0, D97): ⌘K on Apple's platforms and
 * Ctrl+K elsewhere, never a single key (WCAG 2.1.4). A product enables it (the sidebar's `shortcut`);
 * a host that owns the keys turns it off (`enabled = false`), and a key a host already handled
 * (`defaultPrevented`) is left to it. Inside the Beyond Desktop the application window's own document
 * receives the key while it has focus, so nothing more is needed there.
 */
export class SidebarShortcut {
	#view;
	#run;
	#enabled;
	#handler = event => this.#key(event);

	/**
	 * @param {object} options
	 * @param {Window|null} options.view the window whose document hears the key
	 * @param {() => boolean} options.run opens the search; answers whether there was one
	 * @param {boolean} [options.enabled] listening from the start
	 */
	constructor({ view, run, enabled = false }) {
		this.#view = view;
		this.#run = run;
		this.#enabled = false;
		this.enabled = enabled;
	}

	/** Whether this platform names the key ⌘ (Apple's) rather than Ctrl. */
	get apple() {
		const navigator = this.#view?.navigator;
		const platform = navigator?.userAgentData?.platform ?? navigator?.platform ?? '';
		return /mac|iphone|ipad|ipod/i.test(platform);
	}

	/** The shortcut as shown ("⌘K", "Ctrl+K") and as `aria-keyshortcuts` ("Meta+K", "Control+K"). */
	get words() {
		return this.apple ? { text: '⌘K', keys: 'Meta+K' } : { text: 'Ctrl+K', keys: 'Control+K' };
	}

	get enabled() {
		return this.#enabled;
	}

	/** Listens to the document's keys, or stops. */
	set enabled(value) {
		const next = Boolean(value) && Boolean(this.#view?.document);
		if (next === this.#enabled) return;
		this.#enabled = next;
		if (next) this.#view.document.addEventListener('keydown', this.#handler);
		else this.#view?.document?.removeEventListener('keydown', this.#handler);
	}

	destroy() {
		this.enabled = false;
	}

	#key(event) {
		if (event.defaultPrevented || event.isComposing || event.altKey || event.shiftKey) return;
		if (String(event.key).toLowerCase() !== 'k') return;
		const modifier = this.apple ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
		if (!modifier) return;
		if (this.#run()) event.preventDefault();
	}
}
