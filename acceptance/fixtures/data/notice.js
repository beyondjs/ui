import { AgainLine } from '@beyond-js/ui';

/** When the fixture's outage last tried: a minute before the page opened. */
const last = Date.now() - 60_000;

const words = {
	en: { text: 'Beyond Projects did not answer. Only this project is shown.', again: 'Try again' },
	es: { text: 'Beyond Projects no respondió. Solo se muestra este proyecto.', again: 'Reintentar' }
};

/**
 * The family bar's notice for `?notice=outage` (0.44.0, D132): who did not answer in the warning tone, when it
 * last tried and Try again, as Delegate passes it from `useAgain`; null without the query. `run` is Try again,
 * as the DOM notice's `run` and React's `onSelect`.
 */
export function outage(language, run, search = location.search) {
	if (new URLSearchParams(search).get('notice') !== 'outage') return null;
	const said = words[language] ?? words.en;
	return {
		text: said.text,
		action: { label: said.again, run, onSelect: run },
		outage: { moments: { active: true, trying: false, last, offline: false }, locale: language, labels: language === 'es' ? AgainLine.labels.es : {} }
	};
}
