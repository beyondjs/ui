import { el } from '../core/element.js';

/**
 * The words a search matched, marked where they appear (0.21.1, the list rule L8): each word of the
 * query, ignoring case and taken literally, in a `<mark class="bui-match">`. A list marks them in its
 * rows' names.
 */
export class Matches {
	/**
	 * @param {string} text
	 * @param {string|null|undefined} query
	 * @returns {Array<string|HTMLElement>} the text's parts, each match a mark
	 */
	static mark(text, query) {
		const terms = String(query ?? '').trim().split(/\s+/).filter(Boolean).map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
		if (!terms.length || typeof text !== 'string') return [text];
		// Split on a captured group: the matches are the odd parts
		return text.split(new RegExp(`(${terms.join('|')})`, 'iu')).map((part, index) => (index % 2 ? el('mark', { class: 'bui-match', text: part }) : part)).filter(part => part !== '');
	}
}
