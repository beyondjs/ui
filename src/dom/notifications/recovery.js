import { Again } from '../again/again.js';
import { AgainLine } from '../again/line.js';

/** An unavailable notification relay is retried; missing setup and access are answered states. */
export class Recovery {
	#again;
	#line;

	constructor({ run, locale, labels }) {
		this.#again = new Again({ run });
		this.#line = new AgainLine({ again: this.#again, locale, labels });
	}

	static outage(feed) {
		return feed.state === 'unavailable' && [null, 'projects_unavailable', 'accounts_unavailable'].includes(feed.reason);
	}

	get element() {
		return this.#line.element;
	}

	update(feed) {
		if (['loading', 'more'].includes(feed.state)) return;
		if (Recovery.outage(feed)) this.#again.start();
		else this.#again.stop();
	}

	stop() {
		this.#again.stop();
	}

	destroy() {
		this.stop();
		this.#line.destroy();
	}
}
