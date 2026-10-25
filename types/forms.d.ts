/** Types of the family's one way to wait for what is still to give (0.32.0, D183), part of `@beyond-js/ui/dom` and re-exported by `@beyond-js/ui/react`. */

/** A part that says itself whether it waits, such as a `Field` or a required `SecretField`. */
export interface Waited {
	readonly missing?: boolean;
	/** Where it stands in the page, so the first part that waits is read in the page's order (0.32.1). */
	readonly element?: Element;
	focus(): void;
}

/**
 * What a form still waits for: a required control with nothing in it that the browser validates (blanks,
 * an unchecked required box, a radio group or a choice with nothing chosen; text the browser could not
 * read is wrong, not missing), or a part the product marks `data-missing`; given `fields`, theirs.
 * Its submit buttons wait quiet (`aria-disabled`, still reachable), those outside the form that name it
 * with `form` included, and a busy one (`data-busy`) keeps its state, as a package `Button` that waits for
 * the product's own condition (`data-bui-waiting`, 0.35.0) keeps its wait. It hears the form's input and
 * change until `destroy()`.
 */
export class Required {
	/** The event a marked part answers with `preventDefault()` when it puts the caret where it is given itself (`bui-focus`). */
	static readonly ask: 'bui-focus';
	/** The bubbling event by which a part says what it holds changed without a typed value (0.32.1). */
	static readonly change: 'bui-change';
	/** Sends `Required.change` from `node`, so a form reads it again (0.32.1). */
	static tell(node: EventTarget | null | undefined): void;
	/** Whether a control keeps a state of its own that no form or `Quiet` frees: its work (`data-busy`) or a package `Button`'s own wait (`data-bui-waiting`, 0.35.0). */
	static held(control: Element): boolean;
	/** Whether `a` comes before `b` in the page (0.32.1). */
	static before(a: Node, b: Node): boolean;
	/** Whether a required control has nothing in it yet; a control the browser does not validate never waits. */
	static empty(control: Element | { required?: boolean; willValidate?: boolean; validity?: Partial<ValidityState>; type?: string; value?: string } | null | undefined): boolean;
	constructor(form: HTMLFormElement, options?: { fields?: Waited[] });
	/** The first control failing its own constraints rather than waiting, or null (0.32.1). */
	readonly wrong: Element | null;
	/** The first control holding text the browser could not read as its kind, or null (0.32.1). */
	readonly unread: Element | null;
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
	/** Reports the first wrong control with the browser's own message when nothing waits before it, stopping the submission; true when it did (0.34.0). */
	report(event: Event): boolean;
	destroy(): void;
}

/**
 * A control that waits quiet while there is nothing for it to act on yet, such as Add while nothing is
 * chosen. Given `place`, a press while it waits only puts the person there and the control's own
 * handler never runs; given `form`, it is drawn again on every change of the form's fields. A busy control
 * and a package `Button`'s own wait (`data-bui-waiting`, 0.35.0) keep their state, drawn again once it ends.
 */
export class Quiet {
	constructor(control: HTMLElement, options: { waiting: () => boolean; place?: (() => HTMLElement | null | undefined) | null; form?: HTMLFormElement | null });
	readonly waiting: boolean;
	settle(): void;
	destroy(): void;
}
