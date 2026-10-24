/**
 * Which turn of a thread the person is reading (0.29.0, D181 and D182): the turn under the reading line,
 * which is the page's sticky edge (the document's `scroll-padding-top`: the family bar and the header's
 * compact line), or the last turn once the page is scrolled to its end, else the first; and whether that
 * turn's opening message (`head`) has gone under the line, so a page can keep it in view in the compact
 * line. Measured on scroll and resize at most once per animation frame, and at once by `measure()`; it
 * reports `{ key, covered }` only when either changed.
 */
export class TurnWatch {
	#view;
	#turns;
	#change;
	#frame = 0;
	#said = '';
	#done = false;
	#measure = () => this.#schedule();

	/**
	 * @param {Window} view the window whose scroll counts
	 * @param {{turns: () => Array<{key: string, element?: Element|null, head?: Element|null}>, change: (seen: {key: string|null, covered: boolean}) => void}} options
	 */
	constructor(view, { turns, change }) {
		this.#view = view;
		this.#turns = turns;
		this.#change = change;
		view?.addEventListener('scroll', this.#measure, { capture: true, passive: true });
		view?.addEventListener('resize', this.#measure, { passive: true });
	}

	/** Decides now which turn is read, after the turns or the page changed. */
	measure() {
		if (this.#done || !this.#view) return;
		const seen = this.#read();
		const said = `${seen.key}|${seen.covered}`;
		if (said === this.#said) return;
		this.#said = said;
		this.#change(seen);
	}

	destroy() {
		this.#done = true;
		this.#view?.removeEventListener('scroll', this.#measure, { capture: true });
		this.#view?.removeEventListener('resize', this.#measure);
		if (this.#frame) this.#view?.cancelAnimationFrame?.(this.#frame);
		this.#frame = 0;
	}

	#read() {
		const turns = this.#turns().filter(turn => turn.element?.isConnected);
		if (!turns.length) return { key: null, covered: false };
		const root = this.#view.document.documentElement;
		const line = (parseFloat(this.#view.getComputedStyle(root).scrollPaddingTop) || 0) + 1;
		const end = this.#view.innerHeight + this.#view.scrollY >= root.scrollHeight - 2;
		let read = turns[0];
		if (end) read = turns.at(-1);
		else {
			// Turns are in order: the last one whose top passed the line is the one read
			for (const turn of turns) {
				if (turn.element.getBoundingClientRect().top > line) break;
				read = turn;
			}
		}
		const head = read.head?.isConnected ? read.head : null;
		return { key: read.key, covered: Boolean(head) && head.getBoundingClientRect().top < line - 1 };
	}

	#schedule() {
		if (this.#frame || this.#done || !this.#view) return;
		const later = this.#view.requestAnimationFrame?.bind(this.#view) ?? (callback => this.#view.setTimeout(callback, 0));
		this.#frame = later(() => {
			this.#frame = 0;
			this.measure();
		});
	}
}
