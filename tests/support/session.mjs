/** The product `Session` sees in its unit tests (`session.test.mjs`, `session-host.test.mjs`). */
export const ada = Object.freeze({ id: 'acc_ada', name: 'Ada Lovelace', email: 'ada@example.com' });

/**
 * A product as `Session` sees it: a session it reads, a hand-off whose silent attempt a landing
 * answers, and the sign-in window a press opens. `platform` says whether Beyond Accounts still has a
 * session; `after` is the answer the product reads once the person signed in again.
 */
export class SessionProduct {
	/** `{ ui, page }`, set by the test file */
	static context = null;

	answer = { state: 'ended', reason: 'expired' };
	platform = true;
	ended = null;
	opened = [];
	reads = 0;
	popup = null;
	#ui;
	#page;

	constructor({ platform = true, ended = null, reason = 'expired' } = {}, { ui, page } = SessionProduct.context) {
		this.#ui = ui;
		this.#page = page;
		this.platform = platform;
		this.ended = ended;
		this.answer = { state: 'ended', reason };
		window.open = (url, name) => {
			this.opened.push(url);
			this.popup = { closed: false, opener: window, location: { replace: address => this.opened.push(address), href: 'about:blank' }, focus: () => {}, close: () => (this.popup.closed = true) };
			return this.popup;
		};
	}

	session(options = {}) {
		return new this.#ui.Session({
			product: 'conduict',
			person: ada,
			read: async () => {
				this.reads += 1;
				return this.answer;
			},
			start: mode => `about:blank#${mode}`,
			wait: 300,
			interval: 20,
			...options
		});
	}

	/** Answers the hidden frame as the landing would. */
	async land() {
		await this.#page.until(() => document.querySelector('iframe[data-session="renewal"]'));
		const frame = document.querySelector('iframe[data-session="renewal"]');
		if (this.platform) this.answer = { state: 'signed', person: ada };
		const data = { type: 'beyond-session', outcome: this.platform ? 'renewed' : 'interaction', ended: this.ended };
		window.dispatchEvent(new window.MessageEvent('message', { data, source: frame.contentWindow }));
	}

	signin(person = ada) {
		this.answer = { state: 'signed', person };
	}

	/** The session's dialog, or null. */
	static dialog() {
		return document.querySelector('dialog.bui-session');
	}

	/** The dialog's button or link named `name`. */
	static button(name) {
		return [...(SessionProduct.dialog()?.querySelectorAll('button, a') ?? [])].find(node => node.textContent.trim() === name);
	}
}
