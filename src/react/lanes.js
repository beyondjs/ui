import React from 'react';
import { Lanes as Block } from '../dom/lanes/lanes.js';
import { Clock } from '../dom/time/clock.js';
import { h, useInstance, useLatest, useSync } from './hooks.js';

const { forwardRef, useImperativeHandle } = React;

/**
 * 0.22.0's `Lanes` in React, driven by its DOM class: `lanes` are applied when their content changes (a
 * lane that stays keeps its button and focus), `label` and `trace` in place, and `onChoose` is read from
 * the latest props. `clock`, `locale` and `labels` make a new instance (memoize `labels`). The ref moves
 * focus to a lane (`focus(key, options?)`). In React a lane's `title`, `kind` and `now` are text.
 */
export const Lanes = forwardRef(function Lanes({ label = null, lanes = [], trace = true, onChoose = null, clock = Clock.system, locale, labels }, ref) {
	const latest = useLatest(onChoose);
	const [host, block] = useInstance(() => new Block({ label, trace, clock, locale, labels, choose: (key, event) => latest.current?.(key, event) }), [clock, locale, labels]);
	useSync(block, current => current.update({ label, trace }), [label, Boolean(trace)]);
	useSync(block, current => current.update({ lanes }), [JSON.stringify(lanes ?? [])]);
	useImperativeHandle(ref, () => ({ focus: (key, options) => block?.focus(key, options) ?? false }), [block]);
	return h('div', { ref: host, className: 'bui-host' });
});

Lanes.labels = Block.labels;
