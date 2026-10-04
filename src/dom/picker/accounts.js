import { el } from '../core/element.js';
import { ChoiceMenu } from '../choice/menu.js';

/**
 * The "From [account ▾]" switcher above a picker's list (0.7.0, CNT-93): the accounts the results come
 * from, such as each GitHub installation linked to an organization, and the product's "Connect
 * another" action after them.
 *
 * Accounts: `{ id, label, detail?, status?, disabled?, reason? }`. One that cannot be used (suspended,
 * removed, paused) stays listed with its one-line reason and is never chosen. The account in view is
 * kept by the picker and passed to its source as `account`; without a `value` the first usable one is
 * in view. One usable account and no action is a statement ("From acme"), as every choice is.
 */
export class PickerAccounts {
	#element;
	#menu;
	#onchange;

	/**
	 * @param {object} options
	 * @param {{items: Array<object>, value?: string|null, connect?: {label: string, run: () => void}|null}} options.accounts
	 * @param {import('../core/labels.js').Labels} options.labels the picker's copy (`from`)
	 * @param {(id: string) => void} options.onchange the account in view changed
	 */
	constructor({ accounts, labels, onchange }) {
		this.#onchange = onchange;
		this.#menu = new ChoiceMenu({ label: labels.text('from'), options: [], onchange: id => this.#onchange(id) });
		this.#element = el('div', { class: 'bui-picker-from' }, [this.#menu.element]);
		this.update(accounts);
	}

	get element() {
		return this.#element;
	}

	/** The account in view, or null when none can be used. */
	get value() {
		return this.#menu.value;
	}

	/** The switcher's button (absent while it is a statement). */
	get control() {
		return this.#menu.control;
	}

	/**
	 * Replaces the accounts and the action; keeps the account in view while it is still usable, else
	 * `value`, else the first usable one. Returns whether the account in view changed.
	 */
	update({ items = [], value = undefined, connect = null } = {}) {
		const before = this.#menu.value;
		const usable = items.filter(item => item && !item.disabled);
		const wanted = value !== undefined ? value : before;
		const kept = usable.some(item => item.id === wanted) ? wanted : (usable[0]?.id ?? null);
		this.#menu.actions = connect?.label ? [{ label: connect.label, run: () => connect.run?.() }] : [];
		this.#menu.options = items.filter(Boolean).map(item => ({ value: item.id, label: item.label, detail: item.detail ?? null, status: item.status ?? null, disabled: Boolean(item.disabled), reason: item.reason ?? null }));
		this.#menu.value = kept;
		return this.#menu.value !== before;
	}

	destroy() {
		this.#menu.destroy();
	}
}
