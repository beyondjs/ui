/**
 * The copy of the long-operation components (decision D50) in English and Spanish. Each component
 * takes `labels` like every other; these sets are also public as `Steps.labels`, `Awaited.labels`,
 * `Freshness.labels` and `TechnicalDetails.labels` (`.en`, `.es`), so a product in Spanish passes
 * `Steps.labels.es` instead of keeping its own copy. Durations use the units below.
 */
const units = {
	en: { second: '{count} s', minute: '{count} min', hour: '{count} h', day: '{count} d' },
	es: { second: '{count} s', minute: '{count} min', hour: '{count} h', day: '{count} d' }
};

const freeze = sets => Object.freeze({ en: Object.freeze(sets.en), es: Object.freeze(sets.es) });

export const steps = freeze({
	en: {
		...units.en,
		done: 'Done',
		progress: 'In progress',
		stalled: 'Blocked',
		failed: 'Failed',
		waiting: 'Waiting',
		took: 'Took {duration}',
		running: '{elapsed} so far',
		usual: '{elapsed} so far · usually about {expected}',
		slow: 'Taking longer than usual · {elapsed} so far · usually about {expected}',
		phase: 'Now: {phase} · {elapsed}',
		stopped: 'Last phase: {phase}',
		change: '{step}: {state}',
		late: '{step}: taking longer than usual'
	},
	es: {
		...units.es,
		done: 'Hecho',
		progress: 'En curso',
		stalled: 'Bloqueado',
		failed: 'Falló',
		waiting: 'En espera',
		took: 'Tardó {duration}',
		running: '{elapsed} hasta ahora',
		usual: '{elapsed} hasta ahora · suele tardar unos {expected}',
		slow: 'Está tardando más de lo habitual · {elapsed} hasta ahora · suele tardar unos {expected}',
		phase: 'Ahora: {phase} · {elapsed}',
		stopped: 'Última fase: {phase}',
		change: '{step}: {state}',
		late: '{step}: está tardando más de lo habitual'
	}
});

export const awaited = freeze({
	en: {
		...units.en,
		since: 'Since {time}',
		left: 'About {duration} left',
		brief: 'Less than a minute left',
		slow: 'Taking longer than usual',
		unknown: 'Time left unknown',
		progress: 'Progress: {title}',
		check: 'Check again',
		unchecked: 'The check did not finish. Try again.',
		done: 'Done',
		failed: 'Did not finish',
		ended: '{title}: done',
		stopped: '{title}: did not finish',
		late: '{title}: taking longer than usual',
		blocked: '{title}: {reason}'
	},
	es: {
		...units.es,
		since: 'Desde {time}',
		left: 'Queda aproximadamente {duration}',
		brief: 'Queda menos de un minuto',
		slow: 'Está tardando más de lo habitual',
		unknown: 'Tiempo restante desconocido',
		progress: 'Progreso: {title}',
		check: 'Comprobar de nuevo',
		unchecked: 'La comprobación no terminó. Vuelve a intentarlo.',
		done: 'Listo',
		failed: 'No terminó',
		ended: '{title}: listo',
		stopped: '{title}: no terminó',
		late: '{title}: está tardando más de lo habitual',
		blocked: '{title}: {reason}'
	}
});

export const freshness = freeze({
	en: {
		...units.en,
		checked: 'Checked {duration} ago',
		now: 'Checked just now',
		known: 'Last known: {state} · {time}',
		last: 'Last known: {state}'
	},
	es: {
		...units.es,
		checked: 'Comprobado hace {duration}',
		now: 'Comprobado ahora mismo',
		known: 'Último estado conocido: {state} · {time}',
		last: 'Último estado conocido: {state}'
	}
});

export const details = freeze({
	en: {
		summary: 'Technical details',
		request: 'Request',
		time: 'Time',
		copy: 'Copy details',
		copied: 'Copied',
		refused: 'Could not copy. The details are selected: copy them with your keyboard.'
	},
	es: {
		summary: 'Detalles técnicos',
		request: 'Solicitud',
		time: 'Hora',
		copy: 'Copiar detalles',
		copied: 'Copiado',
		refused: 'No se pudo copiar. Los detalles están seleccionados: cópialos con el teclado.'
	}
});

export const line = freeze({
	en: {
		...units.en,
		running: '{elapsed} so far',
		usual: '{elapsed} so far · usually about {expected}',
		slow: 'Taking longer than usual · {elapsed} so far',
		done: 'Done',
		took: 'Done · took {duration}',
		failed: 'Did not finish',
		check: 'Check again',
		unchecked: 'The check did not finish. Try again.',
		ended: '{title}: done',
		stopped: '{title}: did not finish',
		late: '{title}: taking longer than usual',
		blocked: '{title}: {reason}'
	},
	es: {
		...units.es,
		running: '{elapsed} hasta ahora',
		usual: '{elapsed} hasta ahora · suele tardar unos {expected}',
		slow: 'Está tardando más de lo habitual · {elapsed} hasta ahora',
		done: 'Listo',
		took: 'Listo · tardó {duration}',
		failed: 'No terminó',
		check: 'Comprobar de nuevo',
		unchecked: 'La comprobación no terminó. Vuelve a intentarlo.',
		ended: '{title}: listo',
		stopped: '{title}: no terminó',
		late: '{title}: está tardando más de lo habitual',
		blocked: '{title}: {reason}'
	}
});
