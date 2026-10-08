/** Types of the helpers a React product reuses (0.11.1; `Bytes` and `CopyButton` since 0.11.2), re-exported by `@beyond-js/ui/react`. */
import type { ReactElement, RefObject } from 'react';
import type { Copy } from './notifications.js';
export { Age, Hint, Bytes } from './dom.js';
export type { AgeWords } from './dom.js';

/** The family tooltip for the glyph-only controls (`data-bui-hint`, `aria-label`) inside the element given this ref (0.11.1). */
export function useHint<T extends Element = HTMLElement>(): RefObject<T | null>;

/** One action that copies a text and says "Copied" in place (0.11.2), driven by the DOM `CopyButton`; `text` may be a function read at each press. */
export function CopyButton(props: { text: string | (() => string); label?: string | null; name?: string | null; variant?: 'primary' | 'secondary' | 'quiet'; small?: boolean; onResult?: ((copied: boolean) => void) | null; labels?: Copy }): ReactElement;
export namespace CopyButton { const labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> }; }

// The React Diff (0.11.2)
export * from './react-diff.js';
