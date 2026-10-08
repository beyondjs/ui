import { el, fill, content } from '../core/element.js';
import { Cut, NameTip } from '../core/cut.js';
import { hidden } from '../feedback.js';
import { EntryAge } from './age.js';

const tones = Object.freeze(['neutral', 'success', 'warning', 'danger', 'info', 'progress']);

/**
 * One link of a sidebar, patched in place so a live change never replaces the element that may hold
 * focus. A section's item ends with its `meta` (a short count or note); an entry (a product's own
 * item, such as a conversation) shows its `label` on one line, cut only while a tooltip shows it whole
 * on hover and focus (D44), and ends with at most one `mark` in words with its tone (`{ label, tone }`:
 * "Needs you", "Failed"). The current one has `aria-current="page"`; an item without `href` is shown
 * but cannot be followed.
 *
 * Since 0.11.0 an entry may end with its `age` ("2 h", "3 d"): the full moment is read with the entry
 * ("Fix the redirect, Needs you, Tuesday 6 October 2026 at 10:42") and shown in its tooltip on hover
 * and focus, with the title when the title is cut.
 */
export class SidebarItem {
	#holder = el('li');
	#node = null;
	#label = el('span', { class: 'bui-sidebar-label' });
	#end = el('span');
	#entry;
	#tip = null;
	#age = el('time', { class: 'bui-sidebar-age' });
	#when = '';
	#labels;

	/**
	 * @param {{entry: boolean, labels?: import('../core/labels.js').Labels|null}} options whether it is an
	 *   entry (one line, a mark and an age) or a section, and the sidebar's copy (an age's units)
	 */
	constructor({ entry, labels = null }) {
		this.#entry = entry;
		this.#labels = labels;
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

	/** @param {{label: string|Node, href?: string|null, current?: boolean, meta?: string|number|null, mark?: {label: string, tone?: string}|null, age?: unknown}} item */
	update({ label, href = null, current = false, meta = null, mark = null, age = null }) {
		const link = Boolean(href);
		if (!this.#node || (this.#node.tagName === 'A') !== link) this.#make(link);
		if (link && this.#node.getAttribute('href') !== href) this.#node.setAttribute('href', href);
		if (current) this.#node.setAttribute('aria-current', 'page');
		else this.#node.removeAttribute('aria-current');
		if (typeof label !== 'string' || this.#label.textContent !== label || this.#label.childNodes.length !== 1) fill(this.#label, [content(label)]);
		if (this.#entry) {
			this.#mark(mark);
			this.#date(age);
		} else this.#meta(meta);
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
		const whole = () => [Cut.text(this.#label) ? this.#label.textContent : null, this.#when || null].filter(Boolean).join(' · ');
		this.#tip = this.#entry ? new NameTip(this.#node, { text: whole, cut: () => Cut.text(this.#label) || Boolean(this.#when) }) : null;
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

	/** The entry's age at its end: short words shown, the full moment read (0.11.0). */
	#date(age) {
		const words = age === null || age === undefined || age === '' ? null : new EntryAge(age, { labels: this.#labels, locale: this.#holder.ownerDocument.documentElement.lang || undefined });
		this.#when = words?.title ?? '';
		if (!words?.label) return this.#age.remove();
		if (this.#age.textContent !== `, ${words.title}${words.label}`) fill(this.#age, [hidden(`, ${words.title}`), el('span', { 'aria-hidden': 'true', text: words.label })]);
		if (words.datetime) this.#age.setAttribute('datetime', words.datetime);
		else this.#age.removeAttribute('datetime');
		if (this.#age.parentNode !== this.#node) this.#node.append(this.#age);
	}

	#mark(mark) {
		if (!mark?.label) return this.#end.remove();
		const tone = tones.includes(mark.tone) ? mark.tone : 'neutral';
		this.#end.className = 'bui-sidebar-mark';
		if (this.#end.dataset.tone !== tone) this.#end.dataset.tone = tone;
		if (this.#end.textContent !== `, ${mark.label}`) fill(this.#end, [hidden(', '), el('span', { class: 'bui-sidebar-dot', 'aria-hidden': 'true' }), mark.label]);
		if (this.#end.parentNode !== this.#node) this.#node.insertBefore(this.#end, this.#age.parentNode === this.#node ? this.#age : null);
	}
}
