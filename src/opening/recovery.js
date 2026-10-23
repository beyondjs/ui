/**
 * What the opening says when it cannot simply wait (0.21.0): `late` (past the bound, it keeps trying),
 * `error` (something failed while it opened), `failed` (the product's code could not load) and
 * `offline` (it continues by itself on reconnecting).
 * Each says what happened in a heading, the way on in one sentence, **Reload** (the browser's current
 * address, the person's choice) and closed **Technical details** to copy: the step, the error, the
 * address and the time (D43). Nothing here retries the product's reads; the product owns those.
 */
export class OpeningRecovery {
	static bound = 5000;

	#element;
	#words;
	#heading;
	#note;
	#text;
	#copy;
	#said;
	#facts = {};

	/**
	 * @param {{ element: HTMLElement, words: import('./words.js').OpeningWords }} specs `element` is the
	 * presentation's recovery block, with its `data-opening-*` parts
	 */
	constructor({ element, words }) {
		this.#element = element;
		this.#words = words;
		this.#heading = element.querySelector('[data-opening-heading]');
		this.#note = element.querySelector('[data-opening-note]');
		this.#text = element.querySelector('[data-opening-text]');
		this.#copy = element.querySelector('[data-opening-copy]');
		this.#said = element.querySelector('[data-opening-said]');
		element.querySelector('[data-opening-reload]')?.addEventListener('click', () => location.reload());
		this.#copy?.addEventListener('click', () => void this.copy());
	}

	/** The state shown (`late`, `error`, `failed`, `offline`), or null while hidden */
	get state() {
		return this.#element.hidden ? null : (this.#element.dataset.state ?? null);
	}

	/** The details' text: what a person copies for whoever helps them */
	get details() {
		const words = key => this.#words.text(key);
		const lines = [[words('step'), this.#facts.step], [words('steps'), this.#facts.steps], [words('error'), this.#facts.error], [words('address'), location.href], [words('time'), new Date().toISOString()]];
		return lines.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`).join('\n');
	}

	/**
	 * Shows a state with its facts (`{ step, steps, error }`), each kept until replaced; returns the
	 * sentence the page's one status announces
	 */
	show(state, facts = {}) {
		this.#facts = { ...this.#facts, ...facts };
		this.#element.dataset.state = state;
		const heading = { late: 'late', error: 'late', failed: 'failed', offline: 'offline' }[state] ?? 'late';
		const note = { late: 'keeps', error: 'stopped', failed: 'again', offline: 'reconnect' }[state] ?? 'keeps';
		this.#heading.textContent = this.#words.text(heading);
		this.#note.textContent = this.#words.text(note);
		this.#text.textContent = this.details;
		this.#element.hidden = false;
		return `${this.#heading.textContent}. ${this.#note.textContent}`;
	}

	hide() {
		this.#element.hidden = true;
	}

	/** Copies the details, or selects them when the browser refuses, and says which in place */
	async copy() {
		const text = this.details;
		this.#text.textContent = text;
		try {
			await Promise.race([navigator.clipboard.writeText(text), new Promise((resolve, reject) => setTimeout(() => reject(new Error('bound')), OpeningRecovery.bound))]);
			this.#said.textContent = this.#words.text('copied');
		} catch {
			const range = document.createRange();
			range.selectNodeContents(this.#text);
			getSelection()?.removeAllRanges();
			getSelection()?.addRange(range);
			this.#said.textContent = this.#words.text('refused');
		}
	}
}
