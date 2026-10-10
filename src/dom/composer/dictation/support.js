/**
 * Whether a window can record dictation, and in which type, decided without asking for anything: the
 * microphone is asked for only after a press. Recording needs `navigator.mediaDevices.getUserMedia`
 * (which a browser offers only to a secure page), `MediaRecorder` and one supported type, tried in this
 * order only: WebM with Opus, WebM, MP4. Ogg is never offered, because the transcription provider
 * refuses it. `reason` names what is missing: `insecure`, `unsupported` or `type`.
 */
export class DictationSupport {
	/** The types tried, in order. */
	static types = Object.freeze(['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']);

	#reason = null;
	#type = null;

	/** @param {Window|null} view the window whose devices and recorder are used */
	constructor(view) {
		const devices = view?.navigator?.mediaDevices;
		if (typeof devices?.getUserMedia !== 'function') {
			this.#reason = view?.isSecureContext === false ? 'insecure' : 'unsupported';
			return;
		}
		const Recorder = view.MediaRecorder;
		if (typeof Recorder !== 'function') {
			this.#reason = 'unsupported';
			return;
		}
		this.#type = DictationSupport.types.find(type => DictationSupport.#supports(Recorder, type)) ?? null;
		if (!this.#type) this.#reason = 'type';
	}

	/** Whether recording is possible here. */
	get available() {
		return this.#reason === null;
	}

	/** Why it is not (`insecure`, `unsupported`, `type`), or null. */
	get reason() {
		return this.#reason;
	}

	/** The negotiated type, or null. */
	get type() {
		return this.#type;
	}

	static #supports(Recorder, type) {
		try {
			return typeof Recorder.isTypeSupported === 'function' && Recorder.isTypeSupported(type) === true;
		} catch {
			return false;
		}
	}
}
