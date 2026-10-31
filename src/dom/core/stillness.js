/**
 * Whether the person asked for less motion (D95): the system's `prefers-reduced-motion: reduce`, or a product's own
 * choice written on the document root as `data-motion="reduced"` (Beyond Home's motion on this device). A stylesheet
 * reaches the second with `:root[data-motion='reduced']`; motion the package scripts (Web Animations, a smooth
 * scroll, a level drawn on each frame) reads it here, so a product's chosen Reduced holds where its stylesheet cannot
 * reach. A product's `data-motion="full"` does not override the system's setting: only less motion is honored.
 */
export class Stillness {
	static query = '(prefers-reduced-motion: reduce)';
	static attribute = 'motion';

	/**
	 * @param {Window|null|undefined} [view] the window whose setting and document are read (the global one by default)
	 * @returns {boolean}
	 */
	static asked(view = globalThis) {
		if (!view) return false;
		if (view.matchMedia?.(Stillness.query)?.matches === true) return true;
		return view.document?.documentElement?.dataset?.[Stillness.attribute] === 'reduced';
	}
}
