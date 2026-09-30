import React from 'react';

const { useSyncExternalStore } = React;

/**
 * The values in effect of a `Preferences` instance (`{ appearance, locale }`), re-rendering after each
 * change. The instance is the product's own, created once outside React so its first paint happens
 * before the application renders; the hook only reads it.
 */
export function usePreferences(preferences) {
	return useSyncExternalStore(preferences.subscribe, () => preferences.current, () => preferences.current);
}
