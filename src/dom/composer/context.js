import { ComposerFiles } from './files.js';
import { ComposerIntake } from './intake.js';
import { ComposerSuggest } from './suggest.js';

/**
 * What a composer's message carries beside its text (0.11.0): attachments (`attach`: paste, drop and
 * Attach, with the chips the product sets) and suggestions after a trigger character (`onsuggest`).
 * Each part exists only when the product asks for it; without them the composer is as it was.
 */
export class ComposerContext {
	#files;
	#intake = null;
	#suggest = null;

	/**
	 * @param {object} options
	 * @param {HTMLElement} options.root the composer
	 * @param {HTMLElement} options.box the field's box
	 * @param {HTMLTextAreaElement} options.field the field
	 * @param {import('../core/labels.js').Labels} options.labels the composer's copy
	 * @param {string|undefined} options.locale the language of sizes and percents
	 * @param {object|null} options.attach `{ label?, accept?, multiple?, onfiles, onremove?, onretry? }`
	 * @param {((query: string, signal: AbortSignal) => Promise<unknown>)|null} options.onsuggest the suggestions' source
	 * @param {object|null} options.suggest `{ trigger?, bound?, delay?, label?, explain? }`
	 * @param {() => void} options.refocus moves focus to the field
	 * @param {(text: string, caret: number) => void} options.oninsert writes a suggestion into the field
	 */
	constructor({ root, box, field, labels, locale, attach, onsuggest, suggest, refocus, oninsert }) {
		this.#files = new ComposerFiles({ labels, locale, refocus, callbacks: { onremove: item => attach?.onremove?.(item), onretry: attach?.onretry ? item => attach.onretry(item) : null } });
		if (attach) this.#intake = new ComposerIntake({ root, box, field, labels, attach });
		if (onsuggest) {
			if (typeof onsuggest !== 'function') throw new TypeError("A composer's suggestions come from onsuggest(query, signal)");
			this.#suggest = new ComposerSuggest({ field, anchor: box, labels, source: onsuggest, settings: suggest, oninsert });
			box.append(this.#suggest.element);
		}
	}

	/** The chips' list, at the box's top. */
	get files() {
		return this.#files;
	}

	/** Attach and its file input, for the toolbar's start; none without `attach`. */
	get controls() {
		return this.#intake?.elements ?? [];
	}

	/** The suggestions, or null. */
	get suggest() {
		return this.#suggest;
	}

	/** The attachments' intake, or null. */
	get intake() {
		return this.#intake;
	}

	/** A key in the field the open suggestions take; returns whether it was taken. */
	keys(event) {
		return this.#suggest?.keys(event) ?? false;
	}

	destroy() {
		this.#suggest?.destroy();
		this.#intake?.destroy();
		this.#files.destroy();
	}
}
