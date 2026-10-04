import { Component } from '../core/component.js';
import { el, fill } from '../core/element.js';
import { Labels } from '../core/labels.js';
import { Clipboard } from '../core/clipboard.js';
import { Button } from '../button.js';
import { TimeWords } from '../time/words.js';
import { details } from './labels.js';

/**
 * "Technical details" (decision D43 as amended on 2026-10-03): a closed disclosure under a failure or
 * a blocked step, holding the source's own words, the request identifier and the time, with one
 * action that copies all of it for support.
 *
 * It is a native `<details>`: the summary opens it with a press, Enter or Space. The copy goes through
 * the Clipboard API under a bound; when the browser refuses it (no API, no permission, no answer
 * within `TechnicalDetails.bound`) the component says so in place and selects the text, so the person
 * copies it with the keyboard. The time is shown in the person's language and copied as ISO 8601.
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
	#values = { text: '', request: null, time: null };

	/**
	 * @param {object} options
	 * @param {string} [options.text] the source's own words (an error message, a command's output)
	 * @param {string|null} [options.request] the request identifier
	 * @param {string|number|Date|null} [options.time] when it happened
	 * @param {boolean} [options.open] starts open
	 * @param {string} [options.locale] the language of the shown time
	 */
	constructor({ text = '', request = null, time = null, open = false, locale = undefined, labels = {} } = {}) {
		super();
		this.#labels = new Labels(details.en, labels);
		this.#locale = locale;
		this.#content = el('div', { class: 'bui-details-content' });
		this.#result = el('p', { class: 'bui-details-result', role: 'status' });
		this.#button = new Button({ label: this.#labels.text('copy'), small: true, onclick: () => this.#button.run(() => this.copy()) });
		this.#element = el('details', { class: 'bui-details', open }, [
			el('summary', { class: 'bui-details-summary', text: this.#labels.text('summary') }),
			el('div', { class: 'bui-details-body' }, [this.#content, el('div', { class: 'bui-details-actions' }, [this.#button.element, this.#result])])
		]);
		this.update({ text, request, time });
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

	/** Everything the copy action copies: the words, then the request and the time, one per line. */
	get report() {
		const { text, request, time } = this.#values;
		const moment = TimeWords.moment(time);
		return [
			text,
			request ? `${this.#labels.text('request')}: ${request}` : null,
			moment === null ? null : `${this.#labels.text('time')}: ${new Date(moment).toISOString()}`
		].filter(Boolean).join('\n');
	}

	/** Replaces any of `text`, `request` and `time`. */
	update(values = {}) {
		this.#values = { ...this.#values, ...values };
		const { text, request } = this.#values;
		const moment = TimeWords.moment(this.#values.time);
		const facts = [
			request ? [this.#labels.text('request'), el('code', { text: String(request) })] : null,
			moment === null ? null : [this.#labels.text('time'), el('time', { datetime: new Date(moment).toISOString(), text: this.#shown(moment) })]
		].filter(Boolean);
		fill(this.#content, [
			text ? el('pre', { class: 'bui-details-text', text: String(text) }) : null,
			facts.length ? el('dl', { class: 'bui-details-facts' }, facts.map(([term, value]) => el('div', {}, [el('dt', { text: term }), el('dd', {}, [value])]))) : null
		]);
		this.#result.textContent = '';
	}

	/**
	 * Copies the report. Resolves true when the clipboard took it; false when it was refused, after
	 * saying so in place and selecting the text.
	 */
	async copy() {
		const copied = await Clipboard.write(this.#element.ownerDocument, this.report, TechnicalDetails.bound);
		if (this.destroyed) return copied;
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
