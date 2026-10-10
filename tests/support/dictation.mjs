import { Media } from './media.mjs';

/**
 * Composer-like harnesses for `ComposerDictation` on a happy-dom page: a root holding the field, the
 * dictation's line and Dictate, faked media (`Media`), a clock the test moves (`advance(ms)`) and a
 * transcription the test answers (`calls`, `answers`); `insert` writes the field as the composer does.
 * `release()` destroys every dictation made and takes the media away. The static members read the line
 * (`actions`, `words`, `said`), press one of its ways on and record for a while.
 */
export class Dictations {
	#page;
	#Dictation;
	#Clock;
	#made = [];

	/** @param {import('./page.mjs').Page} page @param {{ComposerDictation: Function, Clock: Function}} modules */
	constructor(page, { ComposerDictation, Clock }) {
		this.#page = page;
		this.#Dictation = ComposerDictation;
		this.#Clock = Clock;
	}

	/** A harness: `{ dictation, media, clock, root, field, inserted, calls, answers, advance }`. */
	make({ options = {}, media = {}, value = '', at = null, labels = {} } = {}) {
		const fake = new Media(this.#page.window, media).install();
		const time = { now: 0 };
		const clock = new this.#Clock({ now: () => time.now });
		const document = this.#page.document;
		const root = document.createElement('div');
		const field = document.createElement('textarea');
		field.value = value;
		const [start, end] = [].concat(at ?? value.length);
		field.setSelectionRange(start, end ?? start);
		const inserted = [];
		const calls = [];
		const answers = [];
		const transcribe = (blob, details) => {
			calls.push({ blob, ...details });
			return new Promise((resolve, reject) => answers.push({ resolve, reject }));
		};
		const insert = (text, caret) => {
			field.value = text;
			field.setSelectionRange(caret, caret);
			inserted.push({ text, caret });
		};
		const dictation = new this.#Dictation({ options: { transcribe, ...options }, field, root, insert, refocus: () => field.focus(), clock, labels });
		root.append(field, dictation.element, dictation.button);
		document.body.append(root);
		this.#made.push({ dictation, media: fake });
		const advance = ms => {
			time.now += ms;
			clock.tick();
		};
		return { dictation, media: fake, clock, root, field, inserted, calls, answers, advance };
	}

	release() {
		for (const { dictation, media } of this.#made.splice(0)) {
			dictation.destroy();
			media.uninstall();
		}
		delete this.#page.document.visibilityState;
	}

	/** Lets promises and zero timers run. */
	static async settle(rounds = 5) {
		for (let round = 0; round < rounds; round += 1) await new Promise(resolve => setTimeout(resolve, 0));
	}

	/** The words of the line's ways on. */
	static actions(dictation) {
		return [...dictation.element.querySelectorAll('.bui-dictation-actions button')].map(button => button.textContent);
	}

	/** Presses the line's way on of that word. */
	static press(dictation, label) {
		[...dictation.element.querySelectorAll('.bui-dictation-actions button')].find(button => button.textContent === label).click();
	}

	/** The line's words. */
	static words(dictation) {
		return dictation.element.querySelector('.bui-dictation-text').textContent;
	}

	/** What the line's announcer said last. */
	static said(dictation) {
		return dictation.element.querySelector('.bui-announcer').textContent;
	}

	/** Records for `ms` milliseconds, then stops; resolves once the transcription was asked for (not answered). */
	static async record(harness, ms = 3000) {
		await harness.dictation.start();
		harness.advance(ms);
		harness.dictation.stop();
		await Dictations.settle();
	}
}
