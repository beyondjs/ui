import { el, content } from './core/element.js';
import { Labels } from './core/labels.js';

const en = { affected: 'Work it affects', lost: 'What is lost', kept: 'What is kept', costing: 'What keeps costing', recovery: 'How to undo' };
const es = { affected: 'Trabajo afectado', lost: 'Lo que se pierde', kept: 'Lo que se conserva', costing: 'Qué sigue costando', recovery: 'Cómo deshacerlo' };

/**
 * The consequence of a destructive or irreversible action, stated before it is confirmed (decision
 * D17): the work it affects (`affected`: running conversations, deliveries in progress), what is lost,
 * what is kept, what keeps costing (`costing`: what is still charged) and how to undo it, in that
 * order, each only when given. A value is text, a node or a list of them (a list is drawn as one).
 *
 * `confirm({ consequence })` draws it; a product whose confirmation is a dialog of its own draws the
 * same list with `consequence(parts, labels)`. It is a stateless builder, the standalone-function
 * exception the coding standard allows. `consequence.labels` holds the terms in English and Spanish
 * (since 0.7.2, with `affected` and `costing`).
 *
 * @param {{affected?: unknown, lost?: unknown, kept?: unknown, costing?: unknown, recovery?: unknown}|null} parts
 * @param {Record<string, string>|import('./core/labels.js').Labels} [labels] the terms, English by default
 * @returns {HTMLElement|null} the list, or null when nothing is stated
 */
export function consequence(parts, labels = {}) {
	const words = labels instanceof Labels ? labels : new Labels(en, labels);
	const given = order.filter(key => [].concat(parts?.[key] ?? []).filter(Boolean).length);
	if (!given.length) return null;
	const describe = value => (Array.isArray(value) ? el('ul', {}, value.filter(Boolean).map(line => el('li', {}, [content(line)]))) : content(value));
	return el('dl', { class: 'bui-consequence' }, given.map(key => el('div', { class: `bui-consequence-${key}` }, [el('dt', { text: words.text(key) }), el('dd', {}, [describe(parts[key])])])));
}

const order = ['affected', 'lost', 'kept', 'costing', 'recovery'];
consequence.order = Object.freeze([...order]);
consequence.labels = Object.freeze({ en: Object.freeze(en), es: Object.freeze(es) });
