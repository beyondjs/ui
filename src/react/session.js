import React from 'react';
import { Session } from '../dom/session/session.js';
import { useLatest } from './hooks.js';

const { useEffect, useState } = React;

/**
 * `Session` for a React product: created once the product knows who is signed in (`person`), for
 * `product`, and destroyed on unmount. Every function option (`read`, `start`, `other`, `delegate`, `signin`,
 * `onrenewed`, `onchanged`) is read from the latest props. Returns `{ session }` (since 0.9.0 there is no
 * `signin` for the family bar: the dialog cannot be dismissed, so the page is never open without a session).
 */
export function useSession(options) {
	const latest = useLatest(options);
	const [session, setSession] = useState(null);
	const signed = Boolean(options.person);
	useEffect(() => {
		if (!signed) return undefined;
		const given = latest.current;
		const call = name => (...args) => latest.current[name]?.(...args);
		const made = new Session({
			...given,
			read: call('read'),
			start: call('start'),
			other: given.other ? call('other') : null,
			delegate: given.delegate ? call('delegate') : null,
			signin: given.signin ? call('signin') : null,
			onrenewed: call('onrenewed'),
			onchanged: given.onchanged ? call('onchanged') : null
		});
		setSession(made);
		return () => {
			made.destroy();
			setSession(current => (current === made ? null : current));
		};
		// A new session only for another product or once someone is signed in
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [options.product, signed]);
	return { session };
}

useSession.labels = Session.labels;
