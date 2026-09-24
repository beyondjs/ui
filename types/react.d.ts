/** Types of `@beyond-js/ui/react`: the React adapter (React 18 and 19). */
import type { ReactNode, ReactElement, Ref, RefAttributes, ForwardRefExoticComponent, FormHTMLAttributes, ButtonHTMLAttributes, SelectHTMLAttributes, MouseEvent as ReactMouseEvent, RefObject } from 'react';
import type { Copy, NotificationAdapter, Notice } from './notifications.js';
import type { Tone, MenuItem, ChoiceOption, SelectOption, PromptOptions, QuestionOptions, Crumb, CollectionState, InboxState, PickerChoice, PickerSource, Component } from './dom.js';
export type { Copy, NotificationAdapter, Notice, NoticePage, NoticeRequest, NoticeSource, NoticeSummary } from './notifications.js';
export { confirm, prompt, alert } from './dom.js';

export function Icon(props: { name: string }): ReactElement;

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type' | 'onClick'> {
	label?: ReactNode;
	children?: ReactNode;
	variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
	glyph?: string | null;
	href?: string | null;
	onClick?: ((event: ReactMouseEvent<HTMLElement>) => void) | null;
	busy?: boolean;
	labels?: { busy?: string };
	type?: 'button' | 'submit' | 'reset';
	small?: boolean;
	name?: string;
}
export function Button(props: ButtonProps): ReactElement;
/** `[busy, run]`: `run(work)` runs an action once and ignores presses meanwhile. */
export function useBusy(): [boolean, <T>(work: () => Promise<T>) => Promise<T | undefined>];
export function Status(props: { label: ReactNode; tone?: Tone | 'progress' }): ReactElement;
export function Badge(props: { label: ReactNode; tone?: Tone }): ReactElement;
export function Callout(props: { tone?: Exclude<Tone, 'neutral'>; title: ReactNode; body?: ReactNode; actions?: ReactNode; live?: boolean; children?: ReactNode }): ReactElement;
export function Loading(props: { label?: string }): ReactElement;
export function Skeleton(props: { lines?: number }): ReactElement;

export function Field(props: { label: ReactNode; hint?: ReactNode; error?: ReactNode; optional?: boolean; labels?: { optional?: string }; children: ReactNode }): ReactElement;
export function Select(props: SelectHTMLAttributes<HTMLSelectElement> & { options: SelectOption[] }): ReactElement;
export function Choices(props: { legend: ReactNode; type?: 'checkbox' | 'radio'; name?: string; options: ChoiceOption[]; value: string | string[] | null; onChange?: (value: any) => void; hint?: ReactNode; error?: ReactNode }): ReactElement;

export interface DialogProps {
	open: boolean;
	title: string;
	description?: string | null;
	busy?: boolean;
	escape?: boolean;
	backdrop?: boolean;
	size?: 'small' | 'medium' | 'large';
	labels?: { close?: string };
	/** The person dismissed it (null) or `close(value)` ran inside; never a close through `open`, a replacement or an unmount. */
	onClose?: (value: unknown) => void;
	actions?: ReactNode;
	children?: ReactNode;
}
export function Dialog(props: DialogProps): ReactElement | null;
export function useConfirm(labels?: Copy): {
	confirm(options: QuestionOptions): Promise<boolean>;
	prompt(options: PromptOptions): Promise<string | null>;
	alert(options: QuestionOptions): Promise<void>;
};
export function FocusedForm(props: Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'children'> & {
	onSubmit: (values: Record<string, string>, data: FormData) => Promise<unknown>;
	explain?: (error: unknown) => string;
	onSuccess?: (result: unknown) => void;
	labels?: { failure?: string };
	children?: ReactNode | ((busy: boolean) => ReactNode);
}): ReactElement;

export interface PickerHandle {
	readonly value: string[];
	readonly selected: PickerChoice[];
	mark(id: string, finding: { state?: PickerChoice['state']; reason?: string | null }): void;
	remove(id: string): void;
	refresh(): void;
	focus(): void;
}
export interface PickerProps {
	label: string;
	source: PickerSource;
	onChange?: (selected: PickerChoice[]) => void;
	multiple?: boolean;
	selected?: PickerChoice[];
	filters?: Array<{ name: string; label: string; value?: string; options: SelectOption[] }>;
	name?: string | null;
	hint?: string | null;
	limit?: number;
	delay?: number;
	all?: boolean;
	labels?: Copy;
}
export const Picker: ForwardRefExoticComponent<PickerProps & RefAttributes<PickerHandle>>;

export interface ReactColumn<Row> { key: string; label: string; value?: (row: Row) => string | Node; render?: (row: Row) => ReactNode; numeric?: boolean; primary?: boolean }
export interface CollectionProps<Row> {
	label: string;
	columns: ReactColumn<Row>[];
	source: (request: CollectionState & { limit: number; signal: AbortSignal }) => Promise<{ rows: Row[]; total?: number | null; more?: boolean | null }>;
	link?: ((row: Row) => string) | null;
	onOpen?: ((row: Row, event: MouseEvent) => void) | null;
	search?: boolean;
	filters?: Array<{ name: string; label: string; all?: string; options: SelectOption[] }>;
	state?: Partial<CollectionState> | null;
	onState?: ((state: CollectionState) => void) | null;
	limit?: number;
	empty?: { title?: string; body?: string } | null;
	explain?: ((error: unknown) => string) | null;
	labels?: Copy;
}
export function Collection<Row = Record<string, unknown>>(props: CollectionProps<Row>): ReactElement;

export interface HeaderProps {
	brand: { label: string; href: string; image?: { src: string; width?: number; height?: number } | null };
	context?: Crumb[] | null;
	nav?: Crumb[] | null;
	notifications?: ReactNode;
	account?: ReactNode;
	toggle?: { controls: string; expanded: boolean; onChange?: (expanded: boolean) => void } | null;
	onNavigate?: ((item: Crumb, event: MouseEvent) => void) | null;
	labels?: Copy;
}
export function Header(props: HeaderProps): ReactElement;
export function Disclosure(props: { label: string; name?: string | null; align?: 'start' | 'end'; onChange?: (open: boolean) => void; children?: ReactNode }): ReactElement;
export function ActionMenu(props: { label?: string | null; name?: string | null; items: Array<(Omit<MenuItem, 'run'> & { onSelect?: (event: MouseEvent) => void }) | null | false>; align?: 'start' | 'end'; glyph?: string | null }): ReactElement;
export function Help(props: { topic: string; text?: string | string[]; labels?: Copy; children?: ReactNode }): ReactElement;
export function Tooltip(props: { text: string; children: ReactElement }): ReactElement;

export interface NotificationEntryHandle {
	refresh(): void;
	/** Opens the panel. */
	open(): void;
	/** Closes the panel; focus inside it returns to the bell. */
	close(): void;
	readonly count: number | null;
	/** Whether the count stopped at the summary's bound (shown as "N+"). */
	readonly more: boolean;
	readonly expanded: boolean;
}
export interface NotificationEntryProps {
	adapter: NotificationAdapter;
	href?: string | null;
	onOpen?: ((destination: string, item: Notice) => void) | null;
	onView?: ((event: MouseEvent) => void) | null;
	products?: Record<string, string>;
	locale?: string;
	limit?: number;
	interval?: number;
	labels?: Copy;
}
export const NotificationEntry: ForwardRefExoticComponent<NotificationEntryProps & RefAttributes<NotificationEntryHandle>>;
export function NotificationInbox(props: {
	adapter: NotificationAdapter;
	onOpen?: ((destination: string, item: Notice) => void) | null;
	products?: Record<string, string>;
	locale?: string;
	limit?: number;
	state?: Partial<InboxState> | null;
	onState?: ((state: InboxState) => void) | null;
	labels?: Copy;
}): ReactElement;
export function useToaster(labels?: Copy): { show(message: string, options?: { tone?: 'success' | 'info' | 'warning' | 'danger'; detail?: string; duration?: number }): (() => void) | undefined; clear(): void };
/** `[host, instance]`; `instance` is null until mounted and whenever the rendered instance is already destroyed. */
export function useInstance<T extends Component>(create: () => T, deps: unknown[], options?: { place?: boolean }): [RefObject<HTMLElement | null>, T | null];
export type { Ref };
