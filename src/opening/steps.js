/**
 * The steps of one opening (0.21.0): what is happening, in words, each with how long it took or has run
 * so far, measured from the navigation's start. The first is the document's own (`interface`, until the
 * product's root draws); the next ones are those the product names on its waiting element. They show
 * only once the opening is not quick, all at once; the running step's time is redrawn every `rate`
 * milliseconds and is never announced, and past its measured 90th percentile it says how long it usually
 * takes. A step's mark is the family's shape for its state (D129): done a filled circle, running a
 * half-filled circle, late a diamond, failed a square.
 */
export class OpeningSteps {
	static rate = 100;

	#list;
	#words;
	#usual;
	#items = [];
	#shown = false;
	#timer = 0;

	/**
	 * @param {{ list: HTMLOListElement, words: import('./words.js').OpeningWords, usual: import('./usual.js').OpeningUsual }} specs
	 */
	constructor({ list, words, usual }) {
		this.#list = list;
		this.#words = words;
		this.#usual = usual;
	}

	/** The running step (`{ id, own, start, end, state }`), or null */
	get active() {
		const last = this.#items.at(-1);
		return last && last.end === null ? last : null;
	}

	/** The running step's words, in the document's language now */
	get label() {
		const active = this.active;
		return active ? this.#label(active) : '';
	}

	/** Whether the steps are said: the opening was not quick (`show`) */
	get shown() {
		return this.#shown;
	}

	/** Whether the running step has passed its usual time on this device */
	get late() {
		const active = this.active;
		const usual = active ? this.#usual.of(active.id) : null;
		return Boolean(usual && performance.now() - active.start > usual.p90);
	}

	/** Every step so far, for the technical details: "Loading Conduict (interface) 0.9 s · …" */
	get text() {
		return this.#items.map(item => `${this.#label(item)} (${item.id || 'wait'}) ${this.#words.time((item.end ?? performance.now()) - item.start)}`).join(' · ');
	}

	/** The finished steps' durations, by the step each one names */
	get durations() {
		return this.#items.filter(item => item.end !== null && item.id).map(item => ({ step: item.id, ms: item.end - item.start }));
	}

	/**
	 * Starts a step (`id`, with the product's own words `own` for a step the family does not name),
	 * ending the running one at the same moment; the same step again changes nothing. Returns whether a
	 * new step started.
	 */
	begin(id, own = '', start = performance.now()) {
		const active = this.active;
		if (active && active.id === id && active.own === own) return false;
		if (active) this.#close(active, start);
		const item = { id, own, start, end: null, state: 'active', row: null };
		this.#items.push(item);
		if (this.#shown) {
			this.#draw(item);
			this.#tick();
		}
		return true;
	}

	/** Ends the running step */
	end(at = performance.now()) {
		const active = this.active;
		if (active) this.#close(active, at);
		clearTimeout(this.#timer);
	}

	/** Gives the running step (or the last one) another state: `late`, `failed`, `offline` or `active` */
	mark(state) {
		const item = this.active ?? this.#items.at(-1);
		if (!item) return;
		item.state = state;
		if (item.row) item.row.dataset.state = state;
	}

	/** Shows the steps, all at once, and keeps the running step's time */
	show() {
		if (this.#shown) return;
		this.#shown = true;
		for (const item of this.#items) this.#draw(item);
		this.#list.hidden = false;
		this.#tick();
	}

	/** Says every step again in the document's language now */
	speak() {
		for (const item of this.#items) {
			const label = item.row?.querySelector('.bui-opening-label');
			if (label) label.textContent = this.#label(item);
			this.#time(item);
		}
	}

	#label(item) {
		return this.#words.step(item.id, item.own);
	}

	#close(item, at) {
		item.end = Math.max(item.start, at);
		item.state = 'done';
		if (!item.row) return;
		item.row.dataset.state = 'done';
		this.#time(item);
	}

	#draw(item) {
		const row = document.createElement('li');
		row.className = 'bui-opening-step';
		row.dataset.state = item.state;
		const mark = document.createElement('span');
		mark.className = 'bui-opening-dot';
		const label = document.createElement('span');
		label.className = 'bui-opening-label';
		label.textContent = this.#label(item);
		const time = document.createElement('span');
		time.className = 'bui-opening-time';
		row.append(mark, label, time);
		item.row = row;
		this.#list.append(row);
		this.#time(item);
	}

	/** The time beside a step: how long it took, or has run so far, and past its usual, how long it usually takes */
	#time(item) {
		const cell = item.row?.querySelector('.bui-opening-time');
		if (!cell) return;
		const ran = (item.end ?? performance.now()) - item.start;
		const usual = item.end === null ? this.#usual.of(item.id) : null;
		const late = Boolean(usual && ran > usual.p90);
		item.row.toggleAttribute('data-late', late);
		cell.textContent = late ? `${this.#words.time(ran)} · ${this.#words.text('usual', { time: this.#words.time(usual.median) })}` : this.#words.time(ran);
	}

	#tick() {
		clearTimeout(this.#timer);
		const active = this.active;
		if (!active) return;
		this.#time(active);
		this.#timer = setTimeout(() => this.#tick(), OpeningSteps.rate);
	}
}
