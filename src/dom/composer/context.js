import { ComposerFiles } from './files.js';
import { ComposerIntake } from './intake.js';
import { ComposerAdd } from './add.js';
import { ComposerSuggest } from './suggest.js';
import { ComposerRecall } from './recall.js';
import { ComposerDictation } from './dictation/dictation.js';

/**
 * What a composer's message carries beside its text (0.11.0): attachments (`attach`: paste, drop and
 * Attach, with the chips the product sets) and suggestions after a trigger character (`onsuggest`);
 * since 0.14.0 the product's commands after a "/" at the field's start (`commands`), its last queued
 * message on ArrowUp in an empty field (`recall`) and dictation (`dictation`); since 0.26.0 the **+**
 * that attaches or opens the product's entries (`ComposerAdd`, D165). Each part exists only when the
 * product asks for it; without them the composer is as it was.
 */
export class ComposerContext {
	#files;
	#intake = null;
	#add;
	#suggest = null;
	#commands = null;
	#recall = null;
	#dictation = null;

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
	 * @param {Array<object>|((query: string, signal: AbortSignal) => unknown)|null} [options.commands] the product's commands (0.14.0)
	 * @param {(() => string|null|Promise<string|null>)|null} [options.recall] the text ArrowUp brings back into an empty field (0.14.0)
	 * @param {object|null} [options.dictation] `{ transcribe, cap?, bound?, minimum?, explain? }` (0.14.0)
	 * @param {() => void} options.refocus moves focus to the field
	 * @param {(text: string, caret: number) => void} options.oninsert writes a suggestion into the field
	 */
	constructor({ root, box, field, labels, locale, attach, onsuggest, suggest, commands = null, recall = null, dictation = null, refocus, oninsert }) {
		this.#files = new ComposerFiles({ labels, locale, refocus, callbacks: { onremove: item => attach?.onremove?.(item), onretry: attach?.onretry ? item => attach.onretry(item) : null } });
		if (attach) this.#intake = new ComposerIntake({ root, box, field, labels, attach });
		this.#add = new ComposerAdd({ labels, pick: this.#intake ? () => this.#intake.pick() : null, attach: attach?.label ?? null });
		if (onsuggest) {
			if (typeof onsuggest !== 'function') throw new TypeError("A composer's suggestions come from onsuggest(query, signal)");
			this.#suggest = new ComposerSuggest({ field, anchor: box, labels, source: onsuggest, settings: suggest, oninsert, locale });
			box.append(this.#suggest.element);
		}
		if (commands) {
			this.#commands = new ComposerSuggest({ field, anchor: box, labels, source: ComposerContext.#list(commands), settings: { trigger: '/', start: true, delay: 0, label: labels.text('commands') }, oninsert, locale });
			box.append(this.#commands.element);
		}
		if (recall) this.#recall = new ComposerRecall({ field, recall, oninsert });
		if (dictation) this.#dictation = new ComposerDictation({ options: dictation, field, root, insert: oninsert, refocus, labels: dictation.labels ?? {} });
	}

	/** The chips' list, at the box's top. */
	get files() {
		return this.#files;
	}

	/** The **+** and its file input, for the toolbar's start (the + is not drawn with nothing to add). */
	get controls() {
		return [this.#add.element, this.#intake?.input].filter(Boolean);
	}

	/** The **+** (`ComposerAdd`), whose `entries` the product sets (0.26.0). */
	get add() {
		return this.#add;
	}

	/** The suggestions, or null. */
	get suggest() {
		return this.#suggest;
	}

	/** The commands' list after "/" (a `ComposerSuggest`), or null (0.14.0). */
	get commands() {
		return this.#commands;
	}

	/** Dictation (`ComposerDictation`), or null (0.14.0). */
	get dictation() {
		return this.#dictation;
	}

	/** The attachments' intake, or null. */
	get intake() {
		return this.#intake;
	}

	/** A key in the field the open suggestions or commands take, or ArrowUp's recall; returns whether it was taken. */
	keys(event) {
		return (this.#suggest?.keys(event) || this.#commands?.keys(event) || this.#recall?.keys(event)) ?? false;
	}

	destroy() {
		this.#dictation?.destroy();
		this.#commands?.destroy();
		this.#suggest?.destroy();
		this.#intake?.destroy();
		this.#add.destroy();
		this.#files.destroy();
	}

	/** A source for the commands: the product's own, or a filter of its list by what follows the "/". */
	static #list(commands) {
		if (typeof commands === 'function') return commands;
		if (!Array.isArray(commands)) throw new TypeError("A composer's commands are a list or a source(query, signal)");
		return query => ComposerContext.filter(commands, query);
	}

	/** The commands of a list that match what follows the "/": the start of their value, or a word of their label. */
	static filter(commands, query) {
		const wanted = String(query ?? '').toLowerCase();
		return (commands ?? []).filter(item => item && (String(item.value ?? '').replace(/^\//, '').toLowerCase().startsWith(wanted) || String(item.label ?? '').toLowerCase().includes(wanted)));
	}
}
