/** Types of `@beyond-js/ui/dom` (also the package root): the framework-free components. */
import type { Copy, NotificationAdapter, Notice } from './notifications.js';
export type { Copy, NotificationAdapter, Notice, NoticePage, NoticeRequest, NoticeSummary } from './notifications.js';

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
export function icon(name: 'chevron' | 'check' | 'close' | 'search' | 'menu' | 'alert' | 'info' | 'help' | 'bell' | 'more' | 'refresh'): SVGSVGElement;

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
	constructor(options: { label?: Content | null; name?: string | null; items: Array<MenuItem | null | false>; align?: 'start' | 'end'; glyph?: string | null });
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
	labels?: Copy;
}
export class Field extends Component {
	constructor(options: FieldOptions);
	readonly control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
	readonly value: string;
	readonly invalid: boolean;
	set error(message: string | null);
	check(): boolean;
	focus(): void;
}

export interface ChoiceOption { value: string; label: Content; hint?: string; disabled?: boolean; reason?: string }
export class Choices extends Component {
	constructor(options: { legend: Content; type?: 'checkbox' | 'radio'; name?: string | null; options: ChoiceOption[]; value?: string | string[] | null; hint?: Content | null; error?: string | null; required?: boolean; onchange?: ((value: string | string[] | null) => void) | null });
	value: string | string[] | null;
	set error(message: string | null);
	focus(): void;
}

export type SelectOption = { value: string; label: Content; disabled?: boolean } | { group: string; options: SelectOption[] };
export class Select extends Component {
	constructor(options: { name?: string | null; options: SelectOption[]; value?: string | null; required?: boolean; disabled?: boolean; onchange?: ((value: string) => void) | null; id?: string | null });
	readonly control: HTMLSelectElement;
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
	accept?: string;
	cancel?: string;
	ok?: string;
	tone?: 'primary' | 'danger';
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
	constructor(kind: 'confirm' | 'prompt' | 'alert', options: QuestionOptions | PromptOptions);
	ask(): Promise<{ value: unknown } | null>;
}
export function confirm(options: QuestionOptions): Promise<boolean>;
export function prompt(options: PromptOptions): Promise<string | null>;
export function alert(options: QuestionOptions): Promise<void>;

export class FocusedForm {
	constructor(form: HTMLFormElement, options: { submit: (values: Record<string, string>, data: FormData) => Promise<unknown>; fields?: Array<{ check(): boolean; focus(): void }>; explain?: ((error: unknown) => string) | null; onsuccess?: ((result: unknown) => void) | null; onbusy?: ((busy: boolean) => void) | null; labels?: Copy });
	readonly busy: boolean;
	readonly form: HTMLFormElement;
	set problem(message: string | null);
	destroy(): void;
}

export class Tooltip extends Component {
	constructor(trigger: HTMLElement, options: { text: Content; delay?: number });
	readonly shown: boolean;
	set text(value: Content);
	show(): void;
	hide(): void;
}
export class Help extends Disclosure {
	constructor(options: { topic: string; text: Content | Content[]; labels?: Copy; onchange?: ((open: boolean) => void) | null });
}

export function status(label: Content, tone?: Tone | 'progress'): HTMLElement;
export function badge(label: Content, tone?: Tone): HTMLElement;
export function callout(options: { tone?: Exclude<Tone, 'neutral'>; title: Content; body?: Content | null; actions?: Node[]; live?: boolean }): HTMLElement;
export function loading(label?: string): HTMLElement;
export function skeleton(lines?: number): HTMLElement;
export function hidden(text: string): HTMLElement;

export * from './parts.js';
