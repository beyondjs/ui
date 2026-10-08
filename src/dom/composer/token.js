/**
 * The token a suggestion list completes (0.11.0): the trigger character ("@") at the start of the text
 * or after a space, and what follows it up to the caret without a space ("@src/ch" asks for "src/ch").
 * Read from a field's text and caret; `replace` gives the text with the token replaced by a value and a
 * space, and where the caret goes. A pure reading, kept as a small value object.
 */
export class MentionToken {
	#start;
	#query;
	#trigger;

	/** @param {{start: number, query: string, trigger: string}} parts */
	constructor({ start, query, trigger }) {
		this.#start = start;
		this.#query = query;
		this.#trigger = trigger;
	}

	/**
	 * The token at the caret, or null.
	 *
	 * @param {string} text the field's text
	 * @param {number} caret the caret's place (`selectionStart`, with an empty selection)
	 * @param {string} trigger one character
	 */
	static at(text, caret, trigger) {
		const before = text.slice(0, caret);
		const index = before.lastIndexOf(trigger);
		if (index < 0) return null;
		if (index > 0 && !/\s/.test(before[index - 1])) return null;
		const query = before.slice(index + trigger.length);
		if (/\s/.test(query) || query.includes(trigger)) return null;
		return new MentionToken({ start: index, query, trigger });
	}

	/** Where the trigger is. */
	get start() {
		return this.#start;
	}

	/** What follows the trigger up to the caret. */
	get query() {
		return this.#query;
	}

	/** The same token: the same place and the same query. */
	same(other) {
		return Boolean(other) && other.start === this.#start && other.query === this.#query;
	}

	/** The text with this token replaced by `value` and a space, and the caret after them. */
	replace(text, value) {
		const end = this.#start + this.#trigger.length + this.#query.length;
		const rest = text.slice(end);
		const inserted = `${value}${rest.startsWith(' ') ? '' : ' '}`;
		return { text: `${text.slice(0, this.#start)}${inserted}${rest}`, caret: this.#start + inserted.length + (rest.startsWith(' ') ? 1 : 0) };
	}
}
