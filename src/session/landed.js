/**
 * Public module `@beyond-js/ui/session/landed`: the page a product's session hand-off ends on when
 * `Session` started it, in a hidden frame (a silent renewal) or in the sign-in window. It has no
 * imports, so a product may serve this file as written or bundle it.
 *
 * The product's return route redirects here with `session=renewed|interaction|unavailable|failed`,
 * `ended=<reason>` when Beyond Accounts gave one, and `product=<id>`. The landing tells the page:
 * its parent (a frame) by a message, and every page of this origin on the `beyond-session` channel. In
 * the window it says what happened and closes itself once renewed: a window without an opener may only
 * close itself (Chrome refuses the page's `close()`). Nothing here is a credential: the page that
 * started it still confirms with the product's own read.
 */
class Landing {
	static OUTCOMES = Object.freeze(['renewed', 'interaction', 'unavailable', 'failed']);
	static WORDS = Object.freeze({
		en: Object.freeze({ renewed: 'You’re signed in again. You can close this window.', other: 'Signing in did not finish. Close this window and try again from the page.' }),
		es: Object.freeze({ renewed: 'Ya volviste a iniciar sesión. Puedes cerrar esta ventana.', other: 'No se terminó de iniciar sesión. Cierra esta ventana y vuelve a intentarlo desde la página.' })
	});

	#view;

	constructor(view) {
		this.#view = view;
	}

	get message() {
		const query = new URLSearchParams(this.#view.location.search);
		const given = query.get('session');
		const outcome = Landing.OUTCOMES.includes(given) ? given : 'failed';
		return { type: 'beyond-session', outcome, ended: query.get('ended') || null, product: query.get('product') || null };
	}

	get framed() {
		try {
			return this.#view.parent !== this.#view;
		} catch {
			return true;
		}
	}

	run() {
		const message = this.message;
		// The outcome alone, which no page can use for anything but reading its own session again
		if (this.framed) this.#view.parent.postMessage(message, '*');
		try {
			const channel = new this.#view.BroadcastChannel('beyond-session');
			channel.postMessage(message);
			channel.close();
		} catch {
			// A browser without the channel: the page that opened the window reads the session by itself
		}
		if (this.framed) return;
		this.#say(message.outcome);
		if (message.outcome === 'renewed') this.#view.setTimeout(() => this.#view.close(), 150);
	}

	#say(outcome) {
		const document = this.#view.document;
		const language = (this.#view.navigator?.language ?? 'en').toLowerCase().startsWith('es') ? 'es' : 'en';
		const words = Landing.WORDS[language];
		const node = document.querySelector('[data-session-said]') ?? document.body.appendChild(document.createElement('p'));
		node.setAttribute('role', 'status');
		node.textContent = outcome === 'renewed' ? words.renewed : words.other;
		document.documentElement.lang = language;
	}
}

if (typeof window !== 'undefined') new Landing(window).run();

export { Landing };
