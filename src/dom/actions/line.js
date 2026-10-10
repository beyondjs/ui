import { Component } from '../core/component.js';
import { el, fill, content } from '../core/element.js';

/**
 * A quiet line of secondary actions under a piece of content (0.14.0, D102), such as an answer's Copy,
 * Copy link, Details and Changed files: one control style for the whole line, muted until hover or
 * focus (every `Button`, `CopyButton` or link in it is drawn the same), then the facts on the same line
 * (duration · tokens · cost) as a muted group of their own in tabular figures. A path in it is `code`
 * with `.bui-path`, underlined only on hover. The product brings the actions and the words; the line
 * carries no copy of its own.
 */
export class ActionLine extends Component {
	#element;
	#actions = el('div', { class: 'bui-action-line-actions' });
	#facts = el('p', { class: 'bui-action-line-facts' });

	/**
	 * @param {object} [options]
	 * @param {Array<Node|{element: Node}>} [options.actions] the quiet actions, in order
	 * @param {Array<string|Node>} [options.facts] the facts, joined by " · "
	 * @param {string|null} [options.label] the line's accessible name, when it needs one ("Answer actions")
	 */
	constructor({ actions = [], facts = [], label = null } = {}) {
		super();
		this.#element = el('div', { class: 'bui-action-line', role: label ? 'group' : null, 'aria-label': label }, [this.#actions, this.#facts]);
		this.actions = actions;
		this.facts = facts;
	}

	get element() {
		return this.#element;
	}

	/** Replaces the actions; one that stays keeps its element, so focus on it stays. */
	set actions(nodes) {
		const list = [].concat(nodes ?? []).filter(Boolean).map(node => node.element ?? node);
		if (list.length !== this.#actions.childNodes.length || list.some((node, index) => this.#actions.childNodes[index] !== node)) this.#actions.replaceChildren(...list);
		this.#actions.hidden = !list.length;
	}

	/** Replaces the facts: strings or nodes, joined by a separator that assistive technology skips. */
	set facts(values) {
		const list = [].concat(values ?? []).filter(value => value !== null && value !== undefined && value !== '');
		fill(this.#facts, list.map((value, index) => [index ? el('span', { class: 'bui-action-line-dot', 'aria-hidden': 'true', text: ' · ' }) : null, el('span', { class: 'bui-action-line-fact' }, [content(value)])]));
		this.#facts.hidden = !list.length;
	}
}
