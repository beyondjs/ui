import { el, content } from './core/element.js';
import { Labels } from './core/labels.js';
import { callout } from './feedback.js';

const copy = Object.freeze({
	en: Object.freeze({ unchanged: 'Nothing was changed.', maybe: 'The change may have been made.', check: 'Check before trying again.' }),
	es: Object.freeze({ unchanged: 'No se cambió nada.', maybe: 'Puede que el cambio se haya hecho.', check: 'Compruébalo antes de volver a intentarlo.' })
});

/**
 * A change that did not get its answer, said at the operation the family's way (D186, 0.33.0), in the
 * warning tone and announced politely, never as a failure of the person's or the product's:
 *
 * - `{ outcome: 'unavailable', cause }`: the service answered that it could not make it (a 503
 *   `UNAVAILABLE`), so who did not answer (`cause`, from the family's catalog: "Beyond Projects did not
 *   answer") and "Nothing was changed." The person's own action is the way to try again.
 * - `{ outcome: 'unknown', cause?, check?, details? }`: no answer arrived (a timeout, a dropped
 *   connection), so the change may have been made: "The change may have been made.", who did not answer
 *   when known, "Check before trying again.", the way to check (`check`: a node, or `{ label, href }` /
 *   `{ label, run }`, such as a read again or the object's page) and the request under Technical details.
 *   It is never sent again by itself.
 *
 * Anything else is not an outcome of this kind: a string stays in the danger tone, for refusals' errors
 * and failures that are not outages, and `{ text, tone: 'warning' }` says a product's own words in the
 * warning tone, politely. `FocusedForm`, `confirm` and `prompt` draw what their `explain(error)` returns
 * through `answer`.
 */
export class ChangeOutcome {
	/** The copy in English and Spanish. */
	static labels = copy;

	/** Whether `value` is a change's outcome to say this way. */
	static is(value) {
		return Boolean(value) && typeof value === 'object' && !value.nodeType && ['unavailable', 'unknown'].includes(value.outcome);
	}

	/**
	 * The callout for an outcome (`ChangeOutcome.is`).
	 *
	 * @param {{outcome: 'unavailable'|'unknown', cause?: string|null, check?: Node|{label: string, href?: string, run?: () => void}|null, details?: object|null}} outcome
	 * @param {object} [labels] the words (`ChangeOutcome.labels.es`)
	 */
	static draw({ outcome, cause = null, check = null, details = null }, labels = {}) {
		const words = labels instanceof Labels ? labels : new Labels(copy.en, labels);
		if (outcome === 'unavailable') return callout({ tone: 'warning', title: cause ?? words.text('unchanged'), body: cause ? words.text('unchanged') : null, live: true, details });
		const body = [cause ? `${String(cause).replace(/\.$/, '')}. ` : '', words.text('check')].join('');
		return callout({ tone: 'warning', title: words.text('maybe'), body, actions: [ChangeOutcome.#way(check)].filter(Boolean), live: true, details });
	}

	/**
	 * What a form or a question says after its change failed (`explain(error)`'s return): an outcome by
	 * `draw`, `{ text, tone }` in its tone (`warning` polite, else danger), a string in danger, as an alert.
	 */
	static answer(value, labels = {}) {
		if (ChangeOutcome.is(value)) return ChangeOutcome.draw(value, labels);
		const said = value && typeof value === 'object' && !value.nodeType ? value : { text: value, tone: 'danger' };
		return callout({ tone: said.tone === 'warning' ? 'warning' : 'danger', title: said.text, live: true });
	}

	/** The way to check: the product's node, or a quiet link or button that reads it again. */
	static #way(check) {
		if (!check) return null;
		if (typeof check.nodeType === 'number') return check;
		const { label, href = null, run = null } = check;
		const node = href ? el('a', { class: 'bui-button bui-button-secondary bui-button-small', href }) : el('button', { type: 'button', class: 'bui-button bui-button-secondary bui-button-small' });
		node.append(el('span', {}, [content(label)]));
		if (run) node.addEventListener('click', event => run(event));
		return node;
	}
}
