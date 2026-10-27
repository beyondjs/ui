import { Button } from '../button.js';
import { Labels } from '../core/labels.js';

/** One recovery action: labelled refresh glyph, secondary style and single-flight activation. */
export class RetryAction extends Button {
	static labels = Object.freeze({ en: Object.freeze({ retry: 'Try again' }), es: Object.freeze({ retry: 'Reintentar' }) });

	/**
	 * `run` repeats a safe read or reconnects a transport, never an unknown write. Its words are
	 * `labels.retry`, else those of the language in effect (`locale`, else `<html lang>`, 0.44.0).
	 */
	constructor({ run, labels = {}, small = true, name = null, locale = undefined }) {
		super({ label: new Labels(RetryAction.labels, labels, locale).text('retry'), glyph: 'refresh', variant: 'secondary', small, name, labels,
			onclick: () => void this.run(run).catch(() => {}) });
	}
}
