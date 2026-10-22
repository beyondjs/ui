/** Shared collection toolbar types. The constructor is exposed as DOM `Collection.Tools`. */
import type { Component, Content, Copy, SelectOption } from './dom.js';

export type CollectionToolsMode = 'compact' | 'expanded' | 'external';
export interface CollectionFilter {
	name: string;
	label: Content;
	all?: string;
	options: SelectOption[];
}
export interface CollectionToolsState {
	query: string;
	filters: Record<string, string>;
}
export interface CollectionToolsOptions {
	label: string;
	search?: boolean;
	filters?: CollectionFilter[];
	state?: Partial<CollectionToolsState>;
	onchange?: ((state: CollectionToolsState) => void) | null;
	labels?: Copy;
	/** Compact tools by default; false keeps the search expanded. Filters remain grouped. */
	compact?: boolean;
	/** Milliseconds after the last key before search applies (200). Filters and clears apply immediately. */
	delay?: number;
}
export interface CollectionTools extends Component {
	get state(): CollectionToolsState;
	/** Restores the controls without reporting a change. */
	set state(state: Partial<CollectionToolsState>);
	/** Opens and focuses search, or the first available control when search is disabled. */
	focus(): void;
}
export interface CollectionToolsConstructor {
	new (options: CollectionToolsOptions): CollectionTools;
	readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
}
