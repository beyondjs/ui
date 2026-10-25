import { Component } from './core/component.js';
import { el, content } from './core/element.js';
import { glyph } from './core/icons.js';
import { Ids } from './core/ids.js';
import { Labels } from './core/labels.js';
import { badge } from './feedback.js';
import { TechnicalDetails } from './operations/details.js';
import { RetryAction } from './again/action.js';
import { Again } from './again/again.js';
import { AgainLine } from './again/line.js';

const defaults = { owner: 'Who can change this: ', retry: 'Try again', ...AgainLine.labels.en, offline: 'You’re offline' };

/**
 * The icon of each kind: a lock for access, a plug for a missing association, information for a
 * capability, and since 0.15.0 a globe for a service that does not answer (`outage`), which is never a
 * denial (PKG-16).
 */
export const glyphs = { access: 'lock', association: 'plug', capability: 'info', outage: 'globe' };

/**
 * "Not available here" (decision D06): a missing permission, admission, association or capability
 * explained in place, in four parts: what is unavailable (`title`), why (`reason`), who can change
 * it (`owner`) and the action open to this person (`action`, `secondary`). An optional `code` shows
 * the refusal's code as a tag.
 *
 * It replaces refusal cards, raw error envelopes and hidden buttons, and never looks like a failure
 * of the product: its tones are warning, information and neutral, never danger. It decides nothing:
 * the product states the refusal it received. Since 0.15.0 (D43) `details` (`{ request, time, text }`)
 * adds the closed "Technical details" with the request identifier and the time, copyable for support.
 *
 * Since 0.17.1 an outage (`kind: 'outage'`) given its read as `again` tries again by itself (D132):
 * `Again`'s schedule, the line "Last tried 12:04 · trying again by itself" under its words, and a
 * "Try again" when the product passes no `action` of its own (a product's own Try again calls
 * `unavailable.again.now()`). The read that found the outage is the first try; when the read answers the
 * waiting ends, and the product draws what it answered. A refusal is never tried again: `again` is
 * ignored for every other kind. Offline (0.33.0) its reason says "You're offline" in place of who did not
 * answer and its own Try again waits hidden, since nothing can answer; it tries again once the browser
 * is online, as `Recovery` does.
 */
export class Unavailable extends Component {
	/** The copy in English and Spanish (0.7.1). */
	static labels = Object.freeze({ en: Object.freeze({ ...defaults }), es: Object.freeze({ owner: 'Quién puede cambiarlo: ', retry: 'Reintentar', ...AgainLine.labels.es, offline: 'Estás sin conexión' }) });

	#element;
	#details = null;
	#again = null;
	#line = null;
	#action = null;
	#release = null;
	#reason = null;

	/**
	 * @param {object} options
	 * @param {string|Node} options.title what is unavailable
	 * @param {string|Node} options.reason why
	 * @param {string|Node} [options.owner] who can change it
	 * @param {Node} [options.action] the action open to this person, usually a button
	 * @param {Node} [options.secondary] another action
	 * @param {'access'|'association'|'capability'|'outage'} [options.kind]
	 * @param {string} [options.code] the refusal's code
	 * @param {2|3|4|5|6} [options.level] the heading level (2)
	 * @param {{request?: string|null, time?: string|number|Date|null, text?: string, locale?: string, labels?: object}|null} [options.details] technical details (0.15.0)
	 * @param {(() => Promise<unknown>)|{run: () => Promise<unknown>}|null} [options.again] an outage's read, or `Again`'s options (0.17.1)
	 * @param {string} [options.locale] the language of the line's time of day (0.17.1)
	 */
	constructor({ title, reason, owner = null, action = null, secondary = null, kind = 'access', code = null, level = 2, labels = {}, details = null, again = null, locale = undefined }) {
		super();
		const type = glyphs[kind] ? kind : 'access';
		const id = Ids.next('bui-unavailable');
		const text = new Labels(defaults, labels);
		this.#details = details ? new TechnicalDetails(details) : null;
		if (type === 'outage' && again) {
			this.#again = new Again(typeof again === 'function' ? { run: again } : again);
			this.#line = new AgainLine({ again: this.#again, locale, labels, now: typeof again === 'function' ? undefined : again.now });
			if (!action) {
				this.#action = new RetryAction({ labels: { retry: text.text('retry') }, run: () => this.#again.now() });
				action = this.#action.element;
			}
			const said = el('span', {}, [content(reason)]);
			this.#reason = { said, away: el('span', { hidden: true, text: text.text('offline') }) };
			reason = [said, this.#reason.away];
			this.#release = this.#again.listen(state => this.#show(state));
		}
		this.#element = el('section', { class: `bui-unavailable bui-unavailable-${type}`, 'data-unavailable': type, 'aria-labelledby': id }, [
			el('span', { class: 'bui-unavailable-icon' }, [glyph(glyphs[type])]),
			el('div', { class: 'bui-unavailable-body' }, [
				el(`h${Unavailable.level(level)}`, { id, class: 'bui-unavailable-title' }, [content(title)]),
				el('p', { class: 'bui-unavailable-reason' }, [].concat(reason).map(content)),
				owner ? el('p', { class: 'bui-unavailable-owner' }, [el('span', { class: 'bui-unavailable-label', text: text.text('owner') }), content(owner)]) : null,
				code ? el('p', { class: 'bui-unavailable-code' }, [badge(code, 'neutral')]) : null,
				this.#line?.element ?? null,
				action || secondary ? el('div', { class: 'bui-unavailable-actions' }, [action, secondary]) : null,
				this.#details?.element ?? null
			])
		]);
		this.#again?.start();
		if (this.#again) this.#show(this.#again.moments);
	}

	get element() {
		return this.#element;
	}

	/** The technical details shown, or null (0.15.0). */
	get details() {
		return this.#details;
	}

	/** What tries an outage again (`Again`), or null (0.17.1): a product's own Try again calls `again.now()`. */
	get again() {
		return this.#again;
	}

	destroy() {
		this.#release?.();
		this.#action?.destroy();
		this.#again?.stop();
		this.#line?.destroy();
		this.#details?.destroy();
		super.destroy();
	}

	/** An outage's line while it waits: its own Try again busy while a try runs, and offline the person's cause */
	#show({ trying, offline }) {
		if (this.#action) {
			this.#action.busy = trying;
			this.#action.element.hidden = offline;
		}
		this.#reason.said.hidden = offline;
		this.#reason.away.hidden = !offline;
	}

	/** A heading level from 2 to 6; anything else is 2. */
	static level(value) {
		return [2, 3, 4, 5, 6].includes(Number(value)) ? Number(value) : 2;
	}
}
