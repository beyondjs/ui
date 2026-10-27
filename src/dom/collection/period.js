import { Labels } from '../core/labels.js';
import { words } from './tools-labels.js';

const DAY = 86400000;
const forms = Object.freeze({ days: /^P([1-9]\d{0,2})D$/, month: /^(\d{4})-(0[1-9]|1[0-2])$/, span: /^(\d{4}-\d{2}-\d{2})\/(\d{4}-\d{2}-\d{2})$/ });

/**
 * The periods of a collection's period filter (0.44.0, the list rule L8): a chooser of periods kept in the
 * filter state as text, as every other filter's value is, so the address reproduces it. A value is one of
 * three forms, all in UTC days, as the family's usage and cost records count them:
 *
 * - `P30D`, the last 30 days, today included (an ISO 8601 duration of 1 to 999 days);
 * - `2026-10`, a calendar month;
 * - `2026-09-01/2026-09-15`, a span of days, both included: never offered by the chooser, a person never
 *   types it, but restored from an address a product wrote (the life of one job so far) and named there.
 *
 * The chooser offers the filter's `days` (7 and 30 by default) and its `months` (3: this month and the two
 * before it); a well-formed value outside them, such as an older month from the address, is offered with
 * its own name. `Period.range(value)` gives a product's source the range to read.
 */
export class Period {
	#filter;
	#labels;

	/**
	 * @param {{ days?: number[], months?: number, now?: () => Date|number }} filter the filter's definition
	 * @param {Labels|object} [labels] the tools' words (`Collection.Tools.labels.es`): `days`, `span` and `locale`
	 */
	constructor(filter, labels = {}) {
		this.#filter = filter;
		this.#labels = labels instanceof Labels ? labels : new Labels(words.en, labels);
	}

	/** The choices the filter offers: its last days, then its months, the current one first. */
	get options() {
		const { days = [7, 30], months = 3 } = this.#filter;
		const now = new Date(this.#filter.now?.() ?? Date.now());
		const listed = Array.from({ length: Math.max(0, months) }, (_, back) => Period.#month(now, back));
		return [...days.map(count => `P${count}D`), ...listed].map(value => this.option(value)).filter(Boolean);
	}

	/**
	 * A value as an option `{ value, label }`, or null when it is not a period
	 *
	 * @param {string} value
	 */
	option(value) {
		const shape = Period.#shape(value);
		if (!shape) return null;
		const locale = this.#labels.text('locale');
		if (shape.kind === 'days') return { value, label: this.#labels.text('days', { count: shape.count }) };
		if (shape.kind === 'month') return { value, label: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(shape.start) };
		const day = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
		return { value, label: this.#labels.text('span', { start: day.format(shape.start), end: day.format(shape.last) }) };
	}

	/**
	 * The range a period covers, its `start` included and its `end` excluded, in UTC; null for no period
	 * (an empty or malformed value). `P30D` ends at the end of today by `now`.
	 *
	 * @param {string|null|undefined} value
	 * @param {{ now?: Date|number }} [options]
	 * @returns {{ start: Date, end: Date }|null}
	 */
	static range(value, { now = Date.now() } = {}) {
		const shape = Period.#shape(value);
		if (!shape) return null;
		if (shape.kind !== 'days') return { start: shape.start, end: new Date(shape.last.getTime() + (shape.kind === 'month' ? 0 : DAY)) };
		const today = new Date(now);
		const end = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) + DAY;
		return { start: new Date(end - shape.count * DAY), end: new Date(end) };
	}

	/** Whether a value is a period of one of the three forms */
	static valid(value) {
		return Boolean(Period.#shape(value));
	}

	/** A value's form and bounds: a month's `last` is its end, a span's its last day */
	static #shape(value) {
		const text = String(value ?? '');
		const days = forms.days.exec(text);
		if (days) return { kind: 'days', count: Number(days[1]) };
		const month = forms.month.exec(text);
		if (month) {
			const [year, index] = [Number(month[1]), Number(month[2]) - 1];
			return { kind: 'month', start: new Date(Date.UTC(year, index, 1)), last: new Date(Date.UTC(year, index + 1, 1)) };
		}
		const span = forms.span.exec(text);
		if (!span) return null;
		const [start, last] = [Period.#day(span[1]), Period.#day(span[2])];
		return start && last && start <= last ? { kind: 'span', start, last } : null;
	}

	/** A `YYYY-MM-DD` day at UTC midnight, or null when the calendar has no such day */
	static #day(text) {
		const date = new Date(`${text}T00:00:00Z`);
		return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text ? null : date;
	}

	static #month(now, back) {
		const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, 1));
		return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
	}
}
