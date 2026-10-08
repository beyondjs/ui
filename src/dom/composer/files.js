import { el } from '../core/element.js';
import { Hint } from '../core/hint.js';
import { KeyedList } from '../core/keyed.js';
import { Announcer } from '../operations/announcer.js';
import { FileChip } from './file.js';

/**
 * A composer's attachments (0.11.0): the chips the product sets (`items`), patched by `key` so a live
 * change of progress never moves focus, and one polite region that says each chip's state once when it
 * changes ("photo.png attached", "notes.txt failed: too large"), never its progress. The list is the
 * product's: Remove and Retry call back, and the product sets the list again. When the chip that held
 * focus leaves, focus goes to the chip now at its place, or to the field when none is left.
 */
export class ComposerFiles {
	#element = el('ul', { class: 'bui-composer-files', hidden: true });
	#order = new KeyedList(this.#element);
	#chips = new Map();
	#said = new Map();
	#announcer = new Announcer();
	#hint;
	#labels;
	#locale;
	#refocus;
	#callbacks;

	/**
	 * @param {object} options
	 * @param {import('../core/labels.js').Labels} options.labels the composer's copy
	 * @param {string|undefined} options.locale the language of sizes and percents
	 * @param {() => void} options.refocus moves focus to the field
	 * @param {{onremove?: (item: object) => void, onretry?: ((item: object) => void)|null}} options.callbacks the product's handlers
	 */
	constructor({ labels, locale, refocus, callbacks }) {
		this.#labels = labels;
		this.#locale = locale;
		this.#refocus = refocus;
		this.#callbacks = callbacks;
		this.#element.setAttribute('aria-label', labels.text('files'));
		this.#hint = new Hint(this.#element);
	}

	get element() {
		return this.#element;
	}

	/** The polite region that says each change of state. */
	get announcer() {
		return this.#announcer.element;
	}

	/** The items as given, in order. */
	get items() {
		return [...this.#chips.values()].map(chip => chip.item);
	}

	/** Whether any attachment is ready to go with the message. */
	get ready() {
		return [...this.#chips.values()].some(chip => chip.state === 'ready');
	}

	/** `[{ key, name, size?, type?, state, progress?, reason?, thumbnail?, file? }]`, or none. */
	set items(items) {
		const document = this.#element.ownerDocument;
		const inside = this.#element.contains(document.activeElement);
		const next = new Map();
		const said = [];
		const words = { labels: this.#labels, size: bytes => this.#size(bytes), percent: share => this.#percent(share), retry: Boolean(this.#callbacks.onretry) };
		for (const item of (Array.isArray(items) ? items : []).filter(item => item && item.key !== undefined)) {
			const key = String(item.key);
			const chip = this.#chips.get(key) ?? new FileChip({ labels: this.#labels, onremove: given => this.#callbacks.onremove?.(given), onretry: given => this.#callbacks.onretry?.(given) });
			chip.update(item, words);
			next.set(key, chip);
			if (this.#said.get(key) !== chip.state) said.push(this.#say(chip));
		}
		for (const [key, chip] of this.#chips) {
			if (next.has(key)) continue;
			said.push(this.#labels.text('removed', { name: chip.item?.name ?? '' }));
			chip.destroy();
		}
		this.#order.order([...next.values()].map(chip => chip.element));
		this.#chips = next;
		this.#said = new Map([...next].map(([key, chip]) => [key, chip.state]));
		this.#element.hidden = !next.size;
		if (inside && !this.#element.contains(document.activeElement)) this.#refocus();
		this.#announcer.say(...said);
	}

	destroy() {
		for (const chip of this.#chips.values()) chip.destroy();
		this.#chips.clear();
		this.#hint.destroy();
	}

	#say(chip) {
		const name = chip.item.name ?? '';
		if (chip.state === 'failed') return this.#labels.text('failure', { name, reason: chip.item.reason ?? this.#labels.text('unknown') });
		return this.#labels.text(chip.state === 'uploading' ? 'sending' : 'attached', { name });
	}

	#size(bytes) {
		const units = ['byte', 'kilobyte', 'megabyte', 'gigabyte'];
		let value = Math.max(0, bytes);
		let unit = 0;
		while (value >= 1000 && unit < units.length - 1) {
			value /= 1000;
			unit += 1;
		}
		return new Intl.NumberFormat(this.#locale, { style: 'unit', unit: units[unit], unitDisplay: 'short', maximumFractionDigits: unit < 2 ? 0 : 1 }).format(value);
	}

	#percent(share) {
		return new Intl.NumberFormat(this.#locale, { style: 'percent', maximumFractionDigits: 0 }).format(share);
	}
}
