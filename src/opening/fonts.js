/**
 * One set of font faces in the document (0.17.1). The opening's stylesheet declares the family's faces so
 * its first paint is in Inter and Rubik; the application then declares the same faces from its own
 * `@beyond-js/ui/fonts.css`. Two declarations of one face are two faces to the browser: only one of them
 * is ever used, the other stays unloaded, and `document.fonts.check('400 16px Inter')` stays false.
 *
 * Once the application is ready, `release()` hands the opening's faces over to the application's: every
 * face the page uses is loaded under the application's declaration first (from the browser's cache when
 * the addresses are the same), then the opening's `@font-face` rules are removed, so the text never
 * falls back to another face in between. When the application declares no faces of its own, or one of
 * them could not load within `bound`, the opening's stay: the page keeps a face for its text.
 */
export class OpeningFonts {
	/** Milliseconds the application's faces have to load before the opening's are kept. */
	static bound = 10000;

	#sheet;
	#fonts;

	/**
	 * @param {CSSStyleSheet|null} sheet the opening's stylesheet
	 * @param {FontFaceSet|null} [fonts] the document's faces
	 */
	constructor(sheet, fonts = globalThis.document?.fonts ?? null) {
		this.#sheet = sheet;
		this.#fonts = fonts;
	}

	/** Resolves whether the opening's faces were removed. */
	async release() {
		const rules = this.#rules();
		if (!rules.length || !this.#fonts) return false;
		const faces = [...this.#fonts];
		const declared = OpeningFonts.#count(rules.map(rule => OpeningFonts.#family(rule.style.getPropertyValue('font-family'))));
		const present = OpeningFonts.#count(faces.map(face => OpeningFonts.#family(face.family)));
		// The application declares at least the same faces again; otherwise the opening's are the only ones
		if ([...declared].some(([family, count]) => (present.get(family) ?? 0) < count * 2)) return false;
		const used = new Set(faces.filter(face => face.status !== 'unloaded' && declared.has(OpeningFonts.#family(face.family))).map(OpeningFonts.#key));
		const loads = faces.filter(face => used.has(OpeningFonts.#key(face))).map(face => face.load());
		if (!(await OpeningFonts.#within(Promise.all(loads)))) return false;
		const all = [...this.#sheet.cssRules];
		for (const rule of rules.reverse()) this.#sheet.deleteRule(all.indexOf(rule));
		return true;
	}

	#rules() {
		try {
			return [...(this.#sheet?.cssRules ?? [])].filter(rule => rule.constructor?.name === 'CSSFontFaceRule' || rule.type === 5);
		} catch {
			return [];
		}
	}

	static #family(name) {
		return String(name ?? '').trim().replace(/^["']|["']$/g, '');
	}

	static #key(face) {
		return [OpeningFonts.#family(face.family), face.weight, face.style, face.unicodeRange].join('|');
	}

	static #count(names) {
		const counts = new Map();
		for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
		return counts;
	}

	static async #within(work) {
		let timer;
		const late = new Promise(resolve => (timer = setTimeout(() => resolve(false), OpeningFonts.bound)));
		try {
			return await Promise.race([work.then(() => true, () => false), late]);
		} finally {
			clearTimeout(timer);
		}
	}
}
