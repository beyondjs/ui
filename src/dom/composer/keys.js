const submits = Object.freeze(['enter', 'mod']);

/**
 * What a key does in a composer's field, and the hint that says it.
 *
 * With `submit: 'enter'` (the default), Enter sends on a hardware keyboard and Shift+Enter adds a
 * line; with `'mod'`, Enter adds a line. ⌘+Enter (Ctrl+Enter elsewhere) sends in both. On a touch
 * screen (no hover and a coarse pointer) Enter always adds a line and the button sends. Enter never
 * sends while an input method composes a character (`isComposing`, or Safari's key code 229 for the
 * Enter that ends a composition). Escape is not a composer key: it closes menus only.
 */
export class ComposerKeys {
	static submits = submits;

	#submit;
	#view;

	/**
	 * @param {object} options
	 * @param {'enter'|'mod'} options.submit how a hardware keyboard sends
	 * @param {Window|null} options.view the window whose pointer and platform decide
	 */
	constructor({ submit, view }) {
		if (!submits.includes(submit)) throw new TypeError(`A composer's submit is one of ${submits.join(', ')}`);
		this.#submit = submit;
		this.#view = view;
	}

	get submit() {
		return this.#submit;
	}

	/** Whether the screen is a touch screen now: no hover and a coarse pointer. */
	get touch() {
		return Boolean(this.#view?.matchMedia?.('(hover: none) and (pointer: coarse)')?.matches);
	}

	/** The modifier key's name on this platform: ⌘ on Apple's, Ctrl elsewhere. */
	get key() {
		const navigator = this.#view?.navigator;
		const platform = navigator?.userAgentData?.platform ?? navigator?.platform ?? '';
		return /mac|iphone|ipad|ipod/i.test(platform) ? '⌘' : 'Ctrl';
	}

	/** Whether a keydown in the field sends the message. */
	sends(event) {
		if (event.key !== 'Enter' || event.isComposing || event.keyCode === 229) return false;
		if (event.metaKey || event.ctrlKey) return true;
		return this.#submit === 'enter' && !event.shiftKey && !event.altKey && !this.touch;
	}

	/** The hint read with the field, in the composer's words; `action` is the primary action's label. */
	hint(labels, action) {
		if (this.touch) return labels.text('touch', { action });
		return this.#submit === 'mod' ? labels.text('mod', { key: this.key }) : labels.text('enter');
	}
}
