import { el } from '../core/element.js';

/**
 * Holds the place of an action whose permission or presence is known only after the object's read (0.44.0,
 * LOAD-01): `PageHeader`'s `actions: [reserved(restore)]` draws the action where it will be, unseen
 * (`visibility: hidden`), `inert` and hidden from assistive technology, so it takes its width and height
 * without being offered. Once the read answers, the product sets `actions` again: with the action itself when
 * it is permitted, so nothing on the title's line moves, or without it when it is not. The holder adds no
 * box of its own (`display: contents`): the action is laid out as it will be. A stateless builder, as
 * `waiting` is.
 *
 * @param {Node|{element: Node}} action the action as it will be drawn
 * @returns {HTMLElement}
 */
export function reserved(action) {
	return el('span', { class: 'bui-reserved', inert: true, 'aria-hidden': 'true' }, [action?.element ?? action]);
}
