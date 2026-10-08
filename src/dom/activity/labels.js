/**
 * The copy of the activity components (`ActivityRow`, `ActivityGroup`) in English and Spanish: the
 * states in words, durations in the units of the long-operation components, and the sections' "Show
 * all" and "Copy". Each component takes `labels` like every other; these sets are public as
 * `ActivityRow.labels` and `ActivityGroup.labels`.
 */
const freeze = sets => Object.freeze({ en: Object.freeze(sets.en), es: Object.freeze(sets.es) });

export const activity = freeze({
	en: {
		second: '{count} s',
		minute: '{count} min',
		hour: '{count} h',
		day: '{count} d',
		running: 'Running',
		done: 'Done',
		failed: 'Failed',
		denied: 'Denied',
		waiting: 'Waiting',
		elapsed: '{duration}',
		took: '{duration}',
		more: ({ count }) => `Show all ${count} lines`,
		less: 'Show fewer lines',
		copy: 'Copy',
		copied: 'Copied',
		refused: 'Could not copy. The text is selected: copy it with your keyboard.'
	},
	es: {
		second: '{count} s',
		minute: '{count} min',
		hour: '{count} h',
		day: '{count} d',
		running: 'En curso',
		done: 'Hecho',
		failed: 'Falló',
		denied: 'Denegado',
		waiting: 'En espera',
		elapsed: '{duration}',
		took: '{duration}',
		more: ({ count }) => `Mostrar las ${count} líneas`,
		less: 'Mostrar menos líneas',
		copy: 'Copiar',
		copied: 'Copiado',
		refused: 'No se pudo copiar. El texto está seleccionado: cópialo con el teclado.'
	}
});
