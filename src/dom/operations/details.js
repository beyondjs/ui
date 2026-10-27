import { Component } from '../core/component.js';
import { el, fill } from '../core/element.js';
import { Labels } from '../core/labels.js';
import { Clipboard } from '../core/clipboard.js';
import { Button } from '../button.js';
import { glyph } from '../core/icons.js';
import { TimeWords } from '../time/words.js';
import { details } from './labels.js';
import { DetailsEntries } from './entries.js';

/**
 * "Technical details" (decision D43 as amended on 2026-10-03): a closed disclosure under a failure or
 * a blocked step, holding the source's own words, the request identifier and the time, with one
 * action that copies all of it for support.
 *
 * It is a native `<details>`: the summary opens it with a press, Enter or Space. Since 0.11.2 its summary
 * is the family's one disclosure affordance (`bui-summary`: a chevron that turns, the words in the text
 * color), never a link's look. The copy goes through
 * the Clipboard API under a bound; when the browser refuses it (no API, no permission, no answer
 * within `TechnicalDetails.bound`) the component says so in place and selects the text, so the person
 * copies it with the keyboard. The time is shown in the person's language and copied as ISO 8601.
 *
 * Since 0.24.0 (D163) `entries` holds the reads one incident affected, one row each with its request and
 * time, so an outage keeps every read's evidence under one disclosure instead of one per read.
 */
export class TechnicalDetails extends Component {
	/** The copy in English and Spanish. */
	static labels = details;
	/** Milliseconds the clipboard may take before the copy counts as refused. */
	static bound = 5000;

	#element;
	#labels;
	#locale;
	#content;
	#result;
	#button;
	#revision = 0;
	#values = { text: '', request: null, time: null, entries: [] };

	/**
	 * @param {object} options
	 * @param {string} [options.text] the source's own words (an error message, a command's output)
	 * @param {string|null} [options.request] the request identifier
	 * @param {string|number|Date|null} [options.time] when it happened
	 * @param {Array<{label: string, text?: string, request?: string|null, time?: string|number|Date|null}>} [options.entries] the reads one incident affected (0.24.0)
	 * @param {boolean} [options.open] starts open
	 * @param {string} [options.locale] the language of the shown time
	 */
	constructor({ text = '', request = null, time = null, entries = [], open = false, locale = undefined, labels = {} } = {}) {
		super();
		this.#labels = new Labels(details, labels, locale);
		this.#locale = locale;
		this.#content = el('div', { class: 'bui-details-content' });
		this.#result = el('p', { class: 'bui-details-result', role: 'status' });
		this.#button = new Button({ label: this.#labels.text('copy'), small: true, onclick: () => this.#button.run(() => this.copy()) });
		this.#element = el('details', { class: 'bui-details', open }, [
			el('summary', { class: 'bui-details-summary bui-summary' }, [glyph('chevron'), el('span', { text: this.#labels.text('summary') })]),
			el('div', { class: 'bui-details-body' }, [this.#content, el('div', { class: 'bui-details-actions' }, [this.#button.element, this.#result])])
		]);
		this.update({ text, request, time, entries });
	}

	get element() {
		return this.#element;
	}

	get open() {
		return this.#element.open;
	}

	set open(value) {
		this.#element.open = Boolean(value);
	}

	/** Everything the copy action copies: the words, then the request and the time, one per line, then a block per affected read. */
	get report() {
		const { text, request, time } = this.#values;
		const moment = TimeWords.moment(time);
		const own = [
			text,
			request ? `${this.#labels.text('request')}: ${request}` : null,
			moment === null ? null : `${this.#labels.text('time')}: ${new Date(moment).toISOString()}`
		].filter(Boolean).join('\n');
		return [own, this.#entries().report].filter(Boolean).join('\n\n');
	}

	/** Replaces any of `text`, `request`, `time` and `entries`. */
	update(values = {}) {
		this.#revision++;
		this.#values = { ...this.#values, ...values, entries: values.entries ?? this.#values.entries ?? [] };
		const { text, request } = this.#values;
		const moment = TimeWords.moment(this.#values.time);
		const facts = [
			request ? [this.#labels.text('request'), el('code', { text: String(request) })] : null,
			moment === null ? null : [this.#labels.text('time'), el('time', { datetime: new Date(moment).toISOString(), text: this.#shown(moment) })]
		].filter(Boolean);
		const entries = this.#entries();
		fill(this.#content, [
			text ? el('pre', { class: 'bui-details-text', text: String(text) }) : null,
			facts.length ? el('dl', { class: 'bui-details-facts' }, facts.map(([term, value]) => el('div', {}, [el('dt', { text: term }), el('dd', {}, [value])]))) : null,
			entries.size ? entries.draw() : null
		]);
		this.#result.textContent = '';
	}

	#entries() {
		return new DetailsEntries({ entries: this.#values.entries ?? [], labels: this.#labels, locale: this.#locale });
	}

	/**
	 * Copies the report. Resolves true when the clipboard took it; false when it was refused, after
	 * saying so in place and selecting the text.
	 */
	async copy() {
		const revision = this.#revision;
		const copied = await Clipboard.write(this.#element.ownerDocument, this.report, TechnicalDetails.bound);
		if (this.destroyed || revision !== this.#revision) return copied;
		this.#result.textContent = this.#labels.text(copied ? 'copied' : 'refused');
		this.#result.classList.toggle('bui-details-refused', !copied);
		if (!copied) Clipboard.select(this.#content);
		return copied;
	}

	destroy() {
		this.#button.destroy();
		super.destroy();
	}

	#shown(moment) {
		return new Intl.DateTimeFormat(this.#locale, { dateStyle: 'medium', timeStyle: 'medium', hourCycle: 'h23' }).format(new Date(moment));
	}
}
