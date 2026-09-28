import { el, content } from './core/element.js';

/**
 * The family lockup: the Beyond wordmark with the product name beside it, the same in every product.
 *
 * The consumer passes the wordmark asset it carries (`src`), because the package ships no brand
 * asset. The name is sized and placed against the wordmark's letters; its size follows the
 * `--bui-lockup-height` custom property (the wordmark's height, 21px by default).
 *
 * @param {{src: string, name?: string|Node|null, alt?: string}} options
 */
export function lockup({ src, name = null, alt = 'Beyond' }) {
	return el('span', { class: 'bui-lockup' }, [
		el('img', { class: 'bui-lockup-mark', src, alt }),
		name ? el('span', { class: 'bui-lockup-name' }, [content(name)]) : null
	]);
}
