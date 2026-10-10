import React from 'react';
import ReactDOM from 'react-dom';
import { Rail as Line, RailItem as Item, RailMoment as When } from '../dom/activity/rail.js';
import { h, useInstance, useSync } from './hooks.js';

const { useState } = React;

/**
 * The rail of 0.12.0 in React: `Rail` holds React children (activity rows and `RailItem`s) on one line;
 * `RailItem` is driven by its DOM class, its children placed in its content through a portal, so the
 * mark has one implementation; `RailMoment` is a time of day at the line's far end.
 */

/** A rail of work: one line down the column of its children's marks. */
export function Rail({ label = null, children = null }) {
	return h('div', { className: 'bui-rail', role: label ? 'group' : undefined, 'aria-label': label ?? undefined }, children);
}

/** One event on a rail: a mark (`glyph`, a dot without one, a spinner while `progress`) and the children. */
export function RailItem({ glyph = null, tone = 'neutral', children = null }) {
	const [holder] = useState(() => {
		const node = document.createElement('div');
		node.setAttribute('data-bui-slot', '');
		return node;
	});
	const [host, item] = useInstance(() => new Item({ glyph, tone, content: holder }), []);
	useSync(item, current => current.update({ glyph, tone }), [glyph, tone]);
	return h(React.Fragment, null, h('div', { ref: host, className: 'bui-host' }), ReactDOM.createPortal(children, holder));
}

/** A time of day at the rail's far end: `text` as the product says it, `datetime` and `title` whole. */
export function RailMoment({ text, datetime = null, title = null }) {
	const [host, moment] = useInstance(() => new When({ text, datetime, title }), []);
	useSync(moment, current => current.update({ text, datetime, title }), [text, datetime, title]);
	return h('div', { ref: host, className: 'bui-host' });
}

RailItem.tones = Line.tones;
