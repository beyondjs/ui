import { el } from '../core/element.js';

/**
 * The one action of a place with nothing to show yet (`EmptyState`, `Collection`'s `empty`): a node given as
 * it is, or `{ label, href, run }` drawn as the primary button, a link with `href` (0.44.0, shared).
 */
export class EmptyAction {
	/**
	 * @param {Node|{label: string, href?: string|null, run?: ((event: Event) => void)|null}|null} action
	 * @returns {Node|null}
	 */
	static draw(action) {
		if (!action) return null;
		if (typeof action.nodeType === 'number') return action;
		const { label, href = null, run = null } = action;
		const node = href ? el('a', { class: 'bui-button bui-button-primary', href }) : el('button', { type: 'button', class: 'bui-button bui-button-primary' });
		node.append(el('span', { text: label }));
		if (run) node.addEventListener('click', event => run(event));
		return node;
	}
}
