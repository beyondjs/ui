/**
 * One renewal without the person: the product's hand-off start in a hidden frame, asking Beyond
 * Accounts not to show anything (`prompt=none`), as Google and Microsoft renew a session.
 *
 * The frame passes through Accounts, which with a living Beyond session issues a code at once and with
 * none returns `session=interaction` instead of a sign-in page. It ends on the product's landing
 * (`@beyond-js/ui/session/landed`), which tells this page the outcome with a message whose source is
 * the frame. `attempt()` resolves with `{ outcome, ended }`: `renewed`, `interaction` (with the reason
 * Accounts gave, when it gave one), `unavailable`, `failed`, or `timeout` when nothing came back within
 * `bound` (a frame the browser or a header refused, a landing missing). The caller confirms with the
 * product's own read either way: the frame's word only makes it faster.
 */
export class Silent {
	static OUTCOMES = Object.freeze(['renewed', 'interaction', 'unavailable', 'failed']);

	#document;
	#bound;

	/**
	 * @param {object} options
	 * @param {Document} options.document
	 * @param {number} [options.bound] milliseconds an attempt may take (10000)
	 */
	constructor({ document, bound = 10_000 }) {
		this.#document = document;
		this.#bound = bound;
	}

	/** @param {string} address the product's hand-off start for a silent renewal */
	attempt(address) {
		const view = this.#document.defaultView;
		const frame = this.#document.createElement('iframe');
		frame.hidden = true;
		frame.setAttribute('aria-hidden', 'true');
		frame.setAttribute('tabindex', '-1');
		frame.setAttribute('title', '');
		frame.dataset.session = 'renewal';
		return new Promise(resolve => {
			let timer = null;
			const finish = result => {
				clearTimeout(timer);
				view?.removeEventListener('message', heard);
				frame.remove();
				resolve(result);
			};
			const heard = event => {
				if (event.source !== frame.contentWindow || event.data?.type !== 'beyond-session') return;
				const outcome = Silent.OUTCOMES.includes(event.data.outcome) ? event.data.outcome : 'failed';
				finish({ outcome, ended: event.data.ended ?? null });
			};
			view?.addEventListener('message', heard);
			timer = setTimeout(() => finish({ outcome: 'timeout', ended: null }), this.#bound);
			frame.src = address;
			this.#document.body.append(frame);
		});
	}
}
