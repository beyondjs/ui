import { Disclosure } from '../disclosure.js';
import { el, fill } from '../core/element.js';
import { icon } from '../core/icons.js';
import { Ids } from '../core/ids.js';
import { Labels } from '../core/labels.js';
import { callout, loading } from '../feedback.js';
import { defaults } from './labels.js';
import { Moment } from './moment.js';
import { Feed } from './feed.js';
import { NoticeList } from './list.js';
import { Actions } from './actions.js';
import { Panel } from './panel.js';

/**
 * The header entry to a person's notifications: a bell button with the unread count and a panel of
 * recent items.
 *
 * The count comes from `adapter.summary()` and is hidden whenever it is unknown: before it loads,
 * after a failure and while notifications are unavailable, so a stale or invented number is never
 * shown. The panel loads when opened and forgets its items when closed. It states loading, empty,
 * failure with retry, unavailable (for example when the product runs without Beyond Projects) and
 * partial results (some products did not answer), and offers "Mark all as read" and a link to the
 * full inbox. Nothing here performs a business action.
 */
export class NotificationEntry extends Disclosure {
	#adapter;
	#labels;
	#badge;
	#feed;
	#list;
	#panel;
	#limit;
	#count = null;
	#stamp = null;

	/**
	 * @param {object} options
	 * @param {{summary: Function, list: Function, read: Function, unread: Function, open: Function}} options.adapter
	 * @param {string} [options.href] the address of the full inbox
	 * @param {(destination: string, item: object) => void} [options.onopen] navigates to an opened item
	 * @param {(event: MouseEvent) => void} [options.onview] takes over the inbox link (applications that route themselves)
	 * @param {Record<string,string>} [options.products] display names by product id
	 * @param {string} [options.locale] language of relative times
	 * @param {number} [options.limit] items in the panel (default 6)
	 * @param {number} [options.interval] milliseconds between count refreshes; 0 refreshes only on demand
	 */
	constructor({ adapter, href = null, onopen = null, onview = null, products = {}, locale = undefined, limit = 6, interval = 0, labels = {} }) {
		const words = new Labels(defaults, labels);
		const badge = el('span', { class: 'bui-count', 'aria-hidden': 'true', hidden: true });
		super({ label: [icon('bell'), badge], name: words.text('button', { count: null }), align: 'end', variant: 'bell', class: 'bui-notify', onchange: open => this.#toggled(open) });
		this.#adapter = adapter;
		this.#labels = words;
		this.#badge = badge;
		this.#limit = limit;
		this.#feed = new Feed(adapter);
		const go = onopen ?? (destination => this.element.ownerDocument.defaultView.location.assign(destination));
		const actions = new Actions({ adapter, feed: this.#feed, onopen: (destination, item) => { this.close(false); go(destination, item); }, changed: () => this.#changed(), say: key => this.#panel.say(words.text(key)) });
		this.#list = new NoticeList({ labels: words, moment: new Moment(locale), products, actions });
		this.#panel = new Panel({ labels: words, id: Ids.next('bui-notify'), href, onview, retry: () => this.#load(), everything: () => this.#everything() });
		fill(this.panel, [this.#panel.element]);
		this.panel.setAttribute('aria-labelledby', this.#panel.heading);
		this.refresh();
		if (interval > 0) this.#poll(interval);
	}

	/** The unread count shown, or null while unknown. */
	get count() {
		return this.#count;
	}

	/** Reads the unread count again. */
	async refresh() {
		let summary = null;
		try {
			summary = await this.#adapter.summary();
		} catch {
			summary = null;
		}
		if (this.destroyed) return;
		const known = summary && summary.available !== false && Number.isInteger(summary.unread);
		this.#count = known ? summary.unread : null;
		this.element.dataset.state = !summary ? 'failed' : summary.available === false ? 'unavailable' : 'ready';
		this.#badge.hidden = !this.#count;
		this.#badge.textContent = this.#count > 99 ? '99+' : String(this.#count ?? '');
		this.button.setAttribute('aria-label', this.#labels.text('button', { count: this.#count }));
	}

	destroy() {
		this.#feed.clear();
		super.destroy();
	}

	#poll(interval) {
		this.later(() => {
			this.refresh();
			this.#poll(interval);
		}, interval);
	}

	#toggled(open) {
		if (open) this.#load();
		else {
			// Private text never outlives the open panel.
			this.#feed.clear();
			this.#panel.show([]);
		}
	}

	async #load() {
		this.#stamp = new Date().toISOString();
		const pending = this.#feed.load({ state: 'all', product: null, limit: this.#limit });
		this.#draw();
		if (await pending) this.#draw();
	}

	#draw() {
		const feed = this.#feed;
		const words = this.#labels;
		if (feed.state === 'loading') return this.#panel.show([loading(words.text('loading'))], false);
		if (feed.state === 'unavailable') return this.#panel.show([callout({ tone: 'info', title: words.text('unavailable') })], false);
		if (feed.state === 'failed') return this.#panel.failed(words.text('failure'));
		const partial = feed.missing.length ? callout({ tone: 'warning', title: words.text('partial', { products: feed.missing.join(', ') }) }) : null;
		const body = feed.items.length ? this.#list.render(feed.items) : el('p', { class: 'bui-empty-title', text: words.text('empty') });
		NoticeList.keep(this.panel, () => this.#panel.show([partial, body], feed.items.some(item => !item.read)));
	}

	#changed() {
		this.#draw();
		this.refresh();
	}

	async #everything() {
		try {
			await this.#adapter.read({ before: this.#stamp ?? new Date().toISOString() });
		} catch {
			this.#panel.say(this.#labels.text('update'));
			return;
		}
		await this.#load();
		this.refresh();
	}
}
