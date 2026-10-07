/** Types of `Session` (0.8.0; the dialog cannot be dismissed since 0.9.0): a session that ends while the person works, answered alike in every product. Re-exported by `@beyond-js/ui/dom`. */
import type { Component, Copy } from './dom.js';



export interface SessionPerson {
	id?: string;
	name?: string | null;
	email?: string | null;
}
/** The product's read of its own session. A rejection is an unavailable answer, never a sign-out. */
export type SessionAnswer = { state: 'signed'; person?: SessionPerson | null; expires?: string | number | null } | { state: 'ended'; reason?: 'expired' | 'revoked' | 'suspended' | string | null };
export type SessionState = 'signed' | 'renewing' | 'asking' | 'ended';
export type SessionKind = 'expired' | 'revoked' | 'suspended' | 'unavailable';
/** `read` sends it again once renewed; `write` once renewed while it waited; `false` never. */
export type SessionReplay = 'read' | 'write' | false;
export interface SessionEvent {
	type: 'state' | 'renewed' | 'changed';
	state: SessionState;
	person: SessionPerson | null;
	interactive?: boolean;
}
export interface SessionOptions {
	/** The product's id, carried on the `beyond-session` channel. */
	product: string;
	read: () => Promise<SessionAnswer>;
	/** The product's hand-off start: `silent` (in a hidden frame, `prompt=none`), `window` or `tab`; null where a mode is not offered. */
	start: (mode: 'silent' | 'window' | 'tab') => string | null;
	person?: SessionPerson | null;
	expires?: string | number | null;
	/** "Use another account": the product's sign-out of Beyond. */
	other?: (() => void) | null;
	/** Beyond Accounts' address, offered to a suspended account. */
	accounts?: string | null;
	/** A host that asks the person itself (the Beyond Desktop): true once signed in, false when the window is closing; a rejection is asked again by itself. */
	delegate?: ((request: { reason: SessionKind | null; person: SessionPerson | null; address: string | null }) => Promise<boolean>) | null;
	/** The product's own sign-in behind Continue, resolving true once done (0.8.2: an installed shell signing in through the system browser). */
	signin?: (() => Promise<boolean>) | null;
	onrenewed?: ((person: SessionPerson | null) => void) | null;
	onchanged?: ((person: SessionPerson | null) => void) | null;
	/** Renews in a hidden frame first (default true). */
	silent?: boolean;
	/** The least time between two silent attempts, in ms (60000). */
	pause?: number;
	/** Milliseconds a read may take (8000). */
	bound?: number;
	/** Milliseconds a silent renewal may take before the dialog (10000). */
	wait?: number;
	/** How often the session is read while the sign-in window is open, in ms (2000). */
	interval?: number;
	document?: Document;
	labels?: Copy;
}
/** A session that ended: renewed without being seen, or one dialog, the same in every product. */
export class Session extends Component {
	static readonly labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> };
	static readonly STATES: readonly SessionState[];
	constructor(options: SessionOptions);
	readonly state: SessionState;
	readonly person: SessionPerson | null;
	readonly kind: SessionKind | null;
	readonly notice: { readonly shown: boolean; readonly kind: SessionKind | null; readonly phase: string; readonly element: HTMLDialogElement | null };
	text(key: string, values?: Record<string, unknown>): string;
	lost(lost?: { reason?: string | null; replay?: SessionReplay }): Promise<boolean>;
	/** Looks at the session now and resolves with the state after looking: a live transport speaks only while `signed`. */
	check(): Promise<SessionState>;
	subscribe(listener: (event: SessionEvent) => void): () => void;
}
