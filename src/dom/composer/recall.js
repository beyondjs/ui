/**
 * ArrowUp in an empty composer brings a message back to edit (0.14.0), as Slack and Claude Code do: the
 * product's `recall()` answers the text (or a promise of it), such as its last queued message, and the
 * text is written into the field with the caret at its end, ready to edit; nothing is sent. An answer of
 * null leaves the field as it is. Only a plain ArrowUp counts, never while an input method composes; a
 * field with any text keeps ArrowUp for moving the caret.
 */
export class ComposerRecall {
	#field;
	#recall;
	#oninsert;

	/**
	 * @param {object} options
	 * @param {HTMLTextAreaElement} options.field the composer's field
	 * @param {() => string|null|Promise<string|null>} options.recall the product's text to edit
	 * @param {(text: string, caret: number) => void} options.oninsert writes the text and the caret into the field
	 */
	constructor({ field, recall, oninsert }) {
		if (typeof recall !== 'function') throw new TypeError("A composer's recall is a function");
		this.#field = field;
		this.#recall = recall;
		this.#oninsert = oninsert;
	}

	/** Handles a key in the field; returns whether it was taken. */
	keys(event) {
		if (event.key !== 'ArrowUp' || event.shiftKey || event.altKey || event.metaKey || event.ctrlKey || event.isComposing || this.#field.value !== '') return false;
		let answer;
		try {
			answer = this.#recall();
		} catch (error) {
			globalThis.reportError?.(error);
			return false;
		}
		if (answer === null || answer === undefined) return false;
		Promise.resolve(answer).then(
			text => {
				// Typing meanwhile wins over a late answer
				if (typeof text === 'string' && text && this.#field.value === '' && this.#field.isConnected) this.#oninsert(text, text.length);
			},
			error => globalThis.reportError?.(error)
		);
		return true;
	}
}
