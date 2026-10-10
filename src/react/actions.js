import { h } from './hooks.js';

/**
 * A quiet line of secondary actions (0.14.0, D102), rendered by React with the DOM `ActionLine`'s markup:
 * `children` are the actions (buttons, `CopyButton`, links), drawn in one muted style until hover or focus;
 * `facts` (strings or React content) follow as a muted group in tabular figures, joined by " · ";
 * `label` names the line when it needs a name.
 */
export function ActionLine({ facts = [], label = null, children = null }) {
	const shown = [].concat(facts ?? []).filter(value => value !== null && value !== undefined && value !== '');
	const actions = [].concat(children ?? []).filter(Boolean);
	return h(
		'div',
		{ className: 'bui-action-line', role: label ? 'group' : undefined, 'aria-label': label ?? undefined },
		h('div', { className: 'bui-action-line-actions', hidden: !actions.length }, children),
		h(
			'p',
			{ className: 'bui-action-line-facts', hidden: !shown.length },
			shown.map((value, index) => [index ? h('span', { key: `dot${index}`, className: 'bui-action-line-dot', 'aria-hidden': 'true' }, ' · ') : null, h('span', { key: `fact${index}`, className: 'bui-action-line-fact' }, value)])
		)
	);
}
