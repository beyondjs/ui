import React from 'react';
import { TurnIndex as Index } from '../dom/turns/turns.js';
import { h, useInstance, useLatest, useSync } from './hooks.js';

const { forwardRef, useImperativeHandle } = React;

/**
 * 0.29.0's `TurnIndex` in React, driven by its DOM class: `turns` are applied when the array changes
 * (memoize it; a turn's `element` and `head` are the turn's and its message's DOM elements, from refs),
 * `label` in place, and `onChoose` and `onView` are read from the latest props. `labels` and `keys` make
 * a new instance (memoize `labels`). The ref moves focus to a mark (`focus(key, options?)`), moves between
 * turns (`move(step)`) and decides at once which turn is read (`measure()`).
 */
export const TurnIndex = forwardRef(function TurnIndex({ label = null, turns = [], onChoose = null, onView = null, keys = true, labels }, ref) {
	const choose = useLatest(onChoose);
	const view = useLatest(onView);
	const [host, index] = useInstance(() => new Index({ label, labels, keys, choose: choose.current ? (key, how) => choose.current?.(key, how) : null, onview: seen => view.current?.(seen) }), [labels, keys, Boolean(onChoose)]);
	useSync(index, current => current.update({ label }), [label]);
	useSync(index, current => current.update({ turns }), [turns]);
	useImperativeHandle(ref, () => ({ focus: (key, options) => index?.focus(key, options) ?? false, move: step => index?.move(step) ?? false, measure: () => index?.measure() }), [index]);
	return h('div', { ref: host, className: 'bui-host' });
});

TurnIndex.labels = Index.labels;
