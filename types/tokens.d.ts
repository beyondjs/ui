/** Types of `@beyond-js/ui/tokens`: the canonical Beyond design tokens. */
export type Provenance = { provenance: 'captured'; source: string } | { provenance: 'proposed'; reason: string };
export type Primitive = { value: string } & Provenance;
export type Pair = [foreground: string, background: string, kind: 'text' | 'graphic' | 'decorative'];

export interface Tokens {
	version: string;
	status: 'proposed' | 'approved';
	source: string;
	attribute: 'data-beyond-mode';
	provenance: { origin: string; revision: string; moved: string; note: string };
	color: { primitives: Record<string, Primitive>; themes: { light: Record<string, string>; dark: Record<string, string> }; pairs: Pair[] };
	typography: {
		family: Record<'sans' | 'mono', { value: string; provenance: string }>;
		weight: Record<'light' | 'medium', { value: number; provenance: string }>;
		size: Record<string, { value: string; line: number; tracking?: string; provenance: string }>;
	};
	space: { provenance: string; reason: string; steps: Record<string, string> };
	radius: Record<string, { value: string; provenance: string }>;
	elevation: Record<string, { value: string; provenance: string }>;
	overlay: Record<string, { value: string; provenance: string }>;
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
