import { Component } from '../core/component.js';
import { Ids } from '../core/ids.js';
import { Labels } from '../core/labels.js';
import { el } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { TechnicalDetails } from '../operations/details.js';
import { Again } from './again.js';
import { AgainLine } from './line.js';
import { RetryAction } from './action.js';
import { OfflineVoice } from './voice.js';

const copy = Object.freeze({
	en: Object.freeze({ ...RetryAction.labels.en, ...AgainLine.labels.en, offline: 'You’re offline' }),
	es: Object.freeze({ ...RetryAction.labels.es, ...AgainLine.labels.es, offline: 'Estás sin conexión' })
});

/**
 * One outage of one explicitly identified dependency and context, said once (D163, 0.24.0): a line in
 * the warning tone with who did not answer (`title`, from the family's catalog of causes, D133), when it
 * last tried (D132) and one Try again (D101). It lists nothing: each read it affects says it is
 * unavailable in its own place (`EmptyState`'s `outage`, `Section`'s `unavailable`), and the evidence of
 * every read is one "Technical details" with a row per read. When nothing on the page could be read the
 * product sets `whole`, and the notice is the page's body in `Unavailable`'s form instead of a line above
 * empty regions.
 *
 * While the browser is offline (`navigator.onLine === false`, 0.33.0) the line names no product: it says
 * "You're offline", when it last tried and that it tries again as soon as the person is back online, with
 * no Try again, since nothing can answer; what was read stays under its "Last updated". Offline is one
 * cause for the whole page, so only the first such notice says it (`OfflineVoice`). A notice whose
 * dependency runs on this computer (a development service on loopback) sets `local`, and keeps naming it.
 *
 * Products create separate instances for independent failures. Entries are failed reads or lost
 * transports, never writes. Each symptom stays until its owner confirms an answer, including a refusal,
 * or removes it.
 */
export class Recovery extends Component {
	/** The copy in English and Spanish: Try again, the last-tried line and the offline cause (0.33.0). */
	static labels = copy;

	#element;
	#title;
	#cause;
	#words;
	#local;
	#offline = false;
	#status;
	#details = null;
	#evidence = '';
	#entries = new Map();
	#labels;
	#locale;
	#level;
	#focus;
	#again;
	#line;
	#action;
	#release;
	#running = null;
	#manual = false;

	/**
	 * @param {object} options
	 * @param {string} options.title who did not answer ("Beyond Accounts did not answer")
	 * @param {object} [options.labels] the words of Try again, the last-tried line and Technical details
	 * @param {string} [options.locale] the language of times
	 * @param {object} [options.again] `Again`'s options but `run`
	 * @param {(() => HTMLElement|null)|null} [options.focus] where focus goes when the last symptom ends
	 * @param {boolean} [options.whole] the page's body itself, when nothing on it could be read
	 * @param {2|3|4|5|6} [options.level] the heading level of the page form (2)
	 * @param {boolean} [options.local] what did not answer runs on this computer, so being offline does not explain it (0.33.0)
	 */
	constructor({ title, labels = {}, locale = undefined, again = {}, focus = null, whole = false, level = 2, local = false }) {
		super();
		this.#labels = labels;
		this.#words = new Labels(copy.en, labels);
		this.#cause = String(title ?? '');
		this.#local = Boolean(local);
		this.#locale = locale;
		this.#level = [2, 3, 4, 5, 6].includes(Number(level)) ? Number(level) : 2;
		this.#focus = focus;
		this.#again = new Again({ ...again, run: () => this.#read(this.#manual) });
		this.#line = new AgainLine({ again: this.#again, labels, locale, now: again.now });
		this.#action = new RetryAction({ labels, run: () => this.now() });
		const id = Ids.next('bui-recovery');
		this.#title = el('p', { id, class: 'bui-recovery-title', text: this.#cause });
		this.#status = el('p', { class: 'bui-hidden', role: 'status' });
		this.#element = el('section', { class: 'bui-recovery', 'data-recovery': 'line', 'aria-labelledby': id, hidden: true }, [
			el('span', { class: 'bui-recovery-mark', 'aria-hidden': 'true' }, [glyph('globe')]),
			el('div', { class: 'bui-recovery-words' }, [this.#title, this.#line.element]),
			el('div', { class: 'bui-recovery-actions' }, [this.#action.element]),
			this.#status
		]);
		this.whole = whole;
		this.#release = this.#again.listen(state => {
			this.#action.busy = state.trying || this.#running !== null;
			if (state.offline === this.#offline) return;
			this.#offline = state.offline;
			this.#show();
			OfflineVoice.tell(this);
		});
		OfflineVoice.join(this, () => this.#show());
	}

	get element() {
		return this.#element;
	}

	/** Number of affected reads or transports. */
	get size() {
		return this.#entries.size;
	}

	/** Who did not answer, as the product named it; offline the line says "You're offline" instead. */
	get title() {
		return this.#cause;
	}

	set title(value) {
		const text = String(value ?? '');
		if (this.#cause === text) return;
		this.#cause = text;
		this.#show();
	}

	/** Whether what did not answer runs on this computer, so the line names it even offline (0.33.0). */
	get local() {
		return this.#local;
	}

	/** Whether the line says the person is offline now (0.33.0). */
	get offline() {
		return this.#offline && !this.#local;
	}

	/** Whether it is the page's body (`Unavailable`'s form) rather than a line above the page's regions. */
	get whole() {
		return this.#element.dataset.recovery === 'page';
	}

	set whole(value) {
		const whole = Boolean(value);
		const tag = whole ? `h${this.#level}` : 'p';
		if (this.#title.localName !== tag) {
			const title = el(tag, { id: this.#title.id, class: 'bui-recovery-title', text: this.#title.textContent });
			this.#title.replaceWith(title);
			this.#title = title;
		}
		this.#element.dataset.recovery = whole ? 'page' : 'line';
	}

	/**
	 * Adds or updates a symptom without resetting its retry schedule: `title` names what could not be
	 * read, in Technical details; `details` (`{ request, time, text }`) is its evidence. `automatic: false`
	 * means the transport already reconnects itself; the manual action still reconnects it. The callback
	 * returns false or rejects until answered. Replacing an entry invalidates its previous pending answer.
	 */
	set(key, { title, details = null, run, automatic = true }) {
		if (this.destroyed) return;
		if (typeof run !== 'function') throw new TypeError('Recovery needs a bounded read');
		this.#entries.set(key, { title, details, run, automatic });
		this.#offline = this.#again.offline;
		this.#draw();
		if ([...this.#entries.values()].some(entry => entry.automatic)) this.#again.start();
		else this.#again.stop();
	}

	/** Removes only the symptom its owner confirmed, never every symptom on one success. */
	delete(key) {
		if (!this.#entries.delete(key)) return;
		const active = this.#element.ownerDocument.activeElement;
		const inside = this.#element.contains(active);
		this.#draw();
		// Its evidence left with it, or the notice did: focus goes to Try again, else to the page
		if (inside && (!this.size || !this.#element.contains(active))) (this.size ? this.#action.element : this.#focus?.())?.focus({ preventScroll: true });
		if (![...this.#entries.values()].some(entry => entry.automatic)) this.#again.stop();
	}

	/** Retries all affected reads and transports, once while a try is running. */
	now() {
		if (!this.#again.active) return this.#read(true);
		this.#manual = true;
		return this.#again.now().finally(() => {
			this.#manual = false;
		});
	}

	#read(manual) {
		if (this.destroyed) return Promise.resolve(true);
		if (this.#running) return this.#running;
		const entries = [...this.#entries].filter(([, entry]) => manual || entry.automatic);
		const reads = new Map();
		this.#action.busy = true;
		// Defer callbacks until the promise is installed: synchronous callbacks can ask to retry too.
		this.#running = Promise.resolve()
			.then(() =>
				Promise.allSettled(
					entries.map(async ([key, entry]) => {
						// Several symptoms may share one bounded page read. Invoke it only once per attempt.
						if (!reads.has(entry.run)) reads.set(entry.run, Promise.resolve().then(() => entry.run()));
						const answered = await reads.get(entry.run);
						if (answered !== false && this.#entries.get(key) === entry) this.delete(key);
					})
				)
			)
			.then(() => ![...this.#entries.values()].some(entry => entry.automatic))
			.finally(() => {
				this.#running = null;
				if (!this.destroyed) this.#action.busy = false;
			});
		return this.#running;
	}

	/**
	 * Shown while a symptom stays, said once when it appears: who did not answer, or offline that the person
	 * is offline, by the first notice of the page alone and with no Try again, since nothing can answer
	 */
	#show() {
		const away = this.offline;
		const text = away ? this.#words.text('offline') : this.#cause;
		if (this.#title.textContent !== text) this.#title.textContent = text;
		this.#element.hidden = !this.#entries.size || (away && !OfflineVoice.speaks(this));
		this.#element.toggleAttribute('data-offline', away);
		this.#action.element.hidden = away;
		const said = this.#element.hidden ? '' : text;
		if (this.#status.textContent !== said) this.#status.textContent = said;
	}

	/** Its symptoms drawn: the line shown or hidden, and its evidence patched in place. */
	#draw() {
		this.#show();
		if (this.offline) OfflineVoice.tell(this);
		const rows = [...this.#entries.values()]
			.filter(entry => entry.details)
			.map(({ title, details }) => ({ label: title, text: details.text ?? '', request: details.request ?? null, time: details.time ?? null }));
		const evidence = JSON.stringify(rows);
		// Identical evidence keeps the disclosure, its focus and a copy's result as they are
		if (evidence === this.#evidence) return;
		this.#evidence = evidence;
		if (!rows.length) {
			this.#details?.destroy();
			this.#details = null;
		} else if (this.#details) this.#details.update({ entries: rows });
		else {
			const given = [...this.#entries.values()].find(entry => entry.details)?.details ?? {};
			this.#details = new TechnicalDetails({ entries: rows, locale: this.#locale ?? given.locale, labels: { ...(given.labels ?? {}), ...this.#labels } });
			this.#status.before(this.#details.element);
		}
	}

	destroy() {
		this.#entries.clear();
		OfflineVoice.leave(this);
		this.#release();
		this.#again.stop();
		this.#line.destroy();
		this.#action.destroy();
		this.#details?.destroy();
		super.destroy();
	}
}
