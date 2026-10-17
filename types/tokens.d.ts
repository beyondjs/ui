/** Types of `@beyond-js/ui/tokens`: the canonical Beyond design tokens. */
export type Provenance = { provenance: 'captured'; source: string } | { provenance: 'proposed'; reason: string };
/** `use` states a primitive's role where its use is restricted (the brand orange and its variants). */
export type Primitive = { value: string; use?: string } & Provenance;
export type Pair = [foreground: string, background: string, kind: 'text' | 'graphic' | 'decorative'];

export interface Tokens {
	version: string;
	status: 'proposed' | 'approved';
	source: string;
	attribute: 'data-beyond-mode';
	approval?: { date: string; by: string; decisions: string[]; note: string; layout?: object; conversation?: object; /** Decision C2 (token set 0.6.0) */ visual?: { date: string; by: string; decisions: string[]; amends: string[]; tokens: string[]; note: string } };
	/** Entries shipped as proposals, not approved family rules (since token set 0.5.1 only the code colors of Conduict's audit, P3). */
	pending?: { date: string; decisions: string[]; tokens: string[]; note: string };
	provenance: { origin: string; revision: string; moved: string; note: string };
	color: { primitives: Record<string, Primitive>; themes: { light: Record<string, string>; dark: Record<string, string> }; pairs: Pair[] };
	typography: {
		/** `brand` (0.6.0): Rubik, the wordmark's face; `sans` is Inter since 0.6.0 */
		family: Record<'sans' | 'mono' | 'brand', { value: string; provenance: string }>;
		/** `semibold` (600) since token set 0.6.0 */
		weight: Record<'light' | 'regular' | 'medium' | 'semibold', { value: number; provenance: string }>;
		size: Record<string, { value: string; line: number; tracking?: string; provenance: string }>;
	};
	space: { provenance: string; reason: string; steps: Record<string, string> };
	radius: Record<string, { value: string; provenance: string }>;
	/** `dark`, when present, is the value in the dark theme (the window levels). */
	elevation: Record<string, { value: string; dark?: string; provenance: string }>;
	/** `dark`, when present, is the value in the dark theme (the bar's lift since 0.6.0). */
	overlay: Record<string, { value: string; dark?: string; provenance: string }>;
	motion: Record<string, { value: string; provenance: string }>;
	density: Record<string, { control: string; row: string; provenance: string }>;
	layout: Record<string, { value: string; provenance: string }>;
	breakpoints: { provenance: string; source: string; steps: Record<string, number> };
}

export const tokens: Tokens;
export const primitives: Tokens['color']['primitives'];
export const themes: Tokens['color']['themes'];
export const pairs: Pair[];
export const typography: Tokens['typography'];
export const space: Tokens['space'];
export const radius: Tokens['radius'];
export const elevation: Tokens['elevation'];
export const overlay: Tokens['overlay'];
export const motion: Tokens['motion'];
export const density: Tokens['density'];
export const layout: Tokens['layout'];
export const breakpoints: Tokens['breakpoints'];

/** Writes the tokens as CSS custom properties for both themes and the system fallback. */
export class TokenSheet {
	constructor(tokens: Tokens);
	readonly shared: string[];
	theme(name: 'light' | 'dark'): string[];
	readonly css: string;
}

/** WCAG 2.2 contrast between two `#rrggbb` colors. */
export class Contrast {
	static required: { text: number; large: number; graphic: number };
	static luminance(hex: string): number;
	static ratio(first: string, second: string): number;
}
