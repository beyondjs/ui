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
	/** Set by the Vite adapter on its development server: a failure shows its technical details open (0.25.0). */
	development?: boolean;
	base?: string;
}
/** Static document adapter for servers that do not use a bundler. */
export class OpeningDocument {
	constructor(options: OpeningOptions);
	/** The opening's words in both languages, its steps' included (0.21.0). */
	static readonly labels: Readonly<Record<'en' | 'es', Readonly<Record<string, string>>>>;
	/** The package's version, stamped on the document it renders (0.25.0). */
	static readonly version: string;
	readonly files: Map<string, string | Uint8Array>;
	readonly script: { defer: true; src: string; 'data-opening': string };
	render(html: string): string;
}
/**
 * Vite integration; only explicitly named application entries receive an opening. On a development
 * server the document is built from the package as installed, and an install of another copy restarts
 * the server (0.25.0).
 */
export class OpeningPlugin {
	constructor(options: Omit<OpeningOptions, 'development'> & { pages?: string[] });
	readonly plugin: {
		name: string;
		configResolved(config: any): Promise<void>;
		transformIndexHtml: { order: 'post'; handler(html: string, context: any): string | { html: string; tags: any[] } };
		configureServer(server: any): void;
		generateBundle(this: any): void;
	};
}
