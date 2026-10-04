/** Types of `@beyond-js/ui/react`: the React adapter (React 18 and 19). */
import type { ReactNode, ReactElement, Ref, RefAttributes, ForwardRefExoticComponent, FormHTMLAttributes, ButtonHTMLAttributes, SelectHTMLAttributes, MouseEvent as ReactMouseEvent, RefObject } from 'react';
import type { Copy, NotificationAdapter, Notice } from './notifications.js';
import type { Tone, MenuItem, ChoiceOption, SelectOption, PromptOptions, QuestionOptions, Crumb, CollectionState, InboxState, PickerChoice, PickerSource, Component, ChoiceMenuOption, PickerAccount, PickerRecognized, PickerFound, GitRef, PickedProject, StatusRowState, ProviderState } from './dom.js';
export type { ChoiceMenuOption, PickerAccount, PickerItem, PickerMark, PickerRecognized, PickerFound, GitRef, PickedProject, StatusRowState, ProviderState, DraftKey } from './dom.js';
export type { Copy, NotificationAdapter, Notice, NoticePage, NoticeRequest, NoticeSource, NoticeSummary } from './notifications.js';
export { confirm, prompt, alert, availability, productNames } from './dom.js';
export type { AvailabilityState, Consequence, FamilySignout, Step, StepState, Expected, DetailsRecord, AwaitedReason, AwaitedState, Moment, FamilyDescriptor, FamilyUnavailable, FamilyFallback, FamilyNavigation, FamilyProduct, FamilyProductId, FamilyProductNames, FamilyReason, FamilyHere, FamilyManage, FamilyNotice, FamilyOrganization, FamilyProjectState, ProductNavItem, SidebarGroup, SidebarItem, UnavailableKind } from './dom.js';
import type { FamilyDescriptor, FamilyUnavailable, FamilyFallback, FamilyNavigation, FamilySignout, ProductNavItem, SidebarGroup, UnavailableKind, Clock, Step, Expected, DetailsRecord, StepsLabels, Moment } from './dom.js';
export { Clock } from './dom.js';

/** An icon of the catalog: 16, 20 (default) or 24 px; decorative without `label`. */
export function Icon(props: { name: IconName; size?: IconSize; label?: string | null }): ReactElement;
export { icons, unlabeled, Preferences } from './dom.js';
export type { IconName, IconSize, IconOptions, UnlabeledIconName, Appearance, PreferenceValues, PreferenceLabels, PreferencesOptions } from './dom.js';
import type { IconName, IconSize, Preferences, PreferenceValues } from './dom.js';
/** The values in effect of a `Preferences` instance, re-rendering after each change. */
export function usePreferences(preferences: Preferences): PreferenceValues;
export { PreferencesDialog } from './dom.js';
export type { PageTemplate, PageWidth, PageCrumb, TabItem, FamilyPreferences, ArrivalLabels } from './dom.js';
import type { PageTemplate, PageWidth, PageCrumb, TabItem, ArrivalLabels } from './dom.js';
/** The content region (D52): edge to edge, one gutter from the navigation, blocks at their width tier. */
export function Page(props: { template?: PageTemplate; width?: PageWidth; arrival?: ReactNode; header?: ReactNode; aside?: ReactNode; label?: string | null; children?: ReactNode }): ReactElement;
/** The page's one header: crumbs, the H1, one status, facts, the line's actions and the tabs. */
export function PageHeader(props: { title: ReactNode; crumbs?: Array<PageCrumb | null | false>; status?: ReactNode; facts?: ReactNode; actions?: ReactNode; tabs?: ReactNode; headingRef?: Ref<HTMLHeadingElement> | null; labels?: { crumbs?: string } }): ReactElement;
/** A flat section: a heading, one description line, its actions and its content. */
export function Section(props: { title: ReactNode; description?: ReactNode; actions?: ReactNode; level?: 2 | 3; children?: ReactNode }): ReactElement;
/** The arrival line (D54), driven by the DOM `Arrival`. */
export function Arrival(props: { product: string; href: string; onDismiss?: (() => void) | null; onNavigate?: ((item: { href: string; url: string }, event: MouseEvent) => void) | null; labels?: Partial<ArrivalLabels> }): ReactElement;
/** A resource's areas as tabs, driven by the DOM `Tabs`. */
export function Tabs(props: { items: Array<TabItem | null | false>; label?: string | null; onNavigate?: ((item: TabItem, event: MouseEvent) => void) | null; labels?: { nav?: string } }): ReactElement;

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
export function Lockup(props: { src: string; name?: ReactNode; alt?: string }): ReactElement;
export function Status(props: { label: ReactNode; tone?: Tone | 'progress' }): ReactElement;
export function Badge(props: { label: ReactNode; tone?: Tone }): ReactElement;
export function Callout(props: { tone?: Exclude<Tone, 'neutral'>; title: ReactNode; body?: ReactNode; actions?: ReactNode; live?: boolean; children?: ReactNode }): ReactElement;
export function Loading(props: { label?: string }): ReactElement;
export function Skeleton(props: { lines?: number }): ReactElement;

export function Field(props: { label: ReactNode; hint?: ReactNode; error?: ReactNode; optional?: boolean; /** Marks the value as suggested (0.7.0, `useSuggestion`) */ suggested?: boolean; labels?: { optional?: string; suggested?: string }; children: ReactNode }): ReactElement;
/** A suggested value that follows `suggestion` until the person edits it (0.7.0). */
export function useSuggestion(suggestion: string | null): { value: string; onChange: (event: { target: { value: string } } | string) => void; onBlur: (event: { target: { value: string } }) => void; suggested: boolean; follow: () => void };
export function Select(props: SelectHTMLAttributes<HTMLSelectElement> & { options: SelectOption[]; /** One option is stated as text (default true; 0.7.0) */ statement?: boolean }): ReactElement;
export function Choices(props: { legend: ReactNode; type?: 'checkbox' | 'radio'; name?: string; options: ChoiceOption[]; value: string | string[] | null; onChange?: (value: any) => void; hint?: ReactNode; error?: ReactNode; statement?: boolean }): ReactElement;

/** Actions with `onSelect` read from the latest props. */
export interface ReactChoiceAction { label: string; onSelect?: (() => void) | null; disabled?: boolean; reason?: string | null }
/** One choice among a few things that have a state (CNT-94, 0.7.0). */
export function ChoiceMenu(props: { label: string; options: Array<ChoiceMenuOption | null | false>; value?: string | null; placeholder?: string | null; actions?: Array<ReactChoiceAction | null | false>; disabled?: boolean; align?: 'start' | 'end'; placement?: 'auto' | 'below' | 'above'; search?: boolean | 'auto' | number; statement?: boolean; name?: string | null; onChange?: ((value: string) => void) | null; labels?: Copy }): ReactElement;
export namespace ChoiceMenu { const labels: Copies; }
/** A branch or another Git ref (0.7.0). */
export function RefChooser(props: { label?: string | null; refs?: GitRef[]; value?: string | null; loading?: boolean; unavailable?: { text?: string | null; onRetry?: (() => void) | null } | null; escape?: boolean; validate?: ((value: string) => string | null) | null; layout?: 'field' | 'inline'; name?: string | null; onChange?: ((value: string) => void) | null; labels?: Copy }): ReactElement;
export namespace RefChooser { const labels: Copies; }
/** The organization's projects with their state in this product (0.7.0). */
export function ProjectPicker(props: { projects: PickedProject[]; product: string; value?: string | null; label?: string | null; only?: 'unset' | null; actions?: Array<ReactChoiceAction | null | false>; name?: string | null; onChange?: ((id: string) => void) | null; labels?: Copy }): ReactElement;
export namespace ProjectPicker { const labels: Copies; }
/** A secret with Connect first (0.7.0); the ref's `value` is the pasted text, or null when the stored one is kept. */
export const SecretField: ForwardRefExoticComponent<{ label: string; connect?: { label: string; onSelect?: (() => void) | null; href?: string | null } | null; credential?: string; stored?: boolean; hint?: string | null; name?: string | null; labels?: Copy } & RefAttributes<{ readonly value: string | null }>> & { labels: Copies };
/** A prewritten message, link or command with one copy action (0.7.0). */
export function CopyMessage(props: { text: string; kind?: 'message' | 'command' | 'link'; label?: string | null; labels?: Copy }): ReactElement;
export namespace CopyMessage { const labels: Copies; }
/** One thing with one state (0.7.0); `action` is React content, `more` items take `onSelect`. */
export function StatusRow(props: { title: string; kind?: string | null; state: StatusRowState; reason?: string | null; owner?: string | null; facts?: string[]; action?: ReactNode; more?: Array<ReactChoiceAction | null | false>; level?: 2 | 3 | 4 | 5 | 6; clock?: Clock; locale?: string; labels?: Copy }): ReactElement;
export namespace StatusRow { const labels: Copies; }
/** A provider's window followed until the server says how it ended (0.7.0). */
export const ProviderWindow: ForwardRefExoticComponent<{ provider: string; href: string; read: () => Promise<{ state: string; [key: string]: unknown }>; origin?: string | null; onEnd?: ((outcome: 'done' | 'waiting', answer: { state: string; [key: string]: unknown }) => void) | null; same?: boolean | 'auto'; expected?: Expected; bound?: number; clock?: Clock; locale?: string; labels?: Copy } & RefAttributes<{ open(): void; check(): Promise<void> | undefined; cancel(): void; readonly state: ProviderState }>> & { labels: Copies };
/** A side sheet (0.7.0): `open`, `onClose`, `busy`, `error` (React content at its top), `actions`, `restore`. */
export function SideSheet(props: { open: boolean; title: string; label?: string | null; description?: string | null; width?: 'form' | 'standard'; busy?: boolean; error?: ReactNode; restore?: HTMLElement | null; labels?: { close?: string }; onClose?: (value: unknown) => void; actions?: ReactNode; children?: ReactNode }): ReactElement | null;
export namespace SideSheet { const labels: Copies; }
/** List and detail (0.7.0): the detail beside the list on a wide region, its own page on a narrow one. */
export function ListDetail(props: { list: ReactNode; detail?: ReactNode; label?: string | null; back?: { label: ReactNode; href: string; onNavigate?: ((event: ReactMouseEvent<HTMLAnchorElement>) => void) | null } | null }): ReactElement;
export { Draft } from './dom.js';

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
	/** The account in view (0.7.0). */
	readonly account: string | null;
	readonly recognized: PickerRecognized | null;
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
	/** Milliseconds the source may take (20000; 0.7.0) */
	bound?: number;
	/** "From [account ▾]" (0.7.0); `connect.onSelect` is read from the latest props */
	accounts?: { items: PickerAccount[]; value?: string | null; connect?: { label: string; onSelect?: (() => void) | null } | null } | null;
	/** In place of the list while given (0.7.0) */
	gate?: { title: string; reason: string; owner?: string | null; action?: ReactNode; secondary?: ReactNode; kind?: UnavailableKind; code?: string | null; level?: 2 | 3 | 4 | 5 | 6 } | null;
	/** The "Can't find it?" content, shown in every state (0.7.0) */
	footer?: ReactNode;
	recognize?: ((text: string) => PickerRecognized | null) | null;
	onRecognize?: ((found: PickerFound | null) => void) | null;
	explain?: ((error: unknown) => string | null) | null;
	labels?: Copy;
}
export const Picker: ForwardRefExoticComponent<PickerProps & RefAttributes<PickerHandle>> & { labels: Copies };

export interface ReactColumn<Row> { key: string; label: string; value?: (row: Row) => string | Node; render?: (row: Row) => ReactNode; numeric?: boolean; primary?: boolean; /** Hidden as the region narrows, the highest number first (0.7.0) */ priority?: number }
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
	brand: { label: string; href: string; lockup?: { src: string; name?: string } | null; logo?: Node | null; image?: { src: string; width?: number; height?: number } | null };
	context?: Crumb[] | null;
	nav?: Crumb[] | null;
	notifications?: ReactNode;
	account?: ReactNode;
	toggle?: { controls: string; expanded: boolean; onChange?: (expanded: boolean) => void } | null;
	onNavigate?: ((item: Crumb, event: MouseEvent) => void) | null;
	labels?: Copy;
}
export function Header(props: HeaderProps): ReactElement;
export interface FamilyBarProps {
	product: string;
	brand: { src: string; href: string };
	descriptor?: FamilyDescriptor | FamilyUnavailable | null;
	fallback?: FamilyFallback | null;
	products?: Record<string, string>;
	notifications?: ReactNode;
	/** `signout`: `{ end, before?, after?, bound? }` (0.5.0), whose functions are read from the latest props, or the earlier callback or link. */
	account?: { signout?: FamilySignout | (() => void) | { href: string } | null; items?: Array<{ label: string; href?: string | null; onSelect?: (() => void) | null } | null | false>; label?: string | null; preferences?: import('./page.js').FamilyPreferences | null };
	toggle?: { controls: string; expanded: boolean; onChange?: (expanded: boolean) => void } | null;
	onNavigate?: ((item: FamilyNavigation, event: MouseEvent) => void) | null;
	advisory?: string[];
	/** One line at the top of the project menu (0.4.0); its action's `onSelect` is called with the latest props. */
	notice?: { text: string; href?: string | null; action?: { label: string; href?: string | null; onSelect?: (() => void) | null } | null } | null;
	/** The product's own dialog markers, left out of the address Accounts returns to (0.4.0). */
	transient?: string[];
	/** Memoize: a new object creates a new bar */
	labels?: Copy;
}
/** The family bar, driven by the DOM `FamilyBar`; `descriptor` and `fallback` are applied when they change. */
export function FamilyBar(props: FamilyBarProps): ReactElement;
/** A product's sections (0.4.0), driven by the DOM `Sidebar`; place it first in a `.bui-shell` element. */
export function Sidebar(props: { product: string; groups?: SidebarGroup[]; context?: string | { label?: string | null; name: string } | null; cut?: number; section?: string | null; onNavigate?: ((item: FamilyNavigation, event: MouseEvent) => void) | null; labels?: { sections?: string; close?: string } }): ReactElement;
export function ProductNav(props: { items: Array<ProductNavItem | null | false>; label?: string | null; sticky?: boolean; onNavigate?: ((item: ProductNavItem, event: MouseEvent) => void) | null; labels?: { nav?: string } }): ReactElement;
export function Unavailable(props: { title: ReactNode; reason: ReactNode; owner?: ReactNode; action?: ReactNode; secondary?: ReactNode; kind?: UnavailableKind; code?: string | null; level?: 2 | 3 | 4 | 5 | 6; labels?: { owner?: string } }): ReactElement;
export function Disclosure(props: { label: string; name?: string | null; align?: 'start' | 'end'; onChange?: (open: boolean) => void; children?: ReactNode }): ReactElement;
export function ActionMenu(props: { label?: string | null; name?: string | null; items: Array<(Omit<MenuItem, 'run'> & { onSelect?: (event: MouseEvent) => void }) | null | false>; align?: 'start' | 'end'; glyph?: string | null; placement?: 'auto' | 'below' | 'above' }): ReactElement;
export function Help(props: { topic: string; text?: string | string[]; labels?: Copy; children?: ReactNode }): ReactElement;
export function Tooltip(props: { text: string; describe?: boolean; children: ReactElement }): ReactElement;

/** The steps of an operation with their times (0.5.0, D50); `clock`, `locale` and `labels` (memoize) create a new list. */
export function Steps(props: { label: string; steps?: Array<Step | null | false>; clock?: Clock; locale?: string; labels?: StepsLabels }): ReactElement;
/** The card a person waits on (0.5.0, E52): `check` and `onEnd` use the latest props; `ended` ends it once. */
export function Awaited(props: {
	title: string;
	since?: Moment | null;
	expected?: Expected | null;
	steps?: Array<Step | null | false> | null;
	reason?: { text: string; way?: string | null; action?: { label: string; href?: string | null; onSelect?: (() => void) | null } | null; details?: DetailsRecord | null } | null;
	check?: (() => Promise<unknown>) | null;
	ended?: 'done' | 'failed' | null;
	onEnd?: ((outcome: 'done' | 'failed') => void) | null;
	clock?: Clock;
	locale?: string;
	level?: 2 | 3 | 4 | 5 | 6;
	labels?: Copy & { steps?: StepsLabels; details?: Copy };
}): ReactElement;
/** A state with "Checked … ago", or "Last known: … · {time}" while disconnected (0.5.0). */
export function Freshness(props: { label: string; tone?: Tone | 'progress'; checked?: Moment | null; connected?: boolean; clock?: Clock; locale?: string; labels?: Copy }): ReactElement;
/** "Technical details" with the request and the time, copyable for support (0.5.0, D43). */
export function TechnicalDetails(props: DetailsRecord & { open?: boolean; locale?: string; labels?: Copy }): ReactElement;
/** The copy in English and Spanish, as on the DOM classes (`Steps.labels.es`). */
type Copies = { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
export namespace Steps { const labels: Copies; }
export namespace Awaited { const labels: Copies; }
export namespace Freshness { const labels: Copies; }
export namespace TechnicalDetails { const labels: Copies; }

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
