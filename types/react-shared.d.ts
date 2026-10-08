/** Types of the helpers a React product reuses (0.11.1), re-exported by `@beyond-js/ui/react`. */
import type { RefObject } from 'react';
export { Age, Hint } from './dom.js';
export type { AgeWords } from './dom.js';

/** The family tooltip for the glyph-only controls (`data-bui-hint`, `aria-label`) inside the element given this ref (0.11.1). */
export function useHint<T extends Element = HTMLElement>(): RefObject<T | null>;
