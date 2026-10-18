import { Preferences } from '../dom/preferences/preferences.js';

/** Owns only the document's first opening, before an application has a useful screen. */
class OpeningRuntime {
	#specs;
	#element;
	#observer;
	#timer;
	#ended = false;

	constructor(script) {
		this.#specs = JSON.parse(decodeURIComponent(script.dataset.opening));
		const { key, appearance = 'system', locale = 'en', device = false } = this.#specs;
		new Preferences({ key, fallback: { appearance, locale: device && navigator.language.startsWith('es') ? 'es' : locale } }).restore();
		// Installed before module evaluation, including failures that precede DOMContentLoaded.
		window.addEventListener('error', this.#failure, true);
		window.addEventListener('unhandledrejection', this.#failure);
		this.#start();
	}

	#start() {
		this.#element = document.getElementById('bui-opening');
		if (!this.#element) return;
		this.#element.querySelector('button').addEventListener('click', () => location.reload());
		this.#observer = new MutationObserver(() => this.#check());
		this.#observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'data-state', 'data-bui-opening-wait'] });
		this.#timer = setTimeout(() => this.#slow(), 12000);
		this.#check();
	}

	#check() {
		if (this.#ended) return;
		const root = document.querySelector(this.#specs.root);
		if (!root || !root.children.length || root.querySelector(this.#specs.pending ?? '[data-bui-opening-wait]')) return;
		this.#ended = true;
		clearTimeout(this.#timer);
		this.#observer.disconnect();
		window.removeEventListener('error', this.#failure, true);
		window.removeEventListener('unhandledrejection', this.#failure);
		// A person who reached recovery keeps a keyboard destination when the page arrives late.
		const focused = this.#element.contains(document.activeElement);
		this.#element.remove();
		if (focused) {
			const destination = root.querySelector('h1, main, button, a[href]') ?? root;
			if (!destination.hasAttribute('tabindex')) destination.setAttribute('tabindex', '-1');
			destination.focus({ preventScroll: true });
		}
	}

	#slow() {
		if (this.#ended) return;
		this.#element.dataset.state = 'slow';
		this.#element.querySelector('[data-opening-recovery]').hidden = false;
		this.#element.querySelector('[data-opening-status]').setAttribute('aria-live', 'polite');
	}

	#failure = event => {
		// Missing images, fonts and optional resources must not turn an opening into a failure.
		if (event.type === 'error' && event.target !== window && event.target?.tagName !== 'SCRIPT') return;
		if (this.#ended) return;
		if (!this.#element) {
			document.addEventListener('DOMContentLoaded', () => this.#slow(), { once: true });
			return;
		}
		this.#slow();
	};
}

new OpeningRuntime(document.currentScript);
