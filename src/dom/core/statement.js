import { el, content } from './element.js';
import { Ids } from './ids.js';

/**
 * One option is a statement, not a choice (D56, "Choose, never type", shared piece 6): where a
 * choice offers a single option that can be chosen, `Select`, `Choices` (radios) and `ChoiceMenu`
 * show it as text and still submit its value.
 *
 * The text is an `<output>`, which a `<label for>` names like any control, so a `Field` around a
 * statement keeps its label; the value travels in a hidden input when the control has a `name`. This
 * is a stateless builder, the standalone-function exception the coding standard allows.
 *
 * @param {object} options
 * @param {string|Node} options.text what is stated (the option's label)
 * @param {string} [options.value] the value submitted with a form
 * @param {string|null} [options.name] the form name; no hidden input without it
 * @param {string|null} [options.id] the output's id, for a label's `for`
 * @param {Node[]} [options.extra] content after the text
 * @param {[string, string]|null} [options.status] the option's state and its tone, after the text (0.7.1)
 * @param {string|Node|null} [options.hint] the option's own line (its hint or detail), under the text and
 *   describing it (0.7.1): a statement keeps everything the option said
 */
export function statement({ text, value = '', name = null, id = null, extra = [], status = null, hint = null }) {
	const described = hint ? Ids.next('bui-statement-hint') : null;
	const [state, tone] = status ?? [null, null];
	return el('span', { class: 'bui-statement', 'data-value': value }, [
		el('output', { id, class: 'bui-statement-text', 'aria-describedby': described }, Array.isArray(text) ? text : [content(text)]),
		state ? el('span', { class: `bui-status bui-status-${tone ?? 'neutral'}` }, [el('span', { class: 'bui-status-dot', 'aria-hidden': 'true' }), state]) : null,
		...extra,
		hint ? el('span', { id: described, class: 'bui-statement-hint' }, [content(hint)]) : null,
		name ? el('input', { type: 'hidden', name, value }) : null
	]);
}

/** What an option says beside its label: its hint, else its detail or description. */
export function said(option) {
	return option.hint ?? option.detail ?? option.description ?? null;
}

/** The one option a choice states instead of offering, or null when there is a real choice. */
export function single(options, { actions = [] } = {}) {
	const flat = options.flatMap(option => (option?.options ? option.options : [option])).filter(Boolean);
	if (flat.length !== 1 || actions.length) return null;
	return flat[0].disabled ? null : flat[0];
}
