/**
 * What the opening says when it cannot simply wait (0.21.0, said from the person's side in 0.25.0).
 * Three states, each saying only what is true:
 *
 * - `late`: past the bound and still running: "Taking longer than expected", waiting or **Reload**.
 * - `failed`: the product cannot open in this page: "Couldn't open {product}" and **Reload**; every sign
 *   of progress stops (the stylesheet quiets the trace, the steps stop their time).
 * - `offline`: "You're offline"; the product opens by itself once the connection returns, so nothing
 *   is offered that cannot work offline, Reload included.
 *
 * A cause is said only when it is established: a development server out of date (the document came from
 * another version of this package). **Technical details** (D43) hold the step, the steps, the error,
 * the version, the address and the time, to copy; a development server shows them open on a failure.
 * Nothing here retries the product's reads; the product owns those.
 */
export class OpeningRecovery {
	static bound = 5000;

	#element;
	#words;
	#heading;
	#note;
	#reload;
	#details;
	#summary;
	#text;
	#copy;
	#said;
	#facts = {};
	#cause = '';
	#development;

	/**
	 * @param {{ parent: HTMLElement, before?: Node | null, words: import('./words.js').OpeningWords, development?: boolean }} specs
	 * `parent` receives the recovery block (before `before`); `development` opens the details on a failure
	 */
	constructor({ parent, before = null, words, development = false }) {
		this.#words = words;
		this.#development = development;
		const part = (tag, className, host) => host.appendChild(Object.assign(document.createElement(tag), { className }));
		this.#element = document.createElement('div');
		this.#element.className = 'bui-opening-recovery';
		this.#element.dataset.openingRecovery = '';
		this.#element.hidden = true;
		this.#heading = part('p', 'bui-opening-heading', this.#element);
		this.#note = part('p', 'bui-opening-note', this.#element);
		this.#reload = part('button', 'bui-opening-reload', this.#element);
		this.#details = part('details', 'bui-opening-details', this.#element);
		this.#summary = part('summary', '', this.#details);
		this.#text = part('pre', 'bui-opening-text', this.#details);
		this.#copy = part('button', 'bui-opening-copy', this.#details);
		this.#said = part('p', 'bui-opening-said', this.#details);
		// The parts keep the hooks they had in the document's markup before 0.25.0
		for (const [name, node] of Object.entries({ heading: this.#heading, note: this.#note, reload: this.#reload, text: this.#text, copy: this.#copy, said: this.#said })) node.setAttribute(`data-opening-${name}`, '');
		for (const button of [this.#reload, this.#copy]) button.type = 'button';
		this.#said.setAttribute('aria-live', 'polite');
		this.#reload.addEventListener('click', () => location.reload());
		this.#copy.addEventListener('click', () => void this.copy());
		parent.insertBefore(this.#element, before);
		this.speak();
	}

	/** The state shown (`late`, `failed`, `offline`), or null while hidden */
	get state() {
		return this.#element.hidden ? null : (this.#element.dataset.state ?? null);
	}

	/** The details' text: what a person copies for whoever helps them */
	get details() {
		const words = key => this.#words.text(key);
		const lines = [[words('step'), this.#facts.step], [words('steps'), this.#facts.steps], [words('error'), this.#facts.error], [words('version'), this.#facts.version], [words('page'), this.#facts.page], [words('address'), location.href], [words('time'), new Date().toISOString()]];
		return lines.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`).join('\n');
	}

	/** Keeps facts for the details without showing anything (`{ step, steps, error, version, page }`) */
	keep(facts) {
		this.#facts = { ...this.#facts, ...facts };
		if (this.state) this.#text.textContent = this.details;
	}

	/**
	 * An established cause, said in place of the state's own note: `outdated` for a development server
	 * whose document came from another version of the package
	 */
	set cause(key) {
		this.#cause = key;
	}

	/** Shows a state with its facts, each kept until replaced; returns the sentence the page's one status announces */
	show(state, facts = {}) {
		this.keep(facts);
		this.#element.dataset.state = state;
		this.#element.hidden = false;
		const reachable = state !== 'offline';
		this.#reload.hidden = !reachable;
		this.#details.hidden = !reachable;
		if (state === 'failed' && this.#development) this.#details.open = true;
		this.#text.textContent = this.details;
		return this.speak();
	}

	hide() {
		this.#element.hidden = true;
	}

	/** Says every part again in the document's language now; returns the announced sentence */
	speak() {
		const state = this.#element.dataset.state;
		const heading = { late: 'late', failed: 'failed', offline: 'offline' }[state];
		const note = state === 'offline' ? 'reconnect' : this.#cause || (state === 'late' ? 'wait' : '');
		this.#heading.textContent = heading ? this.#words.text(heading) : '';
		this.#note.textContent = note ? this.#words.text(note) : '';
		this.#note.hidden = !note;
		this.#reload.textContent = this.#words.text('reload');
		this.#summary.textContent = this.#words.text('details');
		this.#copy.textContent = this.#words.text('copy');
		if (this.state) this.#text.textContent = this.details;
		return [this.#heading.textContent, this.#note.textContent].filter(Boolean).map(line => line.replace(/[.!?]$/, '')).join('. ') + (heading ? '.' : '');
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
