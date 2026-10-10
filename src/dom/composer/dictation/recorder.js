import { Listeners } from '../../core/component.js';

/**
 * One recording of the microphone: asks the browser for it (`open()`, only after a press), records
 * with a new `MediaRecorder` in the negotiated type (`start()`), and gives the recording back as one
 * in-memory `Blob` (`stop()`). Every track is stopped once the recording ends, whichever way it ends,
 * and `release()` stops them at any moment, including while the browser's prompt is still open: a
 * microphone granted after its recording was cancelled is stopped at once and never recorded.
 *
 * A recording that stops by itself (the microphone disconnected, the recorder failed) calls
 * `onend(why)` with `ended` or `broken`, once. Nothing leaves the page: there is no playback element
 * and no request of its own.
 */
export class DictationRecorder {
	/** How long `stop()` waits for the recorder's last data before giving what it has (ms). */
	static bound = 2000;

	#view;
	#type;
	#onend;
	#stream = null;
	#recorder = null;
	#chunks = [];
	#done = null;
	#listeners = new Listeners();
	#released = false;
	#ended = false;

	/**
	 * @param {object} options
	 * @param {Window} options.view the window whose devices and recorder are used
	 * @param {string} options.type the negotiated type (`DictationSupport`)
	 * @param {(why: 'ended'|'broken') => void} [options.onend] the recording stopped by itself
	 */
	constructor({ view, type, onend = null }) {
		this.#view = view;
		this.#type = type;
		this.#onend = onend;
	}

	/** The microphone's stream while it is open, or null. */
	get stream() {
		return this.#stream;
	}

	/** The recording's type: the recorder's own, else the negotiated one. */
	get type() {
		return this.#recorder?.mimeType || this.#type;
	}

	/** Whether this recording was released (cancelled, finished or destroyed). */
	get released() {
		return this.#released;
	}

	/**
	 * Asks the browser for the microphone. Resolves true when it is open, false when the recording was
	 * released meanwhile (its tracks are then stopped); rejects with the browser's error.
	 */
	async open() {
		const stream = await this.#view.navigator.mediaDevices.getUserMedia({ audio: true });
		if (this.#released) {
			DictationRecorder.#halt(stream);
			return false;
		}
		this.#stream = stream;
		for (const track of stream.getTracks?.() ?? []) this.#listeners.add(track, 'ended', () => this.#end('ended'));
		return true;
	}

	/** Starts a new recorder on the open stream; throws when the browser refuses it. */
	start() {
		const Recorder = this.#view.MediaRecorder;
		const recorder = new Recorder(this.#stream, { mimeType: this.#type });
		this.#recorder = recorder;
		this.#done = new Promise(resolve => this.#listeners.add(recorder, 'stop', () => resolve(), { once: true }));
		this.#listeners.add(recorder, 'dataavailable', event => {
			if (event.data?.size) this.#chunks.push(event.data);
		});
		this.#listeners.add(recorder, 'error', () => this.#end('broken'));
		// Data every second, so a recording that ends by itself keeps what came before
		recorder.start(1000);
	}

	/** Stops recording and resolves the recording as one `Blob`; every track is stopped. */
	async stop() {
		const recorder = this.#recorder;
		if (recorder && recorder.state !== 'inactive') {
			try {
				recorder.stop();
			} catch (error) {
				globalThis.reportError?.(error);
			}
		}
		if (this.#done) await this.#wait(this.#done);
		const Blob = this.#view.Blob ?? globalThis.Blob;
		const blob = new Blob(this.#chunks, { type: this.type });
		this.release();
		return blob;
	}

	/** Stops the recorder and every track and forgets the data; harmless twice. */
	release() {
		if (this.#released) return;
		this.#released = true;
		this.#listeners.release();
		if (this.#recorder?.state && this.#recorder.state !== 'inactive') {
			try {
				this.#recorder.stop();
			} catch {
				// A recorder that cannot stop is already gone with its tracks
			}
		}
		if (this.#stream) DictationRecorder.#halt(this.#stream);
		this.#chunks = [];
	}

	/** Waits for the recorder's end, at most `bound`: a recorder that never says so still ends the wait. */
	#wait(done) {
		return new Promise(resolve => {
			const timer = this.#view.setTimeout(resolve, DictationRecorder.bound);
			done.then(() => {
				this.#view.clearTimeout(timer);
				resolve();
			});
		});
	}

	#end(why) {
		if (this.#ended || this.#released) return;
		this.#ended = true;
		this.#onend?.(why);
	}

	static #halt(stream) {
		for (const track of stream.getTracks?.() ?? []) track.stop();
	}
}
