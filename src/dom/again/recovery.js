import { Component } from '../core/component.js';
import { Ids } from '../core/ids.js';
import { el } from '../core/element.js';
import { Again } from './again.js';
import { AgainLine } from './line.js';
import { RetryAction } from './action.js';
import { RecoveryEntry } from './entry.js';

/**
 * One notice for one explicitly identified dependency and context. Products create separate
 * instances for independent failures. Entries are failed reads or lost transports, never writes.
 * Each symptom stays until its owner confirms an answer, including a refusal, or removes it.
 */
export class Recovery extends Component {
	#element;
	#body;
	#summary;
	#entries = new Map();
	#views = new Map();
	#focus;
	#again;
	#line;
	#action;
	#release;
	#running = null;
	#manual = false;

	/** `title` names the shared connection; every `run` must have its own request bound. */
	constructor({ title, labels = {}, locale, again = {}, focus = null }) {
		super();
		this.#focus = focus;
		this.#again = new Again({ ...again, run: () => this.#read(this.#manual) });
		this.#line = new AgainLine({ again: this.#again, labels, locale, now: again.now });
		this.#action = new RetryAction({ labels, run: () => this.now() });
		this.#body = el('div');
		this.#summary = el('p', { class: 'bui-hidden', role: 'status' });
		const id = Ids.next('bui-recovery');
		this.#element = el('section', { class: 'bui-unavailable bui-unavailable-outage bui-callout-warning', 'data-recovery': '', 'aria-labelledby': id, hidden: true }, [
			el('div', { class: 'bui-unavailable-body' }, [
				el('h2', { id, class: 'bui-unavailable-title', text: title }), this.#summary, this.#body, this.#line.element,
				el('div', { class: 'bui-unavailable-actions' }, [this.#action.element])
			])
		]);
		this.#release = this.#again.listen(state => { this.#action.busy = state.trying || this.#running !== null; });
	}

	get element() { return this.#element; }
	/** Number of affected reads or transports. */
	get size() { return this.#entries.size; }

	/**
	 * Adds or updates a symptom without resetting its retry schedule. `automatic: false` means the
	 * transport already reconnects itself; the manual action still reconnects it. The callback returns
	 * false or rejects until answered. Replacing an entry invalidates its previous pending answer.
	 */
	set(key, { title, reason = '', details = null, run, automatic = true }) {
		if (this.destroyed) return;
		if (typeof run !== 'function') throw new TypeError('Recovery needs a bounded read');
		const entry = { title, reason, details, run, automatic };
		this.#entries.set(key, entry);
		if (this.#views.has(key)) this.#views.get(key).update(entry);
		else {
			const view = new RecoveryEntry(entry);
			this.#views.set(key, view);
			this.#body.append(view.element);
		}
		this.#draw();
		if ([...this.#entries.values()].some(entry => entry.automatic)) this.#again.start();
		else this.#again.stop();
	}

	/** Removes only the symptom its owner confirmed, never every symptom on one success. */
	delete(key) {
		if (!this.#entries.delete(key)) return;
		const view = this.#views.get(key);
		const active = this.#element.ownerDocument.activeElement;
		const focused = view.element.contains(active) || (!this.size && this.#element.contains(active));
		view.destroy();
		this.#views.delete(key);
		this.#draw();
		if (focused) (this.size ? this.#action.element : this.#focus?.())?.focus({ preventScroll: true });
		if (![...this.#entries.values()].some(entry => entry.automatic)) this.#again.stop();
	}

	/** Retries all affected reads and transports, once while a try is running. */
	now() {
		if (!this.#again.active) return this.#read(true);
		this.#manual = true;
		return this.#again.now().finally(() => { this.#manual = false; });
	}

	#read(manual) {
		if (this.destroyed) return Promise.resolve(true);
		if (this.#running) return this.#running;
		const entries = [...this.#entries].filter(([, entry]) => manual || entry.automatic);
		const reads = new Map();
		this.#action.busy = true;
		// Defer callbacks until the promise is installed: synchronous callbacks can ask to retry too.
		this.#running = Promise.resolve().then(() => Promise.allSettled(entries.map(async ([key, entry]) => {
			// Several symptoms may share one bounded page read. Invoke it only once per attempt.
			if (!reads.has(entry.run)) reads.set(entry.run, Promise.resolve().then(() => entry.run()));
			const answered = await reads.get(entry.run);
			if (answered !== false && this.#entries.get(key) === entry) this.delete(key);
		}))).then(() => ![...this.#entries.values()].some(entry => entry.automatic)).finally(() => {
			this.#running = null;
			if (!this.destroyed) this.#action.busy = false;
		});
		return this.#running;
	}

	#draw() {
		this.#element.hidden = !this.#entries.size;
		const summary = [...this.#entries.values()].map(entry => entry.title).join('. ');
		if (this.#summary.textContent !== summary) this.#summary.textContent = summary;
	}

	destroy() {
		this.#entries.clear();
		this.#release();
		this.#again.stop();
		this.#line.destroy();
		this.#action.destroy();
		for (const view of this.#views.values()) view.destroy();
		this.#views.clear();
		super.destroy();
	}
}
