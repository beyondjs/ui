/**
 * The sign-in in its own window: the product's hand-off start opened from a press, followed until the
 * product's own read says the person is signed in again, then left to close itself on the landing.
 *
 * It opens blank on this origin, drops the opener (Accounts and a provider must not be able to navigate
 * this tab) and only then goes to the address, as `ProviderWindow` does (0.7.4, 0.7.5). While the window
 * is open the product's `read()` is asked every `interval`, one read at a time, and at once when the
 * landing says so on the `beyond-session` channel. `ondone(answer)` ends it; a window closed before the
 * read says signed calls `onclosed()`; a blocked window `onblocked()`.
 */
export class Trip {
	#document;
	#read;
	#interval;
	#window = null;
	#timer = null;
	#reading = false;
	#hooks;

	/**
	 * @param {object} options
	 * @param {Document} options.document
	 * @param {() => Promise<{state: string}>} options.read the product's read of its own session
	 * @param {number} [options.interval] how often the session is read while the window is open (2000)
	 * @param {{ondone: (answer: object) => void, onclosed: () => void, onblocked: () => void}} options.hooks
	 */
	constructor({ document, read, interval = 2000, hooks }) {
		this.#document = document;
		this.#read = read;
		this.#interval = interval;
		this.#hooks = hooks;
	}

	get open() {
		return Boolean(this.#window && !this.#window.closed);
	}

	/** Opens the window; call it from a press, or the browser blocks it. */
	start(address) {
		const view = this.#document.defaultView;
		const width = Math.min(560, view.screen?.availWidth ?? 560);
		const features = `popup,width=${width},height=720`;
		let opened = view.open('', 'beyond-session', features);
		if (!opened) return this.#hooks.onblocked();
		try {
			opened.opener = null;
		} catch {
			// A browser that refuses it keeps the window as opened
		}
		try {
			opened.location.replace(address);
		} catch {
			// A window of that name left on another origin: opened again by name, at the address
			opened = view.open(address, 'beyond-session', features) ?? opened;
		}
		this.#window = opened;
		this.#follow();
	}

	/** Brings the window forward, or opens it again when it is gone. */
	show(address) {
		if (this.open) return this.#window.focus?.();
		this.start(address);
	}

	/** The landing said something: read now. */
	wake() {
		if (this.#window) void this.#check();
	}

	/** Stops following; a window still on this origin is closed, one elsewhere closes itself. */
	stop() {
		clearTimeout(this.#timer);
		this.#timer = null;
		const opened = this.#window;
		this.#window = null;
		if (!opened) return;
		try {
			void opened.location.href;
			opened.close?.();
		} catch {
			// On another origin only the window itself may close (Chrome refuses, WebKit reports it)
		}
	}

	#follow() {
		clearTimeout(this.#timer);
		this.#timer = setTimeout(() => this.#check(), this.#interval);
	}

	async #check() {
		if (this.#reading || !this.#window) return;
		this.#reading = true;
		const closed = this.#window.closed;
		let answer = null;
		try {
			answer = await this.#read();
		} catch {
			answer = null;
		} finally {
			this.#reading = false;
		}
		if (!this.#window) return;
		if (answer?.state === 'signed') {
			this.stop();
			return this.#hooks.ondone(answer);
		}
		if (closed || this.#window.closed) {
			this.#window = null;
			clearTimeout(this.#timer);
			return this.#hooks.onclosed();
		}
		this.#follow();
	}
}
