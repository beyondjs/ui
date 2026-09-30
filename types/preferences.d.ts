/** Types of `Preferences` (decision D07), re-exported by `@beyond-js/ui`, `/dom` and `/react`. */

export type Appearance = 'system' | 'light' | 'dark';

export interface PreferenceValues {
	readonly appearance: Appearance;
	readonly locale: string;
}

export interface PreferenceLabels {
	readonly everywhere: string;
	readonly appearance: string;
	readonly system: string;
	readonly light: string;
	readonly dark: string;
	readonly language: string;
}

export interface PreferencesOptions {
	/** The device copy's storage key, one per product (`beyond-projects`). */
	key: string;
	/** The product's defaults; `fallback.locale` is one of `locales`. */
	fallback: { appearance: Appearance; locale: string };
	/** The languages the product is localized in; `['en', 'es']` by default. */
	locales?: string[];
	/** Where the device copy lives; `localStorage` when omitted, nowhere with `null`. */
	storage?: Storage | null;
	/** The element that carries `data-beyond-mode` and `lang`; `<html>` when omitted. */
	root?: Element;
}

/** A person's language and appearance in one product: the account's values on arrival, a device choice in between. */
export class Preferences {
	static readonly labels: { readonly en: PreferenceLabels; readonly es: PreferenceLabels };
	static readonly appearances: readonly Appearance[];
	constructor(options: PreferencesOptions);
	readonly appearance: Appearance;
	readonly locale: string;
	readonly current: PreferenceValues;
	readonly fallback: PreferenceValues;
	readonly labels: PreferenceLabels;
	/** First paint: the device copy, or the product's defaults. */
	restore(): PreferenceValues;
	/** Arrival: the account's values win; a missing or `null` appearance is unset and keeps the product's default. */
	apply(values?: { appearance?: Appearance | null; locale?: string | null }): PreferenceValues;
	/** A change made in the product, on this device only. */
	choose(values: { appearance?: Appearance; locale?: string }): PreferenceValues;
	/** Calls the listener after every change; returns the release. Safe to pass detached. */
	subscribe: (listener: (values: PreferenceValues) => void) => () => void;
}
