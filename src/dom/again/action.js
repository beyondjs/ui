import { Button } from '../button.js';

/** One recovery action: labelled refresh glyph, secondary style and single-flight activation. */
export class RetryAction extends Button {
	static labels = Object.freeze({ en: Object.freeze({ retry: 'Try again' }), es: Object.freeze({ retry: 'Reintentar' }) });

	/** `run` repeats a safe read or reconnects a transport, never an unknown write. */
	constructor({ run, labels = {}, small = true, name = null }) {
		super({ label: labels.retry ?? RetryAction.labels.en.retry, glyph: 'refresh', variant: 'secondary', small, name, labels,
			onclick: () => void this.run(run).catch(() => {}) });
	}
}
