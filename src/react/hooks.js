import React from 'react';

const { useEffect, useLayoutEffect, useRef, useState } = React;

/**
 * The bridge between React and a DOM component class: the class is created after mount, its element
 * is placed in a host element React renders, and it is destroyed on unmount or when `deps` change.
 * Creating it in an effect keeps React's development double-mount honest: every instance is
 * destroyed, so nothing leaks.
 *
 * Returns `[host, instance]`: `host` is the ref for the host element, `instance` is null until mounted
 * and whenever the instance React renders with is already destroyed. React 18 can render once with the
 * instance its development double-mount destroyed (for example under an ancestor that uses
 * `useSyncExternalStore`), so an adapter never applies props to, portals into or calls through it.
 */
export function useInstance(create, deps, { place = true } = {}) {
	const host = useRef(null);
	const [instance, setInstance] = useState(null);
	useLayoutEffect(() => {
		const made = create();
		if (place && host.current) host.current.append(made.element);
		setInstance(made);
		return () => {
			made.destroy();
			setInstance(current => (current === made ? null : current));
		};
		// The caller states the dependencies that require a new instance.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);
	return [host, living(instance)];
}

/** The instance, or null when it is missing or destroyed. */
export function living(instance) {
	return instance && !instance.destroyed ? instance : null;
}

/** A ref that always holds the latest value, for callbacks a long-lived DOM instance calls later. */
export function useLatest(value) {
	const ref = useRef(value);
	useLayoutEffect(() => {
		ref.current = value;
	});
	return ref;
}

/** Runs `apply(instance)` whenever the instance or `deps` change, unless it is destroyed. */
export function useSync(instance, apply, deps) {
	useEffect(() => {
		if (living(instance)) apply(instance);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [instance, ...deps]);
}

export const h = React.createElement;
