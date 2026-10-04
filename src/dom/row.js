import { Component } from './core/component.js';
import { el, fill, content } from './core/element.js';
import { glyph } from './core/icons.js';
import { Ids } from './core/ids.js';
import { Labels } from './core/labels.js';
import { ActionMenu } from './menu.js';
import { Unavailable } from './unavailable.js';
import { Freshness } from './operations/freshness.js';
import { Clock } from './time/clock.js';

const words = {
	en: { owner: 'Who can change this: ', more: 'More actions for {title}' },
	es: { owner: 'Quién puede cambiarlo: ', more: 'Más acciones de {title}' }
};
const glyphs = { success: 'check', warning: 'alert', danger: 'alert', info: 'info', neutral: 'info', progress: 'clock' };

/**
 * One thing with one state, such as a GitHub connection, a person's GitHub account or an AI engine
 * (design S3, E54's "one row per engine"): one state, its reason, who can fix it, and the one action
 * open to this person.
 *
 * A region named by its title, with its kind beside it ("GitHub organization"); the state with how
 * fresh it is (`Freshness`: "Ready · Checked 2 min ago", or "Last known: …" while the source is
 * disconnected); the reason in words; "Who can change this: …"; a few facts; then the state's one
 * `action` and "More actions" (`more`, an `ActionMenu`) at the end. The state's tone draws a glyph
 * beside the title; the words carry the meaning, never the color. `update` replaces any part.
 */
export class StatusRow extends Component {
	/** The copy in English and Spanish. */
	static labels = Object.freeze({ en: Object.freeze(words.en), es: Object.freeze(words.es) });

	#element;
	#parts;
	#labels;
	#fresh;
	#menu = null;
	#values;
	#id;

	/**
	 * @param {object} options
	 * @param {string|Node} options.title what it is ("acme")
	 * @param {string|Node} [options.kind] what kind of thing ("GitHub organization")
	 * @param {{label: string, tone?: string, checked?: unknown, connected?: boolean}} options.state its one state
	 * @param {string|Node} [options.reason] why it is in that state
	 * @param {string|Node} [options.owner] who can change it
	 * @param {Array<string|Node>} [options.facts] short lines ("Linked by Ada · 12 Sep")
	 * @param {Node|null} [options.action] the state's one action, usually a button
	 * @param {Array<object>} [options.more] further actions (`ActionMenu` items)
	 * @param {2|3|4|5|6} [options.level] the title's heading level (3)
	 * @param {Clock} [options.clock] the page's clock
	 */
	constructor({ title, kind = null, state, reason = null, owner = null, facts = [], action = null, more = [], level = 3, clock = Clock.system, locale = undefined, labels = {} }) {
		super();
		const { freshness = {}, ...own } = labels ?? {};
		this.#labels = new Labels(words.en, own);
		this.#id = Ids.next('bui-statusrow');
		this.#fresh = new Freshness({ label: state.label, tone: state.tone ?? 'neutral', checked: state.checked ?? null, connected: state.connected ?? true, clock, locale, labels: freshness });
		this.#parts = {
			mark: el('span', { class: 'bui-statusrow-mark', 'aria-hidden': 'true' }),
			title: el(`h${Unavailable.level(level)}`, { id: this.#id, class: 'bui-statusrow-title' }),
			kind: el('span', { class: 'bui-statusrow-kind' }),
			reason: el('p', { class: 'bui-statusrow-reason' }),
			owner: el('p', { class: 'bui-statusrow-owner' }),
			facts: el('ul', { class: 'bui-statusrow-facts' }),
			actions: el('div', { class: 'bui-statusrow-actions' })
		};
		const parts = this.#parts;
		this.#element = el('section', { class: 'bui-statusrow', 'aria-labelledby': this.#id }, [
			el('div', { class: 'bui-statusrow-main' }, [el('div', { class: 'bui-statusrow-head' }, [parts.mark, parts.title, parts.kind]), el('div', { class: 'bui-statusrow-state' }, [this.#fresh.element]), parts.reason, parts.owner, parts.facts]),
			parts.actions
		]);
		this.#values = {};
		this.update({ title, kind, state, reason, owner, facts, action, more });
	}

	get element() {
		return this.#element;
	}

	/** The state as it reads: its words and how fresh it is. */
	get text() {
		return this.#fresh.text;
	}

	/** Replaces any of `title`, `kind`, `state`, `reason`, `owner`, `facts`, `action` and `more`. */
	update(values = {}) {
		this.#values = { ...this.#values, ...values };
		const { title, kind, state, reason, owner, facts, action, more } = this.#values;
		const parts = this.#parts;
		fill(parts.title, [content(title)]);
		fill(parts.kind, kind ? [content(kind)] : []);
		parts.kind.hidden = !kind;
		const tone = state.connected === false ? 'neutral' : (state.tone ?? 'neutral');
		parts.mark.className = `bui-statusrow-mark bui-statusrow-${tone}`;
		fill(parts.mark, [glyph(glyphs[tone] ?? 'info')]);
		this.#fresh.update({ label: state.label, tone: state.tone ?? 'neutral', checked: state.checked ?? null, connected: state.connected ?? true });
		fill(parts.reason, reason ? [content(reason)] : []);
		parts.reason.hidden = !reason;
		fill(parts.owner, owner ? [el('span', { class: 'bui-statusrow-label', text: this.#labels.text('owner') }), content(owner)] : []);
		parts.owner.hidden = !owner;
		fill(parts.facts, (facts ?? []).filter(Boolean).map(fact => el('li', {}, [content(fact)])));
		parts.facts.hidden = !facts?.length;
		this.#menu?.destroy();
		this.#menu = more?.filter(Boolean).length ? new ActionMenu({ label: null, name: this.#labels.text('more', { title: typeof title === 'string' ? title : (title?.textContent ?? '') }), items: more }) : null;
		fill(parts.actions, [action?.element ?? action, this.#menu?.element]);
		parts.actions.hidden = !parts.actions.childElementCount;
	}

	destroy() {
		this.#menu?.destroy();
		this.#fresh.destroy();
		super.destroy();
	}
}
