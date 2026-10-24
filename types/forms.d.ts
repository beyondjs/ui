/** Types of the family's one way to wait for what is still to give (0.32.0, D183), part of `@beyond-js/ui/dom` and re-exported by `@beyond-js/ui/react`. */

/** A part that says itself whether it waits, such as a `Field` or a required `SecretField`. */
export interface Waited {
	readonly missing?: boolean;
	focus(): void;
}

/**
 * What a form still waits for: a required control with nothing in it that the browser validates (blanks,
 * an unchecked required box, a radio group or a choice with nothing chosen; text the browser could not
 * read is wrong, not missing), or a part the product marks `data-missing`; given `fields`, theirs.
 * Its submit buttons wait quiet (`aria-disabled`, still reachable), those outside the form that name it
 * with `form` included, and a busy one (`data-busy`) keeps its state. It hears the form's input and
 * change until `destroy()`.
 */
export class Required {
	/** The event a marked part answers with `preventDefault()` when it puts the caret where it is given itself (`bui-focus`). */
	static readonly ask: 'bui-focus';
	/** Whether a required control has nothing in it yet; a control the browser does not validate never waits. */
	static empty(control: Element | { required?: boolean; willValidate?: boolean; validity?: Partial<ValidityState>; type?: string; value?: string } | null | undefined): boolean;
	constructor(form: HTMLFormElement, options?: { fields?: Waited[] });
	/** The first part that waits, in the page's order, or null. */
	readonly first: Element | Waited | null;
	readonly missing: boolean;
	/** The form's submit buttons, and those outside it that name it with `form`. */
	readonly buttons: Array<HTMLButtonElement | HTMLInputElement>;
	settle(): void;
	/** Puts the caret in the first part that waits; true when one waits. */
	focus(): boolean;
	/** Stops a submission while a part waits, the caret put there; true when it stopped it. */
	hold(event: Event): boolean;
	destroy(): void;
}

/**
 * A control that waits quiet while there is nothing for it to act on yet, such as Add while nothing is
 * chosen. Given `place`, a press while it waits only puts the person there and the control's own
 * handler never runs; given `form`, it is drawn again on every change of the form's fields.
 */
export class Quiet {
	constructor(control: HTMLElement, options: { waiting: () => boolean; place?: (() => HTMLElement | null | undefined) | null; form?: HTMLFormElement | null });
	readonly waiting: boolean;
	settle(): void;
	destroy(): void;
}
