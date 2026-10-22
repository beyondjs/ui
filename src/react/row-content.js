import { createPortal } from 'react-dom';
import { ListRow } from '../dom/list/row.js';

/** Stable React slots inside the shared DOM row; React retains ownership of each slot's children. */
export class RowContent {
	#row;
	#latest;
	#slots = new Map();
	#ids = new WeakMap();
	#serial = 0;
	#key;

	constructor(props, latest) {
		this.#latest = latest;
		const plan = this.prepare(props);
		this.#row = new ListRow(plan.options);
		this.#key = plan.key;
	}

	get element() { return this.#row.element; }
	get destroyed() { return this.#row.destroyed; }

	/** A render plan never serializes React elements, which may contain circular owner references. */
	prepare(props) {
		const portals = [];
		const slot = (value, key) => this.#content(value, key, portals);
		const state = (value, key) => value && typeof value === 'object' && 'state' in value
			? { ...value, label: slot(value.label, `${key}.label`) } : slot(value, key);
		const { run, actions = [], menu = [], select = null } = props;
		const options = {
			...props, tag: 'div',
			meta: [].concat(props.meta ?? []).map((value, index) => slot(value, `meta.${index}`)),
			facts: (props.facts ?? []).map((value, index) => slot(value, `facts.${index}`)),
			lead: state(props.lead, 'lead'), status: state(props.status, 'status'),
			run: run ? event => this.#latest.current.run?.(event) : null,
			actions: actions.map((action, index) => action ? { ...action, run: event => this.#latest.current.actions?.[index]?.onSelect?.(event) } : null),
			menu: menu.filter(Boolean).map((item, index) => ({ ...item, run: item.href ? null : event => this.#latest.current.menu?.filter(Boolean)[index]?.onSelect?.(event) })),
			select: select ? { ...select, onchange: checked => this.#latest.current.select?.onChange?.(checked) } : null
		};
		const key = JSON.stringify([
			this.#identity(props.title), props.href, Boolean(run), props.current,
			options.meta.map(value => this.#identity(value)), options.facts.map(value => this.#identity(value)),
			this.#identity(options.lead), this.#identity(options.status),
			actions.map((action, index) => action ? [index, action.label, action.glyph, action.name] : null),
			menu.filter(Boolean).map(item => [item.label, item.href, item.disabled, item.reason, item.tone]),
			select ? [select.checked, select.disabled, select.name, select.value] : null
		]);
		return { options, key, portals };
	}

	/** Native row updates move slots; return focus to the retained child after that synchronous move. */
	update(plan) {
		if (plan.key === this.#key) return;
		const active = this.element.ownerDocument.activeElement;
		const retained = this.element.contains(active);
		const column = active?.closest('.bui-row-actions > button')?.style.getPropertyValue('--bui-action-column');
		const name = active?.getAttribute('aria-label') ?? active?.textContent;
		this.#row.update(plan.options);
		this.#key = plan.key;
		if (!retained) return;
		const target = this.element.contains(active) ? active : column
			? [...this.element.querySelectorAll('.bui-row-actions > button')].find(button => button.style.getPropertyValue('--bui-action-column') === column && (button.getAttribute('aria-label') ?? button.textContent) === name) : null;
		if (target && target !== this.element.ownerDocument.activeElement) target.focus({ preventScroll: true });
	}

	destroy() { this.#row.destroy(); }

	#content(value, key, portals) {
		if (value === null || value === undefined || typeof value === 'boolean') return null;
		if (typeof value === 'string' || value.nodeType) return value;
		if (!this.#slots.has(key)) this.#slots.set(key, document.createElement('span'));
		const node = this.#slots.get(key);
		portals.push(createPortal(value, node, key));
		return node;
	}

	#identity(value) {
		if (!value || typeof value !== 'object') return value;
		if ('state' in value) return [value.state, this.#identity(value.label)];
		if (!this.#ids.has(value)) this.#ids.set(value, ++this.#serial);
		return this.#ids.get(value);
	}
}
