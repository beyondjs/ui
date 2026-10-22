import React from 'react';

/** Places the collection's own toolbar in an empty caller-owned outlet. */
export function useTools(instance, target, mode) {
	React.useLayoutEffect(() => {
		if (!instance || instance.destroyed || mode !== 'external' || !target) return;
		const element = instance.tools.element;
		target.append(element);
		return () => {
			if (element.parentNode === target) element.remove();
		};
	}, [instance, target, mode]);
}
