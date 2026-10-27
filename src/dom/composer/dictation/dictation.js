import { Listeners } from '../../core/component.js';
import { Labels } from '../../core/labels.js';
import { Interaction } from '../../core/interaction.js';
import { Clock } from '../../time/clock.js';
import { DictationSupport } from './support.js';
import { DictationRecorder } from './recorder.js';
import { DictationLine } from './line.js';
import { DictationButton } from './button.js';
import { DictationTimer } from './timer.js';
import { DictationFailure } from './failure.js';
import { DictationInsertion } from './insertion.js';
import { DictationTranscription } from './transcription.js';
import { dictation as copy } from './labels.js';

/**
 * A composer's dictation (0.14.0): voice becomes editable text in the field, never a message sent by
 * itself. **Dictate** (the `microphone` glyph beside its word, D11) is offered only where recording is
 * possible (`DictationSupport`); the microphone is asked for only after the press. The line inside the
 * composer's box says each state with its ways on:
 *
 * - `asking`: the browser's prompt is open; Cancel.
 * - `recording`: the time against the cap, a decorative level meter, Stop (transcribe) and Cancel;
 *   Escape in the composer cancels; ten seconds before the cap it says so, and at the cap it stops and
 *   transcribes by itself.
 * - `transcribing`: the product's `transcribe(blob, { signal, type, seconds })` runs, bounded by
 *   `bound`; Cancel aborts its signal and discards. Its text goes in at the caret through `insert`, and
 *   focus goes back to the field.
 * - `failed`: one of `DictationFailure`'s kinds, in words, with Try again and Dismiss or Discard.
 *
 * One polite announcer says Recording, Transcribing, the text added, the last seconds and each failure,
 * never the ticking time. The recording stays in memory; every track, timer, frame, listener and audio
 * context is released when a dictation ends and on `destroy()`.
 */
export class ComposerDictation {
	/** The copy in English and Spanish. */
	static labels = copy;

	#field;
	#root;
	#view;
	#labels;
	#insert;
	#refocus;
	#support;
	#button;
	#line;
	#timer;
	#state = 'idle';
	#failure = null;
	#recorder = null;
	#recording = null;
	#insertion = null;
	#transcription;
	#attempt = 0;
	#watch = new Listeners();
	#destroyed = false;

	/**
	 * @param {object} config
	 * @param {{transcribe: (blob: Blob, details: {signal: AbortSignal, type: string, seconds: number}) => Promise<{text: string}>, cap?: number, bound?: number, minimum?: number, explain?: (error: unknown) => string|{text: string, retry?: boolean}|null|undefined}} config.options
	 *   the product's transcription, the cap in seconds (120), the transcription's bound in ms (55 000), the
	 *   least seconds worth transcribing (1) and what a refused transcription says
	 * @param {HTMLTextAreaElement} config.field the composer's field, whose caret receives the text
	 * @param {HTMLElement} config.root the composer's element, where Escape cancels a recording
	 * @param {Window} [config.view] the window whose devices are used (the field's)
	 * @param {object} [config.labels] entries replacing the English copy
	 * @param {(text: string, caret: number) => void} config.insert writes the field's whole new text and caret, as typing would
	 * @param {() => void} [config.refocus] moves focus to the field
	 * @param {Clock} [config.clock] the clock of the times and bounds (the page's)
	 */
	constructor({ options, field, root, view = field?.ownerDocument?.defaultView ?? null, labels = {}, insert, refocus = null, clock = Clock.system }) {
		if (typeof options?.transcribe !== 'function') throw new TypeError("A composer's dictation transcribes through options.transcribe");
		if (typeof insert !== 'function') throw new TypeError("A composer's dictation writes its text through insert");
		this.#transcription = new DictationTranscription({ view, transcribe: options.transcribe, explain: options.explain });
		this.#field = field;
		this.#root = root;
		this.#view = view;
		this.#labels = new Labels(copy, labels);
		this.#insert = insert;
		this.#refocus = refocus ?? (() => field.focus());
		this.#support = new DictationSupport(view);
		this.#line = new DictationLine(view);
		this.#timer = new DictationTimer({ clock, labels: this.#labels, line: this.#line, cap: options.cap, bound: options.bound, minimum: options.minimum, onend: mode => this.#limit(mode) });
		this.#button = new DictationButton({ label: this.#labels.text('dictate'), available: this.#support.available, onpress: () => this.start() });
	}

	/** The Dictate button, for the toolbar's end before the primary action; hidden where unavailable. */
	get button() {
		return this.#button.element;
	}

	/** The line, for the composer's box between the field and the toolbar; its row is hidden while idle. */
	get element() {
		return this.#line.element;
	}

	/** `idle`, `asking`, `recording`, `transcribing` or `failed`. */
	get state() {
		return this.#state;
	}

	/** The failure's kind while `failed`, else null. */
	get failure() {
		return this.#failure?.kind ?? null;
	}

	/** Whether dictation is offered here. */
	get available() {
		return this.#support.available;
	}

	/** Why it is not (`insecure`, `unsupported`, `type`), or null. */
	get reason() {
		return this.#support.reason;
	}

	/** Asks for the microphone and records, from idle or a failure (whose recording is discarded). */
	async start() {
		if (!this.available || this.#destroyed || !['idle', 'failed'].includes(this.#state)) return;
		// Focus follows a press of Dictate or Try again to the line's Cancel; typing in the field keeps it there
		const pressed = this.#line.focused || this.#button.used;
		this.#clear();
		this.#insertion = new DictationInsertion(this.#field);
		const attempt = ++this.#attempt;
		const recorder = new DictationRecorder({ view: this.#view, type: this.#support.type, onend: why => this.#interrupt(why) });
		this.#recorder = recorder;
		const document = this.#root.ownerDocument;
		this.#watch.add(this.#root, 'keydown', event => this.#escape(event));
		this.#watch.add(document, 'visibilitychange', () => document.visibilityState === 'hidden' && this.#interrupt('hidden'));
		this.#enter('asking', this.#labels.text('asking'), [this.#way('cancel', () => this.cancel())]);
		if (pressed) this.#line.focus();
		try {
			if (!(await recorder.open()) || attempt !== this.#attempt) return;
			recorder.start();
		} catch (error) {
			if (attempt !== this.#attempt) return;
			return this.#fail(DictationFailure.device(error));
		}
		const stop = { ...this.#way('stop', () => this.stop()), variant: 'secondary', glyph: 'stop' };
		this.#enter('recording', this.#labels.text('recording'), [stop, this.#way('cancel', () => this.cancel())]);
		this.#line.level.start(recorder.stream);
		this.#line.say(this.#labels.text('recording'));
		this.#timer.start('recording');
	}

	/** Stops recording and transcribes; a recording under `minimum` seconds is kept, not transcribed. */
	async stop() {
		if (this.#state !== 'recording' || !this.#recorder) return;
		const short = this.#timer.short(this.#timer.seconds);
		const done = this.#finish();
		if (!short) this.#working();
		const recording = await done;
		if (!recording) return;
		this.#recording = recording;
		return short ? this.#fail(new DictationFailure('short')) : this.#ask();
	}

	/** Discards the dictation in any state: closes the microphone, aborts a transcription, drops the recording. */
	cancel() {
		if (this.#state === 'idle' || this.#destroyed) return;
		const within = this.#within();
		this.#attempt += 1;
		this.#clear();
		this.#enter('idle');
		if (within) this.#refocus();
	}

	/** Does a failure's Try again: records again, or transcribes the kept recording again. */
	retry() {
		if (this.#state !== 'failed') return;
		if (this.#failure?.retry === 'record') return this.start();
		if (this.#failure?.retry !== 'transcribe' || !this.#recording) return;
		if (this.#timer.short(this.#recording.seconds)) return this.#fail(new DictationFailure('short'));
		this.#working();
		return this.#ask();
	}

	/** Drops a failure and its recording (Dismiss, Discard). */
	discard() {
		this.cancel();
	}

	/** Releases the microphone, the audio context, the transcription, every listener and timer. */
	destroy() {
		if (this.#destroyed) return;
		this.#destroyed = true;
		this.#attempt += 1;
		this.#clear();
		this.#line.destroy();
		this.#button.destroy();
	}

	/**
	 * Ends the recording, whichever way: the meter, the time and the recording's listeners stop at once,
	 * and the recording resolves once the recorder gave its data (null when cancelled meanwhile).
	 */
	async #finish() {
		const recorder = this.#recorder;
		const seconds = this.#timer.seconds;
		const attempt = this.#attempt;
		// Forgotten at once, so a second Stop or an interruption meanwhile does nothing; `stop()` releases it
		this.#recorder = null;
		this.#quiet();
		const blob = await recorder.stop();
		if (attempt !== this.#attempt || this.#destroyed) return null;
		return { blob, type: blob.type || recorder.type, seconds };
	}

	/** Hands the recording to the product, bounded; a late or cancelled answer is ignored. */
	async #ask() {
		const answer = await this.#transcription.run(this.#recording);
		if (!answer || this.#destroyed) return;
		if (answer.failure) return this.#fail(answer.failure);
		const placed = this.#insertion.place(this.#field, answer.text);
		const within = this.#within();
		this.#clear();
		this.#enter('idle');
		this.#insert(placed.text, placed.caret);
		if (within) this.#refocus();
		this.#line.say(this.#labels.text('added'));
	}

	/** A recording that stopped by itself: what was recorded is kept and can be transcribed. */
	async #interrupt(why) {
		if (this.#state !== 'recording' || !this.#recorder) return;
		const recording = await this.#finish();
		if (!recording) return;
		this.#recording = recording;
		this.#fail(new DictationFailure('interrupted', { why }));
	}

	/** The cap stops and transcribes; past the bound the transcription is aborted and its recording kept. */
	#limit(mode) {
		if (mode === 'recording') return void this.stop();
		if (this.#state !== 'transcribing') return;
		this.#transcription.abort();
		this.#fail(new DictationFailure('unavailable'));
	}

	#fail(failure) {
		this.#quiet();
		this.#recorder?.release();
		this.#recorder = null;
		if (!failure.kept) this.#recording = null;
		this.#failure = failure;
		const words = failure.words(this.#labels);
		this.#enter('failed', words, failure.actions(this.#labels, { retry: () => this.retry(), close: () => this.discard() }));
		if (words) this.#line.say(words);
	}

	/** Enters `transcribing`: the line with its spinner, elapsed time and Cancel. */
	#working() {
		this.#enter('transcribing', this.#labels.text('transcribing'), [this.#way('cancel', () => this.cancel())]);
		this.#line.say(this.#labels.text('transcribing'));
		this.#timer.start('transcribing');
	}

	#enter(state, text = null, actions = []) {
		if (state !== 'failed') this.#failure = null;
		this.#state = state;
		this.#line.draw({ state, text, actions });
		this.#button.waiting = state === 'idle' ? null : this.#line.id;
	}

	#escape(event) {
		if (event.key !== 'Escape' || event.defaultPrevented || !['asking', 'recording'].includes(this.#state)) return;
		event.preventDefault();
		event.stopPropagation();
		this.cancel();
	}

	/** Leaves recording or transcribing: the time, the meter and the recording's listeners stop. */
	#quiet() {
		this.#timer.stop();
		this.#line.level.stop();
		this.#watch.release();
	}

	/** Releases everything of the current dictation: microphone, transcription, recording, time, listeners. */
	#clear() {
		this.#quiet();
		this.#transcription.abort();
		this.#recorder?.release();
		this.#recorder = null;
		this.#recording = null;
	}

	#way(id, run) {
		return { id, label: this.#labels.text(id), run };
	}

	/** Whether focus is in the composer or nowhere: only then does it go back to the field. */
	#within() {
		const document = this.#root.ownerDocument;
		return Interaction.adrift(document) || this.#root.contains(document.activeElement) || this.#line.element.contains(document.activeElement);
	}
}
