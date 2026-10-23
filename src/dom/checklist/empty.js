import { Component } from '../core/component.js';
import { el, content } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Labels } from '../core/labels.js';
import { Checklist } from './checklist.js';

const defaults = { clear: 'Clear the filter', outage: 'Not available right now' };
const marks = { empty: 'box', match: 'search', context: 'folder', outage: 'globe' };

/**
 * A place with nothing to show yet (0.15.0, DQ-17), which the family tells apart (navigation rule): no
 * data yet (`kind: 'empty'`), nothing that matches a filter (`'match'`, with "Clear the filter" when the
 * product gives `clear`) and a missing context such as no project chosen (`'context'`). It says a title,
 * at most one sentence, and offers one primary action; a first run may carry a `Checklist` of the steps
 * that set the place up instead of four empty sections.
 *
 * Since 0.24.0 (D163) a place whose read did not answer is `'outage'`: "Not available right now" by
 * default, with the outage's mark and no action of its own, since who did not answer and the one Try
 * again are said once by the page's `Recovery`. It is never drawn as empty: a failed read is unavailable.
 * Since 0.24.1 it is one quiet line, the mark beside its words, with no box unless `frame` asks for one:
 * several places of one outage never read as a stack of boxes.
 */
export class EmptyState extends Component {
	/** The copy in English and Spanish. */
	static labels = Object.freeze({ en: Object.freeze({ ...defaults }), es: Object.freeze({ clear: 'Quitar el filtro', outage: 'No disponible en este momento' }) });

	#element;
	#checklist = null;

	/**
	 * @param {object} options
	 * @param {'empty'|'match'|'context'|'outage'} [options.kind]
	 * @param {string|Node} [options.title] what is not here yet; an outage says "Not available right now" by default
	 * @param {string|Node|null} [options.text] one sentence, at most
	 * @param {Node|{label: string, href?: string|null, run?: (event: Event) => void}|null} [options.action] the one primary action, never an outage's
	 * @param {(() => void)|null} [options.clear] clears the filter (`kind: 'match'`)
	 * @param {ConstructorParameters<typeof Checklist>[0]|Checklist|null} [options.checklist] a first run's steps
	 * @param {string|null} [options.glyph] another mark from the catalog
	 * @param {boolean|null} [options.frame] false inside a region that is framed already, as `waiting`'s (0.24.0); an
	 * outage is unframed unless it is true (0.24.1)
	 */
	constructor({ kind = 'empty', title = null, text = null, action = null, clear = null, checklist = null, glyph: mark = null, frame = null, labels = {} }) {
		super();
		const type = Object.hasOwn(marks, kind) ? kind : 'empty';
		const words = new Labels(defaults, labels);
		const outage = type === 'outage';
		frame ??= !outage;
		this.#checklist = outage ? null : checklist instanceof Checklist ? checklist : checklist ? new Checklist(checklist) : null;
		const actions = outage ? [] : [EmptyState.#action(action), type === 'match' && clear ? el('button', { type: 'button', class: 'bui-button bui-button-quiet bui-button-small', onclick: () => clear() }, [el('span', { text: words.text('clear') })]) : null].filter(Boolean);
		this.#element = el('div', { class: `bui-empty bui-empty-${type}${frame ? '' : ' bui-empty-unframed'}`, 'data-kind': type }, [
			el('span', { class: 'bui-empty-mark', 'aria-hidden': 'true' }, [glyph(mark ?? marks[type])]),
			el('p', { class: 'bui-empty-title' }, [content(title ?? (outage ? words.text('outage') : ''))]),
			text ? el('p', { class: 'bui-empty-body' }, [content(text)]) : null,
			actions.length ? el('div', { class: 'bui-empty-actions' }, actions) : null,
			this.#checklist?.element ?? null
		]);
	}

	get element() {
		return this.#element;
	}

	/** The first run's checklist, when it has one. */
	get checklist() {
		return this.#checklist;
	}

	destroy() {
		this.#checklist?.destroy();
		super.destroy();
	}

	static #action(action) {
		if (!action) return null;
		if (typeof action.nodeType === 'number') return action;
		const { label, href = null, run = null } = action;
		const node = href ? el('a', { class: 'bui-button bui-button-primary', href }) : el('button', { type: 'button', class: 'bui-button bui-button-primary' });
		node.append(el('span', { text: label }));
		if (run) node.addEventListener('click', event => run(event));
		return node;
	}
}
