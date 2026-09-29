import { Component } from './core/component.js';
import { el, content } from './core/element.js';
import { icon } from './core/icons.js';
import { Ids } from './core/ids.js';
import { Labels } from './core/labels.js';
import { badge } from './feedback.js';

const defaults = { owner: 'Who can change this: ' };

/** The icon of each kind: a lock for access, a plug for a missing association, information for a capability. */
export const glyphs = { access: 'lock', association: 'plug', capability: 'info' };

/**
 * "Not available here" (decision D06): a missing permission, admission, association or capability
 * explained in place, in four parts: what is unavailable (`title`), why (`reason`), who can change
 * it (`owner`) and the action open to this person (`action`, `secondary`). An optional `code` shows
 * the refusal's code as a tag.
 *
 * It replaces refusal cards, raw error envelopes and hidden buttons, and never looks like a failure
 * of the product: its tones are warning, information and neutral, never danger. It decides nothing:
 * the product states the refusal it received.
 */
export class Unavailable extends Component {
	#element;

	/**
	 * @param {object} options
	 * @param {string|Node} options.title what is unavailable
	 * @param {string|Node} options.reason why
	 * @param {string|Node} [options.owner] who can change it
	 * @param {Node} [options.action] the action open to this person, usually a button
	 * @param {Node} [options.secondary] another action
	 * @param {'access'|'association'|'capability'} [options.kind]
	 * @param {string} [options.code] the refusal's code
	 * @param {2|3|4|5|6} [options.level] the heading level (2)
	 */
	constructor({ title, reason, owner = null, action = null, secondary = null, kind = 'access', code = null, level = 2, labels = {} }) {
		super();
		const type = glyphs[kind] ? kind : 'access';
		const id = Ids.next('bui-unavailable');
		const text = new Labels(defaults, labels);
		this.#element = el('section', { class: `bui-unavailable bui-unavailable-${type}`, 'data-unavailable': type, 'aria-labelledby': id }, [
			el('span', { class: 'bui-unavailable-icon' }, [icon(glyphs[type])]),
			el('div', { class: 'bui-unavailable-body' }, [
				el(`h${Unavailable.level(level)}`, { id, class: 'bui-unavailable-title' }, [content(title)]),
				el('p', { class: 'bui-unavailable-reason' }, [content(reason)]),
				owner ? el('p', { class: 'bui-unavailable-owner' }, [el('span', { class: 'bui-unavailable-label', text: text.text('owner') }), content(owner)]) : null,
				code ? el('p', { class: 'bui-unavailable-code' }, [badge(code, 'neutral')]) : null,
				action || secondary ? el('div', { class: 'bui-unavailable-actions' }, [action, secondary]) : null
			])
		]);
	}

	get element() {
		return this.#element;
	}

	/** A heading level from 2 to 6; anything else is 2. */
	static level(value) {
		return [2, 3, 4, 5, 6].includes(Number(value)) ? Number(value) : 2;
	}
}
