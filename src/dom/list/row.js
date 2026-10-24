import { Component } from '../core/component.js';
import { el, fill, content } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Ids } from '../core/ids.js';
import { Cut, NameTip } from '../core/cut.js';
import { Labels } from '../core/labels.js';
import { ActionMenu } from '../menu.js';
import { Button } from '../button.js';
import { ActionLine } from '../actions/line.js';
import { Status } from '../status/status.js';

const defaults = { more: 'More actions for {title}', select: 'Choose {title}' };

/**
 * One object in a list (0.15.0, the audit's DQ-12, DQ-09 and DQ-05): a dense row with its state's mark,
 * its name on the first line and a muted line of facts under it, what it says at its end, quiet
 * actions and an overflow menu. The whole row opens the object (`href` or `run`) through its name, a link
 * or a button whose target covers the row, so no interactive element is nested in another; the actions,
 * the menu and the check stay above that target. The name is drawn in the text color, never the accent.
 *
 * On a narrow row (a container query on the row itself, under 30rem) the end's facts move under the
 * meta and the actions wrap after them: facts stay visible and long values wrap, never a card of labels
 * and values. With `select` the row is a choice in a picker: a checkbox before the name, its state given
 * by the product. `update()` patches the row in place: the name keeps focus, the menu keeps its instance.
 *
 * The name stays on one line and may be cut at its end only while it shows whole in a tooltip on hover
 * and keyboard focus (0.28.0, D44), which a name that fits never shows.
 */
export class ListRow extends Component {
	/** The copy in English and Spanish. */
	static labels = Object.freeze({ en: Object.freeze({ ...defaults }), es: Object.freeze({ more: 'Más acciones de {title}', select: 'Elegir {title}' }) });

	#element;
	#lead = el('span', { class: 'bui-row-lead' });
	#main = el('div', { class: 'bui-row-main' });
	#name = null;
	#tip = null;
	#meta = el('p', { class: 'bui-row-meta' });
	#end = el('div', { class: 'bui-row-end' });
	#actions = new ActionLine();
	#check = null;
	#menu = null;
	#buttons = [];
	#labels;
	#options = {};

	/**
	 * @param {object} options
	 * @param {string|Node} options.title the object's name
	 * @param {string|null} [options.href] opens the object (the whole row)
	 * @param {((event: Event) => void)|null} [options.run] opens the object in place, when it has no address
	 * @param {string|Node|Array<string|Node|null>|null} [options.meta] facts under the name, joined by " · "
	 * @param {{state: string, label?: string|Node|null}|string|Node|null} [options.lead] the mark before the name: a `Status` state, a glyph name or a node
	 * @param {{state: string, label?: string|Node|null}|Node|null} [options.status] a state in words at the row's end
	 * @param {Array<string|Node>} [options.facts] short values at the row's end (counts, ages)
	 * @param {Array<{label: string, run: (event: Event) => unknown, glyph?: string|null, name?: string|null}>} [options.actions] quiet actions
	 * @param {Array<object>} [options.menu] the overflow menu's items (`ActionMenu` items)
	 * @param {{checked?: boolean, disabled?: boolean, name?: string|null, value?: string|null, onchange?: (checked: boolean) => void}|null} [options.select] a checkbox before the name
	 * @param {boolean} [options.current] the object in view
	 * @param {'li'|'div'} [options.tag] the row's element (`li` inside a list)
	 */
	constructor(options) {
		super();
		this.#labels = new Labels(defaults, options.labels ?? {});
		this.#actions.element.querySelector('.bui-action-line-actions').classList.add('bui-row-actions');
		this.#element = el(options.tag === 'div' ? 'div' : 'li', { class: 'bui-row' }, [this.#lead, this.#main, this.#end]);
		this.update(options);
	}

	get element() {
		return this.#element;
	}

	/** The overflow menu, when the row has one. */
	get menu() {
		return this.#menu;
	}

	/** Patches the row with new options; what is not given is removed. */
	update(options) {
		this.#options = { ...options };
		const { title, href = null, run = null, meta = null, lead = null, status = null, facts = [], actions = [], menu = [], select = null, current = false } = options;
		this.#title(title, href, run);
		this.#element.toggleAttribute('data-current', Boolean(current));
		this.#element.toggleAttribute('data-open', Boolean(href || run));
		this.#mark(lead);
		const parts = [].concat(meta).filter(part => part !== null && part !== undefined && part !== '');
		fill(this.#meta, parts.flatMap((part, index) => (index ? [' · ', content(part)] : [content(part)])));
		this.#meta.hidden = !parts.length;
		this.#select(select, title);
		this.#tail({ status, facts, actions, menu, title });
		return this;
	}

	destroy() {
		this.#tip?.destroy();
		this.#menu?.destroy();
		this.#actions.destroy();
		for (const button of this.#buttons) button.destroy();
		super.destroy();
	}

	#title(title, href, run) {
		const kind = href ? 'a' : run ? 'button' : 'span';
		if (!this.#name || this.#name.localName !== kind) {
			const next = el(kind, { class: 'bui-row-title', type: kind === 'button' ? 'button' : null, id: Ids.next('bui-row') });
			if (kind !== 'span') next.addEventListener('click', event => this.#options.run?.(event));
			const focused = this.#name && this.#name === this.#name.ownerDocument.activeElement;
			if (this.#name) this.#name.replaceWith(next);
			else this.#main.append(next, this.#meta);
			this.#name = next;
			this.#tip?.destroy();
			this.#tip = new NameTip(next, { text: () => next.textContent, cut: () => Cut.text(next) });
			if (focused) next.focus({ preventScroll: true });
		}
		if (href) this.#name.setAttribute('href', href);
		if (typeof title !== 'string' || this.#name.textContent !== title) fill(this.#name, [content(title)]);
		if (this.#options.current) this.#name.setAttribute('aria-current', 'page');
		else this.#name.removeAttribute('aria-current');
	}

	#mark(lead) {
		if (!lead) return this.#lead.replaceChildren();
		if (typeof lead === 'string') return fill(this.#lead, [glyph(lead)]);
		if (lead.state) return fill(this.#lead, [ListRow.#status(lead, true)]);
		fill(this.#lead, [lead]);
	}

	#select(select, title) {
		if (!select) {
			this.#check?.remove();
			this.#check = null;
			return this.#element.removeAttribute('data-select');
		}
		this.#element.setAttribute('data-select', '');
		if (!this.#check) {
			this.#check = el('input', { type: 'checkbox', class: 'bui-row-check', onchange: event => this.#options.select?.onchange?.(event.target.checked) });
			this.#element.prepend(this.#check);
		}
		this.#check.checked = Boolean(select.checked);
		this.#check.disabled = Boolean(select.disabled);
		this.#check.name = select.name ?? '';
		this.#check.value = select.value ?? '';
		this.#check.setAttribute('aria-label', this.#text('select', title));
	}

	#tail({ status, facts, actions, menu, title }) {
		for (const button of this.#buttons) button.destroy();
		this.#buttons = actions.map((action, index) => {
			if (!action) return null;
			const { label, run, glyph: mark = null, name = null } = action;
			const button = new Button({ label, glyph: mark, name, variant: 'quiet', small: true, onclick: event => run?.(event) });
			// Aligned lists keep an absent action's column without inventing a disabled control.
			button.element.style.setProperty('--bui-action-column', String(index + 1));
			return button;
		}).filter(Boolean);
		this.#actions.actions = this.#buttons;
		const items = menu.filter(Boolean);
		if (items.length && !this.#menu) this.#menu = new ActionMenu({ label: null, name: this.#text('more', title), items, align: 'end' });
		else if (items.length) this.#menu.items = items;
		else {
			this.#menu?.destroy();
			this.#menu = null;
		}
		this.#menu?.element.querySelector('.bui-menu-button')?.setAttribute('aria-label', this.#text('more', title));
		const shown = [...facts.filter(fact => fact !== null && fact !== undefined && fact !== false && fact !== '').map(fact => el('span', { class: 'bui-row-fact' }, [content(fact)])), status ? (status.state ? ListRow.#status(status, false) : status) : null].filter(Boolean);
		fill(this.#end, [...shown, this.#buttons.length ? this.#actions.element : null, this.#menu?.element ?? null].filter(Boolean));
		this.#end.hidden = !this.#end.childElementCount;
	}

	#text(key, title) {
		return this.#labels.text(key, { title: typeof title === 'string' ? title : (title?.textContent ?? '') });
	}

	static #status({ state, label = null }, mark) {
		const status = new Status({ state, label });
		if (mark) status.element.classList.add('bui-row-mark');
		return status.element;
	}
}
