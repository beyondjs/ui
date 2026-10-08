/**
 * Where a character of a textarea is drawn (0.11.2), so a composer's suggestions open at the "@" being
 * typed rather than at the field's start. A textarea does not say where its characters are, so a hidden
 * copy with the field's text metrics, width and wrapping holds the text up to that character and a marker;
 * the marker's place is the character's. The copy lives only while it is measured.
 */
export class CaretPoint {
	static #copied = ['boxSizing', 'width', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontStretch', 'fontVariant', 'letterSpacing', 'wordSpacing', 'lineHeight', 'textTransform', 'textIndent', 'tabSize', 'direction'];

	#field;

	/** @param {HTMLTextAreaElement} field */
	constructor(field) {
		this.#field = field;
	}

	/**
	 * The point of the character at `index`, in CSS pixels from the field's top-left border edge, less
	 * what the field has scrolled: `{ left, top }`, or null when the field is not drawn.
	 */
	at(index) {
		const field = this.#field;
		const view = field.ownerDocument.defaultView;
		if (!view || !field.isConnected || !field.getClientRects().length) return null;
		const style = view.getComputedStyle(field);
		const copy = field.ownerDocument.createElement('div');
		for (const name of CaretPoint.#copied) copy.style[name] = style[name];
		Object.assign(copy.style, { position: 'absolute', visibility: 'hidden', top: '0', left: '-9999px', whiteSpace: 'pre-wrap', overflowWrap: 'break-word', overflow: 'hidden', height: 'auto' });
		copy.textContent = field.value.slice(0, index);
		const marker = field.ownerDocument.createElement('span');
		marker.textContent = field.value.slice(index, index + 1) || '.';
		copy.append(marker);
		field.ownerDocument.body.append(copy);
		try {
			return { left: marker.offsetLeft - field.scrollLeft, top: marker.offsetTop - field.scrollTop };
		} finally {
			copy.remove();
		}
	}
}
