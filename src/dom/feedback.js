import { el, content } from './core/element.js';
import { glyph } from './core/icons.js';
import { Labels } from './core/labels.js';

/**
 * Stateless feedback builders: status, badge, count, callout, loading and skeleton. Each returns a
 * new element and keeps no state; the React adapter renders the same markup and classes.
 *
 * Tones: `neutral`, `success`, `warning`, `danger`, `info` and, for status, `progress`.
 */
const glyphs = { info: 'info', warning: 'alert', danger: 'alert', success: 'check', neutral: 'info' };

/** A state with a colored dot and its label; the label carries the meaning, never the color. */
export function status(label, tone = 'neutral') {
	return el('span', { class: `bui-status bui-status-${tone}` }, [
		el('span', { class: 'bui-status-dot', 'aria-hidden': 'true' }),
		content(label)
	]);
}

/** A short tag such as "Stale" or "Internal". */
export function badge(label, tone = 'neutral') {
	return el('span', { class: `bui-badge bui-badge-${tone}` }, [content(label)]);
}

/**
 * A callout: information, warning, danger or success, with optional actions. `live` announces it:
 * politely, or assertively for danger.
 */
export function callout({ tone = 'info', title, body = null, actions = [], live = false }) {
	return el('div', { class: `bui-callout bui-callout-${tone}`, role: live ? (tone === 'danger' ? 'alert' : 'status') : null }, [
		glyph(glyphs[tone] ?? 'info'),
		el('div', { class: 'bui-callout-body' }, [
			el('p', { class: 'bui-callout-title' }, [content(title)]),
			body ? el('p', { class: 'bui-callout-text' }, [content(body)]) : null,
			actions.length ? el('div', { class: 'bui-callout-actions' }, actions) : null
		])
	]);
}

/** An announced loading indicator with a visible label; `loading.labels` (0.7.2) holds the default in English and Spanish. */
export function loading(label = loading.labels.en) {
	return el('div', { class: 'bui-loading', role: 'status' }, [
		el('span', { class: 'bui-spinner', 'aria-hidden': 'true' }),
		el('span', { text: label })
	]);
}

/** Placeholder lines while content loads; hidden from assistive technology, which hears `loading`. */
export function skeleton(lines = 3) {
	return el(
		'div',
		{ class: 'bui-skeleton', 'aria-hidden': 'true' },
		Array.from({ length: lines }, () => el('span', { class: 'bui-skeleton-line' }))
	);
}

/** A visually hidden text for assistive technology only. */
export function hidden(text) {
	return el('span', { class: 'bui-hidden', text });
}

loading.labels = Object.freeze({ en: 'Loading…', es: 'Cargando…' });

/**
 * A loading line that names what it waits for (0.7.6): `loading`, `opening` or `reading`, each with
 * `{name}` (the thing as the product calls it, with its article: "the conversation", «la conversación»).
 */
loading.names = Object.freeze({
	en: Object.freeze({ loading: 'Loading {name}…', opening: 'Opening {name}…', reading: 'Reading {name}…' }),
	es: Object.freeze({ loading: 'Cargando {name}…', opening: 'Abriendo {name}…', reading: 'Leyendo {name}…' })
});

/** The text of a named loading line: `loading(loading.text({ name, kind, language }))`; `kind` defaults to `loading`. */
loading.text = ({ name, kind = 'loading', language = 'en' }) => {
	const names = loading.names[language] ?? loading.names.en;
	return new Labels(names).text(kind in names ? kind : 'loading', { name });
};
