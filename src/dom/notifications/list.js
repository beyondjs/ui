import { el, content } from '../core/element.js';
import { Ids } from '../core/ids.js';
import { hidden } from '../feedback.js';

/**
 * Draws notification items for the entry panel and the inbox.
 *
 * Each item says what happened (the producer's title and summary, rendered by the product at read
 * time), where (the product) and when, and whether it is unread in words as well as with a dot.
 * Opening goes through the adapter, which rechecks access and marks the item read; it is a button
 * because the destination is only known after that check. With `grouped`, items that share a
 * `group` collapse into their latest one with a control that reveals the earlier updates.
 */
export class NoticeList {
	#labels;
	#moment;
	#products;
	#actions;
	#grouped;

	/**
	 * @param {object} options
	 * @param {import('../core/labels.js').Labels} options.labels
	 * @param {import('./moment.js').Moment} options.moment
	 * @param {Record<string,string>} options.products display name per product id
	 * @param {{open: (item: object) => void, mark: (items: object[], read: boolean) => void}} options.actions
	 */
	constructor({ labels, moment, products = {}, actions, grouped = false }) {
		this.#labels = labels;
		this.#moment = moment;
		this.#products = products;
		this.#actions = actions;
		this.#grouped = grouped;
	}

	/** A list element for the items. */
	render(items) {
		const groups = this.#grouped ? NoticeList.groups(items) : items.map(item => [item]);
		return el('ul', { class: 'bui-notices' }, groups.map(group => this.#entry(group)));
	}

	/** Items in order, with those that share a `group` gathered after the first (latest) of them. */
	static groups(items) {
		const found = new Map();
		const order = [];
		for (const item of items) {
			if (!item.group) order.push([item]);
			else if (found.has(item.group)) found.get(item.group).push(item);
			else {
				const members = [item];
				found.set(item.group, members);
				order.push(members);
			}
		}
		return order;
	}

	/**
	 * Runs a redraw of `container` and puts focus back on the same control of the same item, or on
	 * the nearest item when that one is gone, so marking or opening never drops keyboard focus.
	 */
	static keep(container, redraw) {
		const active = container.ownerDocument.activeElement;
		const item = container.contains(active) ? active.closest('[data-id]') : null;
		const kind = active?.dataset?.control;
		const siblings = item ? [...container.querySelectorAll('.bui-notice')] : [];
		const position = siblings.indexOf(item);
		redraw();
		if (!item) return;
		const same = [...container.querySelectorAll('.bui-notice')].find(node => node.dataset.id === item.dataset.id)?.querySelector(`[data-control="${kind}"]`);
		const near = [...container.querySelectorAll('.bui-notice')][Math.max(0, position - 1)]?.querySelector('.bui-notice-open');
		(same ?? near ?? container.querySelector('[role="status"]'))?.focus?.();
	}

	#entry(group) {
		const [latest, ...earlier] = group;
		const node = this.#item(latest, group);
		if (!earlier.length) return node;
		const id = Ids.next('bui-group');
		const rest = el('ul', { id, class: 'bui-notices bui-notice-earlier', hidden: true }, earlier.map(item => this.#item(item, [item])));
		const toggle = el('button', { type: 'button', class: 'bui-link-button', 'data-control': 'group', 'aria-expanded': 'false', 'aria-controls': id }, [this.#labels.text('updates', { count: group.length })]);
		toggle.addEventListener('click', () => {
			const open = rest.hidden;
			rest.hidden = !open;
			toggle.setAttribute('aria-expanded', String(open));
			toggle.textContent = open ? this.#labels.text('hide') : this.#labels.text('updates', { count: group.length });
		});
		node.querySelector('.bui-notice-text').append(toggle, rest);
		return node;
	}

	#item(item, members) {
		const unread = members.some(member => !member.read);
		const product = this.#products[item.product] ?? item.product;
		const open = el('button', { type: 'button', class: 'bui-notice-open', 'data-control': 'open', onclick: () => this.#actions.open(item) }, [
			content(item.title),
			unread ? hidden(` (${this.#labels.text('unread')})`) : null
		]);
		const mark = el('button', { type: 'button', class: 'bui-link-button bui-notice-mark', 'data-control': 'mark', onclick: () => this.#actions.mark(members, unread) }, [this.#labels.text(unread ? 'mark' : 'unmark')]);
		return el('li', { class: 'bui-notice', 'data-id': item.id, 'data-read': String(!unread) }, [
			el('span', { class: 'bui-notice-dot', 'aria-hidden': 'true' }),
			el('div', { class: 'bui-notice-text' }, [
				open,
				item.summary ? el('p', { class: 'bui-notice-summary' }, [content(item.summary)]) : null,
				el('p', { class: 'bui-notice-meta' }, [product ? el('span', { text: product }) : null, product ? ' · ' : null, this.#moment.element(item.occurred)]),
				mark
			])
		]);
	}
}
