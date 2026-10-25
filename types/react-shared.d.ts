/** Types of the helpers a React product reuses (0.11.1; `Bytes` and `CopyButton` since 0.11.2), re-exported by `@beyond-js/ui/react`. */
import type { ReactElement, RefObject } from 'react';
import type { Copy } from './notifications.js';
import type { WaitingShape } from './dom.js';
export { Age, Hint, Bytes, Highlighter, ComposerDictation, PageDock, Required, Quiet } from './dom.js';
export type { ComposerCommand, DictationOptions, HighlighterKind } from './dom.js';
export type { AgeWords } from './dom.js';

/** The family tooltip for the glyph-only controls (`data-bui-hint`, `aria-label`) inside the element given this ref (0.11.1). */
export function useHint<T extends Element = HTMLElement>(): RefObject<T | null>;

/** One action that copies a text and says "Copied" in place (0.11.2), driven by the DOM `CopyButton`; `text` may be a function read at each press. */
export function CopyButton(props: { text: string | (() => string); label?: string | null; name?: string | null; variant?: 'primary' | 'secondary' | 'quiet'; small?: boolean; onResult?: ((copied: boolean) => void) | null; labels?: Copy }): ReactElement;
export namespace CopyButton { const labels: { readonly en: Readonly<Copy>; readonly es: Readonly<Copy> }; }

/** A quiet line of secondary actions (0.14.0, D102): `children` the actions in one muted style, `facts` a muted group in tabular figures. */
export function ActionLine(props: { facts?: Array<import('react').ReactNode>; label?: string | null; children?: import('react').ReactNode }): ReactElement;

// The React Diff (0.11.2)
export * from './react-diff.js';
export { Recency, Matches } from './parts.js';

/** A region's wait (0.23.0, LOAD-01), as the DOM `waiting`. */
export function Waiting(props: WaitingShape): ReactElement;

/**
 * The family's form for a product that sends its own submission (0.32.0, D183): its submit buttons wait
 * quiet while a required control is empty or a part is marked `data-missing`, a press or Enter only puts
 * the caret there, and `onSubmit` runs once nothing waits. The ref is the form element. With `report`
 * (0.34.0, off by default) a control that breaks its own constraints, when nothing waits before it, says
 * the browser's own message and takes the focus, and `onSubmit` does not run.
 */
export const Form: import('react').ForwardRefExoticComponent<import('react').FormHTMLAttributes<HTMLFormElement> & { report?: boolean } & import('react').RefAttributes<HTMLFormElement>>;
