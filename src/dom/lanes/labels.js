/**
 * The copy of `Lanes` (0.27.0) in English and Spanish: the units of a duration (the long-operation
 * components' own), when a lane started and how long it ran (its description and its trace's tooltip),
 * the states in words for a product that gives none of its own (`stateLabel` is the product's word, such
 * as "Waiting for you"), and the group's name when the product gives no `label`. Public as `Lanes.labels`.
 *
 * `started` is a function of `{ time, day }`: `day` is true when the start fell on another day than now,
 * so a language can say "el 28 oct, 10:42:05" instead of "a las 10:42:05".
 */
const freeze = sets => Object.freeze({ en: Object.freeze(sets.en), es: Object.freeze(sets.es) });

export const lanes = freeze({
	en: {
		second: '{count} s',
		minute: '{count} min',
		hour: '{count} h',
		day: '{count} d',
		started: ({ time }) => `Started ${time}`,
		ran: 'ran {duration}',
		elapsed: '{duration} so far',
		running: 'Running',
		waiting: 'Waiting',
		done: 'Done',
		failed: 'Failed',
		stopped: 'Stopped',
		unknown: 'Unknown',
		group: 'Work in parallel'
	},
	es: {
		second: '{count} s',
		minute: '{count} min',
		hour: '{count} h',
		day: '{count} d',
		started: ({ time, day }) => (day ? `Empezó el ${time}` : `Empezó a las ${time}`),
		ran: 'duró {duration}',
		elapsed: '{duration} hasta ahora',
		running: 'En curso',
		waiting: 'En espera',
		done: 'Hecho',
		failed: 'Falló',
		stopped: 'Detenido',
		unknown: 'Desconocido',
		group: 'Trabajo en paralelo'
	}
});
