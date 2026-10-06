/** `@beyond-js/ui/session/landed` (0.8.0): the landing page script of a product's session hand-off. Importing it runs it. */
export interface LandingMessage {
	type: 'beyond-session';
	outcome: 'renewed' | 'interaction' | 'unavailable' | 'failed';
	ended: string | null;
	product: string | null;
}
export class Landing {
	static readonly OUTCOMES: readonly LandingMessage['outcome'][];
	constructor(view: Window);
	readonly message: LandingMessage;
	readonly framed: boolean;
	run(): void;
}
