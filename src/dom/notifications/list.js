import { el, content } from '../core/element.js';
import { Ids } from '../core/ids.js';
import { callout, hidden } from '../feedback.js';

/**
 * Draws notification items for the entry panel and the inbox.
 *
 * Each item says what happened (the producer's title and summary, rendered by the product at read
 * time), where (the product) and when (the family's short age, the full moment on hover), and whether
 * it is unread in words as well as with a dot and a heavier title. The whole row opens the item
 * (D79, 0.13.0): its title is a button stretched over the row, because the destination is only known
 * after the producer rechecks access. "Mark as read" (or "Mark as unread") sits quietly at the end of
 * the row's details, shown while the row is pointed at or holds focus, and always on a touch screen.
 *
 * With `grouped`, items that share a `group` (one matter: a connection, a request, an environment)
 * collapse into their latest one with a control that reveals the earlier updates. With `days`, rows
 * from today and from earlier days are set under "Today" and "Earlier" when there are both.
 */
export class NoticeList {
	#labels;
	#age;
	#products;
	#actions;
	#grouped;
	#days;
	#now;

	/**
	 * @param {object} options
	 * @param {import('../core/labels.js').Labels} options.labels
	 * @param {import('../time/age.js').Age} options.age the short age of each item
	 * @param {Record<string,string>} options.products display name per product id
	 * @param {{open: (item: object) => void, mark: (items: object[], read: boolean) => void}} options.actions
	 * @param {boolean} [options.grouped] one row per matter
	 * @param {boolean} [options.days] "Today" and "Earlier" when the rows span both
	 * @param {() => number} [options.now] the clock the days are told by
	 */
	constructor({ labels, age, products = {}, actions, grouped = false, days = false, now = () => Date.now() }) {
		this.#labels = labels;
		this.#age = age;
		this.#products = products;
		this.#actions = actions;
		this.#grouped = grouped;
		this.#days = days;
		this.#now = now;
	}

	/** The rows of `items` (at most `limit` matters), as one list or under the two day headings. */
	render(items, { limit = Infinity } = {}) {
		const groups = (this.#grouped ? NoticeList.groups(items) : items.map(item => [item])).slice(0, limit);
		const list = rows => el('ul', { class: 'bui-notices' }, rows.map(group => this.#entry(group)));
		if (!this.#days) return list(groups);
		const today = new Date(this.#now()).toDateString();
		const recent = groups.filter(([latest]) => new Date(latest.occurred).toDateString() === today);
		const earlier = groups.filter(group => !recent.includes(group));
		if (!recent.length || !earlier.length) return list(groups);
		const heading = key => el('h3', { class: 'bui-notice-day', text: this.#labels.text(key) });
		return el('div', { class: 'bui-notice-days' }, [heading('today'), list(recent), heading('earlier'), list(earlier)]);
	}

	/** How many matters `items` hold (rows once grouped). */
	count(items) {
		return this.#grouped ? NoticeList.groups(items).length : items.length;
	}

	/**
	 * The warning that some products could not be reached, naming each by its display name (the id
	 * when the product gave none); null when every product answered.
	 */
	partial(missing) {
		if (!missing.length) return null;
		const products = missing.map(id => this.#products[id] ?? id).join(', ');
		return callout({ tone: 'warning', title: this.#labels.text('partial', { products }) });
	}

	/**
	 * Items in order, with those that share a `group` gathered after the first (latest) of them. A group
	 * is its product's (0.13.0), as Beyond Projects counts a matter: two products' equal keys stay apart.
	 */
	static groups(items) {
		const found = new Map();
		const order = [];
		for (const item of items) {
			const key = item.group ? `${item.product ?? ''}\u0000${item.group}` : null;
			if (!key) order.push([item]);
			else if (found.has(key)) found.get(key).push(item);
			else {
				const members = [item];
				found.set(key, members);
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
		const toggle = el('button', { type: 'button', class: 'bui-link-button bui-notice-toggle', 'data-control': 'group', 'aria-expanded': 'false', 'aria-controls': id }, [this.#labels.text('updates', { count: group.length })]);
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
		const open = el('button', { type: 'button', class: 'bui-notice-open', 'data-control': 'open', onclick: () => this.#actions.open(item, members) }, [
			content(item.title),
			unread ? hidden(` (${this.#labels.text('unread')})`) : null
		]);
		const mark = el('button', { type: 'button', class: 'bui-link-button bui-notice-mark', 'data-control': 'mark', onclick: () => this.#actions.mark(members, unread) }, [this.#labels.text(unread ? 'mark' : 'unmark')]);
		const age = this.#age.of(item.occurred);
		const when = age ? el('time', { datetime: age.datetime, title: age.title, text: age.label }) : null;
		return el('li', { class: 'bui-notice', 'data-id': item.id, 'data-read': String(!unread) }, [
			el('span', { class: 'bui-notice-dot', 'aria-hidden': 'true' }),
			el('div', { class: 'bui-notice-text' }, [
				open,
				item.summary ? el('p', { class: 'bui-notice-summary' }, [content(item.summary)]) : null,
				el('div', { class: 'bui-notice-meta' }, [el('span', { class: 'bui-notice-where' }, [product ? el('span', { text: product }) : null, product && when ? ' · ' : null, when]), mark])
			])
		]);
	}
}
