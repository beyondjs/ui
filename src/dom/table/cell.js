/**
 * Whether a table cell's content shows nothing (0.35.0): one rule for the DOM table's values and for what
 * React's cells rendered, so a narrow line leaves out a label and a separator alike in both. Nothing, text
 * of spaces only, or nodes that each hold no text but spaces and no element and are not an element that
 * draws without children (an image, a field, a meter, an embedded frame).
 */
export class CellContent {
	static #drawn = new Set(['img', 'svg', 'picture', 'video', 'audio', 'canvas', 'iframe', 'object', 'embed', 'input', 'select', 'textarea', 'meter', 'progress', 'hr', 'br']);

	/** Whether a value the DOM table draws shows nothing: none, text of spaces only, or a blank node */
	static empty(value) {
		if (value === null || value === undefined) return true;
		if (typeof value === 'string') return !value.trim();
		if (typeof value !== 'object' || typeof value.nodeType !== 'number') return false;
		// A fragment is what it holds
		return value.nodeType === 11 ? CellContent.held(value) : CellContent.#blank(value);
	}

	/** Whether what a holder holds shows nothing: every node in it blank (a React cell's holder) */
	static held(holder) {
		return [...holder.childNodes].every(node => CellContent.#blank(node));
	}

	static #blank(node) {
		if (node.nodeType === 3) return !node.data.trim();
		if (node.nodeType !== 1) return true;
		if (CellContent.#drawn.has(node.localName)) return false;
		return !node.textContent.trim() && !node.childElementCount;
	}
}
