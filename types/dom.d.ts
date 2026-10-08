/** Types of `@beyond-js/ui/dom` (also the package root): the framework-free components. */
import type { Copy, NotificationAdapter, Notice } from './notifications.js';
export type { Copy, NotificationAdapter, Notice, NoticePage, NoticeRequest, NoticeSource, NoticeSummary } from './notifications.js';

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';
export type Content = string | Node;

export class Listeners {
	add(target: EventTarget, type: string, handler: EventListener | ((event: any) => void), options?: AddEventListenerOptions): void;
	remove(target: EventTarget, type: string, handler: EventListener | ((event: any) => void), options?: AddEventListenerOptions): void;
	release(): void;
	readonly size: number;
}

/** Shared lifecycle: an element, `mount(parent)` and a complete `destroy()`. */
export class Component {
	readonly element: HTMLElement;
	readonly destroyed: boolean;
	readonly listeners: Listeners;
	listen(target: EventTarget, type: string, handler: (event: any) => void, options?: AddEventListenerOptions): () => void;
	later(work: () => void, delay: number): () => void;
	mount(parent: Node, before?: Node | null): this;
	destroy(): void;
}

export class Labels {
	constructor(defaults: Copy, given?: Copy);
	text(key: string, values?: Record<string, unknown>): string;
	with(given: Copy): Labels;
}

export function el(tag: string, props?: Record<string, unknown>, children?: unknown): HTMLElement;

export interface ButtonOptions {
	label: Content;
	variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
	glyph?: string | null;
	href?: string | null;
	onclick?: ((event: MouseEvent) => void) | null;
	disabled?: boolean;
	busy?: boolean;
	type?: 'button' | 'submit' | 'reset';
	small?: boolean;
	name?: string | null;
	describedby?: string | null;
	labels?: Copy;
}
export class Button extends Component {
	constructor(options: ButtonOptions);
	busy: boolean;
	disabled: boolean;
	set label(value: Content);
	run<T>(work: () => Promise<T>): Promise<T | undefined>;
}

export interface MenuItem {
	label: Content;
	run?: ((event: MouseEvent) => void) | null;
	href?: string | null;
	disabled?: boolean;
	reason?: string | null;
	tone?: 'danger' | null;
}
export class ActionMenu extends Component {
	constructor(options: { label?: Content | null; name?: string | null; items: Array<MenuItem | null | false>; align?: 'start' | 'end'; glyph?: string | null; placement?: 'auto' | 'below' | 'above' });
	readonly expanded: boolean;
	set items(items: Array<MenuItem | null | false>);
	open(index?: number): void;
	close(refocus?: boolean): void;
}

export interface DisclosureOptions {
	label: Content | Content[];
	name?: string | null;
	children?: Node[];
	align?: 'start' | 'end';
	variant?: string;
	role?: string | null;
	onchange?: ((open: boolean) => void) | null;
	class?: string;
	/** Where a floating panel opens (0.11.2): above when there is no room below (`auto`, default), or always on one side. */
	placement?: 'auto' | 'above' | 'below';
}
export class Disclosure extends Component {
	constructor(options: DisclosureOptions);
	readonly button: HTMLButtonElement;
	readonly panel: HTMLElement;
	readonly expanded: boolean;
	toggle(): void;
	open(): void;
	close(refocus?: boolean): void;
}

export interface FieldOptions {
	label: Content;
	control?: HTMLElement | { control: HTMLElement; element: HTMLElement } | null;
	type?: string;
	name?: string | null;
	value?: string | null;
	hint?: Content | null;
	error?: string | null;
	required?: boolean;
	optional?: boolean;
	autocomplete?: string | null;
	messages?: Partial<Record<keyof ValidityState, string>>;
	validate?: ((value: string) => string | null) | null;
	/** A value derived from context, followed until the person edits the field (0.7.0) */
	suggest?: string | null;
	labels?: Copy;
}
export class Field extends Component {
	/** The copy in English and Spanish (0.7.0). */
	static readonly labels: { readonly en: Copy; readonly es: Copy };
	constructor(options: FieldOptions);
	readonly control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
	readonly value: string;
	readonly invalid: boolean;
	/** Whether the person's own value stands over the suggestion (0.7.0). */
	readonly edited: boolean;
	set suggest(value: string | null);
	/** Follows the suggestion again (0.7.0). */
	follow(): void;
	set error(message: string | null);
	check(): boolean;
	focus(): void;
}

export interface ChoiceOption { value: string; label: Content; hint?: string; disabled?: boolean; reason?: string; /** The option's state, beside its label and in its statement (0.7.1) */ status?: [string, Tone | 'progress'] | null }
export class Choices extends Component {
	constructor(options: { legend: Content; type?: 'checkbox' | 'radio'; name?: string | null; options: ChoiceOption[]; value?: string | string[] | null; hint?: Content | null; error?: string | null; required?: boolean; onchange?: ((value: string | string[] | null) => void) | null; /** A radio group's one option is stated as text (default true; 0.7.0) */ statement?: boolean });
	/** Whether the one option is stated as text (0.7.0). */
	readonly stated: boolean;
	value: string | string[] | null;
	set error(message: string | null);
	focus(): void;
}

export type SelectOption = { value: string; label: Content; disabled?: boolean; /** Shown only when the one option is stated (0.7.1) */ hint?: Content | null; status?: [string, Tone | 'progress'] | null } | { group: string; options: SelectOption[] };
/**
 * The tooltip that shows a cut name whole on hover and keyboard focus, only while it is cut (0.5.0,
 * D44). It is created on the first hover or focus and hidden from assistive technology.
 */
export interface NameTip {
	/** The tooltip once it was first needed, else null. */
	readonly tooltip: Tooltip | null;
	/** Removes the control's listeners and the tooltip. */
	destroy(): void;
}
export class Select extends Component {
	/**
	 * Gives a native select the tooltip of its chosen text while the select cuts it (0.5.0, D44): what
	 * `Select` and the React `Select` use, for a product that draws its own select markup. Destroy it
	 * with the control.
	 */
	static tip(control: HTMLSelectElement): NameTip;
	constructor(options: { name?: string | null; options: SelectOption[]; value?: string | null; required?: boolean; disabled?: boolean; onchange?: ((value: string) => void) | null; id?: string | null; /** One option is stated as text (default true; 0.7.0) */ statement?: boolean });
	/** The select, or the statement's `<output>` while one option is stated (0.7.0). */
	readonly control: HTMLSelectElement;
	/** Whether the one option is stated as text (0.7.0). */
	readonly stated: boolean;
	value: string;
}

export interface DialogOptions {
	title: Content;
	description?: Content | null;
	children?: Node[];
	actions?: Node[];
	escape?: boolean;
	backdrop?: boolean;
	size?: 'small' | 'medium' | 'large';
	restore?: HTMLElement | null;
	onclose?: ((value: unknown) => void) | null;
	labels?: Copy;
}
export class Dialog extends Component {
	/** The copy in English and Spanish (0.7.1). */
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	constructor(options: DialogOptions);
	readonly element: HTMLDialogElement;
	readonly body: HTMLElement;
	readonly footer: HTMLElement;
	readonly shown: boolean;
	busy: boolean;
	set title(value: Content);
	set actions(nodes: Node[]);
	fill(children: unknown): this;
	append(children: unknown): this;
	open<T = unknown>(): Promise<T | null>;
	close(value?: unknown): boolean;
	dismiss(): boolean;
}

export interface QuestionOptions {
	title: Content;
	message?: Content;
	/** What is lost, what is kept and how to undo it, as a short list under the message (confirm) */
	consequence?: import('./family.js').Consequence | null;
	/** The action's own verb ("Delete project"); "OK" and "Confirm" are wrong for a named action */
	accept?: string;
	cancel?: string;
	ok?: string;
	tone?: 'primary' | 'danger';
	/** Which button starts focused: Cancel for a danger, Accept otherwise, unless set */
	focus?: 'cancel' | 'accept';
	work?: (value: unknown) => Promise<unknown>;
	explain?: (error: unknown) => string;
	restore?: HTMLElement | null;
	labels?: Copy;
}
export interface PromptOptions extends QuestionOptions {
	label: Content;
	value?: string;
	hint?: Content;
	required?: boolean;
	type?: string;
	messages?: FieldOptions['messages'];
	validate?: (value: string) => string | null;
}
export class Question {
	/** The questions' copy in English and Spanish (0.7.1). */
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	constructor(kind: 'confirm' | 'prompt' | 'alert', options: QuestionOptions | PromptOptions);
	ask(): Promise<{ value: unknown } | null>;
}
export function confirm(options: QuestionOptions): Promise<boolean>;
export function prompt(options: PromptOptions): Promise<string | null>;
export function alert(options: QuestionOptions): Promise<void>;
/** The questions' copy in English and Spanish on each function (0.7.1): `confirm({ …, labels: confirm.labels.es })`. */
export namespace confirm { const labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> }; }
export namespace prompt { const labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> }; }
export namespace alert { const labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> }; }

export class FocusedForm {
	/** The copy in English and Spanish (0.7.2). */
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	constructor(form: HTMLFormElement, options: { submit: (values: Record<string, string>, data: FormData) => Promise<unknown>; fields?: Array<{ check(): boolean; focus(): void }>; explain?: ((error: unknown) => string) | null; onsuccess?: ((result: unknown) => void) | null; onbusy?: ((busy: boolean) => void) | null; labels?: Copy });
	readonly busy: boolean;
	readonly form: HTMLFormElement;
	set problem(message: string | null);
	destroy(): void;
}

export class Tooltip extends Component {
	/** `when` (0.5.0) is asked each time it would show; it shows only while that returns true. */
	constructor(trigger: HTMLElement, options: { text: Content; delay?: number; describe?: boolean; when?: (() => boolean) | null });
	readonly shown: boolean;
	set text(value: Content);
	show(): void;
	hide(): void;
}
export class Help extends Disclosure {
	/** The copy in English and Spanish (0.7.2). */
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	constructor(options: { topic: string; text: Content | Content[]; labels?: Copy; onchange?: ((open: boolean) => void) | null });
}

/** The family lockup: the Beyond wordmark (`src`, the consumer's asset) with the product name. */
export function lockup(options: { src: string; name?: Content | null; alt?: string }): HTMLElement;
export function status(label: Content, tone?: Tone | 'progress'): HTMLElement;
export function badge(label: Content, tone?: Tone): HTMLElement;
export function callout(options: { tone?: Exclude<Tone, 'neutral'>; title: Content; body?: Content | null; actions?: Node[]; live?: boolean }): HTMLElement;
export function loading(label?: string): HTMLElement;
/** The default label in English and Spanish (0.7.2), and the named lines (0.7.6). */
export namespace loading {
	const labels: { readonly en: string; readonly es: string };
	const names: { readonly en: Readonly<Record<'loading' | 'opening' | 'reading', string>>; readonly es: Readonly<Record<'loading' | 'opening' | 'reading', string>> };
	function text(options: { name: string; kind?: 'loading' | 'opening' | 'reading'; language?: 'en' | 'es' }): string;
}
export function skeleton(lines?: number): HTMLElement;
export function hidden(text: string): HTMLElement;

export * from './parts.js';
export * from './family.js';
export * from './icons.js';
export * from './preferences.js';
export * from './page.js';
export * from './operations.js';
export * from './choose.js';
export * from './session.js';
export * from './sidebar.js';
export * from './conversation.js';
export * from './resource.js';
export * from './shared.js';
export * from './diff.js';
