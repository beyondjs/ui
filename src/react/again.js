import React from 'react';
import { Again } from '../dom/again/again.js';
import { AgainLine as Line } from '../dom/again/line.js';
import { Button, useBusy } from './simple.js';
import { RetryAction as Action } from '../dom/again/action.js';
import { h, useLatest } from './hooks.js';

const { useEffect, useMemo, useState } = React;

/**
 * An outage read again by itself while `failing` holds (D132, 0.17.1), on the DOM `Again`'s schedule: it
 * starts when the place finds the outage, stops when the place answers again or goes away, and `run` is
 * always the latest read from the props. Returns `{ active, trying, last, next, now }`; `now()` is the
 * place's Try again. `options` (`steps`, `now`, `timers`, `events`, `page`) are read once.
 *
 * @param {boolean} failing whether the place shows an outage now
 * @param {() => Promise<unknown>} run one read: resolves when it answered, rejects or resolves `false` when it did not
 */
export function useAgain(failing, run, options = {}) {
	const latest = useLatest(run);
	const again = useMemo(() => new Again({ ...options, run: () => latest.current() }), []);
	const [moments, setMoments] = useState(again.moments);
	useEffect(() => again.listen(setMoments), [again]);
	useEffect(() => {
		if (failing) again.start();
		else again.stop();
	}, [again, failing]);
	useEffect(() => () => again.stop(), [again]);
	return useMemo(() => ({ ...moments, now: () => again.now() }), [again, moments]);
}

/** The line "Last tried 12:04 · trying again by itself" for `moments` (from `useAgain`), or nothing. */
export function AgainLine({ moments, locale = undefined, labels = {} }) {
	const text = Line.say(moments, { labels, locale });
	if (!text) return null;
	return h('p', { className: 'bui-again', 'data-again': moments.trying ? 'trying' : 'waiting' }, text);
}

AgainLine.labels = Line.labels;

/** The same recovery action as the DOM component, with the refresh glyph and secondary style. */
export function RetryAction({ onClick, labels = {}, busy = false, small = true, name = null }) {
	const [working, run] = useBusy();
	return h(Button, { label: labels.retry ?? Action.labels.en.retry, glyph: 'refresh', variant: 'secondary', small, name, labels, busy: busy || working, onClick: event => void run(() => onClick?.(event)).catch(() => {}) });
}
RetryAction.labels = Action.labels;
