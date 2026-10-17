import { el, fill, content } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Ids } from '../core/ids.js';

/**
 * A palette's results (0.16.0): groups in the sources' order, each with its heading and its state
 * (looking, unavailable, its options), one active option across all groups, moved with the arrows and
 * wrapping. Options carry their glyph, words, detail and a shortcut at their end (`keys`, hidden on
 * touch). The listbox belongs to the palette's field (`aria-activedescendant`).
 */
export class PaletteResults {
	#element;
	#labels;
	#options = [];
	#active = -1;
	#onchoose;

	/**
	 * @param {object} options
	 * @param {import('../core/labels.js').Labels} options.labels
	 * @param {(item: object, group: object, event: Event) => void} options.onchoose
	 */
	constructor({ labels, onchoose }) {
		this.#labels = labels;
		this.#onchoose = onchoose;
		this.#element = el('div', { id: Ids.next('bui-palette-list'), class: 'bui-palette-list', role: 'listbox', 'aria-label': labels.text('label') });
	}

	get element() {
		return this.#element;
	}

	/** The option chosen with Enter, or null. */
	get active() {
		return this.#options[this.#active] ?? null;
	}

	/** How many options are shown. */
	get count() {
		return this.#options.length;
	}

	/**
	 * Draws the groups: `[{ key, label, state: 'looking'|'unavailable'|'ready', items }]`; a group with
	 * nothing to show is left out. The active option stays on the same item when it is still shown.
	 */
	draw(groups) {
		const before = this.active?.item.id ?? null;
		this.#options = [];
		const nodes = groups.filter(group => group.state !== 'ready' || group.items.length).map(group => this.#group(group));
		fill(this.#element, nodes);
		const same = this.#options.findIndex(option => option.item.id === before);
		this.move(same >= 0 ? same : 0);
	}

	/** Moves the active option to `index`, wrapping at both ends. */
	move(index) {
		const count = this.#options.length;
		this.#active = count ? ((index % count) + count) % count : -1;
		this.#options.forEach((option, at) => option.node.setAttribute('aria-selected', String(at === this.#active)));
		this.active?.node.scrollIntoView?.({ block: 'nearest' });
	}

	/** Moves by `step` from the active option. */
	step(step) {
		if (this.#options.length) this.move(this.#active + step);
	}

	#group(group) {
		const heading = el('p', { id: Ids.next('bui-palette-group'), class: 'bui-palette-heading', text: group.label });
		const state = group.state === 'ready' ? null : el('p', { class: 'bui-palette-state', text: this.#labels.text(group.state === 'looking' ? 'looking' : 'unavailable') });
		const options = group.items.map(item => this.#option(item, group));
		return el('div', { class: 'bui-palette-group', role: 'group', 'aria-labelledby': heading.id, 'data-source': group.key }, [heading, state, ...options]);
	}

	#option(item, group) {
		const index = this.#options.length;
		const node = el('div', { id: Ids.next('bui-palette-option'), class: 'bui-palette-option', role: 'option', 'aria-selected': 'false', onpointerdown: event => event.preventDefault(), onclick: event => this.#onchoose(item, group, event), onpointermove: () => this.#active !== index && this.move(index) }, [
			el('span', { class: 'bui-palette-glyph', 'aria-hidden': 'true' }, [item.glyph ? glyph(item.glyph) : null]),
			el('span', { class: 'bui-palette-words' }, [el('span', { class: 'bui-palette-label' }, [content(item.label)]), item.detail ? el('span', { class: 'bui-palette-detail' }, [content(item.detail)]) : null]),
			item.keys ? el('kbd', { class: 'bui-keys bui-palette-keys', text: item.keys }) : null
		]);
		this.#options.push({ node, item, group });
		return node;
	}
}
