import { Component } from './core/component.js';
import { el, fill } from './core/element.js';
import { glyph } from './core/icons.js';
import { Labels } from './core/labels.js';
import { callout } from './feedback.js';
import { Awaited } from './operations/awaited.js';
import { Clock } from './time/clock.js';
import { words } from './provider-labels.js';

/**
 * A provider's own window, such as GitHub's installation page (FR-G2, design S2 2.3 to 2.4): opened
 * from a press, followed while it is open, and ended by reading the outcome from the server, never
 * from the window.
 *
 * "Continue to {provider}" opens `href` in a window. While it is open the page says "Finish on
 * {provider}" (an `Awaited` card, with "Taking longer than usual" past the 90th percentile of
 * `expected`) with **Reopen the {provider} window** and **Cancel**. A message from `origin` (and only
 * from it) or the window closing makes it call the product's `read()` (bounded by `bound`, D40), which
 * answers `{ state }`: `done` ends it (`onend('done', answer)`), `waiting` hands the product a state it
 * draws itself (an owner's approval), anything else after the window closed says "The {provider}
 * window closed before you finished. Nothing was connected." A blocked window offers **Continue in
 * this tab** and **Try the window again**. On a touch screen or inside a frame (`same: 'auto'`) the
 * address opens in this tab, and the product reads the attempt again when the person comes back. A
 * read that fails or does not answer says that it is not known yet, with **Check again**.
 */
export class ProviderWindow extends Component {
	/** The copy in English and Spanish (`labels.awaited` reaches the card). */
	static labels = words;
	static states = Object.freeze(['idle', 'open', 'blocked', 'checking', 'closed', 'unknown', 'done', 'away']);

	#element;
	#labels;
	#options;
	#state = 'idle';
	#window = null;
	#card = null;
	#since = null;
	#sequence = 0;
	#stop = null;

	/**
	 * @param {object} options
	 * @param {string} options.provider the provider's name ("GitHub")
	 * @param {string} options.href the address that starts the attempt (the product's own start address)
	 * @param {() => Promise<{state: string}>} options.read reads the attempt from the server
	 * @param {string|null} [options.origin] the only origin whose messages are listened to
	 * @param {(outcome: 'done'|'waiting', answer: object) => void} [options.onend]
	 * @param {boolean|'auto'} [options.same] opens in this tab (`auto`: on touch screens and inside frames)
	 * @param {{median: number, p90?: number}} [options.expected] how long it usually takes
	 * @param {number} [options.bound] milliseconds `read` may take (20000)
	 * @param {Clock} [options.clock]
	 */
	constructor({ provider, href, read, origin = null, onend = null, same = 'auto', expected = { median: 120_000, p90: 600_000 }, bound = 20_000, poll = 500, clock = Clock.system, locale = undefined, labels = {} }) {
		super();
		const { awaited = {}, ...own } = labels ?? {};
		this.#labels = new Labels(words.en, own);
		this.#options = { provider, href, read, origin, onend, same, expected, bound, poll, clock, locale, awaited };
		this.#element = el('div', { class: 'bui-provider' });
		const view = this.#view;
		if (view) this.listen(view, 'message', event => this.#message(event));
		this.#draw();
	}

	get element() {
		return this.#element;
	}

	/** `idle`, `open`, `blocked`, `checking`, `closed`, `unknown`, `done` or `away` (opened in this tab). */
	get state() {
		return this.#state;
	}

	/** Opens the provider's window; call it from a press, or the browser blocks it. */
	open() {
		const view = this.#view;
		if (!view || this.destroyed) return;
		if (this.#same(view)) return this.tab();
		const width = Math.min(1024, view.screen?.availWidth ?? 1024);
		const opened = view.open(this.#options.href, 'beyond-provider', `popup,width=${width},height=760`);
		if (!opened) return this.#go('blocked');
		this.#window = opened;
		this.#since = this.#options.clock.now;
		this.#go('open');
		this.#watch();
	}

	/** Continues in this tab: the product reads the attempt again when the person comes back. */
	tab() {
		this.#go('away');
		this.#view?.location.assign(this.#options.href);
	}

	/** Reads the attempt from the server now. */
	async check() {
		const sequence = ++this.#sequence;
		const closed = !this.#window || this.#window.closed;
		if (this.#state !== 'open' || closed) this.#go('checking');
		let answer = null;
		let timer = null;
		try {
			const late = new Promise((resolve, reject) => (timer = setTimeout(() => reject(new Error('The attempt was not read in time')), this.#options.bound)));
			answer = await Promise.race([this.#options.read(), late]);
		} catch {
			answer = null;
		} finally {
			clearTimeout(timer);
		}
		if (sequence !== this.#sequence || this.destroyed) return;
		this.#settle(answer, closed);
	}

	/** Stops following the window and closes it; nothing is read. */
	cancel() {
		this.#sequence += 1;
		this.#window?.close?.();
		this.#window = null;
		this.#go('idle');
	}

	destroy() {
		this.#sequence += 1;
		this.#stop?.();
		this.#card?.destroy();
		super.destroy();
	}

	get #view() {
		return this.#element.ownerDocument.defaultView;
	}

	#same(view) {
		const same = this.#options.same;
		if (same !== 'auto') return Boolean(same);
		let framed = false;
		try {
			framed = view.top !== view;
		} catch {
			framed = true;
		}
		return framed || Boolean(view.matchMedia?.('(pointer: coarse)').matches);
	}

	#settle(answer, closed) {
		const state = answer?.state;
		if (!answer) return this.#go(closed ? 'unknown' : 'open');
		if (state === 'done' || state === 'waiting') {
			this.#window?.close?.();
			this.#window = null;
			this.#go(state === 'done' ? 'done' : 'idle');
			return this.#options.onend?.(state, answer);
		}
		if (!this.#window || this.#window.closed) {
			this.#window = null;
			return this.#go('closed');
		}
		this.#go('open');
	}

	// Polls the window's `closed`, the only signal a cross-origin window gives; a closed window is read once.
	#watch() {
		this.#stop?.();
		const tick = () => {
			if (!this.#window || this.#state === 'done') return;
			if (this.#window.closed) return this.check();
			this.#stop = this.later(tick, this.#options.poll);
		};
		this.#stop = this.later(tick, this.#options.poll);
	}

	#message(event) {
		const { origin } = this.#options;
		if (!origin || event.origin !== origin || event.data?.type !== 'beyond-provider') return;
		if (this.#state === 'open' || this.#state === 'checking') this.check();
	}

	#go(state) {
		if (state === this.#state && state !== 'open') return;
		this.#state = state;
		this.#draw();
	}

	#draw() {
		const labels = this.#labels;
		const provider = this.#options.provider;
		const button = (text, run, variant = 'secondary', external = false) => el('button', { type: 'button', class: `bui-button bui-button-${variant}`, onclick: run }, [external ? glyph('external') : null, el('span', { text })]);
		const start = button(labels.text('continue', { provider }), () => this.open(), 'primary', true);
		if (this.#state !== 'open') {
			this.#card?.destroy();
			this.#card = null;
		}
		if (this.#state === 'open') return this.#open(button);
		if (this.#state === 'blocked') return fill(this.#element, [callout({ tone: 'warning', title: labels.text('blocked', { provider }), live: true, actions: [button(labels.text('tab'), () => this.tab(), 'primary'), button(labels.text('again'), () => this.open())] })]);
		if (this.#state === 'closed') return fill(this.#element, [el('p', { class: 'bui-provider-said', role: 'status', text: labels.text('closed', { provider }) }), start]);
		if (this.#state === 'unknown') return fill(this.#element, [callout({ tone: 'warning', title: labels.text('unknown', { provider }), live: true, actions: [button(labels.text('check'), () => this.check(), 'primary')] })]);
		if (this.#state === 'checking') return fill(this.#element, [el('p', { class: 'bui-provider-said', role: 'status', text: labels.text('checking', { provider }) })]);
		if (this.#state === 'done' || this.#state === 'away') return fill(this.#element, []);
		fill(this.#element, [start]);
	}

	#open(button) {
		const { provider, expected, clock, locale, awaited } = this.#options;
		if (!this.#card) this.#card = new Awaited({ title: this.#labels.text('finish', { provider }), since: this.#since, expected, check: () => this.check(), clock, locale, level: 3, labels: awaited });
		const reopen = button(this.#labels.text('reopen', { provider }), () => (this.#window && !this.#window.closed ? this.#window.focus?.() : this.open()));
		fill(this.#element, [this.#card.element, el('p', { class: 'bui-provider-steps', text: this.#labels.text('steps', { provider }) }), el('div', { class: 'bui-provider-actions' }, [reopen, button(this.#labels.text('cancel'), () => this.cancel(), 'quiet')])]);
	}
}
