/**
 * Why a dictation stopped short, and its ways on. Each kind says what happened in words and offers what
 * resolves it: Try again (record again, or transcribe the kept recording again) and Dismiss when nothing
 * is kept, Discard when a recording is kept.
 *
 * - `denied`, `missing`, `busy`: the microphone could not be used (the browser's `NotAllowedError` or
 *   `SecurityError`, `NotFoundError` or `OverconstrainedError`, `NotReadableError` or `AbortError`).
 * - `interrupted`: the recording stopped by itself (`why`: `ended`, `hidden`, `broken`); what was
 *   recorded is kept and can be transcribed.
 * - `short`: under the minimum duration, never transcribed.
 * - `none`: the transcription found no speech.
 * - `unavailable`: the transcription failed or did not answer within its bound; the recording is kept.
 * - `limit`: the product's own words (`explain` answered a string, or `{ text, retry }`).
 * - `silent`: the product said nothing (`explain` answered null, because another voice answers, such as
 *   the session dialog); the recording is kept, with no words of the dictation's own.
 */
export class DictationFailure {
	static #ways = {
		denied: { retry: 'record', kept: false },
		missing: { retry: 'record', kept: false },
		busy: { retry: 'record', kept: false },
		interrupted: { retry: 'transcribe', kept: true },
		short: { retry: 'record', kept: true },
		none: { retry: 'record', kept: false },
		unavailable: { retry: 'transcribe', kept: true },
		limit: { retry: null, kept: true },
		silent: { retry: 'transcribe', kept: true }
	};

	static #devices = {
		NotAllowedError: 'denied',
		SecurityError: 'denied',
		PermissionDeniedError: 'denied',
		NotFoundError: 'missing',
		OverconstrainedError: 'missing',
		DevicesNotFoundError: 'missing',
		NotReadableError: 'busy',
		AbortError: 'busy',
		TrackStartError: 'busy'
	};

	#kind;
	#text;
	#retry;
	#why;

	/**
	 * @param {'denied'|'missing'|'busy'|'interrupted'|'short'|'none'|'unavailable'|'limit'|'silent'} kind
	 * @param {{text?: string|null, retry?: boolean, why?: string|null}} [details] the product's words and
	 *   whether they allow another try (`limit`), or why a recording stopped (`interrupted`)
	 */
	constructor(kind, { text = null, retry = false, why = null } = {}) {
		if (!Object.hasOwn(DictationFailure.#ways, kind)) throw new TypeError(`Unknown dictation failure "${kind}"`);
		this.#kind = kind;
		this.#text = text;
		this.#why = why;
		const way = DictationFailure.#ways[kind].retry;
		this.#retry = kind === 'limit' ? (retry ? 'transcribe' : null) : way;
	}

	/** The failure of a microphone the browser would not give, by its error's name (`busy` when unknown). */
	static device(error) {
		return new DictationFailure(DictationFailure.#devices[error?.name] ?? 'busy');
	}

	/**
	 * The failure of a refused transcription: the product's `explain(error)` answers its own words (a
	 * string, or `{ text, retry }`), null for silence, or nothing specific for `unavailable`.
	 */
	static answer(error, explain) {
		let given;
		try {
			given = typeof explain === 'function' ? explain(error) : undefined;
		} catch (problem) {
			globalThis.reportError?.(problem);
			given = undefined;
		}
		if (given === null) return new DictationFailure('silent');
		if (typeof given === 'string' && given.trim()) return new DictationFailure('limit', { text: given });
		if (given && typeof given === 'object' && typeof given.text === 'string' && given.text.trim()) return new DictationFailure('limit', { text: given.text, retry: given.retry === true });
		return new DictationFailure('unavailable');
	}

	get kind() {
		return this.#kind;
	}

	/** What Try again does: `record` again, `transcribe` the kept recording again, or null for no Try again. */
	get retry() {
		return this.#retry;
	}

	/** Whether the recording is kept (its way out is Discard rather than Dismiss). */
	get kept() {
		return DictationFailure.#ways[this.#kind].kept;
	}

	/** The failure in words, or null for a silent one. */
	words(labels) {
		if (this.#kind === 'silent') return null;
		if (this.#kind === 'limit') return this.#text;
		if (this.#kind === 'interrupted') return labels.text('interrupted', { why: labels.text(this.#why ?? 'broken') });
		return labels.text(this.#kind);
	}

	/** The ways on as line actions, given what Try again and the way out run. */
	actions(labels, { retry, close }) {
		const again = this.#kind === 'interrupted' ? 'transcribe' : 'retry';
		const out = this.kept ? 'discard' : 'dismiss';
		return [this.#retry ? { id: again, label: labels.text(again), variant: 'secondary', run: retry } : null, { id: out, label: labels.text(out), run: close }].filter(Boolean);
	}
}
