/** Types of the React forms of the 0.10.0 pieces (`Composer`, `LiveText`, `ActivityRow`, `ActivityGroup`, `PanelToggle`), re-exported by `@beyond-js/ui/react`. */
import type { ForwardRefExoticComponent, ReactElement, ReactNode, RefAttributes } from 'react';
import type { Copy } from './notifications.js';
import type { ActivitySection, ActivityState, Clock, ComposerAction, ComposerAttachment, ComposerMessage, ComposerSubmit, ComposerSuggestion, ComposerSuggestSettings, IconName, Moment } from './dom.js';
export type { ActivitySection, ActivityState, ComposerAction, ComposerAttachment, ComposerMessage, ComposerSubmit, ComposerSuggestion, ComposerSuggestSettings, PagePanelOptions, SidebarAction, SidebarEntries, SidebarEntry, SidebarMark, SidebarSearchOptions } from './dom.js';
export { PagePanel } from './dom.js';

type Copies = { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };

export interface ComposerHandle {
	focus(): void;
	/** Sends with an action (the primary one by default); resolves whether it was sent. */
	submit(action?: string | null): Promise<boolean>;
	readonly value: string;
	readonly busy: boolean;
	readonly sending: boolean;
	/** Opens the platform's file chooser, as Attach does (0.11.0). */
	attach(): void;
}
export interface ComposerProps {
	label: string;
	/** Sends; a rejection gives the text back. Read from the latest props. */
	onSubmit: (message: ComposerMessage) => Promise<unknown> | unknown;
	placeholder?: string | null;
	/** The state line above the box: text, React content, or `{ text, action }` with the action React content or `{ label, onSelect }` (0.11.0). */
	status?: ReactNode | { text: ReactNode; action?: ReactNode | { label: string; onSelect?: (() => unknown) | null } | null };
	/** The turn's choices at the toolbar's start, React content (0.11.0). */
	settings?: ReactNode;
	/** Files from paste, drop and Attach; callbacks read from the latest props (0.11.0). */
	attach?: { label?: string | null; accept?: string | null; multiple?: boolean; onFiles: (files: File[], via: 'paste' | 'drop' | 'pick') => void; onRemove?: ((item: ComposerAttachment) => void) | null; onRetry?: ((item: ComposerAttachment) => void) | null } | null;
	/** The chips (0.11.0). */
	attachments?: ComposerAttachment[] | null;
	/** Suggestions after the trigger, read from the latest props (0.11.0). */
	onSuggest?: ((query: string, signal: AbortSignal) => Promise<ComposerSuggestion[] | { items: ComposerSuggestion[] }> | ComposerSuggestion[]) | null;
	suggest?: ComposerSuggestSettings | null;
	locale?: string;
	/** The toolbar's start, React content. */
	tools?: ReactNode;
	/** The toolbar's end before the actions, React content. */
	extras?: ReactNode;
	actions?: ComposerAction[] | null;
	/** The stop action while work runs; `onSelect` is read from the latest props. */
	stop?: { label: string; onSelect?: (() => unknown) | null; busy?: boolean } | null;
	disabled?: { reason?: string | null } | null;
	busy?: boolean;
	submit?: ComposerSubmit;
	/** Applied when it changes. */
	value?: string;
	min?: number;
	max?: number;
	name?: string | null;
	onChange?: ((text: string) => void) | null;
	explain?: ((error: unknown) => string | null) | null;
	/** Memoize: a new object creates a new box. */
	labels?: Copy;
}
/** A message box driven by the DOM `Composer` (0.10.0). */
export const Composer: ForwardRefExoticComponent<ComposerProps & RefAttributes<ComposerHandle>> & { labels: Copies };

export interface LiveTextHandle {
	append(piece: string): void;
	set(text: string): void;
	settle(text?: string): void;
	abandon(note?: string | null): void;
	readonly text: string;
	readonly state: 'live' | 'settled' | 'abandoned';
}
/** Text that arrives in pieces (0.10.0): `render(text)` returns React content, drawn at most once per frame. */
export const LiveText: ForwardRefExoticComponent<{ text?: string; state?: 'live' | 'settled' | 'abandoned'; note?: string | null; render?: ((text: string) => ReactNode) | null; bound?: number; labels?: { live?: string; abandoned?: string } } & RefAttributes<LiveTextHandle>> & { labels: Copies };

export interface ActivityRowProps {
	glyph?: IconName;
	title: string;
	meta?: string | null;
	state?: ActivityState;
	since?: Moment | null;
	until?: Moment | null;
	duration?: number | null;
	tail?: string | null;
	/** React content built once the row is first opened, or section records. */
	body?: (() => ReactNode) | ActivitySection[] | null;
	open?: boolean;
	clock?: Clock;
	locale?: string;
	labels?: Copy;
}
/** One row of activity, driven by the DOM `ActivityRow` (0.10.0). */
export function ActivityRow(props: ActivityRowProps): ReactElement;
export namespace ActivityRow { const labels: Copies; }
/** Consecutive rows folded into one (0.10.0); `rows` are row values patched by `key`, bodies as section records. */
export function ActivityGroup(props: { glyph?: IconName; title: string | ((count: number) => string); meta?: string | null; rows?: Array<(Omit<ActivityRowProps, 'body' | 'clock' | 'locale' | 'labels'> & { key?: string; body?: ActivitySection[] | null }) | null | false>; open?: boolean; clock?: Clock; locale?: string; labels?: Copy }): ReactElement;
export namespace ActivityGroup { const labels: Copies; }
/** The toggle of the page's panel ("Details"), rendered inside a `Page` with `panel` (0.10.0). */
export function PanelToggle(props: { label: ReactNode; variant?: 'primary' | 'secondary' | 'quiet' | 'danger'; glyph?: IconName | null }): ReactElement;

// Only the declarations marked `export` are public.
export {};
