import { RetryAction } from '../again/action.js';
import { Recovery } from '../again/recovery.js';
import { TechnicalDetails } from '../operations/details.js';
import { Component } from '../core/component.js';
import { el, fill } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Ids } from '../core/ids.js';
import { Labels } from '../core/labels.js';
import { Select } from '../select.js';
import { callout, loading } from '../feedback.js';
import { Cause, defaults, copies } from './labels.js';
import { Age } from '../time/age.js';
import { Feed } from './feed.js';
import { Recovery as Relay } from './recovery.js';
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
 *
 * Since 0.33.0 (D163) an outage of its relay (Beyond Projects or Beyond Accounts did not answer, or the
 * browser is offline) is the page's body, as `Recovery`'s page form (`whole`): who did not answer, when it
 * last tried and one Try again, its read in the line's Technical details, and no filter that cannot work.
 * It reads again by itself and gives the page back once the relay answers. `locale` picks its language.
 */
export class NotificationInbox extends Component {
	/** The copy in English and Spanish (0.7.2). */
	static labels = copies;
	#element;
	#adapter;
	#labels;
	#feed;
	#recovery;
	#lang;
	#list;
	#body;
	#status;
	#more;
	#everything;
	#buttons;
	#product;
	#options;
	#state;
	#tools;
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
		this.#lang = String(locale ?? '').toLowerCase().startsWith('es') ? 'es' : 'en';
		this.#recovery = new Recovery({ title: '', whole: true, locale, labels: { ...Recovery.labels[this.#lang], ...labels } });
		const go = onopen ?? (destination => this.#element.ownerDocument.defaultView.location.assign(destination));
		const actions = new Actions({ adapter, feed: this.#feed, onopen: go, changed: () => this.#draw(), say: key => this.#say(this.#labels.text(key)) });
		this.#list = new NoticeList({ labels: this.#labels, age: new Age({ locale }), products, actions, grouped: true, days: true });
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
		this.#everything = el('button', { type: 'button', class: 'bui-button bui-button-secondary bui-button-small', hidden: true, onclick: () => this.#all() }, [glyph('check'), el('span', { text: this.#labels.text('everything') })]);
		this.#status = el('p', { class: 'bui-notify-status', role: 'status' });
		this.#body = el('div', { class: 'bui-inbox-body' });
		this.#more = el('button', { type: 'button', class: 'bui-button bui-button-quiet', hidden: true, onclick: () => this.#page() }, [this.#labels.text('more')]);
		this.#element = el('section', { class: 'bui-inbox', 'aria-label': this.#labels.text('title') }, [
			(this.#tools = el('div', { class: 'bui-inbox-tools' }, [
				el('div', { class: 'bui-toggles', role: 'group', 'aria-label': this.#labels.text('show') }, this.#buttons),
				Object.keys(products).length ? el('div', { class: 'bui-inbox-product' }, [el('label', { for: `${id}-product`, class: 'bui-field-label', text: this.#labels.text('product') }), this.#product.element]) : null,
				this.#everything
			])),
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
		// A page of matters (0.15.0, X-07): one noisy matter never hides the others
		const pending = this.#feed.load({ ...this.#request(), by: 'matter', limit: this.#options.limit ?? 20 });
		this.#draw();
		if (await pending) this.#draw();
	}

	destroy() {
		this.#recovery.destroy();
		this.#feed.clear();
		this.#product.destroy();
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
		// The notice's own tries keep the page as it is; an answer gives it back
		if (feed.state === 'loading' && this.#recovery.size) return;
		if (this.#outage()) return this.#unavailable();
		this.#recovery.delete('inbox');
		this.#tools.hidden = false;
		this.#more.hidden = !(feed.state === 'ready' && feed.more) && feed.state !== 'more';
		this.#more.toggleAttribute('data-busy', feed.state === 'more');
		this.#everything.hidden = !(feed.state === 'ready' && feed.items.some(item => !item.read));
		if (feed.state === 'more') return;
		if (feed.state === 'loading') return fill(this.#body, [loading(words.text('loading'))]);
		if (feed.state === 'unavailable') return fill(this.#body, [callout({ tone: 'info', title: Cause.text(words, feed.reason), actions: [new RetryAction({ labels: { retry: words.text('retry') }, run: () => this.#retry() }).element] })]);
		if (feed.state === 'failed') {
			const retry = new RetryAction({ labels: { retry: words.text('retry') }, run: () => this.#retry() }).element;
			return fill(this.#body, [callout({ tone: 'danger', title: words.text('failure'), actions: [retry] })]);
		}
		// Items marked read stay listed until the next load, so "Mark as unread" can undo at once.
		const items = feed.items;
		const partial = this.#list.partial(feed.missing);
		const empty = el('div', { class: 'bui-empty' }, [el('p', { class: 'bui-empty-title', text: words.text(this.#state.state === 'unread' ? 'caught' : 'empty') })]);
		NoticeList.keep(this.#body, () => fill(this.#body, [partial, items.length ? this.#list.render(items) : empty]));
	}

	/** An outage of the relay, or a read that failed while the browser is offline (0.33.0). */
	#outage() {
		return Relay.outage(this.#feed) || (this.#feed.state === 'failed' && globalThis.navigator?.onLine === false);
	}

	/** The page's body is the outage itself: who did not answer, its read in Technical details, nothing that cannot work. */
	#unavailable() {
		const words = this.#labels;
		const reason = this.#feed.reason;
		this.#recovery.title = Cause.codes.includes(reason) && reason.endsWith('_unavailable') ? words.text(reason) : words.text('unavailable');
		const details = this.#feed.details && { ...this.#feed.details, labels: TechnicalDetails.labels[this.#lang] };
		this.#recovery.set('inbox', { title: words.text('title'), details, run: async () => (await this.load(), false) });
		this.#tools.hidden = true;
		this.#everything.hidden = true;
		this.#more.hidden = true;
		fill(this.#body, [this.#recovery.element]);
	}

	async #retry() {
		const pending = this.#feed.retry();
		this.#draw();
		if (await pending) this.#draw();
	}
}
