/**
 * Where a transcript goes in the field: the caret or selection read when dictation starts, kept while
 * the text stays as it was. If the person edited the text meanwhile, the caret where they left it is
 * used instead. The transcript replaces a selection, with one space before it when the character before
 * is not a space (or the start) and one after it when the character after is not a space (or the end);
 * the caret lands right after the transcript, as typing would leave it.
 */
export class DictationInsertion {
	#value;
	#start;
	#end;

	/** Remembers the field's text and caret as they are now. */
	constructor(field) {
		this.#value = field.value;
		[this.#start, this.#end] = DictationInsertion.#selection(field);
	}

	/** The field's new text and caret with `transcript` in place: `{ text, caret }`. */
	place(field, transcript) {
		const value = field.value;
		const [start, end] = value === this.#value ? [this.#start, this.#end] : DictationInsertion.#selection(field);
		const before = value.slice(0, start);
		const after = value.slice(end);
		const lead = before && !/\s$/.test(before) ? ' ' : '';
		const trail = after && !/^\s/.test(after) ? ' ' : '';
		return { text: `${before}${lead}${transcript}${trail}${after}`, caret: before.length + lead.length + transcript.length };
	}

	/** The field's selection, clamped to its text, in order. */
	static #selection(field) {
		const length = field.value.length;
		const clamp = position => (Number.isInteger(position) ? Math.min(Math.max(position, 0), length) : length);
		const start = clamp(field.selectionStart);
		const end = clamp(field.selectionEnd ?? field.selectionStart);
		return start <= end ? [start, end] : [end, start];
	}
}
