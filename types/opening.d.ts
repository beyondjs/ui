/** Shared opening options. No person, session, credential or destination is stored here. */
export interface OpeningOptions {
	product: string;
	logo: string | URL;
	root?: string;
	pending?: string;
	key: string;
	appearance?: 'system' | 'light' | 'dark';
	locale?: 'en' | 'es';
	device?: boolean;
	base?: string;
}
/** Static document adapter for servers that do not use a bundler. */
export class OpeningDocument {
	constructor(options: OpeningOptions);
	/** The opening's words in both languages, its steps' included (0.21.0). */
	static readonly labels: Readonly<Record<'en' | 'es', Readonly<Record<string, string>>>>;
	readonly files: Map<string, string | Uint8Array>;
	readonly script: { defer: true; src: string; 'data-opening': string };
	render(html: string): string;
}
/** Vite integration; only explicitly named application entries receive an opening. */
export class OpeningPlugin {
	constructor(options: OpeningOptions & { pages?: string[] });
	readonly plugin: {
		name: string;
		configResolved(config: any): void;
		transformIndexHtml: { order: 'post'; handler(html: string, context: any): string | { html: string; tags: any[] } };
		configureServer(server: any): void;
		generateBundle(this: any): void;
	};
}
