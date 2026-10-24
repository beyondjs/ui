/**
 * The copy of `TurnIndex` (0.29.0) in English and Spanish: the index's name when the product gives no
 * `label`, the states a turn's mark says in words when the product gives none of its own (`stateLabel`),
 * and the line under a preview that names the keys moving between turns. Public as `TurnIndex.labels`.
 */
const freeze = sets => Object.freeze({ en: Object.freeze(sets.en), es: Object.freeze(sets.es) });

export const turns = freeze({
	en: {
		group: 'Turns',
		running: 'Running',
		waiting: 'Needs you',
		failed: 'Failed',
		keys: 'Previous and next turn'
	},
	es: {
		group: 'Turnos',
		running: 'En curso',
		waiting: 'Te necesita',
		failed: 'Falló',
		keys: 'Turno anterior y siguiente'
	}
});
