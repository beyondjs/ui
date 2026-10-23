import React from 'react';
import { Again } from '../dom/again/again.js';
import { AgainLine as Line } from '../dom/again/line.js';
import { Recovery as Notice } from '../dom/again/recovery.js';
import { LastUpdate as Update } from '../dom/again/update.js';
import { Button, useBusy } from './simple.js';
import { RetryAction as Action } from '../dom/again/action.js';
import { h, living, useLatest, useSync } from './hooks.js';

const { useEffect, useLayoutEffect, useMemo, useRef, useState } = React;

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

/**
 * One outage's notice for a page (0.24.0, D163), the DOM `Recovery` made once and destroyed with the
 * component, so a `Collection` can join it (`recovery`) and a `Recovery` can draw it (`notice`). Null
 * until mounted, and when `options` is null. `title` follows the props; the rest makes a new notice.
 */
export function useRecovery(options = {}) {
	const { title = '', labels, locale, again, level = 2, focus = null } = options ?? {};
	const latest = useLatest({ focus });
	const [notice, setNotice] = useState(null);
	useLayoutEffect(() => {
		if (!options) return undefined;
		const made = new Notice({ title, labels, locale, again, level, focus: () => latest.current.focus?.() ?? null });
		setNotice(made);
		return () => {
			made.destroy();
			setNotice(current => (current === made ? null : current));
		};
		// A new notice only for its words, language and level; the title is applied below
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [options === null, labels, locale, level]);
	useSync(living(notice), current => (current.title = title), [title]);
	return living(notice);
}

/**
 * The page's one notice for one outage (0.24.0, D163), drawn by the DOM `Recovery`: who did not answer
 * (`title`), when it last tried and one Try again, in one line. `reads` are the reads that did not answer
 * now, `{ key, title, details, run, automatic }`; each says it is unavailable in its own place, and a
 * read leaves the notice when it leaves `reads`, since only the product knows that it answered (`run`,
 * read from the latest props, is its read again). `whole` draws it as the page's body when nothing on
 * the page could be read. `notice` draws one made by `useRecovery`, shared with a `Collection`.
 */
export function Recovery({ notice = null, title, reads = [], whole = false, labels, locale = undefined, again, level = 2, focus = null }) {
	const own = useRecovery(notice ? null : { title, labels, locale, again, level, focus });
	const current = notice ?? own;
	const host = useRef(null);
	const latest = useLatest(reads);
	const synced = useRef(new Set());
	useLayoutEffect(() => {
		if (!current || !host.current) return undefined;
		host.current.append(current.element);
		return () => current.element.remove();
	}, [current]);
	// A shared notice keeps the title its `useRecovery` gave it unless this one names it
	useSync(current, it => title !== undefined && (it.title = title), [title]);
	useSync(current, it => (it.whole = whole), [whole]);
	useSync(
		current,
		it => {
			const keys = new Set(reads.map(read => read.key));
			for (const key of synced.current) if (!keys.has(key)) it.delete(key);
			for (const read of reads) {
				const run = async () => {
					await latest.current.find(item => item.key === read.key)?.run?.();
					return false;
				};
				it.set(read.key, { title: read.title, details: read.details ?? null, automatic: read.automatic ?? true, run });
			}
			synced.current = keys;
		},
		[JSON.stringify(reads.map(({ run, ...read }) => read))]
	);
	return h('div', { ref: host, className: 'bui-host' });
}

/** "Last updated 12:04" over content kept from an earlier read (0.24.0), as the DOM `LastUpdate`. */
export function LastUpdate({ time = null, locale = undefined, labels = {} }) {
	return h('p', { className: 'bui-last-update' }, Update.say(time, { labels, locale }));
}
LastUpdate.labels = Update.labels;
