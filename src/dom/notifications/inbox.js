import { Component } from '../core/component.js';
import { el, fill } from '../core/element.js';
import { icon } from '../core/icons.js';
import { Ids } from '../core/ids.js';
import { Labels } from '../core/labels.js';
import { Select } from '../select.js';
import { callout, loading } from '../feedback.js';
import { defaults } from './labels.js';
import { Moment } from './moment.js';
import { Feed } from './feed.js';
import { NoticeList } from './list.js';
import { Actions } from './actions.js';

/**
 * The full notification inbox of one person, across the products they use.
 *
 * It shows unread or all items, optionally of one product, grouped by their `group` and paged with
 * "Load more". Each item can be opened (after the producer rechecks access) and marked read or
 * unread; "Mark all as read" covers what is listed up to when it was loaded, in the product filter
 * shown. Loading, empty, failure with retry, unavailable and partial results are stated. The filter
 * is the inbox's `state`; `onstate` reports changes so the product can keep them in its address.
 */
export class NotificationInbox extends Component {
	#element;
	#adapter;
	#labels;
	#feed;
	#list;
	#body;
	#status;
	#more;
	#everything;
	#buttons;
	#product;
	#options;
	#state;
	#stamp = null;

	/**
	 * @param {object} options
	 * @param {{summary: Function, list: Function, read: Function, unread: Function, open: Function}} options.adapter
	 * @param {(destination: string, item: object) => void} [options.onopen]
	 * @param {Record<string,string>} [options.products] display names by product id; offered in the product filter
	 * @param {{state?: 'unread'|'all', product?: string}} [options.state]
	 * @param {(state: {state: string, product: string}) => void} [options.onstate]
	 */
	constructor(options) {
		super();
		const { adapter, onopen = null, products = {}, locale = undefined, state = {}, labels = {} } = options;
		this.#options = options;
		this.#adapter = adapter;
		this.#labels = new Labels(defaults, labels);
		this.#state = { state: state.state === 'all' ? 'all' : 'unread', product: state.product ?? '' };
		this.#feed = new Feed(adapter);
		const go = onopen ?? (destination => this.#element.ownerDocument.defaultView.location.assign(destination));
		const actions = new Actions({ adapter, feed: this.#feed, onopen: go, changed: () => this.#draw(), say: key => this.#say(this.#labels.text(key)) });
		this.#list = new NoticeList({ labels: this.#labels, moment: new Moment(locale), products, actions, grouped: true });
		const id = Ids.next('bui-inbox');
		this.#buttons = ['unread', 'all'].map(value =>
			el('button', { type: 'button', class: 'bui-toggle', 'aria-pressed': 'false', onclick: () => this.#change({ state: value }) }, [this.#labels.text(value === 'all' ? 'every' : 'unread')])
		);
		this.#product = new Select({
			id: `${id}-product`,
			options: [{ value: '', label: this.#labels.text('products') }, ...Object.entries(products).map(([value, label]) => ({ value, label }))],
			value: this.#state.product,
			onchange: value => this.#change({ product: value })
		});
		this.#everything = el('button', { type: 'button', class: 'bui-button bui-button-secondary bui-button-small', hidden: true, onclick: () => this.#all() }, [icon('check'), el('span', { text: this.#labels.text('everything') })]);
		this.#status = el('p', { class: 'bui-notify-status', role: 'status' });
		this.#body = el('div', { class: 'bui-inbox-body' });
		this.#more = el('button', { type: 'button', class: 'bui-button bui-button-quiet', hidden: true, onclick: () => this.#page() }, [this.#labels.text('more')]);
		this.#element = el('section', { class: 'bui-inbox', 'aria-label': this.#labels.text('title') }, [
			el('div', { class: 'bui-inbox-tools' }, [
				el('div', { class: 'bui-toggles', role: 'group', 'aria-label': this.#labels.text('show') }, this.#buttons),
				Object.keys(products).length ? el('div', { class: 'bui-inbox-product' }, [el('label', { for: `${id}-product`, class: 'bui-field-label', text: this.#labels.text('product') }), this.#product.element]) : null,
				this.#everything
			]),
			this.#status,
			this.#body,
			this.#more
		]);
		this.load();
	}

	get element() {
		return this.#element;
	}

	get state() {
		return { ...this.#state };
	}

	/** Changes the filter (for example from the address) and loads it. */
	set state(state) {
		this.#state = { state: state.state === 'all' ? 'all' : 'unread', product: state.product ?? '' };
		this.#product.value = this.#state.product;
		this.load();
	}

	/** Loads the first page of the current filter. */
	async load() {
		this.#stamp = new Date().toISOString();
		const pending = this.#feed.load({ ...this.#request(), limit: this.#options.limit ?? 20 });
		this.#draw();
		if (await pending) this.#draw();
	}

	destroy() {
		this.#feed.clear();
		super.destroy();
	}

	#request() {
		return { state: this.#state.state, product: this.#state.product || null };
	}

	#change(part) {
		this.#state = { ...this.#state, ...part };
		this.#options.onstate?.(this.state);
		this.load();
	}

	async #page() {
		const pending = this.#feed.page();
		this.#draw();
		if (await pending) this.#draw();
	}

	async #all() {
		try {
			await this.#adapter.read({ before: this.#stamp, product: this.#state.product || undefined });
		} catch {
			this.#say(this.#labels.text('update'));
			return;
		}
		await this.load();
	}

	#say(message) {
		this.#status.textContent = message;
	}

	#draw() {
		const feed = this.#feed;
		const words = this.#labels;
		this.#buttons.forEach((button, index) => button.setAttribute('aria-pressed', String(['unread', 'all'][index] === this.#state.state)));
		this.#body.setAttribute('aria-busy', String(feed.state === 'loading' || feed.state === 'more'));
		this.#more.hidden = !(feed.state === 'ready' && feed.more) && feed.state !== 'more';
		this.#more.toggleAttribute('data-busy', feed.state === 'more');
		this.#everything.hidden = !(feed.state === 'ready' && feed.items.some(item => !item.read));
		if (feed.state === 'more') return;
		if (feed.state === 'loading') return fill(this.#body, [loading(words.text('loading'))]);
		if (feed.state === 'unavailable') return fill(this.#body, [callout({ tone: 'info', title: words.text('unavailable') })]);
		if (feed.state === 'failed') {
			const retry = el('button', { type: 'button', class: 'bui-button bui-button-secondary bui-button-small', onclick: () => this.#retry() }, [icon('refresh'), el('span', { text: words.text('retry') })]);
			return fill(this.#body, [callout({ tone: 'danger', title: words.text('failure'), actions: [retry] })]);
		}
		// Items marked read stay listed until the next load, so "Mark as unread" can undo at once.
		const items = feed.items;
		const partial = this.#list.partial(feed.missing);
		const empty = el('div', { class: 'bui-empty' }, [el('p', { class: 'bui-empty-title', text: words.text(this.#state.state === 'unread' ? 'caught' : 'empty') })]);
		NoticeList.keep(this.#body, () => fill(this.#body, [partial, items.length ? this.#list.render(items) : empty]));
	}

	async #retry() {
		const pending = this.#feed.retry();
		this.#draw();
		if (await pending) this.#draw();
	}
}
