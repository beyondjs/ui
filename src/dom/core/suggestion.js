/**
 * A suggested value (D56, CNT-95): a value derived from context, such as a slug of a project's name or
 * the next unique name, that follows the context until the person edits it.
 *
 * The person's edit stands from the first keystroke that makes the value differ from the suggestion;
 * later suggestions no longer change it. Leaving the field empty gives it back to the suggestion.
 * `Field` with `suggest` and the React `useSuggestion` share this rule.
 */
export class Suggestion {
	#value;
	#edited = false;

	/** @param {string|null} [value] the first suggestion */
	constructor(value = null) {
		this.#value = value ?? null;
	}

	/** The current suggestion, or null. */
	get value() {
		return this.#value;
	}

	/** Whether the person's own value stands. */
	get edited() {
		return this.#edited;
	}

	/** Whether the field shows the suggestion and is marked as suggested. */
	get shown() {
		return !this.#edited && Boolean(this.#value);
	}

	/** A new suggestion. Returns the value the field shows now, or null while the person's edit stands. */
	offer(value) {
		this.#value = value ?? null;
		return this.#edited ? null : (this.#value ?? '');
	}

	/** The person typed: their value stands unless it is the suggestion itself. */
	typed(text) {
		this.#edited = String(text ?? '') !== (this.#value ?? '');
		return this.#edited;
	}

	/** The person left the field. An empty field takes the suggestion back: returns it, else null. */
	left(text) {
		if (String(text ?? '') !== '' || !this.#value) return null;
		this.#edited = false;
		return this.#value;
	}

	/** Follows the suggestion again. Returns the value to show. */
	follow() {
		this.#edited = false;
		return this.#value ?? '';
	}
}
