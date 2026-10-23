import { el } from '../core/element.js';
import { TimeWords } from '../time/words.js';

/**
 * The reads one incident affected, inside "Technical details" (0.24.0, D163): a row for each with what
 * it was, its request identifier and its time; the source's words once above the rows when every read
 * said the same, else under the row that said them. Copied as one block per read. A missing request or
 * time stays an empty cell: nothing is invented.
 */
export class DetailsEntries {
	#labels;
	#locale;
	#list;

	/**
	 * @param {object} options
	 * @param {Array<{label: string, text?: string, request?: string|null, time?: string|number|Date|null}>} options.entries
	 * @param {import('../core/labels.js').Labels} options.labels the details' labels (`affected`, `request`, `time`)
	 * @param {string} [options.locale] the language of the shown times
	 */
	constructor({ entries, labels, locale = undefined }) {
		this.#labels = labels;
		this.#locale = locale;
		this.#list = entries.map(entry => ({ label: String(entry.label ?? ''), text: entry.text ? String(entry.text) : '', request: entry.request ? String(entry.request) : null, moment: TimeWords.moment(entry.time) }));
	}

	/** Whether there is any read to show. */
	get size() {
		return this.#list.length;
	}

	/** The words every read said, when they all said the same, else ''. */
	get shared() {
		const [first] = this.#list;
		if (!first?.text) return '';
		return this.#list.every(entry => entry.text === first.text) ? first.text : '';
	}

	/** The nodes shown: the shared words, then the table. */
	draw(now = Date.now()) {
		const shared = this.shared;
		const head = el('tr', {}, [this.#labels.text('affected'), this.#labels.text('request'), this.#labels.text('time')].map(text => el('th', { scope: 'col', text })));
		const rows = this.#list.flatMap(entry => [
			el('tr', {}, [
				el('th', { scope: 'row', text: entry.label }),
				el('td', {}, [entry.request ? el('code', { text: entry.request }) : null]),
				el('td', {}, [entry.moment === null ? null : el('time', { datetime: new Date(entry.moment).toISOString(), text: this.#shown(entry.moment, now) })])
			]),
			!shared && entry.text ? el('tr', { class: 'bui-details-said' }, [el('td', { colspan: '3' }, [el('pre', { class: 'bui-details-text', text: entry.text })])]) : null
		]);
		return [shared ? el('pre', { class: 'bui-details-text', text: shared }) : null, el('table', { class: 'bui-details-table' }, [el('thead', {}, [head]), el('tbody', {}, rows)])];
	}

	/** What the copy action copies: the shared words, then a block per read with its request and time in ISO 8601. */
	get report() {
		const shared = this.shared;
		const blocks = this.#list.map(entry =>
			[
				entry.label,
				entry.request ? `${this.#labels.text('request')}: ${entry.request}` : null,
				entry.moment === null ? null : `${this.#labels.text('time')}: ${new Date(entry.moment).toISOString()}`,
				shared ? null : entry.text || null
			]
				.filter(Boolean)
				.join('\n')
		);
		return [shared || null, ...blocks].filter(Boolean).join('\n\n');
	}

	/** The time of day with seconds on `now`'s day, with the day on another. */
	#shown(moment, now) {
		const day = new Date(moment).toDateString() === new Date(now).toDateString();
		const shape = day ? { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' } : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' };
		return new Intl.DateTimeFormat(this.#locale, shape).format(new Date(moment));
	}
}
