/**
 * The step a message needs before it can be sent (0.16.0, the audit's DQ-03): a machine to choose, an AI
 * engine to connect. Instead of a disabled Send and a sentence wedged into the toolbar, the composer's
 * primary action names the step ("Choose a machine and send") and performs it: `run({ text })` is the
 * product's (it opens its chooser, creates what is missing); when it resolves anything but `false`, the
 * message is sent as usual, and `false` keeps the text in the field. A step runs once at a time; a step
 * that throws is reported and keeps the text. An empty field runs the step without sending.
 */
export class ComposerStep {
	#step = null;
	#running = false;

	/** The step, `{ label, run }`, or null. */
	get value() {
		return this.#step;
	}

	set value(step) {
		this.use(step);
	}

	/** Takes a step (or null) and answers it as kept: `{ label, run }` or null. */
	use(step) {
		this.#step = step && step.label && typeof step.run === 'function' ? { label: String(step.label), run: step.run } : null;
		return this.#step;
	}

	get active() {
		return Boolean(this.#step);
	}

	/** Whether the step is running now. */
	get running() {
		return this.#running;
	}

	/**
	 * Runs the step with the text, then `send()` unless it answered false; `draw()` redraws the composer
	 * before and after. Resolves whether the message was sent.
	 */
	async pass({ text, send, draw }) {
		if (this.#running || !this.#step) return false;
		this.#running = true;
		draw();
		let ready;
		try {
			ready = await this.#step.run({ text });
		} catch (error) {
			globalThis.reportError?.(error);
			ready = false;
		} finally {
			this.#running = false;
			draw();
		}
		return ready === false || !text.trim() ? false : send();
	}
}
