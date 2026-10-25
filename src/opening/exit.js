/**
 * The opening's hand-over to the product (0.21.0). The product is shown and usable from the first frame:
 * the presentation stops taking the pointer and its surface fades, while the wordmark and the product's
 * name move into their places in the product's family bar (`.bui-family`), so the identity never jumps.
 * Without a bar in view, the presentation fades alone. It only overlaps, so it may move (D95); under
 * reduced motion, or where the browser cannot animate, it is removed at once. The motion is bounded:
 * whatever happens, it ends within `bound` milliseconds.
 *
 * Since 0.31.0 the bar is marked as landing while the identity moves (`data-bui-landing="flight"`): its own
 * wordmark and name wait hidden under the moving ones, and its separator and the product menu's chevron,
 * which do not move, wait unseen, so nothing of the bar shows through the identity, even a bar drawn again
 * meanwhile. On landing (`landed`) the bar's wordmark and name show where the moving ones arrive and the
 * separator and the chevron fade in; the mark then goes.
 *
 * Since 0.34.0 the focus a product asked for while covered lands as it shows (`OpeningFocus`): where the
 * person's focus is not in the product already, the last target asked for that still takes the focus gets
 * it, and a person in the opening's recovery, which leaves, gets it over the generic destination.
 */
export class OpeningExit {
	static duration = 360;
	static fade = 200;
	static bound = 700;
	static ease = 'cubic-bezier(0.2, 0.7, 0.3, 1)';

	#element;
	#root;
	#focus;
	#bar = null;

	/**
	 * @param {HTMLElement} element The presentation (`#bui-opening`)
	 * @param {Element} root The product's root, where its family bar is
	 * @param {import('./focus.js').OpeningFocus|null} [focus] What the product asked to focus while covered (0.34.0)
	 */
	constructor(element, root, focus = null) {
		this.#element = element;
		this.#root = root;
		this.#focus = focus;
	}

	/** Whether this browser and this person's settings allow the motion */
	get moving() {
		return typeof this.#element.animate === 'function' && !globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
	}

	/** Runs the hand-over and resolves once the presentation can be removed */
	async run() {
		const active = document.activeElement;
		const focused = this.#element.contains(active);
		this.#element.dataset.state = 'leaving';
		// The product shows: the platform's focus is its own again, and what the product asked to focus while
		// covered lands, unless the person's focus is in the product already
		this.#focus?.release();
		const free = focused || !active || active === document.body || active === document.documentElement;
		if (!(free && this.#focus?.land()) && focused) this.#keep();
		if (!this.moving) return;
		const motions = [...this.#flights(), ...this.#fades()];
		try {
			await Promise.race([Promise.allSettled(motions.map(motion => motion.finished)), new Promise(resolve => setTimeout(resolve, OpeningExit.bound))]);
		} finally {
			this.#land();
		}
	}

	/** A person who reached recovery keeps a keyboard destination when the page arrives late and asked for none */
	#keep() {
		const destination = this.#root.querySelector('h1, main, button, a[href]') ?? this.#root;
		if (!destination.hasAttribute('tabindex')) destination.setAttribute('tabindex', '-1');
		destination.focus({ preventScroll: true });
	}

	/** The wordmark and the name, each to its place in the bar when the bar shows it */
	#flights() {
		const pairs = [
			['.bui-opening-wordmark', '.bui-family .bui-lockup-mark'],
			['.bui-opening-name', '.bui-family .bui-lockup-name']
		];
		return pairs.map(([from, to]) => this.#flight(this.#element.querySelector(from), this.#root.querySelector(to))).filter(Boolean);
	}

	#flight(part, place) {
		if (!part) return null;
		const start = part.getBoundingClientRect();
		const end = place?.getBoundingClientRect();
		if (!start.height || !end?.height || end.bottom < 0 || end.top > innerHeight) return this.#fade(part, OpeningExit.fade);
		const shift = `translate(${end.left - start.left}px, ${end.top - start.top}px) scale(${end.height / start.height})`;
		part.style.transformOrigin = '0 0';
		// Only one of each is seen: the bar waits, landing, under the moving one
		this.#bar = place.closest('.bui-family');
		if (this.#bar) this.#bar.dataset.buiLanding = 'flight';
		return part.animate([{ transform: 'none' }, { transform: shift }], { duration: OpeningExit.duration, easing: OpeningExit.ease, fill: 'forwards' });
	}

	/** The identity has landed: the bar's own shows where it arrived and what did not move fades in, then the mark goes */
	#land() {
		const bar = this.#bar;
		if (!bar) return;
		bar.dataset.buiLanding = 'landed';
		setTimeout(() => {
			if (bar.dataset.buiLanding === 'landed') delete bar.dataset.buiLanding;
		}, OpeningExit.fade * 2);
	}

	/**
	 * The trace, the steps, the recovery and the divider leave first; the surface follows once the
	 * identity is most of the way to the bar, so the product shows as its own lockup is reached
	 */
	#fades() {
		const veil = this.#element.querySelector('.bui-opening-veil');
		const rest = this.#element.querySelectorAll('.bui-opening-divider, .bui-opening-trace, .bui-opening-steps, .bui-opening-recovery');
		return [veil ? this.#fade(veil, OpeningExit.fade, OpeningExit.duration - OpeningExit.fade) : null, ...[...rest].map(part => this.#fade(part, OpeningExit.fade / 2))].filter(Boolean);
	}

	#fade(part, duration, delay = 0) {
		return part.animate([{ opacity: 1 }, { opacity: 0 }], { duration, delay, easing: OpeningExit.ease, fill: 'forwards' });
	}
}
