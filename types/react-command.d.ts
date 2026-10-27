/** Types of the React `CommandPalette` and `ChoiceCards` (0.16.0), re-exported by `@beyond-js/ui/react`. */
import type { ReactElement, ForwardRefExoticComponent, RefAttributes } from 'react';
import type { Copy } from './notifications.js';
import type { PaletteItem, PaletteSource, ChoiceCard } from './command.js';
export type { PaletteItem, PaletteSource, ChoiceCard } from './command.js';
export { Primaries, Hierarchy, Ellipses, Focus } from './command.js';
export type { HierarchyPaint, FocusPaint } from './command.js';

export interface CommandPaletteHandle {
	open(query?: string): void;
	close(): void;
	toggle(): void;
	readonly opened: boolean;
	readonly keys: { text: string; keys: string } | null;
}
/** The palette, driven by the DOM `CommandPalette`; sources and `onNavigate` are read from the latest props. */
export const CommandPalette: ForwardRefExoticComponent<{ sources?: PaletteSource[]; recent?: { key: string; limit?: number } | false; shortcut?: boolean; onNavigate?: ((item: PaletteItem, event: Event) => void) | null; delay?: number; bound?: number; labels?: Copy } & RefAttributes<CommandPaletteHandle>> & { labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> } };
export function ChoiceCards(props: { label: string; options: Array<ChoiceCard | null | false>; value?: string | null; name?: string | null; description?: string | null; disabled?: boolean; onChange?: ((value: string) => void) | null }): ReactElement;
