/**
 * What an uncaught failure means for an opening (0.25.0), so the opening says only what is true:
 *
 * - `load`: the product's code could not load or link (a script or an import that did not arrive, a
 *   module that names an export its dependency lacks). Nothing of the product can run in this page.
 * - `start`: the product's code threw while it started, before it drew anything. It will not draw.
 * - `later`: anything else. The product may still finish, so the opening keeps the failure for its
 *   details and watches for progress instead of saying it failed.
 *
 * Missing images, fonts and optional resources are not failures of opening at all.
 */
export class OpeningFault {
	#kind;
	#text;

	/**
	 * @param {Event} event an `error` (window or resource, captured) or an `unhandledrejection`
	 * @param {{ drawn: boolean, started: boolean, words: import('./words.js').OpeningWords }} state
	 * `drawn`: the product's root holds something; `started`: the document's modules have run
	 * (`DOMContentLoaded`), after which a throw is no longer the product's start
	 */
	constructor(event, { drawn, started, words }) {
		const script = event.type === 'error' && event.target?.tagName === 'SCRIPT';
		const reason = event.type === 'unhandledrejection' ? event.reason : event.error;
		const message = String(reason?.message ?? reason ?? event.message ?? '');
		if (script) {
			this.#kind = 'load';
			this.#text = words.text('unloaded', { address: event.target.src });
			return;
		}
		// A module that cannot link fails before the document's modules have run; a syntax error after that, or in
		// a promise (JSON that does not parse), is the product's own failure
		const linked = event.type === 'error' && !started && (reason instanceof SyntaxError || /^(uncaught )?syntaxerror\b/i.test(String(event.message ?? '')));
		const imported = /dynamically imported module|importing a module script failed/i.test(message);
		this.#kind = linked || imported ? 'load' : event.type === 'error' && !drawn && !started ? 'start' : 'later';
		const place = event.filename ? `${event.filename}:${event.lineno}` : '';
		this.#text = [event.type === 'error' ? event.message || message : message, place].filter(Boolean).join(' · ');
	}

	/**
	 * Whether an event is a failure of opening: the window, a promise nobody handled, or one of the page's
	 * own scripts (an extension's or another origin's script that fails is not the product's code)
	 */
	static counts(event) {
		if (event.type === 'unhandledrejection' || event.target === globalThis.window) return true;
		if (event.target?.tagName !== 'SCRIPT') return false;
		try {
			return new URL(event.target.src, globalThis.location.href).origin === globalThis.location.origin;
		} catch {
			return false;
		}
	}

	/** `load`, `start` or `later` */
	get kind() {
		return this.#kind;
	}

	/** Whether the product can no longer finish in this page */
	get final() {
		return this.#kind !== 'later';
	}

	/** What the technical details say about it */
	get text() {
		return this.#text;
	}
}
