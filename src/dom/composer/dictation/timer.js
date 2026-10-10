/**
 * The times of a dictation on the page's `Clock`: while recording, the elapsed time against the cap
 * ("0:12 / 2:00"), the last ten seconds said once and the cap reached; while transcribing, the elapsed
 * time and the bound passed; and the least duration worth transcribing. Each limit is noticed on the clock's beat, so it is crossed by time alone,
 * without waiting for an event. It writes into the dictation's line and calls `onend(mode)` once a limit
 * is reached: `recording` at the cap, `transcribing` past the bound.
 */
export class DictationTimer {
	/** The seconds before the cap that are said. */
	static warning = 10;

	#clock;
	#labels;
	#line;
	#cap;
	#bound;
	#minimum;
	#onend;
	#mode = null;
	#started = 0;
	#beat = null;
	#warned = false;

	/**
	 * @param {object} options
	 * @param {import('../../time/clock.js').Clock} options.clock the page's clock
	 * @param {import('../../core/labels.js').Labels} options.labels the dictation's copy (`time`, `left`)
	 * @param {import('./line.js').DictationLine} options.line where the time and the note are drawn and said
	 * @param {number} [options.cap] the longest recording in seconds (120)
	 * @param {number} [options.bound] the longest transcription in milliseconds (55 000)
	 * @param {number} [options.minimum] the least seconds worth transcribing (1; 0 transcribes any)
	 * @param {(mode: 'recording'|'transcribing') => void} options.onend a limit was reached
	 */
	constructor({ clock, labels, line, cap, bound, minimum, onend }) {
		this.#clock = clock;
		this.#labels = labels;
		this.#line = line;
		this.#cap = DictationTimer.#positive(cap, 120) * 1000;
		this.#bound = DictationTimer.#positive(bound, 55_000);
		const least = Number(minimum ?? 1);
		this.#minimum = Number.isFinite(least) && least > 0 ? least : 0;
		this.#onend = onend;
	}

	/** The time since the current mode started, in seconds rounded to a tenth. */
	get seconds() {
		return Math.round(this.#elapsed() / 100) / 10;
	}

	/** Whether a recording of that many seconds is too short to transcribe. */
	short(seconds) {
		return seconds < this.#minimum;
	}

	/** Starts timing a recording or a transcription (`recording`, `transcribing`). */
	start(mode) {
		this.stop();
		this.#mode = mode;
		this.#started = this.#clock.now;
		this.#warned = false;
		this.#beat = this.#clock.subscribe(() => this.#tick());
		this.#tick();
	}

	/** Stops timing; the clock keeps no listener of it. */
	stop() {
		this.#beat?.();
		this.#beat = null;
		this.#mode = null;
	}

	#tick() {
		const elapsed = this.#elapsed();
		if (this.#mode === 'recording') {
			this.#line.time = this.#labels.text('time', { elapsed: DictationTimer.#minutes(elapsed), cap: DictationTimer.#minutes(this.#cap) });
			const warning = DictationTimer.warning * 1000;
			if (!this.#warned && this.#cap > warning && this.#cap - elapsed <= warning && elapsed < this.#cap) {
				this.#warned = true;
				const left = this.#labels.text('left', { seconds: DictationTimer.warning });
				this.#line.note = left;
				this.#line.say(left);
			}
			if (elapsed >= this.#cap) this.#end();
		} else if (this.#mode === 'transcribing') {
			this.#line.time = DictationTimer.#minutes(elapsed);
			if (elapsed >= this.#bound) this.#end();
		}
	}

	#end() {
		const mode = this.#mode;
		this.stop();
		this.#onend(mode);
	}

	#elapsed() {
		return Math.max(0, this.#clock.now - this.#started);
	}

	/** Minutes and seconds, "2:05". */
	static #minutes(ms) {
		const total = Math.floor(ms / 1000);
		return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
	}

	static #positive(value, fallback) {
		const number = Number(value);
		return Number.isFinite(number) && number > 0 ? number : fallback;
	}
}
