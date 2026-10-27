import { Component } from '../core/component.js';
import { el, content } from '../core/element.js';
import { glyph } from '../core/icons.js';
import { Labels } from '../core/labels.js';
import { Checklist } from './checklist.js';
import { EmptyAction } from './action.js';

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
 * several places of one outage never read as a stack of boxes. Since 0.33.0 `inline` draws that line as
 * phrasing content (`span`s) for a table's cell or a row's value, where a block cannot go: the outage's
 * mark and "Not available right now" on one muted line of the cell's size.
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
	 * @param {boolean} [options.inline] an outage's place in a cell or a row's value, as phrasing content (0.33.0)
	 */
	constructor({ kind = 'empty', title = null, text = null, action = null, clear = null, checklist = null, glyph: mark = null, frame = null, inline = false, labels = {} }) {
		super();
		const type = Object.hasOwn(marks, kind) ? kind : 'empty';
		const words = new Labels(EmptyState.labels, labels);
		const outage = type === 'outage';
		if (outage && inline) {
			this.#element = el('span', { class: 'bui-empty-inline', 'data-kind': type }, [el('span', { class: 'bui-empty-mark', 'aria-hidden': 'true' }, [glyph(mark ?? marks[type])]), el('span', { class: 'bui-empty-said' }, [content(title ?? words.text('outage'))])]);
			return;
		}
		frame ??= !outage;
		this.#checklist = outage ? null : checklist instanceof Checklist ? checklist : checklist ? new Checklist(checklist) : null;
		const actions = outage ? [] : [EmptyAction.draw(action), type === 'match' && clear ? el('button', { type: 'button', class: 'bui-button bui-button-quiet bui-button-small', onclick: () => clear() }, [el('span', { text: words.text('clear') })]) : null].filter(Boolean);
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
}
