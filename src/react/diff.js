import { Diff as View } from '../dom/diff/diff.js';
import { h, useInstance, useSync } from './hooks.js';

/**
 * A change for React (0.11.2), driven by the DOM `Diff`, which owns its parsing, files, keys, budget and
 * copy: `patch` (a unified diff) or `files` (already split) are applied when they change, keeping each
 * file's open state and the focused header; `label`, `level`, `open`, `summary`, `labels` and `locale`
 * create a new one. `Diff.parse(text)` reads a patch as data without a DOM.
 */
export function Diff({ patch = null, files = null, label = null, level = 3, open = 'auto', summary = true, labels, locale }) {
	const [host, diff] = useInstance(() => new View({ patch, files, label, level, open, summary, labels, locale }), [label, level, open, summary, labels, locale]);
	useSync(
		diff,
		current => {
			if (typeof patch === 'string') current.patch = patch;
			else current.files = files ?? [];
		},
		[patch, files]
	);
	return h('div', { ref: host, className: 'bui-host' });
}

// The copy in English and Spanish and the parser, as on the DOM class.
Diff.labels = View.labels;
Diff.parse = View.parse;
