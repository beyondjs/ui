import { el, fill, content } from '../core/element.js';
import { Cut, NameTip } from '../core/cut.js';
import { hidden } from '../feedback.js';

const tones = Object.freeze(['neutral', 'success', 'warning', 'danger', 'info', 'progress']);

/**
 * One link of a sidebar, patched in place so a live change never replaces the element that may hold
 * focus. A section's item ends with its `meta` (a short count or note); an entry (a product's own
 * item, such as a conversation) shows its `label` on one line, cut only while a tooltip shows it whole
 * on hover and focus (D44), and ends with at most one `mark` in words with its tone (`{ label, tone }`:
 * "Needs you", "Failed"). The current one has `aria-current="page"`; an item without `href` is shown
 * but cannot be followed.
 */
export class SidebarItem {
	#holder = el('li');
	#node = null;
	#label = el('span', { class: 'bui-sidebar-label' });
	#end = el('span');
	#entry;
	#tip = null;

	/** @param {{entry: boolean}} options whether it is an entry (one line and a mark) or a section */
	constructor({ entry }) {
		this.#entry = entry;
	}

	get element() {
		return this.#holder;
	}

	/** The label as text. */
	get text() {
		return this.#label.textContent;
	}

	get current() {
		return this.#node?.getAttribute('aria-current') === 'page';
	}

	/** @param {{label: string|Node, href?: string|null, current?: boolean, meta?: string|number|null, mark?: {label: string, tone?: string}|null}} item */
	update({ label, href = null, current = false, meta = null, mark = null }) {
		const link = Boolean(href);
		if (!this.#node || (this.#node.tagName === 'A') !== link) this.#make(link);
		if (link && this.#node.getAttribute('href') !== href) this.#node.setAttribute('href', href);
		if (current) this.#node.setAttribute('aria-current', 'page');
		else this.#node.removeAttribute('aria-current');
		if (typeof label !== 'string' || this.#label.textContent !== label || this.#label.childNodes.length !== 1) fill(this.#label, [content(label)]);
		if (this.#entry) this.#mark(mark);
		else this.#meta(meta);
	}

	destroy() {
		this.#tip?.destroy();
		this.#tip = null;
	}

	/** A link, or a span that says it cannot be followed; focus on the one replaced moves to a new link. */
	#make(link) {
		const old = this.#node;
		const focused = old && old === old.ownerDocument.activeElement;
		const kind = `bui-sidebar-item${this.#entry ? ' bui-sidebar-entry' : ''}`;
		this.#node = link ? el('a', { class: kind }) : el('span', { class: kind, 'aria-disabled': 'true' });
		this.#node.append(this.#label, this.#end);
		this.#tip?.destroy();
		this.#tip = this.#entry ? new NameTip(this.#node, { text: () => this.#label.textContent, cut: () => Cut.text(this.#label) }) : null;
		if (old) old.replaceWith(this.#node);
		else this.#holder.append(this.#node);
		if (focused && link) this.#node.focus({ preventScroll: true });
	}

	#meta(meta) {
		this.#end.className = 'bui-sidebar-meta';
		if (meta === null || meta === undefined || meta === '') return this.#end.remove();
		if (this.#end.textContent !== String(meta) || this.#end.childNodes.length !== 1) fill(this.#end, [content(meta)]);
		if (this.#end.parentNode !== this.#node) this.#node.append(this.#end);
	}

	#mark(mark) {
		if (!mark?.label) return this.#end.remove();
		const tone = tones.includes(mark.tone) ? mark.tone : 'neutral';
		this.#end.className = 'bui-sidebar-mark';
		if (this.#end.dataset.tone !== tone) this.#end.dataset.tone = tone;
		if (this.#end.textContent !== `, ${mark.label}`) fill(this.#end, [hidden(', '), el('span', { class: 'bui-sidebar-dot', 'aria-hidden': 'true' }), mark.label]);
		if (this.#end.parentNode !== this.#node) this.#node.append(this.#end);
	}
}
