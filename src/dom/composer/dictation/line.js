import { el, fill } from '../../core/element.js';
import { glyph } from '../../core/icons.js';
import { Ids } from '../../core/ids.js';
import { Button } from '../../button.js';
import { Announcer } from '../../operations/announcer.js';
import { DictationLevel } from './level.js';

/**
 * The line of a composer's dictation, inside its box between the field and the toolbar: a mark (the
 * recording dot, the spinner or the alert), the state in words, the time against the cap, a note (the
 * last seconds), the level meter while recording and the ways on. The row is hidden while idle; the
 * polite announcer beside it stays, so the end of a dictation is still said once the row is gone.
 *
 * The time and the note change without redrawing the actions, so a focused Stop keeps its focus while
 * the seconds pass; when the actions change and focus was on one of them, it moves to the first new one.
 */
export class DictationLine {
	#element;
	#row;
	#mark = el('span', { class: 'bui-dictation-mark', 'aria-hidden': 'true' });
	#text = el('span', { id: Ids.next('bui-dictation-text'), class: 'bui-dictation-text' });
	#time = el('span', { class: 'bui-dictation-time', hidden: true });
	#note = el('span', { class: 'bui-dictation-note', hidden: true });
	#actions = el('div', { class: 'bui-dictation-actions' });
	#announcer = new Announcer();
	#level;
	#buttons = [];

	/** @param {Window} view the window whose audio context and frames the level meter uses */
	constructor(view) {
		this.#level = new DictationLevel(view);
		this.#row = el('div', { class: 'bui-dictation-row', hidden: true }, [this.#mark, this.#text, this.#time, this.#note, this.#level.element, this.#actions]);
		this.#element = el('div', { class: 'bui-dictation', 'data-state': 'idle' }, [this.#row, this.#announcer.element]);
	}

	get element() {
		return this.#element;
	}

	/** The id of the state's words, which describe the Dictate button while it waits. */
	get id() {
		return this.#text.id;
	}

	/** The level meter (`DictationLevel`). */
	get level() {
		return this.#level;
	}

	/** The time against the cap ("0:12 / 2:00"), or null for none. */
	set time(text) {
		this.#time.hidden = !text;
		this.#time.textContent = text ?? '';
	}

	/** A note after the time ("10 seconds left"), or null. */
	set note(text) {
		this.#note.hidden = !text;
		this.#note.textContent = text ?? '';
	}

	/**
	 * Draws a state: its words (none for a silent failure) and its ways on, `[{ label, run, variant?,
	 * glyph? }]`. `idle` hides the row.
	 */
	draw({ state, text = null, actions = [] }) {
		const document = this.#element.ownerDocument;
		const focused = this.#actions.contains(document.activeElement);
		this.#element.dataset.state = state;
		this.#row.hidden = state === 'idle';
		this.#text.hidden = !text;
		this.#text.textContent = text ?? '';
		fill(this.#mark, [DictationLine.#marks[state]?.() ?? null]);
		this.time = null;
		this.note = null;
		for (const button of this.#buttons) button.destroy();
		this.#buttons = actions.map(action => {
			const button = new Button({ label: action.label, variant: action.variant ?? 'quiet', glyph: action.glyph ?? null, small: true, onclick: () => action.run() });
			button.element.dataset.action = action.id ?? '';
			return button;
		});
		fill(this.#actions, this.#buttons.map(button => button.element));
		if (focused) this.focus();
	}

	/** Moves focus to the first way on, if any; returns whether it did. */
	focus() {
		const first = this.#buttons[0]?.element;
		first?.focus();
		return Boolean(first);
	}

	/** Whether focus is on one of the line's ways on. */
	get focused() {
		return this.#actions.contains(this.#element.ownerDocument.activeElement);
	}

	/** Says something politely, once. */
	say(text) {
		this.#announcer.say(text);
	}

	destroy() {
		this.#level.stop();
		for (const button of this.#buttons) button.destroy();
		this.#buttons = [];
		this.#element.remove();
	}

	static #marks = {
		asking: () => glyph('microphone'),
		recording: () => el('span', { class: 'bui-dictation-dot' }),
		transcribing: () => el('span', { class: 'bui-spinner' }),
		failed: () => glyph('alert')
	};
}
