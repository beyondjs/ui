import { DictationFailure } from './failure.js';

/**
 * One transcription at a time through the product's `transcribe(blob, { signal, type, seconds })`. Its
 * answer is the text, trimmed, or a failure: no speech (`none`) for an empty text, and for a refusal
 * what the product's `explain(error)` makes of it (`DictationFailure.answer`). `abort()` aborts the
 * signal of the transcription under way, whose answer, early or late, is then ignored; an answered
 * transcription's signal is never aborted afterwards.
 */
export class DictationTranscription {
	#view;
	#transcribe;
	#explain;
	#controller = null;
	#attempt = 0;

	/**
	 * @param {object} options
	 * @param {Window|null} options.view the window whose `AbortController` is used
	 * @param {(blob: Blob, details: {signal: AbortSignal, type: string, seconds: number}) => Promise<{text: string}>} options.transcribe
	 * @param {((error: unknown) => unknown)|undefined} options.explain
	 */
	constructor({ view, transcribe, explain }) {
		this.#view = view;
		this.#transcribe = transcribe;
		this.#explain = explain;
	}

	/**
	 * Transcribes a recording `{ blob, type, seconds }`. Resolves `{ text }`, `{ failure }`, or null when
	 * it was aborted meanwhile.
	 */
	async run({ blob, type, seconds }) {
		this.abort();
		const attempt = this.#attempt;
		const Controller = this.#view?.AbortController ?? globalThis.AbortController;
		const controller = new Controller();
		this.#controller = controller;
		let answer;
		try {
			answer = await this.#transcribe(blob, { signal: controller.signal, type, seconds });
		} catch (error) {
			if (attempt !== this.#attempt) return null;
			this.#controller = null;
			return { failure: DictationFailure.answer(error, this.#explain) };
		}
		if (attempt !== this.#attempt) return null;
		this.#controller = null;
		const text = String(answer?.text ?? '').trim();
		return text ? { text } : { failure: new DictationFailure('none') };
	}

	/** Aborts the transcription under way, if any; its answer is ignored. */
	abort() {
		this.#attempt += 1;
		this.#controller?.abort();
		this.#controller = null;
	}
}
