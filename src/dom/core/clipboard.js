/**
 * Copying text for a person, under a bound (decision D40): the Clipboard API may be missing, refuse
 * without a permission or never answer a prompt, so a copy that takes longer than the bound counts
 * as refused. A refused copy selects the text instead, so the keyboard can copy it. Shared by
 * `TechnicalDetails` and `CopyMessage`.
 */
export class Clipboard {
	/**
	 * Writes `text` to the clipboard of `document`'s window. Resolves true when the clipboard took
	 * it, false when it was refused or did not answer within `bound` milliseconds.
	 */
	static async write(document, text, bound) {
		const clipboard = document?.defaultView?.navigator?.clipboard ?? globalThis.navigator?.clipboard;
		if (!clipboard?.writeText) return false;
		let timer = null;
		const late = new Promise((resolve, reject) => (timer = setTimeout(() => reject(new Error('The clipboard did not answer')), bound)));
		try {
			await Promise.race([clipboard.writeText(text), late]);
			return true;
		} catch {
			return false;
		} finally {
			clearTimeout(timer);
		}
	}

	/** Selects every character inside `node`, so the keyboard copies it; a browser that cannot select keeps the text shown. */
	static select(node) {
		const selection = node.ownerDocument.defaultView?.getSelection?.();
		if (!selection) return;
		try {
			selection.removeAllRanges();
			selection.selectAllChildren(node);
		} catch {
			// The text is still shown; the message beside it says the copy was refused.
		}
	}
}
