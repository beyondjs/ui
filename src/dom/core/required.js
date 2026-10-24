/**
 * Whether a required control has nothing in it yet (0.32.0, D183): a step not yet taken, never a failure.
 * Blanks are nothing, and so are an unchecked required box and a radio group with nothing chosen.
 */
export class Required {
	/** @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement|null|undefined} control */
	static empty(control) {
		if (!control?.required) return false;
		if (control.type === 'checkbox' || control.type === 'radio') return Boolean(control.validity?.valueMissing);
		return !String(control.value ?? '').trim();
	}
}
