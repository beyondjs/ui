import { el } from '../../core/element.js';

/**
 * The decorative level meter of a recording: a few bars, hidden from assistive technology, that follow
 * the microphone's loudness through an `AnalyserNode`, drawn at most fifteen times a second. Without
 * `AudioContext`, or for a person who asked for reduced motion, the bars stay still: the line's words
 * and time say that it records. `stop()` cancels the frame and closes the audio context.
 */
export class DictationLevel {
	/** The least time between two drawings (ms): about fifteen a second. */
	static frame = 1000 / 15;
	static #bars = 5;

	#view;
	#element;
	#context = null;
	#analyser = null;
	#samples = null;
	#request = null;
	#last = -Infinity;

	/** @param {Window} view the window whose audio context and frames are used */
	constructor(view) {
		this.#view = view;
		// Through the CSSOM, never a style attribute, which a page's content security policy may refuse
		const bars = Array.from({ length: DictationLevel.#bars }, (_, index) => {
			const bar = el('span', { class: 'bui-dictation-bar' });
			bar.style.setProperty('--bui-dictation-weight', DictationLevel.#weight(index));
			return bar;
		});
		this.#element = el('span', { class: 'bui-dictation-level', 'aria-hidden': 'true' }, bars);
	}

	get element() {
		return this.#element;
	}

	/** Whether the meter follows the microphone (false when still). */
	get moving() {
		return this.#request !== null;
	}

	/** Follows a stream's loudness; stays still without an audio context or under reduced motion. */
	start(stream) {
		this.stop();
		const Context = this.#view.AudioContext ?? this.#view.webkitAudioContext;
		const still = this.#view.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
		if (typeof Context !== 'function' || still || !stream || typeof this.#view.requestAnimationFrame !== 'function') return;
		try {
			this.#context = new Context();
			this.#analyser = this.#context.createAnalyser();
			this.#analyser.fftSize = 256;
			this.#context.createMediaStreamSource(stream).connect(this.#analyser);
			this.#samples = new Uint8Array(this.#analyser.fftSize);
		} catch (error) {
			// A meter that cannot listen stays still; the recording is not affected
			globalThis.reportError?.(error);
			this.stop();
			return;
		}
		this.#request = this.#view.requestAnimationFrame(time => this.#draw(time));
	}

	/** Stops following, closes the audio context and lays the bars down. */
	stop() {
		if (this.#request !== null) this.#view.cancelAnimationFrame?.(this.#request);
		this.#request = null;
		this.#last = -Infinity;
		const context = this.#context;
		this.#context = null;
		this.#analyser = null;
		if (context && context.state !== 'closed') context.close?.()?.catch?.(() => {});
		this.#element.style.setProperty('--bui-dictation-level', '0');
	}

	#draw(time) {
		if (!this.#analyser) return;
		if (time - this.#last >= DictationLevel.frame) {
			this.#last = time;
			this.#analyser.getByteTimeDomainData(this.#samples);
			this.#element.style.setProperty('--bui-dictation-level', DictationLevel.#loudness(this.#samples).toFixed(2));
		}
		this.#request = this.#view.requestAnimationFrame(next => this.#draw(next));
	}

	/** The root mean square of a frame of samples, from 0 to 1, raised so speech fills the bars. */
	static #loudness(samples) {
		let sum = 0;
		for (const sample of samples) {
			const centered = (sample - 128) / 128;
			sum += centered * centered;
		}
		return Math.min(1, Math.sqrt(sum / samples.length) * 3);
	}

	/** Each bar's share of the level: the middle bar is the tallest. */
	static #weight(index) {
		const middle = (DictationLevel.#bars - 1) / 2;
		return (1 - Math.abs(index - middle) / (middle + 1)).toFixed(2);
	}
}
