/** Types of the React family bar's props, re-exported by `@beyond-js/ui/react` (moved from react.d.ts in 0.15.0). */
import type { ReactNode } from 'react';
import type { Copy } from './notifications.js';
import type { FamilyDescriptor, FamilyUnavailable, FamilyNone, FamilyFallback, FamilyNavigation, FamilySignout } from './dom.js';

export interface FamilyBarProps {
	product: string;
	brand: { src: string; href: string };
	descriptor?: FamilyDescriptor | FamilyUnavailable | FamilyNone | null;
	fallback?: FamilyFallback | null;
	/** 0.15.0: false without projects; `bound` ms of loading at most */
	projects?: boolean; bound?: number;
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
